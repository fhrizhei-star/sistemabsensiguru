// Vercel Serverless Function Proxy to Google Apps Script
// Mengatasi masalah CORS dan 302 Redirection dari Google Apps Script Web App

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Ambil URL Google Apps Script dari Query Param, Body, atau Environment Variable
  const scriptUrl =
    req.headers["x-script-url"] ||
    req.query.script_url ||
    process.env.GOOGLE_SCRIPT_URL;

  if (!scriptUrl || scriptUrl.includes("GANTI_DENGAN_URL")) {
    // Mode demo / belum dikonfigurasi
    return res.status(200).json({
      success: false,
      isDemo: true,
      message: "Google Apps Script URL belum dikonfigurasi. Menggunakan data demo lokal."
    });
  }

  try {
    let targetUrl = scriptUrl;

    if (req.method === "GET") {
      const urlObj = new URL(scriptUrl);
      for (const [key, val] of Object.entries(req.query)) {
        if (key !== "script_url") {
          urlObj.searchParams.set(key, val);
        }
      }
      targetUrl = urlObj.toString();

      const response = await fetch(targetUrl, {
        method: "GET",
        redirect: "follow"
      });

      const data = await response.json();
      return res.status(200).json(data);
    } else if (req.method === "POST") {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body || {}),
        redirect: "follow"
      });

      const data = await response.json();
      return res.status(200).json(data);
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
