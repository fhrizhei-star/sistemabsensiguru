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
import { formatDriveUrl } from "@/lib/drive";
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
  ShieldCheck
} from "lucide-react";

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

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    const loadData = async () => {
      const setRes = await Api.request("GET", "getSettings");
      if (setRes && setRes.settings) setSettings(setRes.settings);

      const day = getTodayDayName();
      const schedRes = await Api.request("GET", "getSchedules", {
        hari: day,
        guru_id: user.id
      });
      if (schedRes && schedRes.schedules) {
        setSchedules(schedRes.schedules);
        if (schedRes.schedules.length > 0) {
          setSelectedSchedule(schedRes.schedules[0]);
        }
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

  const handleAttendanceSubmit = async () => {
    setErrorNotice(null);

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
        status: "Hadir",
        koordinat: gpsLocation.string,
        keterangan: notes || "Tepat Waktu",
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
          coords: gpsLocation.string
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
              {currentUser.foto_url ? (
                <img
                  src={formatDriveUrl(currentUser.foto_url)}
                  alt={currentUser.nama || "Guru"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                (currentUser.nama || "G")[0].toUpperCase()
              )}
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
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)"
                        }}
                      >
                        <span style={{ fontWeight: 600, color: isSelected ? "#4338ca" : "inherit" }}>{item.mapel}</span>
                        <span>{item.ruangan}</span>
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <UserCheck size={20} color="#4f46e5" />
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>
                Formulir Presensi Mengajar
              </h2>
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

            {/* Status Validasi Presensi Geofencing */}
            <div
              style={{
                background: "linear-gradient(135deg, #eef2ff 0%, #ecfeff 100%)",
                border: "1.5px solid #c7d2fe",
                borderRadius: "var(--radius-md)",
                padding: "1rem 1.15rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                boxShadow: "0 2px 10px rgba(99, 102, 241, 0.06)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Status Sesi & Lokasi
                </span>
                <span className="badge-status badge-hadir" style={{ fontSize: "0.72rem" }}>
                  <ShieldCheck size={13} style={{ display: "inline", marginRight: "3px" }} />
                  Verifikasi GPS
                </span>
              </div>

              <div style={{ fontSize: "0.88rem", color: "var(--text-main)", fontWeight: 700 }}>
                {selectedSchedule
                  ? `${selectedSchedule.kelas} (${selectedSchedule.jam_mulai} - ${selectedSchedule.jam_selesai})`
                  : "Presensi Kehadiran Harian Sekolah"}
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <MapPin size={13} color="#059669" />
                <span>
                  {gpsLocation
                    ? `Koordinat Terkunci: ${gpsLocation.string}`
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleAttendanceSubmit}
              className="btn-neon-primary"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.95rem",
                fontSize: "1rem",
                marginTop: "0.5rem"
              }}
            >
              {loading ? (
                <span>Menyimpan Presensi...</span>
              ) : (
                <>
                  <CheckCircle2 size={19} />
                  <span>KIRIM PRESENSI SEKARANG</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </main>
    </>
  );
}
