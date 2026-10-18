/**
 * ====================================================================
 * KONFIGURASI SISTEM ABSENSI SEKOLAH
 * ====================================================================
 */

const CONFIG = {
  // Ganti URL di bawah ini dengan URL Web App dari Google Apps Script Anda:
  // Contoh: "https://script.google.com/macros/s/AKfycb.../exec"
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwerFB3CM8t3nf2YxmyTq-MWwr539yp7_ojIYDZmO_XAZv4GkJXBrfuNRaj3h3QWHZxWw/exec",

  // Nama Sekolah Bawaan
  SCHOOL_NAME: "SMA NEGERI 1 TELADAN",
  SCHOOL_ADDRESS: "Jl. Pendidikan Nasional No. 45, Jakarta",

  // Pengaturan Jam Absensi Default
  JAM_MASUK_MULAI: "06:30",
  JAM_MASUK_BATAS: "07:15",
  JAM_PULANG_MULAI: "15:00",
  TOLERANSI_TERLAMBAT_MENIT: 15,

  // Koordinat Sekolah Default (Latitude, Longitude)
  // Contoh koordinat Monas Jakarta: -6.175392, 106.827153
  SCHOOL_LAT: -6.2088,
  SCHOOL_LNG: 106.8456,
  RADIUS_METER: 250, // Radius toleransi absen dalam meter

  // Mode Penyimpanan Cadangan Lokal (Offline Cache jika koneksi Google Sheets terputus)
  get USE_DEMO_MODE() {
    const savedUrl = this.getScriptUrl();
    return !savedUrl || savedUrl.trim() === "" || savedUrl.includes("GANTI_DENGAN_URL");
  },

  // Mendapatkan URL script dari LocalStorage jika pernah disimpan via Menu Pengaturan Admin
  getScriptUrl() {
    const stored = localStorage.getItem("ABSENSI_SCRIPT_URL");
    return stored && stored.trim() !== "" ? stored : this.GOOGLE_SCRIPT_URL;
  },

  setScriptUrl(url) {
    localStorage.setItem("ABSENSI_SCRIPT_URL", url);
  }
};

window.CONFIG = CONFIG;
