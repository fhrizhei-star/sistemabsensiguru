// Vercel Serverless Function Proxy to Google Apps Script
// Mengatasi masalah CORS dan 302 Redirection dari Google Apps Script Web App

const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwerFB3CM8t3nf2YxmyTq-MWwr539yp7_ojIYDZmO_XAZv4GkJXBrfuNRaj3h3QWHZxWw/exec";

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-script-url"
  );
  // Pastikan data selalu realtime dari Google Sheets (tanpa cache)
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Ambil URL Google Apps Script dari Query Param, Header, Environment Variable, atau Fallback Default
  const scriptUrl =
    req.query.script_url ||
    req.headers["x-script-url"] ||
    process.env.GOOGLE_SCRIPT_URL ||
    DEFAULT_SCRIPT_URL;

  if (!scriptUrl || scriptUrl.includes("GANTI_DENGAN_URL")) {
    return res.status(200).json({
      success: false,
      message: "Google Apps Script URL belum dikonfigurasi."
    });
  }

  try {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" });

    // Helper normalisasi tanggal record berdasarkan timestamp ID
    const normalizeAttendanceList = (list) => {
      if (!Array.isArray(list)) return [];
      return list.map((item) => {
        if (item && item.id && String(item.id).startsWith("ATT")) {
          const ts = parseInt(String(item.id).replace("ATT", ""));
          if (!isNaN(ts) && ts > 1600000000000) {
            item.tanggal = new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" });
          }
        }
        return item;
      });
    };

    if (req.method === "GET") {
      const action = req.query.action;

      if (action === "getDashboardStats") {
        // Ambil data absensi dan guru secara simultan
        const [attRes, usersRes] = await Promise.all([
          fetch(`${scriptUrl}?action=getAllAttendance`, { redirect: "follow" })
            .then((r) => r.json())
            .catch(() => ({ success: false, list: [] })),
          fetch(`${scriptUrl}?action=getUsers`, { redirect: "follow" })
            .then((r) => r.json())
            .catch(() => ({ success: false, list: [] }))
        ]);

        const allUsers = usersRes.list || [];
        const totalGuru = allUsers.filter((u) => u.role === "guru").length || allUsers.length || 3;
        const normalizedAtt = normalizeAttendanceList(attRes.list || []);

        const targetDate = req.query.tanggal || todayStr;
        const todayAtt = normalizedAtt.filter((a) => a.tanggal === targetDate);

        // Hitung hadir & terlambat unik berdasarkan user_id
        const attendedUserIds = new Set();
        let hadir = 0;
        let terlambat = 0;

        todayAtt.forEach((a) => {
          if (!attendedUserIds.has(a.user_id)) {
            attendedUserIds.add(a.user_id);
            if (a.status === "Terlambat") {
              terlambat++;
            } else {
              hadir++;
            }
          }
        });

        const belumAbsen = Math.max(0, totalGuru - (hadir + terlambat));

        return res.status(200).json({
          success: true,
          stats: {
            totalGuru,
            hadir,
            terlambat,
            izin: 0,
            belumAbsen,
            tanggal: targetDate
          },
          recentAttendance: todayAtt.slice(0, 10)
        });
      }

      if (action === "getAllAttendance") {
        const fetchUrl = new URL(scriptUrl);
        fetchUrl.searchParams.set("action", "getAllAttendance");

        const gasRes = await fetch(fetchUrl.toString(), { redirect: "follow" });
        const gasData = await gasRes.json();
        if (gasData && Array.isArray(gasData.list)) {
          let list = normalizeAttendanceList(gasData.list);
          if (req.query.tanggal) {
            list = list.filter((a) => a.tanggal === req.query.tanggal);
          }
          if (req.query.mapel && req.query.mapel !== "Semua") {
            list = list.filter((a) => a.mapel === req.query.mapel);
          }
          return res.status(200).json({ success: true, list });
        }
        return res.status(200).json(gasData);
      }

      if (action === "getTodayAttendance") {
        const fetchUrl = new URL(scriptUrl);
        fetchUrl.searchParams.set("action", "getAllAttendance");

        const gasRes = await fetch(fetchUrl.toString(), { redirect: "follow" });
        const gasData = await gasRes.json();
        const targetDate = req.query.tanggal || todayStr;
        const normalized = normalizeAttendanceList(gasData.list || []);
        const todayRecord = normalized.find(
          (a) => a.user_id === req.query.user_id && a.tanggal === targetDate
        );

        return res.status(200).json({ success: true, data: todayRecord || null });
      }

      if (action === "getUserAttendance") {
        const fetchUrl = new URL(scriptUrl);
        fetchUrl.searchParams.set("action", "getUserAttendance");
        if (req.query.user_id) fetchUrl.searchParams.set("user_id", req.query.user_id);
        if (req.query.bulan) fetchUrl.searchParams.set("bulan", req.query.bulan);
        if (req.query.tahun) fetchUrl.searchParams.set("tahun", req.query.tahun);

        const gasRes = await fetch(fetchUrl.toString(), { redirect: "follow" });
        const gasData = await gasRes.json();
        if (gasData && Array.isArray(gasData.list)) {
          const list = normalizeAttendanceList(gasData.list);
          return res.status(200).json({ success: true, list });
        }
        return res.status(200).json(gasData);
      }

      // Default pass-through untuk aksi GET lainnya
      const urlObj = new URL(scriptUrl);
      for (const [key, val] of Object.entries(req.query)) {
        if (key !== "script_url") {
          urlObj.searchParams.set(key, val);
        }
      }

      const response = await fetch(urlObj.toString(), {
        method: "GET",
        redirect: "follow"
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data && Array.isArray(data.list)) {
          data.list = normalizeAttendanceList(data.list);
        }
        return res.status(200).json(data);
      } catch (parseErr) {
        return res.status(200).json({
          success: false,
          error: "Respons bukan format JSON valid",
          raw: text.slice(0, 500)
        });
      }
    } else if (req.method === "POST") {
      let bodyObj = req.body;
      if (typeof bodyObj === "string") {
        try {
          bodyObj = JSON.parse(bodyObj);
        } catch (e) {}
      }

      // Pastikan tanggal dan jam selalu akurat (WITA GMT+8) jika belum diset
      if (typeof bodyObj === "object" && bodyObj !== null) {
        if (bodyObj.action === "recordAttendance") {
          if (!bodyObj.tanggal) {
            bodyObj.tanggal = todayStr;
          }
          if (!bodyObj.jam) {
            bodyObj.jam = new Date().toLocaleTimeString("id-ID", {
              timeZone: "Asia/Makassar",
              hour12: false
            });
          }
        }
      }

      const postBody = typeof bodyObj === "object" ? JSON.stringify(bodyObj) : bodyObj;

      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: postBody,
        redirect: "follow"
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return res.status(200).json(data);
      } catch (parseErr) {
        return res.status(200).json({
          success: false,
          error: "Respons bukan format JSON valid",
          raw: text.slice(0, 500)
        });
      }
    } else {
      return res.status(405).json({ success: false, message: "Metode tidak didukung" });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Gagal terhubung ke Google Apps Script: " + err.message
    });
  }
}
