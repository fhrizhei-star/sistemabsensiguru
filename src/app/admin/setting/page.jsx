"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import { MockDB, getTodayDateStr } from "@/lib/mockData";
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
  ChevronUp,
  Clock,
  Upload,
  Image as ImageIcon,
  FileText,
  Trash2,
  Sparkles,
  Calendar,
  Plus,
  X,
  Palmtree,
  AlertTriangle
} from "lucide-react";
import { DEFAULT_SAMPLE_TTD, DEFAULT_SAMPLE_STEMPEL } from "@/lib/signatureAssets";

export default function AdminSettingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState({
    nama_sekolah: "MTsN GOWA",
    alamat_sekolah: "Jl. Pendidikan Nasional No. 45, Jakarta",
    kota: "Kabupaten Gowa",
    npsn: "20123456",
    no_telp: "(0411) 861234",
    satuan_kerja: "PENDIS",
    kepala_sekolah: "Dr. H. Suharto, M.Pd",
    nip_kepsek: "196805121993031002",
    operator_nama: "Bpk. Hendra Gunawan, S.Kom",
    operator_nip: "198001012005011001",
    ttd_kepsek_url: DEFAULT_SAMPLE_TTD,
    stempel_sekolah_url: DEFAULT_SAMPLE_STEMPEL,
    agenda_rapat_hari_ini: "",
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
    web_url: "https://sistemabsensiguru.vercel.app"
  });
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState(null);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  // States untuk Manajemen Kalender Libur & Libur Semester
  const [holidays, setHolidays] = useState([]);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    id: "",
    nama_libur: "",
    tipe: "Libur Nasional",
    tgl_mulai: getTodayDateStr(),
    tgl_selesai: getTodayDateStr(),
    keterangan: ""
  });
  const [holidaySaving, setHolidaySaving] = useState(false);

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

    const loadHolidays = async () => {
      try {
        const res = await Api.request("GET", "getHolidays");
        if (res && res.holidays) {
          setHolidays(res.holidays);
        }
      } catch (err) {}
    };

    loadSettings();
    loadHolidays();
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

  const handleUploadTtd = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Ukuran file tanda tangan maksimal 3MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSettings((prev) => ({ ...prev, ttd_kepsek_url: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadStempel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Ukuran file stempel maksimal 3MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSettings((prev) => ({ ...prev, stempel_sekolah_url: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleApplySampleSignatures = () => {
    setSettings((prev) => ({
      ...prev,
      ttd_kepsek_url: DEFAULT_SAMPLE_TTD,
      stempel_sekolah_url: DEFAULT_SAMPLE_STEMPEL
    }));
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

  const handleOpenAddHoliday = () => {
    setHolidayForm({
      id: "",
      nama_libur: "",
      tipe: "Libur Nasional",
      tgl_mulai: getTodayDateStr(),
      tgl_selesai: getTodayDateStr(),
      keterangan: ""
    });
    setHolidayModalOpen(true);
  };

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.nama_libur.trim()) {
      alert("Harap masukkan nama hari libur!");
      return;
    }
    if (holidayForm.tgl_mulai > (holidayForm.tgl_selesai || holidayForm.tgl_mulai)) {
      alert("Tanggal mulai tidak boleh melebihi tanggal selesai!");
      return;
    }

    setHolidaySaving(true);
    try {
      const res = await Api.request("POST", "saveHoliday", {}, holidayForm);
      if (res && res.success) {
        setHolidayModalOpen(false);
        const resList = await Api.request("GET", "getHolidays");
        if (resList && resList.holidays) setHolidays(resList.holidays);
      } else {
        alert(res?.message || "Gagal menyimpan data hari libur");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan hari libur");
    } finally {
      setHolidaySaving(false);
    }
  };

  const handleDeleteHoliday = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus hari libur "${nama}"?`)) return;
    try {
      const res = await Api.request("POST", "deleteHoliday", { id }, { id });
      if (res && res.success) {
        setHolidays((prev) => prev.filter((h) => h.id !== id));
      } else {
        alert(res?.message || "Gagal menghapus hari libur");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menghapus hari libur");
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

        <main className="fade-in" style={{ flex: 1, padding: "2rem", overflowX: "hidden" }}>
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
                    Satuan Kerja (Satker) Dokumen LKB
                  </label>
                  <input
                    type="text"
                    value={settings.satuan_kerja || ""}
                    onChange={(e) => setSettings({ ...settings, satuan_kerja: e.target.value })}
                    placeholder="contoh: PENDIS atau MTsN GOWA"
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
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Nama Operator / Tata Usaha (Tanda Tangan)
                  </label>
                  <input
                    type="text"
                    value={settings.operator_nama || ""}
                    onChange={(e) => setSettings({ ...settings, operator_nama: e.target.value })}
                    placeholder="contoh: Hendra Gunawan, S.Kom"
                    className="neon-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    NIP Operator / Tata Usaha
                  </label>
                  <input
                    type="text"
                    value={settings.operator_nip || ""}
                    onChange={(e) => setSettings({ ...settings, operator_nip: e.target.value })}
                    placeholder="contoh: 198001012005011001"
                    className="neon-input"
                  />
                </div>
              </div>
            </div>

            {/* Section 1.5: Tanda Tangan Asli (TTE) Kepala Sekolah & Stempel Resmi Pengesahan */}
            <div className="glass-panel" style={{ padding: "1.75rem", border: "1.5px solid #a7f3d0", background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={20} color="#059669" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                      Tanda Tangan Asli (TTE) & Stempel Resmi Pengesahan
                    </h2>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                      Gambar ini akan otomatis dicetak pada lembar pengesahan LKB ketika Admin / Kepala Sekolah mengesahkan dokumen.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplySampleSignatures}
                  className="btn-neon-secondary"
                  style={{ fontSize: "0.78rem", padding: "0.45rem 0.8rem", color: "#059669", borderColor: "#a7f3d0", background: "#ffffff" }}
                  title="Gunakan contoh tanda tangan dan stempel dinas siap pakai"
                >
                  <Sparkles size={14} />
                  <span>Gunakan Contoh Format Bawaan</span>
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                {/* 1. Upload Tanda Tangan Kepala Sekolah */}
                <div style={{ background: "#ffffff", padding: "1.15rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                      Scan Tanda Tangan Kepala Sekolah
                    </label>
                    {settings.ttd_kepsek_url && (
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, ttd_kepsek_url: "" }))}
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.2rem" }}
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Format PNG transparan disarankan agar tanda tangan menyatu rapi di atas nama.
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: "120px",
                        height: "70px",
                        borderRadius: "8px",
                        border: "1.5px dashed #cbd5e1",
                        background: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        padding: "4px"
                      }}
                    >
                      {settings.ttd_kepsek_url ? (
                        <img
                          src={settings.ttd_kepsek_url}
                          alt="Tanda Tangan Kepala Sekolah"
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                        />
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", textAlign: "center" }}>Belum Ada Tanda Tangan</span>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.45rem 0.85rem",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          borderRadius: "8px",
                          border: "1px solid #059669",
                          background: "#ecfdf5",
                          color: "#059669",
                          cursor: "pointer"
                        }}
                      >
                        <Upload size={14} />
                        <span>Pilih File TTD (PNG/JPG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadTtd}
                          style={{ display: "none" }}
                        />
                      </label>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                        Maks. 3MB (PNG latar transparan / JPG)
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Upload Stempel Resmi Sekolah */}
                <div style={{ background: "#ffffff", padding: "1.15rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                      Scan Stempel Resmi Sekolah / Madrasah
                    </label>
                    {settings.stempel_sekolah_url && (
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, stempel_sekolah_url: "" }))}
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.2rem" }}
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Format PNG transparan stempel dinas warna biru/ungu resmi.
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: "80px",
                        height: "70px",
                        borderRadius: "8px",
                        border: "1.5px dashed #cbd5e1",
                        background: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        padding: "4px"
                      }}
                    >
                      {settings.stempel_sekolah_url ? (
                        <img
                          src={settings.stempel_sekolah_url}
                          alt="Stempel Sekolah"
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                        />
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", textAlign: "center" }}>Belum Ada Stempel</span>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.45rem 0.85rem",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          borderRadius: "8px",
                          border: "1px solid #0284c7",
                          background: "#f0f9ff",
                          color: "#0284c7",
                          cursor: "pointer"
                        }}
                      >
                        <Upload size={14} />
                        <span>Pilih File Stempel (PNG/JPG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadStempel}
                          style={{ display: "none" }}
                        />
                      </label>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                        Maks. 3MB (PNG latar transparan / JPG)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Gabungan di Lembar Dokumen */}
              {(settings.ttd_kepsek_url || settings.stempel_sekolah_url) && (
                <div style={{ marginTop: "1rem", padding: "0.85rem 1.25rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)" }}>
                      Pratinjau Posisi Pengesahan pada Dokumen:
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Stempel otomatis overlap di sisi kiri tanda tangan Kepala Sekolah.
                    </div>
                  </div>

                  <div style={{ position: "relative", width: "190px", height: "70px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {settings.stempel_sekolah_url && (
                      <img
                        src={settings.stempel_sekolah_url}
                        alt="Stempel Preview"
                        style={{
                          position: "absolute",
                          left: "8px",
                          width: "60px",
                          height: "60px",
                          objectFit: "contain",
                          opacity: 0.85,
                          transform: "rotate(-6deg)",
                          pointerEvents: "none",
                          zIndex: 2
                        }}
                      />
                    )}
                    {settings.ttd_kepsek_url && (
                      <img
                        src={settings.ttd_kepsek_url}
                        alt="TTD Preview"
                        style={{
                          position: "relative",
                          width: "140px",
                          height: "55px",
                          objectFit: "contain",
                          zIndex: 1
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Jam Operasional & Batas Presensi Pegawai */}
            <div className="glass-panel" style={{ padding: "1.75rem", border: "1.5px solid #fed7aa", background: "linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ffedd5", border: "1px solid #fdba74", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={20} color="#c2410c" />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                    Jam Operasional & Batas Presensi Pegawai
                  </h2>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                    Aturan jam masuk dan jam kepulangan kantor untuk akun staf tata usaha / pegawai.
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Jam Buka Presensi Masuk (Mulai)
                  </label>
                  <input
                    type="time"
                    value={settings.jam_masuk_mulai || "06:30"}
                    onChange={(e) => setSettings({ ...settings, jam_masuk_mulai: e.target.value })}
                    className="neon-input"
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Tombol absen masuk mulai diizinkan</span>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Batas Jam Masuk (Tepat Waktu)
                  </label>
                  <input
                    type="time"
                    value={settings.jam_masuk_batas || "07:15"}
                    onChange={(e) => setSettings({ ...settings, jam_masuk_batas: e.target.value })}
                    className="neon-input"
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Lewat dari jam ini dihitung terlambat</span>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Jam Mulai Presensi Pulang
                  </label>
                  <input
                    type="time"
                    value={settings.jam_pulang_mulai || "15:00"}
                    onChange={(e) => setSettings({ ...settings, jam_pulang_mulai: e.target.value })}
                    className="neon-input"
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Waktu presensi pulang kantor dibuka</span>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Toleransi Keterlambatan (Menit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={settings.toleransi_menit ?? 15}
                    onChange={(e) => setSettings({ ...settings, toleransi_menit: parseInt(e.target.value, 10) || 0 })}
                    className="neon-input"
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Toleransi menit setelah jam batas masuk</span>
                </div>
              </div>
            </div>

            {/* Section 2b: Manajemen Kalender Libur Madrasah & Libur Semester */}
            <div
              className="glass-panel"
              style={{
                padding: "1.75rem",
                border: "1.5px solid #fca5a5",
                background: "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)",
                boxShadow: "0 4px 20px rgba(239, 68, 68, 0.06)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  marginBottom: "1.25rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "#fee2e2",
                      border: "1.5px solid #fca5a5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#dc2626",
                      flexShrink: 0
                    }}
                  >
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                      Kalender Libur Madrasah & Libur Semester
                    </h2>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                      Atur hari libur nasional, cuti bersama, dan rentang libur semester agar presensi terkunci otomatis tanpa dianggap alpa.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => router.push("/admin")}
                    className="btn-neon-secondary"
                    style={{ fontSize: "0.82rem", padding: "0.5rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <Calendar size={14} color="#ea580c" /> Buka Kalender Dashboard
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleOpenAddHoliday}
                    className="btn-neon-primary"
                    style={{
                      background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                      border: "none",
                      boxShadow: "0 4px 14px rgba(220, 38, 38, 0.25)",
                      fontSize: "0.84rem",
                      padding: "0.55rem 1.15rem",
                      color: "#ffffff"
                    }}
                  >
                    <Plus size={16} /> Tambah Hari Libur
                  </motion.button>
                </div>
              </div>

              {/* Daftar Hari Libur Terjadwal */}
              {holidays.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2.5rem 1rem",
                    borderRadius: "12px",
                    border: "1.5px dashed #fca5a5",
                    background: "#ffffff",
                    color: "var(--text-muted)"
                  }}
                >
                  <Palmtree size={32} color="#dc2626" style={{ margin: "0 auto 0.5rem", opacity: 0.7 }} />
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)", marginBottom: "0.2rem" }}>
                    Belum Ada Jadwal Hari Libur
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                    Sistem saat ini hanya mengunci presensi pada akhir pekan (Sabtu & Minggu). Klik tombol di atas untuk menambah hari libur nasional atau libur semester.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {holidays.map((item) => {
                    const todayStr = getTodayDateStr();
                    const startStr = item.tgl_mulai;
                    const endStr = item.tgl_selesai || startStr;
                    const isOngoing = todayStr >= startStr && todayStr <= endStr;
                    const isUpcoming = todayStr < startStr;
                    const isPast = todayStr > endStr;

                    const d1 = new Date(startStr);
                    const d2 = new Date(endStr);
                    const diffDays = !isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1
                      ? Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1
                      : 1;

                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: "0.95rem 1.15rem",
                          borderRadius: "12px",
                          background: isOngoing ? "#fef2f2" : "#ffffff",
                          border: `1.5px solid ${isOngoing ? "#f87171" : "#fecaca"}`,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "0.75rem"
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)" }}>
                              {item.nama_libur}
                            </span>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                padding: "0.15rem 0.55rem",
                                borderRadius: "999px",
                                background: item.tipe === "Libur Semester" ? "#ede9fe" : item.tipe === "Cuti Bersama" ? "#fef3c7" : "#fee2e2",
                                color: item.tipe === "Libur Semester" ? "#6d28d9" : item.tipe === "Cuti Bersama" ? "#b45309" : "#dc2626",
                                border: `1px solid ${item.tipe === "Libur Semester" ? "#c4b5fd" : item.tipe === "Cuti Bersama" ? "#fde68a" : "#fca5a5"}`
                              }}
                            >
                              {item.tipe}
                            </span>
                            {isOngoing && (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  padding: "0.15rem 0.55rem",
                                  borderRadius: "999px",
                                  background: "#ecfdf5",
                                  color: "#059669",
                                  border: "1px solid #a7f3d0"
                                }}
                              >
                                🌴 Sedang Aktif Hari Ini
                              </span>
                            )}
                            {isPast && (
                              <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600 }}>
                                (Selesai)
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontWeight: 600 }}>
                              <Calendar size={13} color="#dc2626" />
                              {item.tgl_mulai} {item.tgl_selesai && item.tgl_selesai !== item.tgl_mulai ? `s/d ${item.tgl_selesai}` : ""}
                            </span>
                            <span style={{ fontSize: "0.72rem", background: "#f1f5f9", padding: "0.1rem 0.45rem", borderRadius: "4px", color: "#475569", fontWeight: 700 }}>
                              {diffDays} Hari
                            </span>
                            {item.keterangan && item.keterangan !== "-" && (
                              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                &bull; {item.keterangan}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(item.id, item.nama_libur)}
                          title="Hapus hari libur ini"
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "8px",
                            background: "#fee2e2",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
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

              {/* URL Website Absensi untuk Tombol Link di Telegram */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.3rem" }}>
                  Link Website Absensi di Pesan Telegram
                </label>
                <input
                  type="url"
                  value={settings.web_url || "https://sistemabsensiguru.vercel.app"}
                  onChange={(e) => setSettings({ ...settings, web_url: e.target.value })}
                  placeholder="https://sistemabsensiguru.vercel.app"
                  className="neon-input"
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Tautan yang akan disematkan pada pesan pengingat jadwal mengajar Telegram agar guru dapat langsung membuka web.
                </span>
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

          {/* Modal Dialog Tambah Hari Libur */}
          <AnimatePresence>
            {holidayModalOpen && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 9999,
                  background: "rgba(15, 23, 42, 0.65)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1rem"
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget && !holidaySaving) setHolidayModalOpen(false);
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.2 }}
                  className="glass-panel"
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "1.75rem",
                    border: "1.5px solid #fecaca",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "#fee2e2",
                          border: "1px solid #fca5a5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#dc2626"
                        }}
                      >
                        <Calendar size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                          Tambah Hari Libur Baru
                        </h3>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0 }}>
                          Atur jadwal libur nasional atau rentang libur semester
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => !holidaySaving && setHolidayModalOpen(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "0.3rem",
                        borderRadius: "6px"
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveHoliday} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
                        Nama Hari Libur *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="contoh: Libur Semester Ganjil TA 2026/2027"
                        value={holidayForm.nama_libur}
                        onChange={(e) => setHolidayForm({ ...holidayForm, nama_libur: e.target.value })}
                        className="neon-input"
                        style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.85rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
                        Kategori Libur *
                      </label>
                      <select
                        value={holidayForm.tipe}
                        onChange={(e) => setHolidayForm({ ...holidayForm, tipe: e.target.value })}
                        className="neon-input"
                        style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.85rem", background: "#ffffff" }}
                      >
                        <option value="Libur Nasional">Libur Nasional</option>
                        <option value="Cuti Bersama">Cuti Bersama</option>
                        <option value="Libur Semester">Libur Semester (Siswa & Guru)</option>
                        <option value="Libur Khusus Madrasah">Libur Khusus Madrasah</option>
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
                          Tanggal Mulai *
                        </label>
                        <input
                          type="date"
                          required
                          value={holidayForm.tgl_mulai}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            setHolidayForm(prev => ({
                              ...prev,
                              tgl_mulai: newStart,
                              // If end date is empty or earlier than new start, update end date to match start
                              tgl_selesai: !prev.tgl_selesai || prev.tgl_selesai < newStart ? newStart : prev.tgl_selesai
                            }));
                          }}
                          className="neon-input"
                          style={{ width: "100%", padding: "0.6rem 0.75rem", fontSize: "0.85rem" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
                          Tanggal Selesai *
                        </label>
                        <input
                          type="date"
                          required
                          value={holidayForm.tgl_selesai}
                          min={holidayForm.tgl_mulai}
                          onChange={(e) => setHolidayForm({ ...holidayForm, tgl_selesai: e.target.value })}
                          className="neon-input"
                          style={{ width: "100%", padding: "0.6rem 0.75rem", fontSize: "0.85rem" }}
                        />
                      </div>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "-0.5rem" }}>
                      *Untuk libur 1 hari saja, samakan Tanggal Mulai dan Tanggal Selesai.
                    </span>

                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
                        Keterangan Tambahan (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="contoh: Sesuai SKB 3 Menteri atau Kalender Pendidikan Kemenag"
                        value={holidayForm.keterangan}
                        onChange={(e) => setHolidayForm({ ...holidayForm, keterangan: e.target.value })}
                        className="neon-input"
                        style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.85rem" }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.75rem" }}>
                      <button
                        type="button"
                        disabled={holidaySaving}
                        onClick={() => setHolidayModalOpen(false)}
                        className="btn-neon-secondary"
                        style={{ padding: "0.6rem 1.25rem", fontSize: "0.84rem" }}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={holidaySaving}
                        className="btn-neon-primary"
                        style={{
                          background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                          border: "none",
                          boxShadow: "0 4px 14px rgba(220, 38, 38, 0.25)",
                          padding: "0.6rem 1.4rem",
                          fontSize: "0.84rem",
                          color: "#ffffff"
                        }}
                      >
                        {holidaySaving ? "Menyimpan..." : "Simpan Hari Libur"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
