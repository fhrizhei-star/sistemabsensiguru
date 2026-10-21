"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import { getTodayDateStr, getTodayDayName } from "@/lib/mockData";
import {
  Users,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Activity,
  Layers,
  ChevronRight,
  School
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [schoolName, setSchoolName] = useState("SMA NEGERI 1 TELADAN");
  const [stats, setStats] = useState({
    total_guru: 0,
    total_sesi: 0,
    hadir: 0,
    terlambat: 0,
    izin: 0,
    alpha: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const today = getTodayDateStr();
        const [statsRes, usersRes, leavesRes, settingsRes] = await Promise.all([
          Api.request("GET", "getDashboardStats", { tanggal: today }),
          Api.request("GET", "getUsers"),
          Api.request("GET", "getLeaves"),
          Api.request("GET", "getSettings")
        ]);

        if (settingsRes?.settings?.nama_sekolah) {
          setSchoolName(settingsRes.settings.nama_sekolah);
        }

        const teachers = (usersRes?.users || usersRes?.list || []).filter((u) => u.role === "guru" && u.status !== "nonaktif");
        const activeLeaves = (leavesRes?.leaves || leavesRes?.list || []).filter(
          (l) => l.status === "Disetujui" && today >= l.tgl_mulai && today <= l.tgl_selesai
        );

        if (statsRes && statsRes.stats) {
          const s = statsRes.stats;
          setStats({
            total_guru: s.total_guru || s.totalGuru || teachers.length,
            total_sesi: s.total_sesi ?? s.totalSesi ?? 0,
            hadir: s.hadir ?? 0,
            terlambat: s.terlambat ?? 0,
            izin: s.izin !== undefined ? s.izin : activeLeaves.length,
            alpha: s.alpha ?? s.belumAbsen ?? 0
          });

          const recents = statsRes.recent_activity || statsRes.recentAttendance || [];
          setRecentActivities(recents);
        } else {
          setStats((prev) => ({
            ...prev,
            total_guru: teachers.length,
            izin: activeLeaves.length
          }));
        }
      } catch (err) {
        console.error("Gagal memuat dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  if (!currentUser) return null;

  const statCards = [
    {
      title: "Guru Terdaftar",
      value: stats.total_guru,
      icon: Users,
      color: "#4f46e5",
      bg: "linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)",
      border: "#c7d2fe",
      iconBg: "#eef2ff"
    },
    {
      title: "Sesi Hari Ini",
      value: stats.total_sesi,
      icon: CalendarCheck,
      color: "#8b5cf6",
      bg: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)",
      border: "#ddd6fe",
      iconBg: "#f5f3ff"
    },
    {
      title: "Hadir Tepat Waktu",
      value: stats.hadir,
      icon: CheckCircle2,
      color: "#059669",
      bg: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)",
      border: "#a7f3d0",
      iconBg: "#ecfdf5"
    },
    {
      title: "Terlambat",
      value: stats.terlambat,
      icon: Clock,
      color: "#d97706",
      bg: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
      border: "#fde68a",
      iconBg: "#fffbeb"
    },
    {
      title: "Izin / Dinas Luar",
      value: stats.izin,
      icon: AlertCircle,
      color: "#0284c7",
      bg: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
      border: "#bae6fd",
      iconBg: "#f0f9ff"
    },
    {
      title: "Belum Absen",
      value: stats.alpha,
      icon: Activity,
      color: "#e11d48",
      bg: "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)",
      border: "#fecdd3",
      iconBg: "#fff1f2"
    }
  ];

  return (
    <>
      <Navbar role="admin" />
      <div style={{ display: "flex", flex: 1 }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "2rem", overflowX: "hidden" }}>
          {/* Header Banner with Multi-Gradient Flair */}
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
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="pulse-dot" />
                <span
                  style={{
                    fontSize: "0.76rem",
                    color: "#4f46e5",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase"
                  }}
                >
                  Sistem Informasi Presensi Sekolah
                </span>
              </div>
              <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--text-main)", marginTop: "0.25rem" }}>
                Dashboard Administrator Tata Usaha
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Pemantauan kehadiran guru {schoolName} &bull; {getTodayDayName()},{" "}
                {getTodayDateStr()}
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link href="/admin/rekap" style={{ textDecoration: "none" }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  className="btn-neon-secondary"
                  style={{ fontSize: "0.85rem" }}
                >
                  <FileSpreadsheet size={16} color="#0284c7" /> Rekap Harian
                </motion.button>
              </Link>
              <Link href="/admin/guru" style={{ textDecoration: "none" }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  className="btn-neon-primary"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Users size={16} /> Kelola Guru
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Metric Cards Grid with Vivid Colors */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1.25rem",
              marginBottom: "1.75rem"
            }}
          >
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="glass-panel"
                  style={{
                    padding: "1.35rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: card.bg,
                    border: `1.5px solid ${card.border}`,
                    boxShadow: `0 4px 16px ${card.border}60`
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                      {card.title}
                    </span>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "11px",
                        background: card.iconBg,
                        border: `1px solid ${card.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: card.color
                      }}
                    >
                      <Icon size={19} />
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "2.1rem",
                        fontWeight: 900,
                        fontFamily: "var(--font-display)",
                        color: card.color
                      }}
                    >
                      {card.value}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Activity Stream & Quick Shortcuts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
            {/* Live Feed */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel"
              style={{ padding: "1.75rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Activity size={20} color="#059669" />
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                    Aktivitas Presensi Hari Ini
                  </h2>
                </div>
                <span className="pulse-dot" />
              </div>

              {recentActivities.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2.5rem 1rem",
                    color: "var(--text-muted)",
                    border: "1px dashed var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-muted)"
                  }}
                >
                  Belum ada catatan presensi hari ini.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {recentActivities.map((act, i) => (
                    <motion.div
                      key={act.id || i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.85rem 1rem",
                        borderRadius: "var(--radius-md)",
                        background: "#ffffff",
                        border: "1px solid var(--border-light)",
                        boxShadow: "var(--shadow-sm)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "var(--primary-gradient)",
                            color: "#ffffff",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.85rem"
                          }}
                        >
                          {(act.nama || "G")[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)" }}>{act.nama}</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {act.kelas || "Sesi Mengajar"} &bull; {act.jam_absen} WIB
                          </p>
                        </div>
                      </div>

                      <span className={`badge-status badge-${(act.status || "hadir").toLowerCase()}`}>
                        {act.status || "Hadir"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Management Shortcuts */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel"
              style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Layers size={20} color="#059669" />
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Menu Pintas Manajemen
                </h2>
              </div>

              {[
                {
                  title: "Kelola Data Guru",
                  desc: "Tambah, edit data NIP, kontak, dan mapel guru",
                  href: "/admin/guru",
                  icon: Users,
                  color: "#0284c7"
                },
                {
                  title: "Jadwal Pelajaran",
                  desc: "Atur pembagian jam mengajar kelas Senin - Sabtu",
                  href: "/admin/jadwal",
                  icon: CalendarCheck,
                  color: "#7c3aed"
                },
                {
                  title: "Verifikasi Izin & Cuti Guru",
                  desc: "Persetujuan permohonan surat izin dinas luar / dokter",
                  href: "/admin/izin",
                  icon: AlertCircle,
                  color: "#d97706"
                },
                {
                  title: "Pengaturan Geofencing & Sekolah",
                  desc: "Konfigurasi koordinat GPS sekolah dan Google Sheets",
                  href: "/admin/setting",
                  icon: School,
                  color: "#059669"
                }
              ].map((shortcut) => {
                const SIcon = shortcut.icon;
                return (
                  <Link
                    key={shortcut.title}
                    href={shortcut.href}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.01, x: 3 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        padding: "0.95rem 1.15rem",
                        borderRadius: "var(--radius-md)",
                        background: "#ffffff",
                        border: "1px solid var(--border-light)",
                        boxShadow: "var(--shadow-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            background: "var(--bg-muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: shortcut.color
                          }}
                        >
                          <SIcon size={18} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>
                            {shortcut.title}
                          </p>
                          <p style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                            {shortcut.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} color="#94a3b8" />
                    </motion.div>
                  </Link>
                );
              })}
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}
