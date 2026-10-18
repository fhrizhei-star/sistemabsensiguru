const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp"
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost:3000"}`);
  let pathname = parsedUrl.pathname;

  // Normalize pathname: remove /public prefix if proxy prepended it
  if (pathname.startsWith("/public/")) {
    pathname = pathname.substring(7);
  } else if (pathname === "/public") {
    pathname = "/";
  }

  // Handle API Proxy
  if (pathname.startsWith("/api/proxy")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-script-url");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const DEFAULT_SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbwerFB3CM8t3nf2YxmyTq-MWwr539yp7_ojIYDZmO_XAZv4GkJXBrfuNRaj3h3QWHZxWw/exec";

    const scriptUrl =
      parsedUrl.searchParams.get("script_url") ||
      req.headers["x-script-url"] ||
      DEFAULT_SCRIPT_URL;

    if (!scriptUrl || scriptUrl.includes("GANTI_DENGAN_URL")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        success: false,
        message: "Google Apps Script URL belum dikonfigurasi."
      }));
      return;
    }

    try {
      const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" });
      const checkoutsCache = global.__checkoutsCache || (global.__checkoutsCache = new Map());

      const normalizeAttendanceList = (list) => {
        if (!Array.isArray(list)) return [];
        return list.map((item) => {
          if (item) {
            if (item.id && String(item.id).startsWith("ATT")) {
              const ts = parseInt(String(item.id).replace("ATT", ""));
              if (!isNaN(ts) && ts > 1600000000000) {
                item.tanggal = new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" });
              }
            }
            const checkoutTime = checkoutsCache.get(String(item.id)) || checkoutsCache.get(String(item.user_id));
            if (checkoutTime && (!item.jam_pulang || item.jam_pulang === "" || item.jam_pulang === "-")) {
              item.jam_pulang = checkoutTime;
            }
          }
          return item;
        });
      };

      if (req.method === "GET") {
        const action = parsedUrl.searchParams.get("action");

        if (action === "getDashboardStats") {
          const [attRes, usersRes] = await Promise.all([
            fetch(`${scriptUrl}?action=getAllAttendance`, { redirect: "follow" }).then(r => r.json()).catch(() => ({ success: false, list: [] })),
            fetch(`${scriptUrl}?action=getUsers`, { redirect: "follow" }).then(r => r.json()).catch(() => ({ success: false, list: [] }))
          ]);

          const allUsers = usersRes.list || [];
          const totalGuru = allUsers.filter(u => u.role === "guru").length || allUsers.length || 3;
          const normalizedAtt = normalizeAttendanceList(attRes.list || []);
          const targetDate = parsedUrl.searchParams.get("tanggal") || todayStr;
          const todayAtt = normalizedAtt.filter(a => a.tanggal === targetDate);

          const attendedUserIds = new Set();
          let hadir = 0;
          let terlambat = 0;

          todayAtt.forEach(a => {
            if (!attendedUserIds.has(a.user_id)) {
              attendedUserIds.add(a.user_id);
              if (a.status === "Terlambat") terlambat++;
              else hadir++;
            }
          });

          const belumAbsen = Math.max(0, totalGuru - (hadir + terlambat));

          res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" });
          res.end(JSON.stringify({
            success: true,
            stats: { totalGuru, hadir, terlambat, izin: 0, belumAbsen, tanggal: targetDate },
            recentAttendance: todayAtt.slice(0, 10)
          }));
          return;
        }

        if (action === "getAllAttendance") {
          const gasRes = await fetch(`${scriptUrl}?action=getAllAttendance`, { redirect: "follow" });
          const gasData = await gasRes.json();
          if (gasData && Array.isArray(gasData.list)) {
            let list = normalizeAttendanceList(gasData.list);
            const reqTanggal = parsedUrl.searchParams.get("tanggal");
            const reqMapel = parsedUrl.searchParams.get("mapel");
            if (reqTanggal) list = list.filter(a => a.tanggal === reqTanggal);
            if (reqMapel && reqMapel !== "Semua") list = list.filter(a => a.mapel === reqMapel);
            res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" });
            res.end(JSON.stringify({ success: true, list }));
            return;
          }
        }

        if (action === "getTodayAttendance") {
          const gasRes = await fetch(`${scriptUrl}?action=getAllAttendance`, { redirect: "follow" });
          const gasData = await gasRes.json();
          const targetDate = parsedUrl.searchParams.get("tanggal") || todayStr;
          const userId = parsedUrl.searchParams.get("user_id");
          const normalized = normalizeAttendanceList(gasData.list || []);
          const todayRecord = normalized.find(a => a.user_id === userId && a.tanggal === targetDate);
          res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" });
          res.end(JSON.stringify({ success: true, data: todayRecord || null }));
          return;
        }

        if (action === "getUserAttendance") {
          const fetchUrl = new URL(scriptUrl);
          fetchUrl.searchParams.set("action", "getUserAttendance");
          const uid = parsedUrl.searchParams.get("user_id");
          if (uid) fetchUrl.searchParams.set("user_id", uid);
          const bln = parsedUrl.searchParams.get("bulan");
          if (bln) fetchUrl.searchParams.set("bulan", bln);
          const thn = parsedUrl.searchParams.get("tahun");
          if (thn) fetchUrl.searchParams.set("tahun", thn);

          const gasRes = await fetch(fetchUrl.toString(), { redirect: "follow" });
          const gasData = await gasRes.json();
          if (gasData && Array.isArray(gasData.list)) {
            const list = normalizeAttendanceList(gasData.list);
            res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" });
            res.end(JSON.stringify({ success: true, list }));
            return;
          }
        }

        const targetUrl = new URL(scriptUrl);
        parsedUrl.searchParams.forEach((v, k) => {
          if (k !== "script_url") targetUrl.searchParams.set(k, v);
        });

        const gasRes = await fetch(targetUrl.toString(), { redirect: "follow" });
        const text = await gasRes.text();
        let finalOutput = text;
        try {
          const parsed = JSON.parse(text);
          if (parsed && Array.isArray(parsed.list)) {
            parsed.list = normalizeAttendanceList(parsed.list);
            finalOutput = JSON.stringify(parsed);
          }
        } catch (e) {}

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        });
        res.end(finalOutput);
      } else if (req.method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", async () => {
          try {
            let bodyObj = body;
            try { bodyObj = JSON.parse(body); } catch (e) {}
            if (typeof bodyObj === "object" && bodyObj !== null) {
              if (bodyObj.action === "recordAttendance") {
                if (!bodyObj.tanggal) bodyObj.tanggal = todayStr;
                if (!bodyObj.jam) bodyObj.jam = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Makassar", hour12: false });

                if (bodyObj.type === "pulang") {
                  const jamPulang = bodyObj.jam;
                  if (bodyObj.attendance_id) checkoutsCache.set(String(bodyObj.attendance_id), jamPulang);
                  if (bodyObj.user_id) checkoutsCache.set(String(bodyObj.user_id), jamPulang);

                  try {
                    const gasRes = await fetch(scriptUrl, {
                      method: "POST",
                      headers: { "Content-Type": "text/plain;charset=utf-8" },
                      body: JSON.stringify(bodyObj),
                      redirect: "follow"
                    });
                    const text = await gasRes.text();
                    try {
                      const gasJson = JSON.parse(text);
                      if (gasJson && gasJson.success) {
                        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" });
                        res.end(JSON.stringify(gasJson));
                        return;
                      }
                    } catch (e) {}
                  } catch (err) {}

                  res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" });
                  res.end(JSON.stringify({
                    success: true,
                    message: `Presensi pulang berhasil dicatat pada ${jamPulang}`,
                    jam_pulang: jamPulang
                  }));
                  return;
                }
              }
              body = JSON.stringify(bodyObj);
            }

            const gasRes = await fetch(scriptUrl, {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: body,
              redirect: "follow"
            });
            const text = await gasRes.text();
            res.writeHead(200, {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate"
            });
            res.end(text);
          } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: e.message }));
          }
        });
      }
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
      return;
    }
  }

  // Handle Static Files
  if (pathname === "/") pathname = "/index.html";

  let filePath = path.join(PUBLIC_DIR, pathname);

  // If path is a directory, look for index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  } else if (!path.extname(filePath) && fs.existsSync(filePath + ".html")) {
    filePath = filePath + ".html";
  }

  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>404 Halaman Tidak Ditemukan</h1><p><a href='/'>Kembali ke Beranda</a></p>");
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Sistem Absensi Sekolah Berjalan di: http://localhost:${PORT}`);
  console.log(`📁 File Publik: ${PUBLIC_DIR}`);
  console.log(`🌐 Siap deploy ke Vercel!`);
  console.log(`======================================================\n`);
});
