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
    if (req.method === "GET") {
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
        return res.status(200).json(data);
      } catch (parseErr) {
        return res.status(200).json({
          success: false,
          error: "Respons bukan format JSON valid",
          raw: text.slice(0, 500)
        });
      }
    } else if (req.method === "POST") {
      // Pastikan body tidak mengalami double JSON stringify jika sudah string
      let postBody = req.body;
      if (typeof postBody === "object" && postBody !== null) {
        postBody = JSON.stringify(postBody);
      } else if (typeof postBody !== "string") {
        postBody = JSON.stringify(postBody || {});
      }

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
