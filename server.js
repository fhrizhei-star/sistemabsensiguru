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
      if (req.method === "GET") {
        const targetUrl = new URL(scriptUrl);
        parsedUrl.searchParams.forEach((v, k) => {
          if (k !== "script_url") targetUrl.searchParams.set(k, v);
        });

        const gasRes = await fetch(targetUrl.toString(), { redirect: "follow" });
        const text = await gasRes.text();
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        });
        res.end(text);
      } else if (req.method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", async () => {
          try {
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
