"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import { MockDB } from "@/lib/mockData";
import {
  Sliders,
  MapPin,
  Save,
  CheckCircle2,
  Navigation,
  Globe,
  RefreshCw,
  School,
  Send,
  Bell,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function AdminSettingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState({
    nama_sekolah: "MTsN GOWA",
    alamat_sekolah: "Jl. Pendidikan Nasional No. 45, Jakarta",
    kota: "Kabupaten Gowa",
    npsn: "20123456",
    no_telp: "(0411) 861234",
    kepala_sekolah: "Dr. H. Suharto, M.Pd",
    nip_kepsek: "196805121993031002",
    toleransi_menit: 15,
    jam_masuk_mulai: "06:30",
    jam_masuk_batas: "07:15",
    jam_pulang_mulai: "15:00",
    lat_sekolah: -6.2088,
    lng_sekolah: 106.8456,
    radius_meter: 250,
    google_script_url: Api.getScriptUrl(),
    telegram_bot_token: "",
    telegram_chat_id: "",
    telegram_notif_aktif: true,
    telegram_notif_absen: true,
    web_url: "https://absensi-sekolah.vercel.app"
  });
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState(null);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    const loadSettings = async () => {
      const res = await Api.request("GET", "getSettings");
      if (res && res.settings) {
        setSettings((prev) => ({
          ...prev,
          ...res.settings,
          google_script_url: res.settings.google_script_url || prev.google_script_url || Api.getScriptUrl()
        }));
      }
    };

    loadSettings();
  }, [router]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung geolokasi");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings((prev) => ({
          ...prev,
          lat_sekolah: Number(pos.coords.latitude.toFixed(6)),
          lng_sekolah: Number(pos.coords.longitude.toFixed(6))
        }));
        setGpsLoading(false);
      },
      (err) => {
        alert("Gagal membaca GPS: " + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleTestScript = async () => {
    setTestResult({ loading: true });
    if (!settings.google_script_url || settings.google_script_url.trim() === "") {
      setTestResult({
        success: true,
        isMock: true,
        message: "Penyimpanan Offline Lokal Aktif (Data tersimpan di browser)."
      });
      return;
    }

    try {
      const res = await fetch(`/api/proxy?action=getSettings&script_url=${encodeURIComponent(settings.google_script_url)}`);
      const data = await res.json();
      if (data && (data.success !== false || data.status === "success")) {
        setTestResult({ success: true, message: "Koneksi ke Server Database BERHASIL!" });
      } else {
        setTestResult({ success: false, message: "Server merespons tetapi data tidak cocok: " + (data.message || "") });
      }
    } catch (e) {
      setTestResult({ success: false, message: "Gagal terhubung ke Server Database: " + e.message });
    }
  };

  const handleTestTelegram = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      alert("Harap isi Token Bot Telegram dan Chat ID Grup terlebih dahulu!");
      return;
    }
    setTelegramLoading(true);
    setTelegramTestResult({ loading: true });

    try {
      // 1. Simpan pengaturan dulu ke backend & cache lokal
      const db = MockDB.load();
      db.settings = { ...db.settings, ...settings };
      MockDB.save(db);
      await Api.request("POST", "updateSettings", {}, { settings });

      // 2. Kirim pesan test ke Telegram
      const schoolName = settings.nama_sekolah || "Sistem Absensi Guru";
      const nowStr = new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "medium" });
      const customMsg = 
        `🔔 <b>UJI COBA NOTIFIKASI TELEGRAM BERHASIL!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏫 <b>${schoolName}</b>\n` +
        `Sistem Absensi Guru sukses terhubung ke grup Telegram ini.\n` +
        `⏱️ <i>Waktu Uji Coba: ${nowStr}</i>\n\n` +
        `Pengingat jadwal kelas otomatis <b>5 menit sebelum mulai</b> siap aktif! 🚀\n` +
        `━━━━━━━━━━━━━━━━━━━━━━`;

      const res = await Api.request("POST", "testTelegram", {}, { customMessage: customMsg });
      if (res && res.success) {
        setTelegramTestResult({
          success: true,
          message: "Sukses! Pesan uji coba berhasil dikirim ke grup Telegram. Silakan periksa aplikasi Telegram Anda."
        });
      } else {
        setTelegramTestResult({
          success: false,
          message: "Gagal mengirim: " + (res?.message || "Pastikan bot sudah dimasukkan ke dalam grup dan memiliki izin kirim pesan.")
        });
      }
    } catch (err) {
      setTelegramTestResult({
        success: false,
        message: "Terjadi kesalahan koneksi: " + err.message
      });
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedNotice(false);

    try {
      // 1. Simpan ke database lokal agar Api.getScriptUrl() langsung aktif seketika
      const db = MockDB.load();
      db.settings = { ...db.settings, ...settings };
      MockDB.save(db);

      // 2. Kirim update ke Google Apps Script backend
      const res = await Api.request("POST", "updateSettings", {}, { settings });
      if (res && (res.success || res.status === "success")) {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 4000);
      }
    } catch (err) {
      alert("Gagal menyimpan pengaturan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = () => {
    if (confirm("Apakah Anda yakin ingin me-reset cache data lokal? Semua data di cache lokal browser akan diperbarui dari server.")) {
      MockDB.reset();
      window.location.reload();
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <Navbar role="admin" />
      <div style={{ display: "flex", flex: 1 }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "2rem", overflowX: "hidden" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "1.75rem"
            }}
          >
            <div>
              <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--text-main)" }}>
                Pengaturan Sistem & Geofencing
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Konfigurasi profil sekolah, batas toleransi radius GPS, dan Server Database
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleSave}
              className="btn-neon-primary"
              disabled={loading}
            >
              <Save size={18} /> {loading ? "Menyimpan..." : "Simpan Pengaturan"}
            </motion.button>
          </div>

          <AnimatePresence>
            {savedNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  background: "var(--primary-light)",
                  border: "1px solid var(--primary-border)",
                  color: "var(--primary)",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1.5rem",
                  fontWeight: 600
                }}
              >
                <CheckCircle2 size={20} />
                <span>Pengaturan berhasil diperbarui dan disimpan!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Section 1: Profil Sekolah */}
            <div className="glass-panel" style={{ padding: "1.75rem", border: "1.5px solid #c7d2fe", background: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eef2ff", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <School size={20} color="#4f46e5" />
                </div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Informasi Profil Sekolah
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Nama Sekolah
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.nama_sekolah}
                    onChange={(e) => setSettings({ ...settings, nama_sekolah: e.target.value })}
                    className="neon-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Alamat Lengkap Sekolah
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.alamat_sekolah}
                    onChange={(e) => setSettings({ ...settings, alamat_sekolah: e.target.value })}
                    className="neon-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    value={settings.kota || ""}
                    onChange={(e) => setSettings({ ...settings, kota: e.target.value })}
                    placeholder="contoh: Jakarta"
                    className="neon-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    NPSN
                  </label>
                  <input
                    type="text"
                    value={settings.npsn || ""}
                    onChange={(e) => setSettings({ ...settings, npsn: e.target.value })}
                    placeholder="Nomor Pokok Sekolah Nasional"
                    className="neon-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Nomor Telepon Sekolah
                  </label>
                  <input
                    type="text"
                    value={settings.no_telp || ""}
                    onChange={(e) => setSettings({ ...settings, no_telp: e.target.value })}
                    placeholder="contoh: (0411) 861234 atau 0812..."
                    className="neon-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Nama Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={settings.kepala_sekolah || ""}
                    onChange={(e) => setSettings({ ...settings, kepala_sekolah: e.target.value })}
                    placeholder="contoh: Dr. H. Suharto, M.Pd"
                    className="neon-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={settings.nip_kepsek || ""}
                    onChange={(e) => setSettings({ ...settings, nip_kepsek: e.target.value })}
                    placeholder="contoh: 196805121993031002"
                    className="neon-input"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Koordinat Geofencing & GPS */}
            <div className="glass-panel" style={{ padding: "1.75rem", border: "1.5px solid #a7f3d0", background: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MapPin size={20} color="#059669" />
                  </div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                    Titik Koordinat & Radius Geofencing
                  </h2>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="btn-neon-secondary"
                  disabled={gpsLoading}
                  style={{ fontSize: "0.82rem", padding: "0.5rem 0.9rem", color: "#059669", borderColor: "#a7f3d0", background: "#ffffff" }}
                >
                  <Navigation size={14} color="#059669" />
                  <span>{gpsLoading ? "Mencari GPS..." : "Ambil Lokasi Saya Saat Ini"}</span>
                </motion.button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Latitude Sekolah
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={settings.lat_sekolah}
                    onChange={(e) => setSettings({ ...settings, lat_sekolah: parseFloat(e.target.value) || 0 })}
                    className="neon-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Longitude Sekolah
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={settings.lng_sekolah}
                    onChange={(e) => setSettings({ ...settings, lng_sekolah: parseFloat(e.target.value) || 0 })}
                    className="neon-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Radius Toleransi (Meter)
                  </label>
                  <input
                    type="number"
                    required
                    value={settings.radius_meter}
                    onChange={(e) => setSettings({ ...settings, radius_meter: parseInt(e.target.value) || 250 })}
                    className="neon-input"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Integrasi Server Database Cloud */}
            <div className="glass-panel" style={{ padding: "1.75rem", border: "1.5px solid #bae6fd", background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#e0f2fe", border: "1px solid #bae6fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Globe size={20} color="#0284c7" />
                </div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Integrasi Server Database Cloud (Opsional)
                </h2>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem", paddingLeft: "2.8rem" }}>
                Masukkan URL Endpoint Server Database untuk sinkronisasi data presensi guru secara realtime. Kosongkan jika ingin menggunakan penyimpanan database browser.
              </p>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <input
                  type="text"
                  value={settings.google_script_url || ""}
                  onChange={(e) => setSettings({ ...settings, google_script_url: e.target.value })}
                  placeholder="https://.../exec"
                  className="neon-input"
                  style={{ flex: 1, minWidth: "260px" }}
                />
                <button
                  type="button"
                  onClick={handleTestScript}
                  className="btn-neon-secondary"
                  style={{ padding: "0.65rem 1.25rem", fontSize: "0.85rem", borderColor: "#bae6fd", color: "#0284c7", background: "#ffffff" }}
                >
                  <RefreshCw size={15} /> Uji Koneksi
                </button>
              </div>

              {testResult && (
                <div
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "8px",
                    background: testResult.loading
                      ? "var(--bg-muted)"
                      : testResult.success
                      ? "#ecfdf5"
                      : "#fff1f2",
                    border: `1px solid ${
                      testResult.loading
                        ? "var(--border-light)"
                        : testResult.success
                        ? "#a7f3d0"
                        : "#fecdd3"
                    }`,
                    color: testResult.loading
                      ? "var(--text-main)"
                      : testResult.success
                      ? "#065f46"
                      : "#be123c",
                    fontSize: "0.85rem",
                    fontWeight: 600
                  }}
                >
                  {testResult.loading ? "Sedang menguji koneksi ke Server Database..." : testResult.message}
                </div>
              )}
            </div>

            {/* Section 4: Integrasi Notifikasi Telegram (Pengingat 5 Menit & Grup) */}
            <div
              className="glass-panel"
              style={{
                padding: "1.75rem",
                border: "1.5px solid #38bdf8",
                background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#e0f2fe", border: "1px solid #38bdf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Send size={20} color="#0284c7" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                      Notifikasi Pengingat Telegram (Grup Guru)
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0284c7",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "8px",
                    background: "#ffffff"
                  }}
                >
                  <HelpCircle size={16} />
                  <span>{showTelegramGuide ? "Tutup Panduan" : "Panduan Kilat Setup (2 Menit)"}</span>
                  {showTelegramGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem", paddingLeft: "3rem" }}>
                Kirim pengingat otomatis ke grup Telegram guru <strong>5 menit sebelum jam pelajaran dimulai</strong>, dan kirim notifikasi instan ketika guru selesai melakukan presensi.
              </p>

              {/* Panduan Accordion */}
              <AnimatePresence>
                {showTelegramGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      background: "#ffffff",
                      border: "1px dashed #38bdf8",
                      borderRadius: "10px",
                      padding: "1.25rem",
                      marginBottom: "1.5rem",
                      fontSize: "0.85rem",
                      lineHeight: "1.6",
                      color: "var(--text-main)"
                    }}
                  >
                    <h4 style={{ fontWeight: 800, color: "#0284c7", marginBottom: "0.5rem" }}>
                      🚀 Cara Mudah Membuat Bot & Mengambil Chat ID Grup Telegram:
                    </h4>
                    <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
                      <li>
                        <strong>Buat Bot Telegram:</strong> Buka Telegram, cari bot resmi{" "}
                        <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" style={{ color: "#0284c7", fontWeight: 700, textDecoration: "underline" }}>
                          @BotFather <ExternalLink size={12} style={{ display: "inline" }} />
                        </a>
                        , kirim <code>/newbot</code>, lalu ikuti instruksinya. Salin <strong>HTTP API Token</strong> yang diberikan dan tempel ke kolom <strong>Token Bot Telegram</strong> di bawah.
                      </li>
                      <li>
                        <strong>Buat / Buka Grup Guru:</strong> Buat grup Telegram guru sekolah Anda (atau gunakan grup yang sudah ada), lalu <strong>masukkan bot yang baru dibuat ke dalam grup tersebut</strong>.
                      </li>
                      <li>
                        <strong>Jadikan Bot Sebagai Admin Grup</strong> agar bot memiliki hak penuh untuk mengirim pesan.
                      </li>
                      <li>
                        <strong>Dapatkan Chat ID Grup:</strong> Masukkan bot pembantu{" "}
                        <a href="https://t.me/RawDataBot" target="_blank" rel="noreferrer" style={{ color: "#0284c7", fontWeight: 700, textDecoration: "underline" }}>
                          @RawDataBot <ExternalLink size={12} style={{ display: "inline" }} />
                        </a>{" "}
                        ke grup tersebut. Cari tulisan <code>&quot;chat&quot;: &#123; &quot;id&quot;: -100xxxxxxxxxx &#125;</code>. Salin seluruh angka tersebut (termasuk tanda minus <code>-</code> di depannya), lalu tempel ke kolom <strong>Chat ID Grup</strong> di bawah (setelah itu @RawDataBot bisa dikeluarkan dari grup).
                      </li>
                      <li>
                        Klik tombol <strong>&quot;Uji Coba Kirim Pesan&quot;</strong> untuk memastikan notifikasi masuk ke grup!
                      </li>
                    </ol>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Input Telegram */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.3rem" }}>
                    Token Bot Telegram (@BotFather)
                  </label>
                  <input
                    type="text"
                    value={settings.telegram_bot_token || ""}
                    onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                    placeholder="Contoh: 7123456789:AAFsK9m0Zq..."
                    className="neon-input"
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Didapatkan setelah mengetik <code>/newbot</code> di @BotFather
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.3rem" }}>
                    Chat ID Grup Telegram Guru / Staf
                  </label>
                  <input
                    type="text"
                    value={settings.telegram_chat_id || ""}
                    onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                    placeholder="Contoh: -1002345678901"
                    className="neon-input"
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    ID grup biasanya diawali tanda minus (contoh: <code>-100...</code>)
                  </span>
                </div>
              </div>

              {/* Toggle Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem", background: "#ffffff", padding: "1rem", borderRadius: "10px", border: "1px solid #e0f2fe" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)" }}>
                  <input
                    type="checkbox"
                    checked={String(settings.telegram_notif_aktif) === "true" || settings.telegram_notif_aktif === true}
                    onChange={(e) => setSettings({ ...settings, telegram_notif_aktif: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#0284c7" }}
                  />
                  <span>⏰ Aktifkan <strong>Pengingat Jadwal Mengajar 5 Menit Sebelum Mulai</strong></span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)" }}>
                  <input
                    type="checkbox"
                    checked={String(settings.telegram_notif_absen) === "true" || settings.telegram_notif_absen === true}
                    onChange={(e) => setSettings({ ...settings, telegram_notif_absen: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#0284c7" }}
                  />
                  <span>📢 Kirim <strong>Notifikasi Realtime ke Grup saat Guru Melakukan Presensi</strong></span>
                </label>
              </div>

              {/* Tombol Uji Coba */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={telegramLoading}
                  className="btn-neon-secondary"
                  style={{
                    padding: "0.65rem 1.25rem",
                    fontSize: "0.85rem",
                    borderColor: "#38bdf8",
                    color: "#0284c7",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <Send size={15} />
                  {telegramLoading ? "Sedang Mengirim Pesan Uji Coba..." : "Uji Coba Kirim Pesan ke Telegram"}
                </button>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  (Akan mengirim 1 pesan tes langsung ke grup Telegram Anda)
                </span>
              </div>

              {telegramTestResult && (
                <div
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "8px",
                    background: telegramTestResult.loading
                      ? "var(--bg-muted)"
                      : telegramTestResult.success
                      ? "#ecfdf5"
                      : "#fff1f2",
                    border: `1px solid ${
                      telegramTestResult.loading
                        ? "var(--border-light)"
                        : telegramTestResult.success
                        ? "#a7f3d0"
                        : "#fecdd3"
                    }`,
                    color: telegramTestResult.loading
                      ? "var(--text-main)"
                      : telegramTestResult.success
                      ? "#065f46"
                      : "#be123c",
                    fontSize: "0.85rem",
                    fontWeight: 600
                  }}
                >
                  {telegramTestResult.loading ? "Sedang menghubungi Telegram API..." : telegramTestResult.message}
                </div>
              )}
            </div>

            {/* Section 5: Reset Database */}
            <div
              className="glass-panel"
              style={{
                padding: "1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
                border: "1.5px solid #fecdd3",
                background: "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#ffe4e6", border: "1px solid #fecdd3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RefreshCw size={20} color="#e11d48" />
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#e11d48" }}>
                    Reset Cache Data Lokal
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                    Muat ulang data guru, jadwal, dan pengaturan dari server pusat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetData}
                className="btn-neon-danger"
                style={{ fontSize: "0.82rem", background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)", color: "#fff", border: "none", boxShadow: "0 4px 12px rgba(225, 29, 72, 0.25)" }}
              >
                Reset Database
              </button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
