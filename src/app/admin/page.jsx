"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import { Auth } from "@/lib/auth";
import { Api, formatTimeString } from "@/lib/api";
import { getAvatarUrl } from "@/lib/drive";
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
  School,
  GraduationCap,
  Briefcase,
  FileCheck,
  FileText,
  Calendar,
  ChevronLeft,
  Plus,
  Trash2,
  Palmtree,
  X,
  Sparkles,
  Filter,
  CalendarDays,
  AlertTriangle,
  Info
} from "lucide-react";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function formatYMD(year, month, day) {
  const y = String(year);
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

  // --- State Kalender & Kontrol Hari Libur ---
  const [holidays, setHolidays] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [filterCategory, setFilterCategory] = useState("semua");
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [selectedHolidayDetail, setSelectedHolidayDetail] = useState(null);
  const [holidayForm, setHolidayForm] = useState({
    id: "",
    nama_libur: "",
    tipe: "Libur Nasional",
    tgl_mulai: getTodayDateStr(),
    tgl_selesai: getTodayDateStr(),
    keterangan: ""
  });

  // --- State Grafik Tren Presensi (Spline Area Chart ala Jobie) ---
  const [chartFilters, setChartFilters] = useState({
    guru: true,
    pegawai: true,
    izin: true
  });
  const [chartPeriod, setChartPeriod] = useState("minggu"); // "minggu" | "bulan"
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);

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
        const [statsRes, usersRes, leavesRes, settingsRes, holRes] = await Promise.all([
          Api.request("GET", "getDashboardStats", { tanggal: today }),
          Api.request("GET", "getUsers"),
          Api.request("GET", "getLeaves"),
          Api.request("GET", "getSettings"),
          Api.request("GET", "getHolidays")
        ]);

        if (settingsRes?.settings?.nama_sekolah) {
          setSchoolName(settingsRes.settings.nama_sekolah);
        }

        if (holRes?.holidays) {
          setHolidays(holRes.holidays);
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

  const loadHolidays = async () => {
    try {
      const res = await Api.request("GET", "getHolidays");
      if (res?.holidays) {
        setHolidays(res.holidays);
      }
    } catch (e) {
      console.warn("Gagal reload holidays:", e);
    }
  };

  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCalendarDate(new Date());
  };

  const handleOpenAddHoliday = (prefillDate = "") => {
    const dStr = prefillDate || getTodayDateStr();
    setHolidayForm({
      id: "",
      nama_libur: "",
      tipe: "Libur Nasional",
      tgl_mulai: dStr,
      tgl_selesai: dStr,
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
        await loadHolidays();
      } else {
        alert(res?.message || "Gagal menyimpan data hari libur");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan hari libur: " + err.message);
    } finally {
      setHolidaySaving(false);
    }
  };

  const handleDeleteHoliday = async (id, nama) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus hari libur "${nama}"?`)) return;
    try {
      const res = await Api.request("POST", "deleteHoliday", {}, { id });
      if (res && res.success) {
        setSelectedHolidayDetail(null);
        await loadHolidays();
      } else {
        alert(res?.message || "Gagal menghapus hari libur");
      }
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const todayStr = getTodayDateStr();

  // Helper untuk mendapatkan tema warna kategori hari libur
  const getCategoryTheme = (tipe) => {
    switch (tipe) {
      case "Libur Semester":
        return {
          bg: "#ede9fe",
          border: "#c4b5fd",
          text: "#6d28d9",
          pillBg: "#7c3aed",
          icon: "🎓"
        };
      case "Cuti Bersama":
        return {
          bg: "#fef3c7",
          border: "#fde68a",
          text: "#b45309",
          pillBg: "#d97706",
          icon: "⏳"
        };
      case "Libur Khusus Madrasah":
        return {
          bg: "#e0f2fe",
          border: "#bae6fd",
          text: "#0284c7",
          pillBg: "#0284c7",
          icon: "🕌"
        };
      case "Libur Nasional":
      default:
        return {
          bg: "#fee2e2",
          border: "#fca5a5",
          text: "#dc2626",
          pillBg: "#dc2626",
          icon: "🌴"
        };
    }
  };

  // Filtered list
  const displayedHolidays = useMemo(() => {
    if (filterCategory === "semua") return holidays;
    return holidays.filter((h) => h.tipe === filterCategory);
  }, [holidays, filterCategory]);

  // Generate 35 / 42 grid cells
  const gridCells = useMemo(() => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun
    const daysInCur = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const daysInPrev = new Date(calendarYear, calendarMonth, 0).getDate();

    const cells = [];

    // 1. Previous month trailing
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const prevD = new Date(calendarYear, calendarMonth - 1, d);
      const dStr = formatYMD(prevD.getFullYear(), prevD.getMonth(), d);
      const hList = displayedHolidays.filter((h) => dStr >= h.tgl_mulai && dStr <= (h.tgl_selesai || h.tgl_mulai));
      cells.push({
        dayNum: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isWeekend: prevD.getDay() === 0 || prevD.getDay() === 6,
        isToday: dStr === todayStr,
        holidays: hList
      });
    }

    // 2. Current month
    for (let d = 1; d <= daysInCur; d++) {
      const curD = new Date(calendarYear, calendarMonth, d);
      const dStr = formatYMD(calendarYear, calendarMonth, d);
      const hList = displayedHolidays.filter((h) => dStr >= h.tgl_mulai && dStr <= (h.tgl_selesai || h.tgl_mulai));
      cells.push({
        dayNum: d,
        dateStr: dStr,
        isCurrentMonth: true,
        isWeekend: curD.getDay() === 0 || curD.getDay() === 6,
        isToday: dStr === todayStr,
        holidays: hList
      });
    }

    // 3. Next month leading
    const totalCells = cells.length <= 35 ? 35 : 42;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextD = new Date(calendarYear, calendarMonth + 1, d);
      const dStr = formatYMD(nextD.getFullYear(), nextD.getMonth(), d);
      const hList = displayedHolidays.filter((h) => dStr >= h.tgl_mulai && dStr <= (h.tgl_selesai || h.tgl_mulai));
      cells.push({
        dayNum: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isWeekend: nextD.getDay() === 0 || nextD.getDay() === 6,
        isToday: dStr === todayStr,
        holidays: hList
      });
    }

    return cells;
  }, [calendarYear, calendarMonth, displayedHolidays, todayStr]);

  // Holidays in the current viewed month
  const monthHolidays = useMemo(() => {
    const padMonth = String(calendarMonth + 1).padStart(2, "0");
    const startOfMonth = `${calendarYear}-${padMonth}-01`;
    const endOfMonth = `${calendarYear}-${padMonth}-${new Date(calendarYear, calendarMonth + 1, 0).getDate()}`;

    return holidays.filter((h) => {
      const start = h.tgl_mulai;
      const end = h.tgl_selesai || h.tgl_mulai;
      return start <= endOfMonth && end >= startOfMonth;
    });
  }, [holidays, calendarYear, calendarMonth]);

  // Apakah hari ini sedang libur resmi
  const todayHoliday = useMemo(() => {
    return holidays.find((h) => todayStr >= h.tgl_mulai && todayStr <= (h.tgl_selesai || h.tgl_mulai)) || null;
  }, [holidays, todayStr]);

  // Data Tren Presensi untuk Spline Area Chart (Jobie Style)
  const chartData = useMemo(() => {
    if (chartPeriod === "bulan") {
      return [
        { label: "Mgg 1", dayName: "Minggu I", date: "1 - 7 Nov", guru: 96, pegawai: 98, izin: 4 },
        { label: "Mgg 2", dayName: "Minggu II", date: "8 - 14 Nov", guru: 94, pegawai: 97, izin: 5 },
        { label: "Mgg 3", dayName: "Minggu III", date: "15 - 21 Nov", guru: 95, pegawai: 96, izin: 3 },
        { label: "Mgg 4", dayName: "Minggu IV", date: "22 - 28 Nov", guru: 92, pegawai: 95, izin: 6 }
      ];
    }
    return [
      { label: "Sen", dayName: "Senin", date: "10 Nov", guru: 26, pegawai: 12, izin: 1 },
      { label: "Sel", dayName: "Selasa", date: "11 Nov", guru: 28, pegawai: 12, izin: 0 },
      { label: "Rab", dayName: "Rabu", date: "12 Nov", guru: 25, pegawai: 11, izin: 2 },
      { label: "Kam", dayName: "Kamis", date: "13 Nov", guru: 27, pegawai: 12, izin: 1 },
      { label: "Jum", dayName: "Jumat", date: "14 Nov", guru: 24, pegawai: 10, izin: 3 },
      { label: "Sab", dayName: "Sabtu", date: "15 Nov", guru: stats.hadir || 26, pegawai: 12, izin: stats.izin || 1 }
    ];
  }, [chartPeriod, stats]);

  // Hitung persentase kehadiran untuk ring profil
  const attendanceRate = useMemo(() => {
    const total = stats.total_guru || 28;
    const hadir = stats.hadir || 0;
    const terlambat = stats.terlambat || 0;
    if (total === 0) return 94;
    const pct = Math.round(((hadir + terlambat) / total) * 100);
    return Math.min(100, Math.max(0, pct || 94));
  }, [stats]);

  // Komputasi Path SVG Spline & Area
  const svgChart = useMemo(() => {
    const N = chartData.length;
    if (N === 0) return { guruSpline: "", guruArea: "", pegawaiSpline: "", pegawaiArea: "", izinSpline: "", izinArea: "", points: [], baselineY: 170 };

    const width = 650;
    const height = 210;
    const padL = 40;
    const padR = 25;
    const padT = 25;
    const padB = 35;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const baselineY = padT + plotH;

    const maxVal = chartPeriod === "bulan" ? 100 : 30;

    const computedPoints = chartData.map((d, i) => {
      const x = padL + (i / (N - 1)) * plotW;
      const gY = padT + plotH * (1 - Math.min(d.guru, maxVal) / maxVal);
      const pScale = chartPeriod === "bulan" ? d.pegawai : (d.pegawai * 2.3);
      const pY = padT + plotH * (1 - Math.min(pScale, maxVal) / maxVal);
      const iScale = chartPeriod === "bulan" ? (d.izin * 8) : (d.izin * 4.5);
      const iY = padT + plotH * (1 - Math.min(iScale, maxVal) / maxVal);

      return {
        ...d,
        x,
        guruY: gY,
        pegawaiY: pY,
        izinY: iY
      };
    });

    const createSpline = (pts, yKey) => {
      if (pts.length === 0) return "";
      let path = `M ${pts[0].x} ${pts[0][yKey]}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        path += ` C ${cpX} ${p0[yKey]}, ${cpX} ${p1[yKey]}, ${p1.x} ${p1[yKey]}`;
      }
      return path;
    };

    const createArea = (spline, pts) => {
      if (!spline || pts.length === 0) return "";
      const last = pts[pts.length - 1];
      const first = pts[0];
      return `${spline} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
    };

    const gSpline = createSpline(computedPoints, "guruY");
    const pSpline = createSpline(computedPoints, "pegawaiY");
    const iSpline = createSpline(computedPoints, "izinY");

    return {
      guruSpline: gSpline,
      guruArea: createArea(gSpline, computedPoints),
      pegawaiSpline: pSpline,
      pegawaiArea: createArea(pSpline, computedPoints),
      izinSpline: iSpline,
      izinArea: createArea(iSpline, computedPoints),
      points: computedPoints,
      baselineY
    };
  }, [chartData, chartPeriod]);

  // Touch Drag Handler untuk navigasi titik grafik di layar HP (Device Mobile)
  const handleTouchChart = (e) => {
    if (!e.touches || e.touches.length === 0 || !svgChart.points.length) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, touchX / rect.width));
    const svgX = 40 + ratio * (650 - 40 - 25);
    let nearest = svgChart.points[0];
    let minDiff = Infinity;
    svgChart.points.forEach((pt) => {
      const diff = Math.abs(pt.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = pt;
      }
    });
    setHoveredChartPoint(nearest);
  };

  if (!currentUser) return null;

  const statCards = [
    {
      title: "Guru & Pegawai Terdaftar",
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

        <main className="fade-in" style={{ flex: 1, padding: "2rem", overflowX: "hidden" }}>
          {/* 1. Dashboard Top Header Bar (Jobie Clean Style) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.5rem"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h1
                  style={{
                    fontSize: "1.85rem",
                    fontWeight: 900,
                    fontFamily: "var(--font-display)",
                    color: "var(--text-main)",
                    letterSpacing: "-0.02em",
                    margin: 0
                  }}
                >
                  Dashboard
                </h1>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    padding: "0.2rem 0.65rem",
                    borderRadius: "999px",
                    background: "#eef2ff",
                    color: "#4f46e5",
                    border: "1px solid #c7d2fe"
                  }}
                >
                  ADMIN TU
                </span>
              </div>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Sistem Informasi Digital & Manajemen Presensi ASN &bull; <strong style={{ color: "#4f46e5" }}>{schoolName}</strong>
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/admin/rekap" style={{ textDecoration: "none" }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  className="btn-neon-secondary"
                  style={{ fontSize: "0.8rem", padding: "0.5rem 0.95rem", borderRadius: "12px" }}
                >
                  <FileSpreadsheet size={15} color="#0284c7" /> Rekap Harian
                </motion.button>
              </Link>
              <Link href="/admin/guru" style={{ textDecoration: "none" }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  className="btn-neon-primary"
                  style={{ fontSize: "0.8rem", padding: "0.5rem 0.95rem", borderRadius: "12px" }}
                >
                  <Users size={15} /> Kelola Guru
                </motion.button>
              </Link>
            </div>
          </div>

          {/* 2. Top Metric Cards Row (4 Vibrant Cards - Jobie Style) */}
          <div className="admin-metrics-grid">
            {statCards.slice(0, 4).map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  whileHover={{ y: -3, scale: 1.015 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="glass-panel admin-metric-stat-card"
                  style={{
                    background: card.bg,
                    border: `1.5px solid ${card.border}`,
                    boxShadow: `0 4px 18px ${card.border}60`
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                    <span className="truncate-1" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                      {card.title}
                    </span>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "11px",
                        background: card.iconBg,
                        border: `1px solid ${card.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: card.color,
                        flexShrink: 0
                      }}
                    >
                      <Icon size={18} />
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "clamp(1.4rem, 4.5vw, 2.2rem)",
                        fontWeight: 900,
                        fontFamily: "var(--font-display)",
                        color: card.color,
                        lineHeight: 1
                      }}
                    >
                      {card.value}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* 3. Main 2-Column Section (Jobie Dashboard Layout) */}
          <div className="admin-jobie-grid">
            {/* =========================================================
                LEFT COLUMN: Profile Completion Ring & Recent Activities
                ========================================================= */}
            <div className="admin-jobie-left">
              {/* Profile Card with Circular Progress Ring (Jobie Style) */}
              <div
                className="glass-panel jobie-profile-card"
                style={{
                  padding: "1.75rem 1.5rem",
                  borderRadius: "22px",
                  background: "#ffffff",
                  border: "1.5px solid var(--border-light)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  position: "relative"
                }}
              >
                {/* Avatar with Circular SVG Progress Ring */}
                <div style={{ position: "relative", width: "112px", height: "112px", marginBottom: "0.85rem" }}>
                  <svg width="112" height="112" viewBox="0 0 112 112" style={{ transform: "rotate(-90deg)" }}>
                    <defs>
                      <linearGradient id="profileRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="50%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    {/* Background Ring Track */}
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="#f1f5f9"
                      strokeWidth="6"
                      fill="none"
                    />
                    {/* Animated Active Progress Arc */}
                    <motion.circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="url(#profileRingGradient)"
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 48}
                      initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - attendanceRate / 100) }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>

                  {/* Centered User Photo */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "10px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "3px solid #ffffff",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                    }}
                  >
                    <img
                      src={getAvatarUrl(currentUser.foto_url, currentUser.nama || "Admin")}
                      alt={currentUser.nama || "Admin"}
                      referrerPolicy="no-referrer"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = getAvatarUrl("", currentUser.nama || "Admin");
                      }}
                    />
                  </div>

                  {/* Percentage Floating Badge */}
                  <span
                    style={{
                      position: "absolute",
                      bottom: "0",
                      right: "6px",
                      background: "#10b981",
                      color: "#ffffff",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      padding: "0.15rem 0.45rem",
                      borderRadius: "999px",
                      border: "2px solid #ffffff",
                      boxShadow: "0 2px 6px rgba(16, 185, 129, 0.4)"
                    }}
                  >
                    {attendanceRate}%
                  </span>
                </div>

                {/* Identity Info */}
                <h3
                  style={{
                    fontSize: "1.08rem",
                    fontWeight: 800,
                    color: "var(--text-main)",
                    margin: "0 0 2px 0"
                  }}
                >
                  {currentUser.nama || "Administrator Tata Usaha"}
                </h3>
                <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: 0 }}>
                  NIP: {currentUser.nip || "-"} &bull; {currentUser.jabatan || "Kepala Tata Usaha"}
                </p>

                {/* 3 Mini Donut / Circular Stat Gauges (Jobie Style: PHP, Vue, Laravel) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.5rem",
                    width: "100%",
                    marginTop: "1.35rem",
                    paddingTop: "1.1rem",
                    borderTop: "1px solid var(--border-light)"
                  }}
                >
                  {/* Gauge 1: Hadir Tepat Waktu */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ position: "relative", width: "48px", height: "48px" }}>
                      <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="24" cy="24" r="19" stroke="#f1f5f9" strokeWidth="4" fill="none" />
                        <circle
                          cx="24"
                          cy="24"
                          r="19"
                          stroke="#10b981"
                          strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 19}
                          strokeDashoffset={2 * Math.PI * 19 * (1 - attendanceRate / 100)}
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          color: "#10b981"
                        }}
                      >
                        {attendanceRate}%
                      </span>
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "4px" }}>
                      Hadir
                    </span>
                  </div>

                  {/* Gauge 2: Terlambat */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ position: "relative", width: "48px", height: "48px" }}>
                      <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="24" cy="24" r="19" stroke="#f1f5f9" strokeWidth="4" fill="none" />
                        <circle
                          cx="24"
                          cy="24"
                          r="19"
                          stroke="#f59e0b"
                          strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 19}
                          strokeDashoffset={2 * Math.PI * 19 * (1 - Math.min(stats.terlambat * 10, 100) / 100)}
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          color: "#f59e0b"
                        }}
                      >
                        {stats.terlambat}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "4px" }}>
                      Terlambat
                    </span>
                  </div>

                  {/* Gauge 3: Izin / Cuti */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ position: "relative", width: "48px", height: "48px" }}>
                      <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="24" cy="24" r="19" stroke="#f1f5f9" strokeWidth="4" fill="none" />
                        <circle
                          cx="24"
                          cy="24"
                          r="19"
                          stroke="#0284c7"
                          strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 19}
                          strokeDashoffset={2 * Math.PI * 19 * (1 - Math.min(stats.izin * 15, 100) / 100)}
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          color: "#0284c7"
                        }}
                      >
                        {stats.izin}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "4px" }}>
                      Izin / Cuti
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activities Feed (Jobie Style) */}
              <div
                className="glass-panel jobie-recents-card"
                style={{
                  padding: "1.5rem",
                  borderRadius: "22px",
                  background: "#ffffff",
                  border: "1.5px solid var(--border-light)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.03)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Activity size={18} color="#059669" />
                    <h3 style={{ fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                      Aktivitas Terkini
                    </h3>
                  </div>
                  <span className="pulse-dot" />
                </div>

                {recentActivities.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "1.8rem 1rem",
                      color: "var(--text-muted)",
                      border: "1px dashed var(--border-light)",
                      borderRadius: "14px",
                      background: "var(--bg-muted)",
                      fontSize: "0.8rem"
                    }}
                  >
                    Belum ada presensi tercatat hari ini.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    {recentActivities.slice(0, 4).map((act, i) => (
                      <div
                        key={act.id || i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.75rem 0.85rem",
                          borderRadius: "14px",
                          background: "#fafafa",
                          border: "1px solid var(--border-light)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                              color: "#ffffff",
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.8rem",
                              flexShrink: 0
                            }}
                          >
                            {(act.nama || "G")[0]}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p className="truncate-1" style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-main)", margin: 0 }}>
                              {act.nama}
                            </p>
                            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "1px 0 0 0" }}>
                              {formatTimeString(act.jam_absen) || act.jam_absen} WITA
                            </p>
                          </div>
                        </div>

                        <span className={`badge-status badge-${(act.status || "hadir").toLowerCase()}`} style={{ fontSize: "0.68rem" }}>
                          {act.status || "Hadir"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Downward Expand / Link Button (Jobie Style) */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
                  <Link href="/admin/rekap" style={{ textDecoration: "none" }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#ffffff",
                        border: "1.5px solid var(--border-light)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-secondary)",
                        cursor: "pointer"
                      }}
                      title="Lihat Semua Riwayat Presensi"
                    >
                      <ChevronRight size={16} />
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>

            {/* =========================================================
                RIGHT COLUMN: Spline Area Chart & 3 Recommended/Action Cards
                ========================================================= */}
            <div className="admin-jobie-right">
              {/* Spline Area Chart: Vacancy Stats Style */}
              <div
                className="glass-panel admin-chart-panel jobie-chart-card"
                style={{
                  position: "relative"
                }}
              >
                {/* Header: Title, Interactive Switches, Dropdown */}
                <div className="admin-chart-header">
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                      Statistik Kehadiran & Tren Presensi
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                      Grafik fluktuasi harian guru, pegawai, dan pengajuan izin
                    </p>
                  </div>

                  {/* Filter Switches & Period Toggle */}
                  <div className="admin-chart-switches">
                    {/* Switch: Guru */}
                    <button
                      type="button"
                      onClick={() => setChartFilters((prev) => ({ ...prev, guru: !prev.guru }))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: chartFilters.guru ? "#4f46e5" : "var(--text-muted)"
                      }}
                    >
                      <span
                        style={{
                          width: "28px",
                          height: "16px",
                          borderRadius: "999px",
                          background: chartFilters.guru ? "#4f46e5" : "#cbd5e1",
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px",
                          transition: "background 0.2s"
                        }}
                      >
                        <span
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            transform: chartFilters.guru ? "translateX(12px)" : "translateX(0)",
                            transition: "transform 0.2s"
                          }}
                        />
                      </span>
                      <span>Guru</span>
                    </button>

                    {/* Switch: Pegawai */}
                    <button
                      type="button"
                      onClick={() => setChartFilters((prev) => ({ ...prev, pegawai: !prev.pegawai }))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: chartFilters.pegawai ? "#0284c7" : "var(--text-muted)"
                      }}
                    >
                      <span
                        style={{
                          width: "28px",
                          height: "16px",
                          borderRadius: "999px",
                          background: chartFilters.pegawai ? "#0284c7" : "#cbd5e1",
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px",
                          transition: "background 0.2s"
                        }}
                      >
                        <span
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            transform: chartFilters.pegawai ? "translateX(12px)" : "translateX(0)",
                            transition: "transform 0.2s"
                          }}
                        />
                      </span>
                      <span>Pegawai</span>
                    </button>

                    {/* Switch: Izin */}
                    <button
                      type="button"
                      onClick={() => setChartFilters((prev) => ({ ...prev, izin: !prev.izin }))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: chartFilters.izin ? "#f59e0b" : "var(--text-muted)"
                      }}
                    >
                      <span
                        style={{
                          width: "28px",
                          height: "16px",
                          borderRadius: "999px",
                          background: chartFilters.izin ? "#f59e0b" : "#cbd5e1",
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px",
                          transition: "background 0.2s"
                        }}
                      >
                        <span
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            transform: chartFilters.izin ? "translateX(12px)" : "translateX(0)",
                            transition: "transform 0.2s"
                          }}
                        />
                      </span>
                      <span>Izin</span>
                    </button>

                    {/* Period Dropdown */}
                    <div style={{ position: "relative" }}>
                      <select
                        value={chartPeriod}
                        onChange={(e) => setChartPeriod(e.target.value)}
                        style={{
                          appearance: "none",
                          background: "#f8fafc",
                          border: "1px solid var(--border-light)",
                          borderRadius: "10px",
                          padding: "0.3rem 1.6rem 0.3rem 0.65rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--text-main)",
                          cursor: "pointer"
                        }}
                      >
                        <option value="minggu">Minggu Ini</option>
                        <option value="bulan">Bulan Ini</option>
                      </select>
                      <ChevronRight
                        size={12}
                        color="#64748b"
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%) rotate(90deg)",
                          pointerEvents: "none"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* SVG Spline Canvas with Tooltip */}
                <div
                  style={{ position: "relative", width: "100%", height: "210px", touchAction: "none" }}
                  onTouchStart={handleTouchChart}
                  onTouchMove={handleTouchChart}
                  onTouchEnd={() => setTimeout(() => setHoveredChartPoint(null), 2500)}
                >
                  <svg
                    viewBox="0 0 650 210"
                    preserveAspectRatio="none"
                    style={{ width: "100%", height: "100%", overflow: "visible" }}
                  >
                    <defs>
                      {/* Gradient Fill under Guru Curve */}
                      <linearGradient id="guruChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                      {/* Gradient Fill under Pegawai Curve */}
                      <linearGradient id="pegawaiChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                      </linearGradient>
                      {/* Gradient Fill under Izin Curve */}
                      <linearGradient id="izinChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Soft Dashed Grid Horizontal Lines */}
                    {[40, 85, 130, 170].map((yVal) => (
                      <line
                        key={yVal}
                        x1="35"
                        y1={yVal}
                        x2="630"
                        y2={yVal}
                        stroke="#f1f5f9"
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                      />
                    ))}

                    {/* Area Fills under Spline Curves */}
                    {chartFilters.guru && (
                      <path d={svgChart.guruArea} fill="url(#guruChartGrad)" />
                    )}
                    {chartFilters.pegawai && (
                      <path d={svgChart.pegawaiArea} fill="url(#pegawaiChartGrad)" />
                    )}
                    {chartFilters.izin && (
                      <path d={svgChart.izinArea} fill="url(#izinChartGrad)" />
                    )}

                    {/* Spline Lines */}
                    {chartFilters.guru && (
                      <path
                        d={svgChart.guruSpline}
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    )}
                    {chartFilters.pegawai && (
                      <path
                        d={svgChart.pegawaiSpline}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      />
                    )}
                    {chartFilters.izin && (
                      <path
                        d={svgChart.izinSpline}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="5 3"
                      />
                    )}

                    {/* Interactive Guideline on Hover */}
                    {hoveredChartPoint && (
                      <line
                        x1={hoveredChartPoint.x}
                        y1="20"
                        x2={hoveredChartPoint.x}
                        y2="175"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Points & Hover Hit Areas */}
                    {svgChart.points.map((pt, i) => (
                      <g key={i}>
                        {/* Invisible Broad Hover Area */}
                        <rect
                          x={pt.x - 25}
                          y="15"
                          width="50"
                          height="165"
                          fill="transparent"
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() => setHoveredChartPoint(pt)}
                          onMouseLeave={() => setHoveredChartPoint(null)}
                        />

                        {/* Guru Dot */}
                        {chartFilters.guru && (
                          <circle
                            cx={pt.x}
                            cy={pt.guruY}
                            r={hoveredChartPoint?.label === pt.label ? 6 : 4}
                            fill="#ffffff"
                            stroke="#4f46e5"
                            strokeWidth={hoveredChartPoint?.label === pt.label ? 3.5 : 2.5}
                          />
                        )}

                        {/* Pegawai Dot */}
                        {chartFilters.pegawai && (
                          <circle
                            cx={pt.x}
                            cy={pt.pegawaiY}
                            r={hoveredChartPoint?.label === pt.label ? 6 : 3.5}
                            fill="#ffffff"
                            stroke="#0284c7"
                            strokeWidth={hoveredChartPoint?.label === pt.label ? 3.5 : 2}
                          />
                        )}

                        {/* X-Axis Label */}
                        <text
                          x={pt.x}
                          y="192"
                          textAnchor="middle"
                          fill={hoveredChartPoint?.label === pt.label ? "#4f46e5" : "#64748b"}
                          fontSize="11"
                          fontWeight={hoveredChartPoint?.label === pt.label ? "800" : "600"}
                        >
                          {pt.label}
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* Floating Tooltip Card (Jobie Style) */}
                  {hoveredChartPoint && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      style={{
                        position: "absolute",
                        left: `${(hoveredChartPoint.x / 650) * 100}%`,
                        top: "10px",
                        transform: "translateX(-50%)",
                        background: "rgba(15, 23, 42, 0.94)",
                        backdropFilter: "blur(10px)",
                        color: "#ffffff",
                        padding: "0.5rem 0.85rem",
                        borderRadius: "14px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
                        pointerEvents: "none",
                        zIndex: 20,
                        whiteSpace: "nowrap",
                        fontSize: "0.75rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem"
                      }}
                    >
                      <div style={{ fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.18)", paddingBottom: "0.25rem", color: "#93c5fd" }}>
                        {hoveredChartPoint.dayName} &bull; {hoveredChartPoint.date}
                      </div>
                      <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
                        {chartFilters.guru && (
                          <span style={{ color: "#c7d2fe" }}>
                            👨‍🏫 Guru: <strong>{hoveredChartPoint.guru}</strong>
                          </span>
                        )}
                        {chartFilters.pegawai && (
                          <span style={{ color: "#bae6fd" }}>
                            💼 Staf: <strong>{hoveredChartPoint.pegawai}</strong>
                          </span>
                        )}
                        {chartFilters.izin && (
                          <span style={{ color: "#fde68a" }}>
                            📝 Izin: <strong>{hoveredChartPoint.izin}</strong>
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* 3 Recommended / Action Cards (Jobie Style: Recomended Jobs) */}
              <div className="admin-action-cards-grid jobie-actions-card">
                {/* Action Card 1: Jadwal Mengajar */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.015 }}
                  className="glass-panel"
                  style={{
                    padding: "1.25rem",
                    borderRadius: "18px",
                    background: "#ffffff",
                    border: "1.5px solid #c7d2fe",
                    boxShadow: "0 4px 18px rgba(79, 70, 229, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.75rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                        background: "#eef2ff",
                        color: "#4f46e5",
                        border: "1px solid #c7d2fe"
                      }}
                    >
                      JADWAL AKTIF
                    </span>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "#eef2ff",
                        border: "1px solid #c7d2fe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#4f46e5"
                      }}
                    >
                      <CalendarCheck size={16} />
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-main)", margin: "0 0 2px 0" }}>
                      Monitoring KBM
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.3 }}>
                      Pantau jam pelajaran aktif, ruang kelas, dan guru piket hari ini.
                    </p>
                  </div>
                  <Link href="/admin/jadwal" style={{ textDecoration: "none" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: "#4f46e5"
                      }}
                    >
                      Buka Jadwal <ChevronRight size={13} />
                    </span>
                  </Link>
                </motion.div>

                {/* Action Card 2: Verifikasi Izin */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.015 }}
                  className="glass-panel"
                  style={{
                    padding: "1.25rem",
                    borderRadius: "18px",
                    background: "#ffffff",
                    border: "1.5px solid #fde68a",
                    boxShadow: "0 4px 18px rgba(245, 158, 11, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.75rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                        background: "#fffbeb",
                        color: "#d97706",
                        border: "1px solid #fde68a"
                      }}
                    >
                      PERLU TINDAKAN
                    </span>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#d97706"
                      }}
                    >
                      <AlertCircle size={16} />
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-main)", margin: "0 0 2px 0" }}>
                      Verifikasi Izin & Cuti
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.3 }}>
                      Tinjau berkas surat dokter & permohonan dinas luar guru.
                    </p>
                  </div>
                  <Link href="/admin/izin" style={{ textDecoration: "none" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: "#d97706"
                      }}
                    >
                      Verifikasi Sekarang <ChevronRight size={13} />
                    </span>
                  </Link>
                </motion.div>

                {/* Action Card 3: LKB Kinerja */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.015 }}
                  className="glass-panel"
                  style={{
                    padding: "1.25rem",
                    borderRadius: "18px",
                    background: "#ffffff",
                    border: "1.5px solid #a7f3d0",
                    boxShadow: "0 4px 18px rgba(16, 185, 129, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.75rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                        background: "#ecfdf5",
                        color: "#059669",
                        border: "1px solid #a7f3d0"
                      }}
                    >
                      LKB ASN
                    </span>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#059669"
                      }}
                    >
                      <FileCheck size={16} />
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-main)", margin: "0 0 2px 0" }}>
                      LKB Bulanan ASN
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.3 }}>
                      Rekapitulasi berkas laporan kinerja bulanan guru & staf TU.
                    </p>
                  </div>
                  <Link href="/admin/lkb/guru" style={{ textDecoration: "none" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: "#059669"
                      }}
                    >
                      Buka LKB <ChevronRight size={13} />
                    </span>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>

          {/* =========================================================
              Interactive Cool Calendar & Holiday Control Center
              ========================================================= */}
          <div
            className="glass-panel"
            style={{
              padding: "1.5rem",
              marginBottom: "1.75rem",
              background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
              borderRadius: "18px",
              border: "1.5px solid #fed7aa",
              boxShadow: "0 4px 20px rgba(249, 115, 22, 0.06)"
            }}
          >
            {/* 1. Header Bar Kalender */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1.25rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "#ffedd5",
                    border: "1.5px solid #fdba74",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#c2410c",
                    flexShrink: 0
                  }}
                >
                  <CalendarDays size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span>Kalender Madrasah & Kontrol Hari Libur</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                      Live Control
                    </span>
                  </h2>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                    Kelola hari libur nasional, cuti bersama, dan libur semester. Sistem otomatis mengunci presensi pada tanggal tersebut.
                  </p>
                </div>
              </div>

              {/* Navigation & Action Buttons */}
              <div className="admin-calendar-header-actions">
                <div style={{ display: "inline-flex", alignItems: "center", background: "#f8fafc", padding: "0.25rem 0.4rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    title="Bulan Sebelumnya"
                    style={{
                      background: "none",
                      border: "none",
                      padding: "0.35rem 0.5rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "var(--text-main)"
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span style={{ fontWeight: 800, fontSize: "0.95rem", minWidth: "140px", textAlign: "center", color: "var(--text-main)" }}>
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    title="Bulan Berikutnya"
                    style={{
                      background: "none",
                      border: "none",
                      padding: "0.35rem 0.5rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "var(--text-main)"
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleToday}
                  className="btn-neon-secondary"
                  style={{ fontSize: "0.82rem", padding: "0.45rem 0.85rem", fontWeight: 700 }}
                >
                  Hari Ini
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleOpenAddHoliday()}
                  className="btn-neon-primary"
                  style={{
                    fontSize: "0.84rem",
                    padding: "0.5rem 1.15rem",
                    background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
                    border: "none",
                    boxShadow: "0 4px 14px rgba(234, 88, 12, 0.25)",
                    color: "#ffffff"
                  }}
                >
                  <Plus size={16} /> Tambah Hari Libur
                </motion.button>
              </div>
            </div>

            {/* 2. Ribbon Status Hari Ini & Info Kalender */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "0.75rem",
                marginBottom: "1.15rem"
              }}
            >
              <div
                style={{
                  padding: "0.65rem 0.95rem",
                  borderRadius: "10px",
                  background: todayHoliday ? "#fef2f2" : "#f0fdf4",
                  border: `1px solid ${todayHoliday ? "#fca5a5" : "#bbf7d0"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem"
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: todayHoliday ? "#fee2e2" : "#dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: todayHoliday ? "#dc2626" : "#16a34a",
                    flexShrink: 0
                  }}
                >
                  <Palmtree size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Status Hari Ini ({getTodayDayName()})
                  </div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 800, color: todayHoliday ? "#991b1b" : "#166534" }} className="truncate-1">
                    {todayHoliday ? `🌴 Libur: ${todayHoliday.nama_libur}` : (new Date().getDay() === 0 || new Date().getDay() === 6) ? `⛔ Libur Akhir Pekan` : "🟢 Hari Aktif Belajar Mengajar"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "0.65rem 0.95rem",
                  borderRadius: "10px",
                  background: "#faf5ff",
                  border: "1px solid #e9d5ff",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem"
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "#f3e8ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9333ea",
                    flexShrink: 0
                  }}
                >
                  <Calendar size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Libur di {MONTH_NAMES[calendarMonth]}
                  </div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "#6b21a8" }}>
                    {monthHolidays.length} Agenda Hari Libur
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "0.65rem 0.95rem",
                  borderRadius: "10px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem"
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563eb",
                    flexShrink: 0
                  }}
                >
                  <CheckCircle2 size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Proteksi Presensi
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e40af" }} className="truncate-1">
                    Terkunci otomatis tanpa alpa
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Filter Kategori Pills */}
            <div className="admin-calendar-filter-pills">
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginRight: "0.25rem", whiteSpace: "nowrap" }}>
                Filter Kategori:
              </span>
              {[
                { label: "Semua", value: "semua" },
                { label: "Libur Nasional", value: "Libur Nasional" },
                { label: "Libur Semester", value: "Libur Semester" },
                { label: "Cuti Bersama", value: "Cuti Bersama" },
                { label: "Khusus Madrasah", value: "Libur Khusus Madrasah" }
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilterCategory(f.value)}
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.65rem",
                    borderRadius: "999px",
                    cursor: "pointer",
                    border: `1px solid ${filterCategory === f.value ? "#ea580c" : "var(--border-light)"}`,
                    background: filterCategory === f.value ? "#ffedd5" : "#ffffff",
                    color: filterCategory === f.value ? "#c2410c" : "var(--text-secondary)",
                    transition: "all 0.15s ease"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 4. Kalender Grid 7 Kolom */}
            <div style={{ background: "#ffffff", padding: "0.85rem", borderRadius: "14px", border: "1px solid #fed7aa", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              {/* Day Headers (Min s/d Sab) */}
              <div className="admin-calendar-grid" style={{ marginBottom: "6px" }}>
                {DAY_NAMES.map((dName, idx) => {
                  const isSunOrSat = idx === 0 || idx === 6;
                  return (
                    <div
                      key={dName}
                      className={`admin-calendar-header-cell ${isSunOrSat ? "weekend" : ""}`}
                    >
                      {dName}
                    </div>
                  );
                })}
              </div>

              {/* Day Cells Grid */}
              <div className="admin-calendar-grid">
                {gridCells.map((cell, idx) => {
                  const hasHolidays = cell.holidays && cell.holidays.length > 0;
                  const firstH = hasHolidays ? cell.holidays[0] : null;
                  const theme = firstH ? getCategoryTheme(firstH.tipe) : null;

                  return (
                    <div
                      key={`${cell.dateStr}-${idx}`}
                      onClick={() => {
                        if (hasHolidays) {
                          setSelectedHolidayDetail(firstH);
                        } else if (cell.isCurrentMonth) {
                          handleOpenAddHoliday(cell.dateStr);
                        }
                      }}
                      className={`admin-calendar-day-cell ${!cell.isCurrentMonth ? "other-month" : ""
                        } ${cell.isToday ? "today" : ""} ${hasHolidays ? "holiday" : cell.isWeekend ? "weekend-day" : ""
                        }`}
                      style={{
                        background: hasHolidays ? theme.bg : cell.isWeekend ? "#fafaf9" : "#ffffff",
                        borderColor: hasHolidays ? theme.border : cell.isToday ? "#059669" : "#e2e8f0"
                      }}
                      title={
                        hasHolidays
                          ? `${firstH.nama_libur} (${firstH.tipe}) - Klik untuk kelola`
                          : cell.isCurrentMonth
                            ? `Tanggal ${cell.dateStr} - Klik untuk tambah hari libur`
                            : cell.dateStr
                      }
                    >
                      {/* Top Row: Date Number & Badges */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <span
                          style={{
                            fontWeight: cell.isToday ? 900 : cell.isCurrentMonth ? 700 : 500,
                            fontSize: "0.82rem",
                            color: cell.isToday
                              ? "#059669"
                              : hasHolidays
                                ? theme.text
                                : cell.isWeekend
                                  ? "#ef4444"
                                  : cell.isCurrentMonth
                                    ? "var(--text-main)"
                                    : "#94a3b8"
                          }}
                        >
                          {cell.dayNum}
                        </span>

                        {cell.isToday && (
                          <span
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              background: "#059669",
                              color: "#ffffff",
                              padding: "0.1rem 0.35rem",
                              borderRadius: "4px"
                            }}
                          >
                            Hari Ini
                          </span>
                        )}
                      </div>

                      {/* Middle/Bottom: Holiday Chip or Weekend Label */}
                      <div style={{ minWidth: 0, width: "100%", marginTop: "2px" }}>
                        {hasHolidays ? (
                          <div
                            style={{
                              background: theme.pillBg,
                              color: "#ffffff",
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              padding: "0.15rem 0.35rem",
                              borderRadius: "4px",
                              lineHeight: 1.2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem"
                            }}
                          >
                            <span>{theme.icon}</span>
                            <span className="truncate-1">{firstH.nama_libur}</span>
                          </div>
                        ) : cell.isWeekend && cell.isCurrentMonth ? (
                          <div
                            style={{
                              fontSize: "0.6rem",
                              color: "#94a3b8",
                              fontWeight: 600,
                              textAlign: "center",
                              padding: "0.1rem 0"
                            }}
                          >
                            Libur
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Daftar Agenda Libur Terjadwal di Bulan Ini */}
            <div style={{ marginTop: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span>📋 Rincian Jadwal Libur Bulan {MONTH_NAMES[calendarMonth]}</span>
                  <span style={{ fontSize: "0.72rem", padding: "0.1rem 0.45rem", borderRadius: "999px", background: "#fed7aa", color: "#9a3412", fontWeight: 800 }}>
                    {monthHolidays.length}
                  </span>
                </h3>

                <button
                  type="button"
                  onClick={() => handleOpenAddHoliday()}
                  style={{
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    color: "#ea580c",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}
                >
                  <Plus size={14} /> Tambah Libur di Bulan Ini
                </button>
              </div>

              {monthHolidays.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "1.75rem 1rem",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    color: "var(--text-muted)",
                    fontSize: "0.82rem"
                  }}
                >
                  Tidak ada hari libur resmi yang terjadwal di bulan {MONTH_NAMES[calendarMonth]}.
                  Kegiatan belajar mengajar berjalan normal sesuai jadwal hari kerja (Senin - Jumat).
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
                  {monthHolidays.map((item) => {
                    const theme = getCategoryTheme(item.tipe);
                    const isOngoing = todayStr >= item.tgl_mulai && todayStr <= (item.tgl_selesai || item.tgl_mulai);
                    const d1 = new Date(item.tgl_mulai);
                    const d2 = new Date(item.tgl_selesai || item.tgl_mulai);
                    const diffDays = !isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1
                      ? Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1
                      : 1;

                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: "0.85rem 1rem",
                          borderRadius: "12px",
                          background: isOngoing ? "#fff1f2" : "#ffffff",
                          border: `1.5px solid ${isOngoing ? "#fca5a5" : theme.border}`,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "0.75rem"
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 800, padding: "0.12rem 0.45rem", borderRadius: "999px", background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}>
                              {theme.icon} {item.tipe}
                            </span>
                            {isOngoing && (
                              <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "0.1rem 0.4rem", borderRadius: "999px", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                                🌴 Sedang Aktif Hari Ini
                              </span>
                            )}
                          </div>

                          <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-main)", marginBottom: "0.2rem" }}>
                            {item.nama_libur}
                          </div>

                          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontWeight: 600 }}>
                              <Calendar size={13} color="#ea580c" />
                              {item.tgl_mulai} {item.tgl_selesai && item.tgl_selesai !== item.tgl_mulai ? `s/d ${item.tgl_selesai}` : ""}
                            </span>
                            <span style={{ fontSize: "0.7rem", background: "#f1f5f9", padding: "0.1rem 0.4rem", borderRadius: "4px", color: "#475569", fontWeight: 700 }}>
                              {diffDays} Hari
                            </span>
                          </div>

                          {item.keterangan && item.keterangan !== "-" && (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem", fontStyle: "italic" }}>
                              &ldquo;{item.keterangan}&rdquo;
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(item.id, item.nama_libur)}
                          title="Hapus hari libur ini"
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "#fee2e2",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flexShrink: 0
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Menu Pintas Manajemen (Jobie Featured Department Style) */}
          <div
            className="glass-panel"
            style={{
              padding: "1.5rem 1.75rem",
              borderRadius: "20px",
              background: "#ffffff",
              border: "1.5px solid var(--border-light)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              marginBottom: "1.75rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#059669"
                  }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                    Menu Pintas Manajemen & Modul Sistem
                  </h3>
                  <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                    Akses cepat seluruh modul operasional madrasah
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-shortcuts-grid">
              {[
                {
                  title: "Data Guru & Pegawai",
                  desc: "Kelola akun pendidik & staf TU",
                  href: "/admin/guru",
                  icon: Users,
                  color: "#ec4899",
                  bg: "#fdf2f8",
                  border: "#fbcfe8"
                },
                {
                  title: "Presensi Guru",
                  desc: "Rekapitulasi jam mengajar kelas",
                  href: "/admin/rekap/guru",
                  icon: GraduationCap,
                  color: "#10b981",
                  bg: "#ecfdf5",
                  border: "#a7f3d0"
                },
                {
                  title: "Presensi Pegawai",
                  desc: "Rekapitulasi jam kantor staf TU",
                  href: "/admin/rekap/pegawai",
                  icon: Briefcase,
                  color: "#0284c7",
                  bg: "#f0f9ff",
                  border: "#bae6fd"
                },
                {
                  title: "LKB Guru",
                  desc: "Arsip & verifikasi kinerja guru",
                  href: "/admin/lkb/guru",
                  icon: FileCheck,
                  color: "#7c3aed",
                  bg: "#f5f3ff",
                  border: "#ddd6fe"
                },
                {
                  title: "LKB Pegawai",
                  desc: "Arsip & verifikasi staf TU",
                  href: "/admin/lkb/pegawai",
                  icon: FileText,
                  color: "#d97706",
                  bg: "#fffbeb",
                  border: "#fde68a"
                },
                {
                  title: "Jadwal Pelajaran",
                  desc: "Atur jadwal mengajar mingguan",
                  href: "/admin/jadwal",
                  icon: CalendarCheck,
                  color: "#f59e0b",
                  bg: "#fffbeb",
                  border: "#fde68a"
                },
                {
                  title: "Verifikasi Izin & Cuti",
                  desc: "Persetujuan permohonan izin",
                  href: "/admin/izin",
                  icon: AlertCircle,
                  color: "#06b6d4",
                  bg: "#ecfeff",
                  border: "#a5f3fc"
                },
                {
                  title: "Pengaturan Sistem",
                  desc: "Konfigurasi profil sekolah",
                  href: "/admin/setting",
                  icon: School,
                  color: "#8b5cf6",
                  bg: "#f5f3ff",
                  border: "#ddd6fe"
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
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="admin-shortcut-card"
                      style={{
                        border: `1px solid ${shortcut.border}`
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "10px",
                            background: shortcut.bg,
                            border: `1px solid ${shortcut.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: shortcut.color,
                            flexShrink: 0
                          }}
                        >
                          <SIcon size={17} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p className="truncate-1" style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--text-main)", margin: 0 }}>
                            {shortcut.title}
                          </p>
                          <p className="truncate-1" style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "1px 0 0 0" }}>
                            {shortcut.desc}
                          </p>
                        </div>
                      </div>
                      <div className="admin-shortcut-chevron">
                        <ChevronRight size={15} color="#94a3b8" />
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Modal Popup: Tambah Hari Libur Baru */}
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
                    border: "1.5px solid #fed7aa",
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
                          background: "#ffedd5",
                          border: "1px solid #fdba74",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ea580c"
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
                            setHolidayForm((prev) => ({
                              ...prev,
                              tgl_mulai: newStart,
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
                        placeholder="contoh: Sesuai Kalender Pendidikan Kemenag"
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
                          background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
                          border: "none",
                          boxShadow: "0 4px 14px rgba(234, 88, 12, 0.25)",
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

          {/* Modal Detail & Hapus Hari Libur Terpilih */}
          <AnimatePresence>
            {selectedHolidayDetail && (
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
                  if (e.target === e.currentTarget) setSelectedHolidayDetail(null);
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel"
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "1.5rem",
                    border: "1.5px solid #fed7aa",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "#ffedd5", color: "#c2410c", border: "1px solid #fdba74" }}>
                      {selectedHolidayDetail.tipe}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedHolidayDetail(null)}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>
                    {selectedHolidayDetail.nama_libur}
                  </h3>

                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Calendar size={15} color="#ea580c" />
                    <span>
                      {selectedHolidayDetail.tgl_mulai} {selectedHolidayDetail.tgl_selesai && selectedHolidayDetail.tgl_selesai !== selectedHolidayDetail.tgl_mulai ? `s/d ${selectedHolidayDetail.tgl_selesai}` : ""}
                    </span>
                  </div>

                  {selectedHolidayDetail.keterangan && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "#f8fafc", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0", margin: "0 0 1.25rem 0" }}>
                      {selectedHolidayDetail.keterangan}
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteHoliday(selectedHolidayDetail.id, selectedHolidayDetail.nama_libur)}
                      className="btn-neon-danger"
                      style={{ fontSize: "0.82rem", padding: "0.55rem 1rem" }}
                    >
                      <Trash2 size={14} /> Hapus Hari Libur
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedHolidayDetail(null)}
                      className="btn-neon-secondary"
                      style={{ fontSize: "0.82rem", padding: "0.55rem 1.15rem" }}
                    >
                      Tutup
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
