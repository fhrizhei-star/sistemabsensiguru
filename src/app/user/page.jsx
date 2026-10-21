"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";
import TeacherNav from "@/components/TeacherNav";
import RadarScanner from "@/components/RadarScanner";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import { formatDriveUrl, getAvatarUrl } from "@/lib/drive";
import { getTodayDateStr, getTodayDayName } from "@/lib/mockData";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  BookOpen,
  School,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Timer,
  AlertCircle
} from "lucide-react";

// --- Helper Fungsi Pembatasan Jam Mengajar & Status Keterlambatan ---
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const cleaned = String(timeStr).trim().replace(".", ":");
  const parts = cleaned.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }
  return null;
}

function formatMinutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function evaluateAttendanceTiming(schedule, settings, dateObj = new Date()) {
  const nowMin = dateObj.getHours() * 60 + dateObj.getMinutes();
  const toleransi = Number(settings?.toleransi_menit ?? 15);
  const currentTimeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (!schedule) {
    // Mode Presensi Harian Umum
    const masukMulai = settings?.jam_masuk_mulai || "06:30";
    const masukBatas = settings?.jam_masuk_batas || "07:15";
    const startMin = parseTimeToMinutes(masukMulai) ?? (6 * 60 + 30);
    const limitMin = parseTimeToMinutes(masukBatas) ?? (7 * 60 + 15);

    if (nowMin < startMin) {
      return {
        allowed: false,
        phase: "too_early",
        recordStatus: "Hadir",
        badgeText: `⏳ Dibuka ${masukMulai}`,
        badgeColor: "#b45309",
        badgeBg: "#fffbeb",
        badgeBorder: "#fde68a",
        message: `Presensi harian belum dibuka. Presensi dibuka tepat pukul ${masukMulai} (waktu saat ini ${currentTimeStr}).`,
        keterangan: "Tepat Waktu"
      };
    }
    if (nowMin <= limitMin + toleransi) {
      return {
        allowed: true,
        phase: "on_time",
        recordStatus: "Hadir",
        badgeText: "🟢 Tepat Waktu",
        badgeColor: "#065f46",
        badgeBg: "#ecfdf5",
        badgeBorder: "#a7f3d0",
        message: `Presensi harian tepat waktu (batas toleransi s/d ${formatMinutesToTime(limitMin + toleransi)}).`,
        keterangan: "Tepat Waktu"
      };
    }
    const diff = nowMin - limitMin;
    return {
      allowed: true,
      phase: "late",
      recordStatus: "Terlambat",
      badgeText: `🟠 Terlambat (${diff} mnt)`,
      badgeColor: "#c2410c",
      badgeBg: "#fff7ed",
      badgeBorder: "#fed7aa",
      message: `Peringatan: Melewati jam batas masuk ${masukBatas}. Kehadiran tercatat TERLAMBAT ${diff} menit.`,
      keterangan: `Terlambat ${diff} menit`
    };
  }

  // Mode Sesi Kelas Berdasarkan Jadwal Pelajaran
  const startMin = parseTimeToMinutes(schedule.jam_mulai);
  const endMin = parseTimeToMinutes(schedule.jam_selesai);

  if (startMin === null || endMin === null) {
    return {
      allowed: true,
      phase: "on_time",
      recordStatus: "Hadir",
      badgeText: "🟢 Terjadwal",
      badgeColor: "#065f46",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      message: "Jadwal terverifikasi.",
      keterangan: "Tepat Waktu"
    };
  }

  // 1. Belum Waktunya (Misal jadwal 07:30, sekarang 07:28) -> TIDAK BISA ABSEN
  if (nowMin < startMin) {
    const diffBefore = startMin - nowMin;
    return {
      allowed: false,
      phase: "too_early",
      recordStatus: "Hadir",
      badgeText: `⏳ Dibuka ${schedule.jam_mulai}`,
      badgeColor: "#b45309",
      badgeBg: "#fffbeb",
      badgeBorder: "#fde68a",
      message: `Sesi kelas ${schedule.kelas} (${schedule.mapel}) belum dimulai! Presensi baru dapat dilakukan tepat pukul ${schedule.jam_mulai} (saat ini ${currentTimeStr}). Harap menunggu ${diffBefore} menit lagi.`,
      keterangan: "Tepat Waktu"
    };
  }

  // 2. Sudah Melewati Jam Selesai (Misal jadwal 10:00, sekarang 10:01) -> SESI BERAKHIR
  if (nowMin > endMin) {
    return {
      allowed: false,
      phase: "ended",
      recordStatus: "Terlambat",
      badgeText: `⛔ Selesai (${schedule.jam_selesai})`,
      badgeColor: "#475569",
      badgeBg: "#f1f5f9",
      badgeBorder: "#cbd5e1",
      message: `Sesi kelas ${schedule.kelas} (${schedule.mapel}) telah berakhir pada pukul ${schedule.jam_selesai} (saat ini ${currentTimeStr}). Presensi untuk sesi ini sudah ditutup.`,
      keterangan: "Sesi Berakhir"
    };
  }

  // 3. Waktu Presensi Tepat Waktu (07:30 s/d 07:30 + 15 menit = 07:45) -> HADIR
  if (nowMin <= startMin + toleransi) {
    return {
      allowed: true,
      phase: "on_time",
      recordStatus: "Hadir",
      badgeText: `🟢 Tepat Waktu`,
      badgeColor: "#065f46",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      message: `Sesi kelas ${schedule.kelas} sedang berlangsung. Anda melakukan presensi tepat waktu (toleransi s/d ${formatMinutesToTime(startMin + toleransi)}).`,
      keterangan: "Tepat Waktu"
    };
  }

  // 4. Melewati Batas Toleransi 15 Menit (Misal 07:46 s/d 10:00) -> TERLAMBAT
  const lateMinutes = nowMin - startMin;
  return {
    allowed: true,
    phase: "late",
    recordStatus: "Terlambat",
    badgeText: `🟠 Terlambat (${lateMinutes} mnt)`,
    badgeColor: "#c2410c",
    badgeBg: "#fff7ed",
    badgeBorder: "#fed7aa",
    message: `Peringatan Keterlambatan: Anda melewati batas toleransi ${toleransi} menit (jam mulai ${schedule.jam_mulai}, saat ini ${currentTimeStr}). Kehadiran Anda dicatat TERLAMBAT ${lateMinutes} menit.`,
    keterangan: `Terlambat ${lateMinutes} menit`
  };
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [attendanceType, setAttendanceType] = useState("jadwal");
  const [gpsLocation, setGpsLocation] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);
  const [nowDate, setNowDate] = useState(new Date());

  // Real-time clock interval (updates every 1 second)
  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    const loadData = async () => {
      const day = getTodayDayName();
      try {
        const [setRes, schedRes] = await Promise.all([
          Api.request("GET", "getSettings"),
          Api.request("GET", "getSchedules", {
            hari: day,
            guru_id: user.id || user.nip
          })
        ]);

        if (setRes && setRes.settings) setSettings(setRes.settings);

        if (schedRes && schedRes.schedules) {
          const teacherSchedules = schedRes.schedules.filter(
            (s) =>
              String(s.guru_id) === String(user.id) ||
              String(s.nip) === String(user.nip) ||
              String(s.guru_id) === String(user.nip)
          );
          setSchedules(teacherSchedules);
          if (teacherSchedules.length > 0) {
            setSelectedSchedule(teacherSchedules[0]);
          }
        }
      } catch (err) {
        console.error("Gagal memuat jadwal guru:", err);
      }

      // Sinkronisasi foto & profil guru jika baru saja diubah oleh admin
      try {
        const usersRes = await Api.request("GET", "getUsers", { role: "guru" });
        if (usersRes && usersRes.users) {
          const fresh = usersRes.users.find(
            (u) => u.id === user.id || u.username === user.username || (u.nip && u.nip === user.nip)
          );
          if (fresh && (fresh.foto_url !== user.foto_url || fresh.nama !== user.nama)) {
            const updated = { ...user, ...fresh };
            Auth.setCurrentUser(updated);
            setCurrentUser(updated);
          }
        }
      } catch (e) {
        console.warn("Gagal sinkron data user profil:", e);
      }
    };

    loadData();
  }, [router]);

  const activeSchedule = attendanceType === "jadwal" ? selectedSchedule : null;
  const timingEval = evaluateAttendanceTiming(activeSchedule, settings, nowDate);

  const handleAttendanceSubmit = async () => {
    setErrorNotice(null);

    // 1. Validasi Waktu Sesi Kelas & Aturan Toleransi
    if (!timingEval.allowed) {
      setErrorNotice(timingEval.message);
      return;
    }

    // 2. Validasi GPS & Radius Geofencing
    if (!gpsLocation) {
      setErrorNotice("Sinyal GPS belum terdeteksi. Harap tunggu radar geofencing.");
      return;
    }

    if (!gpsLocation.isInside) {
      setErrorNotice(
        `Lokasi Anda berada ${gpsLocation.distance}m dari sekolah (toleransi maksimal ${settings?.radius_meter || 250}m). Harap mendekat ke area sekolah.`
      );
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const jamAbsen = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      const body = {
        user_id: currentUser.id,
        nama: currentUser.nama || currentUser.username,
        nip: currentUser.nip || "-",
        mapel: currentUser.mapel || "Umum",
        tipe_absen: attendanceType,
        jadwal_id: selectedSchedule ? selectedSchedule.id : null,
        kelas: selectedSchedule ? selectedSchedule.kelas : "Umum",
        jam_jadwal: selectedSchedule
          ? `${selectedSchedule.jam_mulai} - ${selectedSchedule.jam_selesai}`
          : "Harian",
        jam_absen: jamAbsen,
        status: timingEval.recordStatus,
        koordinat: gpsLocation.string,
        keterangan: notes ? `${notes} • ${timingEval.keterangan}` : timingEval.keterangan,
        foto: ""
      };

      const res = await Api.request("POST", "recordAttendance", {}, body);
      if (res && res.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#059669", "#10b981", "#38bdf8", "#fbbf24"]
        });

        setSuccessNotice({
          time: jamAbsen,
          type: attendanceType === "jadwal" ? `Sesi ${selectedSchedule?.kelas}` : "Harian",
          coords: gpsLocation.string,
          status: timingEval.recordStatus,
          keterangan: timingEval.keterangan
        });

        setNotes("");
      } else {
        setErrorNotice(res?.message || "Gagal mencatat absensi.");
      }
    } catch (err) {
      setErrorNotice("Terjadi kesalahan sistem saat menyimpan presensi.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <Navbar role="guru" />
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem", width: "100%" }}>
        <TeacherNav />

        {/* Hero Greeting Card with Large Teacher Portrait */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel"
          style={{
            padding: "1.75rem 2rem",
            marginBottom: "1.75rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.25rem",
            background: "linear-gradient(135deg, #ffffff 0%, #eef2ff 45%, #ecfdf5 100%)",
            border: "1.5px solid #c7d2fe",
            boxShadow: "0 6px 20px rgba(99, 102, 241, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div
              style={{
                width: "84px",
                height: "84px",
                borderRadius: "22px",
                overflow: "hidden",
                border: "3px solid #4f46e5",
                background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "2rem",
                boxShadow: "0 6px 20px rgba(79, 70, 229, 0.28)",
                flexShrink: 0
              }}
            >
              <img
                src={getAvatarUrl(currentUser.foto_url, currentUser.nama || currentUser.username)}
                alt={currentUser.nama || "Guru"}
                referrerPolicy="no-referrer"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = getAvatarUrl("", currentUser.nama || currentUser.username);
                }}
              />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Selamat Datang, {currentUser.nama || currentUser.username}
                </h1>
                <span className="badge-status badge-hadir">GURU AKTIF</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "0.25rem" }}>
                NIP: {currentUser.nip || "-"} &bull; {currentUser.jabatan || "Tenaga Pendidik"} &bull;{" "}
                <strong style={{ color: "var(--primary)" }}>{currentUser.mapel || "Guru"}</strong>
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              background: "#ffffff",
              padding: "0.65rem 1.15rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <Calendar size={20} color="#059669" />
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Hari Ini
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)" }}>
                {getTodayDayName()}, {getTodayDateStr()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Success Modal / Banner */}
        <AnimatePresence>
          {successNotice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              className="glass-panel"
              style={{
                background: "var(--primary-light)",
                border: "1.5px solid var(--primary-border)",
                padding: "1.5rem",
                marginBottom: "1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--primary)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#065f46" }}>
                    Presensi Berhasil Terverifikasi!
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                    Tercatat pada jam <strong>{successNotice.time} WIB</strong> &bull; GPS: {successNotice.coords}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessNotice(null)}
                className="btn-neon-primary"
                style={{ fontSize: "0.85rem", padding: "0.6rem 1.2rem" }}
              >
                Tutup
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main 2-Column Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
          {/* Column 1: Jadwal Mengajar Hari Ini */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel"
            style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <BookOpen size={20} color="#059669" />
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Jadwal Mengajar Hari Ini
                </h2>
              </div>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--primary)",
                  fontWeight: 700,
                  background: "var(--primary-light)",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "var(--radius-full)"
                }}
              >
                {schedules.length} Sesi
              </span>
            </div>

            {schedules.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2.5rem 1rem",
                  background: "var(--bg-muted)",
                  borderRadius: "var(--radius-md)",
                  border: "1px dashed var(--border-light)"
                }}
              >
                <Clock size={36} color="#94a3b8" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                  Tidak ada jadwal mengajar pada hari {getTodayDayName()}.
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                  Anda tetap dapat melakukan presensi kehadiran harian di panel sebelah kanan.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {schedules.map((item) => {
                  const isSelected = selectedSchedule && selectedSchedule.id === item.id;
                  const itemTiming = evaluateAttendanceTiming(item, settings, nowDate);
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedSchedule(item);
                        setAttendanceType("jadwal");
                      }}
                      style={{
                        padding: "1.1rem 1.25rem",
                        borderRadius: "var(--radius-md)",
                        background: isSelected ? "linear-gradient(135deg, #eef2ff 0%, #ecfeff 100%)" : "#ffffff",
                        border: `1.5px solid ${isSelected ? "#4f46e5" : "var(--border-light)"}`,
                        boxShadow: isSelected ? "0 4px 16px rgba(79, 70, 229, 0.18)" : "var(--shadow-sm)",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.35rem"
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "1.05rem",
                            color: isSelected ? "#4f46e5" : "var(--text-main)"
                          }}
                        >
                          {item.kelas}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.82rem",
                              color: isSelected ? "#4f46e5" : "var(--text-secondary)",
                              fontWeight: 700,
                              background: isSelected ? "#ffffff" : "var(--bg-muted)",
                              padding: "0.2rem 0.55rem",
                              borderRadius: "6px",
                              boxShadow: isSelected ? "0 1px 4px rgba(79, 70, 229, 0.15)" : "none"
                            }}
                          >
                            {item.jam_mulai} - {item.jam_selesai}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          marginTop: "0.25rem"
                        }}
                      >
                        <span style={{ fontWeight: 600, color: isSelected ? "#4338ca" : "inherit" }}>
                          {item.mapel} &bull; {item.ruangan}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.55rem",
                            borderRadius: "6px",
                            background: itemTiming.badgeBg,
                            color: itemTiming.badgeColor,
                            border: `1px solid ${itemTiming.badgeBorder || itemTiming.badgeColor}`
                          }}
                        >
                          {itemTiming.badgeText}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Column 2: Geofencing & Presensi Action */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel"
            style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <UserCheck size={20} color="#4f46e5" />
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Formulir Presensi Mengajar
                </h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "#4f46e5", fontWeight: 700, background: "#eef2ff", padding: "0.3rem 0.65rem", borderRadius: "8px" }}>
                <Clock size={14} />
                <span>{nowDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              </div>
            </div>

            <AnimatePresence>
              {errorNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    background: "var(--danger-light)",
                    border: "1px solid #fecaca",
                    color: "var(--danger)",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>{errorNotice}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Radar Geofencing */}
            <RadarScanner
              schoolLat={settings?.lat_sekolah || -6.2088}
              schoolLng={settings?.lng_sekolah || 106.8456}
              radiusMeter={settings?.radius_meter || 250}
              onLocationUpdate={(loc) => setGpsLocation(loc)}
            />

            {/* Status Validasi Presensi Geofencing & Jam Sesi */}
            <div
              style={{
                background: "linear-gradient(135deg, #eef2ff 0%, #ecfeff 100%)",
                border: "1.5px solid #c7d2fe",
                borderRadius: "var(--radius-md)",
                padding: "1rem 1.15rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
                boxShadow: "0 2px 10px rgba(99, 102, 241, 0.06)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Status Sesi & Validasi Waktu
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.55rem",
                    borderRadius: "6px",
                    background: timingEval.badgeBg,
                    color: timingEval.badgeColor,
                    border: `1px solid ${timingEval.badgeBorder || timingEval.badgeColor}`
                  }}
                >
                  {timingEval.badgeText}
                </span>
              </div>

              <div style={{ fontSize: "0.92rem", color: "var(--text-main)", fontWeight: 800 }}>
                {selectedSchedule
                  ? `${selectedSchedule.kelas} • ${selectedSchedule.mapel} (${selectedSchedule.jam_mulai} - ${selectedSchedule.jam_selesai})`
                  : "Presensi Kehadiran Harian Sekolah"}
              </div>

              {/* Banner Aturan Waktu Sesi */}
              <div
                style={{
                  background: timingEval.badgeBg,
                  border: `1px solid ${timingEval.badgeBorder || timingEval.badgeColor}`,
                  borderRadius: "8px",
                  padding: "0.65rem 0.85rem",
                  fontSize: "0.8rem",
                  color: timingEval.badgeColor,
                  lineHeight: 1.35,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem"
                }}
              >
                <Clock size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{timingEval.message}</span>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <MapPin size={13} color="#059669" />
                <span>
                  {gpsLocation
                    ? `GPS Terkunci: ${gpsLocation.string}`
                    : "Mendeteksi sinyal GPS perangkat..."}
                </span>
              </div>
            </div>

            {/* Jurnal / Catatan Pembelajaran */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.4rem"
                }}
              >
                Catatan / Materi Pembelajaran (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pembahasan Bab 3 Persamaan Linear..."
                className="neon-input"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={timingEval.allowed && !loading ? { scale: 1.02 } : {}}
              whileTap={timingEval.allowed && !loading ? { scale: 0.98 } : {}}
              type="button"
              onClick={handleAttendanceSubmit}
              disabled={loading || !timingEval.allowed}
              style={{
                width: "100%",
                padding: "0.95rem",
                fontSize: "0.92rem",
                fontWeight: 800,
                marginTop: "0.5rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: loading || !timingEval.allowed ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease",
                background: !timingEval.allowed
                  ? timingEval.badgeBg
                  : timingEval.phase === "late"
                  ? "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)"
                  : "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
                color: !timingEval.allowed ? timingEval.badgeColor : "#ffffff",
                boxShadow: timingEval.allowed
                  ? timingEval.phase === "late"
                    ? "0 4px 16px rgba(234, 88, 12, 0.35)"
                    : "0 4px 16px rgba(5, 150, 105, 0.35)"
                  : "none"
              }}
            >
              {loading ? (
                <span>Menyimpan Presensi...</span>
              ) : !timingEval.allowed ? (
                <>
                  <Timer size={18} />
                  <span>{timingEval.badgeText} - Presensi Dikunci</span>
                </>
              ) : timingEval.phase === "late" ? (
                <>
                  <AlertTriangle size={18} />
                  <span>KIRIM PRESENSI (TERCATAT TERLAMBAT)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>KIRIM PRESENSI (HADIR TEPAT WAKTU)</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </main>
    </>
  );
}
