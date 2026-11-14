"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  AlertTriangle,
  Clock,
  BookOpen,
  School,
  Search,
  Filter,
  X,
  LayoutGrid,
  List,
  Copy,
  RotateCcw,
  Users,
  CheckCircle2,
  Calendar
} from "lucide-react";
import {
  DAFTAR_KELAS,
  DAFTAR_MAPEL,
  DAFTAR_RUANGAN,
  DAFTAR_SESI_JAM
} from "@/lib/constants";

const SCHEDULE_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const FILTER_DAYS = ["Semua", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

const DAY_ORDER = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5
};

const CARD_THEMES = [
  { border: "#c7d2fe", bg: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)", tagBg: "#eef2ff", tagText: "#4f46e5", tagBorder: "#c7d2fe", accent: "#4f46e5" },
  { border: "#a7f3d0", bg: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)", tagBg: "#ecfdf5", tagText: "#059669", tagBorder: "#a7f3d0", accent: "#059669" },
  { border: "#bae6fd", bg: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", tagBg: "#f0f9ff", tagText: "#0284c7", tagBorder: "#bae6fd", accent: "#0284c7" },
  { border: "#fde68a", bg: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)", tagBg: "#fffbeb", tagText: "#b45309", tagBorder: "#fde68a", accent: "#d97706" },
  { border: "#fecdd3", bg: "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)", tagBg: "#fff1f2", tagText: "#e11d48", tagBorder: "#fecdd3", accent: "#e11d48" },
  { border: "#ddd6fe", bg: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)", tagBg: "#faf5ff", tagText: "#7c3aed", tagBorder: "#ddd6fe", accent: "#7c3aed" }
];

export default function AdminJadwalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [selectedDay, setSelectedDay] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterGuru, setFilterGuru] = useState("Semua");
  const [filterMapel, setFilterMapel] = useState("Semua");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSched, setEditingSched] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    hari: "Senin",
    kelas: "VII.1",
    guru_id: "",
    mapel: DAFTAR_MAPEL[0],
    jam_ke: "Jam Ke I - II",
    jam_mulai: "07:30",
    jam_selesai: "08:50",
    ruangan: "R. Kelas VII.1"
  });

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    setCurrentUser(user);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        Api.request("GET", "getSchedules", {}),
        Api.request("GET", "getUsers", { role: "guru" })
      ]);

      if (sRes && (sRes.schedules || sRes.list)) {
        setSchedules(sRes.schedules || sRes.list || []);
      }

      if (tRes && (tRes.users || tRes.list)) {
        const uList = tRes.users || tRes.list || [];
        setTeachers(uList);
        if (uList.length > 0 && !formData.guru_id) {
          setFormData((prev) => ({
            ...prev,
            guru_id: uList[0].id,
            mapel: uList[0].mapel || prev.mapel || DAFTAR_MAPEL[0]
          }));
        }
      }
    } catch (err) {
      console.error("Gagal memuat jadwal:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique options for filter dropdowns
  const availableClasses = useMemo(() => {
    const fromSched = schedules.map((s) => s.kelas).filter(Boolean);
    const set = new Set([...fromSched, ...DAFTAR_KELAS]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [schedules]);

  const availableMapels = useMemo(() => {
    const fromSched = schedules.map((s) => s.mapel).filter(Boolean);
    const set = new Set([...fromSched, ...DAFTAR_MAPEL]);
    return Array.from(set).sort();
  }, [schedules]);

  const availableTeachers = useMemo(() => {
    return [...teachers].sort((a, b) =>
      String(a.nama || "").localeCompare(String(b.nama || ""))
    );
  }, [teachers]);

  // Client-side filtering
  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      // Filter Hari
      if (selectedDay !== "Semua" && item.hari !== selectedDay) {
        return false;
      }

      // Filter Kelas
      if (filterKelas !== "Semua" && item.kelas !== filterKelas) {
        return false;
      }

      // Filter Guru
      if (
        filterGuru !== "Semua" &&
        item.guru_id !== filterGuru &&
        item.nama_guru !== filterGuru
      ) {
        return false;
      }

      // Filter Mapel
      if (filterMapel !== "Semua" && item.mapel !== filterMapel) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nama = String(item.nama_guru || "").toLowerCase();
        const nip = String(item.nip || "").toLowerCase();
        const mapel = String(item.mapel || "").toLowerCase();
        const kelas = String(item.kelas || "").toLowerCase();
        const ruang = String(item.ruangan || "").toLowerCase();
        const jamKe = String(item.jam_ke || "").toLowerCase();

        const match =
          nama.includes(q) ||
          nip.includes(q) ||
          mapel.includes(q) ||
          kelas.includes(q) ||
          ruang.includes(q) ||
          jamKe.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [schedules, selectedDay, filterKelas, filterGuru, filterMapel, searchQuery]);

  // Sort: Day -> Start Time -> Class
  const sortedSchedules = useMemo(() => {
    return [...filteredSchedules].sort((a, b) => {
      const orderA = DAY_ORDER[a.hari] || 99;
      const orderB = DAY_ORDER[b.hari] || 99;
      if (orderA !== orderB) return orderA - orderB;

      const timeA = String(a.jam_mulai || "00:00");
      const timeB = String(b.jam_mulai || "00:00");
      if (timeA !== timeB) return timeA.localeCompare(timeB);

      return String(a.kelas || "").localeCompare(String(b.kelas || ""));
    });
  }, [filteredSchedules]);

  // Stats
  const stats = useMemo(() => {
    const totalSesi = sortedSchedules.length;
    const uniqueTeachers = new Set(
      sortedSchedules.map((s) => s.nama_guru || s.guru_id).filter(Boolean)
    ).size;
    const uniqueClasses = new Set(
      sortedSchedules.map((s) => s.kelas).filter(Boolean)
    ).size;
    return { totalSesi, uniqueTeachers, uniqueClasses };
  }, [sortedSchedules]);

  const isFilterActive =
    selectedDay !== "Semua" ||
    filterKelas !== "Semua" ||
    filterGuru !== "Semua" ||
    filterMapel !== "Semua" ||
    searchQuery.trim() !== "";

  const handleResetFilters = () => {
    setSelectedDay("Semua");
    setFilterKelas("Semua");
    setFilterGuru("Semua");
    setFilterMapel("Semua");
    setSearchQuery("");
  };

  // Modal Handlers
  const handleOpenModal = (sched = null) => {
    if (sched) {
      setEditingSched(sched);
      setFormData({
        hari: sched.hari || (selectedDay !== "Semua" ? selectedDay : "Senin"),
        kelas: sched.kelas || "VII.1",
        guru_id: sched.guru_id || teachers[0]?.id || "",
        mapel: sched.mapel || teachers[0]?.mapel || DAFTAR_MAPEL[0],
        jam_ke: sched.jam_ke || "Jam Ke I - II",
        jam_mulai: sched.jam_mulai || "07:30",
        jam_selesai: sched.jam_selesai || "08:50",
        ruangan: sched.ruangan || `R. Kelas ${sched.kelas || "VII.1"}`
      });
    } else {
      setEditingSched(null);
      const dayForNew = selectedDay !== "Semua" ? selectedDay : "Senin";
      const isJumat = dayForNew === "Jumat";
      setFormData({
        hari: dayForNew,
        kelas: filterKelas !== "Semua" ? filterKelas : "VII.1",
        guru_id: filterGuru !== "Semua" ? filterGuru : (teachers[0]?.id || ""),
        mapel: filterMapel !== "Semua" ? filterMapel : (teachers[0]?.mapel || DAFTAR_MAPEL[0]),
        jam_ke: "Jam Ke I - II",
        jam_mulai: isJumat ? "07:00" : "07:30",
        jam_selesai: isJumat ? "08:20" : "08:50",
        ruangan: `R. Kelas ${filterKelas !== "Semua" ? filterKelas : "VII.1"}`
      });
    }
    setModalOpen(true);
  };

  const handleDuplicate = (sched) => {
    setEditingSched(null);
    setFormData({
      hari: sched.hari || "Senin",
      kelas: sched.kelas || "VII.1",
      guru_id: sched.guru_id || (teachers[0]?.id || ""),
      mapel: sched.mapel || (teachers[0]?.mapel || DAFTAR_MAPEL[0]),
      jam_ke: sched.jam_ke || "Jam Ke I - II",
      jam_mulai: sched.jam_mulai || "07:30",
      jam_selesai: sched.jam_selesai || "08:50",
      ruangan: sched.ruangan || `R. Kelas ${sched.kelas || "VII.1"}`
    });
    setModalOpen(true);
  };

  const handleTeacherSelect = (teacherId) => {
    const t = teachers.find((item) => item.id === teacherId);
    setFormData((prev) => ({
      ...prev,
      guru_id: teacherId,
      mapel: t?.mapel || prev.mapel
    }));
  };

  const handleKelasChange = (newKelas) => {
    setFormData((prev) => ({
      ...prev,
      kelas: newKelas,
      ruangan: !prev.ruangan || prev.ruangan.startsWith("R. Kelas") ? `R. Kelas ${newKelas}` : prev.ruangan
    }));
  };

  const handleSesiChange = (sesiLabel) => {
    const sesi = DAFTAR_SESI_JAM.find((s) => s.label === sesiLabel);
    if (sesi) {
      setFormData((prev) => ({
        ...prev,
        jam_ke: sesi.jam_ke,
        jam_mulai: sesi.jam_mulai,
        jam_selesai: sesi.jam_selesai
      }));
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const t = teachers.find((item) => item.id === formData.guru_id);
    const payload = {
      ...formData,
      id: editingSched ? editingSched.id : null,
      nama_guru: t?.nama || "Guru",
      nip: t?.nip || "-"
    };

    try {
      const res = await Api.request("POST", "saveSchedule", {}, { ...payload, schedule: payload });
      if (res && res.success) {
        setModalOpen(false);
        await fetchData();
      } else {
        alert("Gagal menyimpan jadwal: " + (res?.message || "Terjadi kesalahan"));
      }
    } catch (err) {
      alert("Error menyimpan jadwal: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      const res = await Api.request("POST", "deleteSchedule", {}, { id });
      if (res && res.success) {
        setDeleteConfirmId(null);
        setSchedules((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("Gagal menghapus jadwal: " + (res?.message || "Terjadi kesalahan"));
      }
    } catch (err) {
      alert("Error menghapus jadwal: " + err.message);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <Navbar role="admin" />
      <div style={{ display: "flex", flex: 1 }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "2rem", overflowX: "hidden", maxWidth: "1600px" }}>
          {/* Header Title & Action */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "1.5rem"
            }}
          >
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                Jadwal Sesi Pelajaran
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "0.2rem" }}>
                Kelola dan filter jadwal mengajar kelas guru dengan mudah dan terstruktur
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              {/* View Mode Toggle */}
              <div
                style={{
                  display: "flex",
                  background: "#ffffff",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.2rem",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <button
                  type="button"
                  title="Tampilan Tabel (Rapi & Cepat)"
                  onClick={() => setViewMode("table")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    background: viewMode === "table" ? "var(--primary-light)" : "transparent",
                    color: viewMode === "table" ? "var(--primary-dark)" : "var(--text-secondary)",
                    fontWeight: viewMode === "table" ? 700 : 500,
                    fontSize: "0.82rem",
                    cursor: "pointer"
                  }}
                >
                  <List size={15} />
                  <span>Tabel</span>
                </button>
                <button
                  type="button"
                  title="Tampilan Kartu (Visual)"
                  onClick={() => setViewMode("grid")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    background: viewMode === "grid" ? "var(--primary-light)" : "transparent",
                    color: viewMode === "grid" ? "var(--primary-dark)" : "var(--text-secondary)",
                    fontWeight: viewMode === "grid" ? 700 : 500,
                    fontSize: "0.82rem",
                    cursor: "pointer"
                  }}
                >
                  <LayoutGrid size={15} />
                  <span>Kartu</span>
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => handleOpenModal(null)}
                className="btn-neon-primary"
                style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}
              >
                <Plus size={18} />
                <span>Buat Sesi Jadwal Baru</span>
              </motion.button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.85rem",
              marginBottom: "1.5rem"
            }}
          >
            <div
              className="glass-panel"
              style={{
                padding: "0.9rem 1.15rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                borderLeft: "4px solid #059669",
                background: "#ffffff"
              }}
            >
              <div style={{ padding: "0.6rem", borderRadius: "10px", background: "#ecfdf5", color: "#059669" }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                  Total Sesi Jadwal
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-main)" }}>
                  {stats.totalSesi} <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Sesi</span>
                </div>
              </div>
            </div>

            <div
              className="glass-panel"
              style={{
                padding: "0.9rem 1.15rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                borderLeft: "4px solid #2563eb",
                background: "#ffffff"
              }}
            >
              <div style={{ padding: "0.6rem", borderRadius: "10px", background: "#eff6ff", color: "#2563eb" }}>
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                  Guru Mengajar
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-main)" }}>
                  {stats.uniqueTeachers} <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Guru</span>
                </div>
              </div>
            </div>

            <div
              className="glass-panel"
              style={{
                padding: "0.9rem 1.15rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                borderLeft: "4px solid #7c3aed",
                background: "#ffffff"
              }}
            >
              <div style={{ padding: "0.6rem", borderRadius: "10px", background: "#faf5ff", color: "#7c3aed" }}>
                <School size={20} />
              </div>
              <div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                  Kelas Aktif
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-main)" }}>
                  {stats.uniqueClasses} <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Kelas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Day Navigation Tabs */}
          <div
            style={{
              display: "flex",
              gap: "0.4rem",
              background: "#ffffff",
              padding: "0.35rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-sm)",
              width: "fit-content",
              marginBottom: "1.25rem",
              overflowX: "auto",
              maxWidth: "100%"
            }}
          >
            {FILTER_DAYS.map((day) => {
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  style={{
                    position: "relative",
                    background: "transparent",
                    border: "none",
                    padding: "0.5rem 1.15rem",
                    borderRadius: "var(--radius-full)",
                    color: isSelected ? "#ffffff" : "var(--text-secondary)",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap"
                  }}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="adminDayPill"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "var(--radius-full)",
                        background: "var(--primary-gradient)",
                        boxShadow: "var(--shadow-primary)",
                        zIndex: 0
                      }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1 }}>{day}</span>
                </button>
              );
            })}
          </div>

          {/* Filter & Search Bar */}
          <div
            className="glass-panel"
            style={{
              padding: "1rem 1.25rem",
              background: "#ffffff",
              marginBottom: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem"
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.75rem",
                alignItems: "center"
              }}
            >
              {/* Search Box */}
              <div style={{ position: "relative", minWidth: "220px" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "0.85rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none"
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari guru, NIP, mapel, kelas, atau ruang..."
                  className="neon-input"
                  style={{
                    paddingLeft: "2.4rem",
                    paddingRight: searchQuery ? "2.2rem" : "0.85rem",
                    fontSize: "0.84rem",
                    height: "38px"
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: "0.6rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "0.2rem"
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Kelas */}
              <div>
                <select
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="neon-input"
                  style={{ fontSize: "0.84rem", height: "45px", cursor: "pointer", background: "#ffffff" }}
                >
                  <option value="Semua">Semua Kelas</option>
                  <optgroup label="── Tingkat Kelas VII ──">
                    {availableClasses.filter((k) => k.startsWith("VII.")).map((k) => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── Tingkat Kelas VIII ──">
                    {availableClasses.filter((k) => k.startsWith("VIII.")).map((k) => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── Tingkat Kelas IX ──">
                    {availableClasses.filter((k) => k.startsWith("IX.")).map((k) => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </optgroup>
                  {availableClasses.filter((k) => !k.startsWith("VII.") && !k.startsWith("VIII.") && !k.startsWith("IX.")).length > 0 && (
                    <optgroup label="── Kelas Lainnya ──">
                      {availableClasses.filter((k) => !k.startsWith("VII.") && !k.startsWith("VIII.") && !k.startsWith("IX.")).map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Filter Guru */}
              <div>
                <select
                  value={filterGuru}
                  onChange={(e) => setFilterGuru(e.target.value)}
                  className="neon-input"
                  style={{ fontSize: "0.84rem", height: "45px", cursor: "pointer", background: "#ffffff" }}
                >
                  <option value="Semua">Semua Guru</option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Mapel */}
              <div>
                <select
                  value={filterMapel}
                  onChange={(e) => setFilterMapel(e.target.value)}
                  className="neon-input"
                  style={{ fontSize: "0.84rem", height: "45px", cursor: "pointer", background: "#ffffff" }}
                >
                  <option value="Semua">Semua Mata Pelajaran</option>
                  {availableMapels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter tags & Reset button */}
            {isFilterActive && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  paddingTop: "0.6rem",
                  borderTop: "1px dashed var(--border-light)",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                  <Filter size={13} color="var(--primary)" />
                  <span>Filter Aktif:</span>
                  {selectedDay !== "Semua" && (
                    <span style={{ background: "var(--primary-light)", color: "var(--primary-dark)", padding: "0.15rem 0.55rem", borderRadius: "12px", fontWeight: 600 }}>
                      Hari: {selectedDay}
                    </span>
                  )}
                  {filterKelas !== "Semua" && (
                    <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "0.15rem 0.55rem", borderRadius: "12px", fontWeight: 600 }}>
                      Kelas: {filterKelas}
                    </span>
                  )}
                  {filterGuru !== "Semua" && (
                    <span style={{ background: "#fef3c7", color: "#b45309", padding: "0.15rem 0.55rem", borderRadius: "12px", fontWeight: 600 }}>
                      Guru: {teachers.find((t) => t.id === filterGuru)?.nama || filterGuru}
                    </span>
                  )}
                  {filterMapel !== "Semua" && (
                    <span style={{ background: "#f3e8ff", color: "#7e22ce", padding: "0.15rem 0.55rem", borderRadius: "12px", fontWeight: 600 }}>
                      Mapel: {filterMapel}
                    </span>
                  )}
                  {searchQuery && (
                    <span style={{ background: "#f1f5f9", color: "#475569", padding: "0.15rem 0.55rem", borderRadius: "12px", fontWeight: 600 }}>
                      Cari: &quot;{searchQuery}&quot;
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    border: "none",
                    background: "transparent",
                    color: "#dc2626",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "6px"
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Reset Semua Filter</span>
                </button>
              </div>
            )}
          </div>

          {/* Schedule List Content */}
          {isLoading ? (
            <div className="glass-panel" style={{ padding: "3.5rem", textAlign: "center", background: "#ffffff" }}>
              <div style={{ display: "inline-block", width: "32px", height: "32px", border: "3px solid #e2e8f0", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Memuat data jadwal pelajaran...
              </p>
            </div>
          ) : sortedSchedules.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: "3.5rem",
                textAlign: "center",
                border: "1px dashed var(--border-light)",
                background: "var(--bg-muted)"
              }}
            >
              <CalendarDays size={42} color="#94a3b8" style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.3rem", color: "var(--text-main)" }}>
                Tidak Ada Jadwal yang Cocok
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "450px", margin: "0 auto 1.25rem" }}>
                {isFilterActive
                  ? "Tidak ada jadwal pelajaran yang memenuhi kriteria filter yang Anda pilih. Coba sesuaikan kata kunci atau reset filter."
                  : `Belum ada sesi jadwal yang terdaftar pada hari ${selectedDay}. Klik tombol di bawah untuk membuatnya.`}
              </p>
              {isFilterActive ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn-neon-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <RotateCcw size={14} /> Reset Filter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenModal(null)}
                  className="btn-neon-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <Plus size={16} /> Buat Sesi Baru
                </button>
              )}
            </div>
          ) : viewMode === "table" ? (
            /* ========================================================
               TABLE VIEW (Sangat Disukai Admin untuk Edit Cepat)
               ======================================================== */
            <div
              className="glass-panel"
              style={{
                background: "#ffffff",
                overflowX: "auto",
                border: "1px solid var(--border-light)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-main)", width: "45px", textAlign: "center" }}>No</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-main)", width: "90px" }}>Hari</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-main)", width: "155px" }}>Waktu & Sesi</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-main)", width: "100px" }}>Kelas</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-main)" }}>Mata Pelajaran</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-main)" }}>Guru Pengampu</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-main)", width: "160px" }}>Ruangan</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--text-main)", width: "140px", textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSchedules.map((item, idx) => {
                    const theme = CARD_THEMES[idx % CARD_THEMES.length];
                    return (
                      <tr
                        key={item.id || idx}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background 0.15s",
                          background: idx % 2 === 0 ? "#ffffff" : "#fafbfc"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#fafbfc")}
                      >
                        <td style={{ padding: "0.85rem 1rem", textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            style={{
                              background: theme.tagBg,
                              color: theme.tagText,
                              border: `1px solid ${theme.tagBorder}`,
                              padding: "0.2rem 0.6rem",
                              borderRadius: "6px",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              display: "inline-block"
                            }}
                          >
                            {item.hari}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 700, color: "var(--text-main)", fontFamily: "var(--font-mono)" }}>
                            <span>{item.jam_mulai} - {item.jam_selesai}</span>
                          </div>
                          {item.jam_ke && (
                            <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                              {item.jam_ke}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: "0.88rem",
                              color: "#0f172a",
                              background: "#f1f5f9",
                              padding: "0.25rem 0.6rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1"
                            }}
                          >
                            {item.kelas}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ fontWeight: 700, color: theme.accent, fontSize: "0.9rem" }}>
                            {item.mapel}
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                            {item.nama_guru}
                          </div>
                          {item.nip && item.nip !== "-" && (
                            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                              NIP: {item.nip}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            <MapPin size={13} color={theme.accent} />
                            <span>{item.ruangan || "-"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem" }}>
                            <button
                              type="button"
                              title="Edit Jadwal"
                              onClick={() => handleOpenModal(item)}
                              style={{
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#2563eb",
                                padding: "0.35rem 0.55rem",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontSize: "0.76rem",
                                fontWeight: 600
                              }}
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              title="Duplikat Sesi Jadwal"
                              onClick={() => handleDuplicate(item)}
                              style={{
                                border: "1px solid #a7f3d0",
                                background: "#ecfdf5",
                                color: "#059669",
                                padding: "0.35rem 0.55rem",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontSize: "0.76rem",
                                fontWeight: 600
                              }}
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              title="Hapus Jadwal"
                              onClick={() => setDeleteConfirmId(item.id)}
                              style={{
                                border: "1px solid #fecdd3",
                                background: "#fff1f2",
                                color: "#e11d48",
                                padding: "0.35rem 0.55rem",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontSize: "0.76rem",
                                fontWeight: 600
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ========================================================
               GRID / CARD VIEW (Tampilan Kartu Visual)
               ======================================================== */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
                gap: "1rem"
              }}
            >
              {sortedSchedules.map((item, idx) => {
                const theme = CARD_THEMES[idx % CARD_THEMES.length];
                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="glass-panel"
                    style={{
                      padding: "1.15rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "0.85rem",
                      border: `1.5px solid ${theme.border}`,
                      background: theme.bg,
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)"
                    }}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.65rem",
                          gap: "0.5rem"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                          <span
                            style={{
                              width: "9px",
                              height: "9px",
                              borderRadius: "50%",
                              background: theme.accent,
                              flexShrink: 0
                            }}
                          />
                          <span
                            style={{
                              fontSize: "1.15rem",
                              fontWeight: 800,
                              color: "var(--text-main)"
                            }}
                          >
                            Kelas {item.kelas}
                          </span>
                        </div>

                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.76rem",
                            color: theme.tagText,
                            background: theme.tagBg,
                            border: `1px solid ${theme.tagBorder}`,
                            padding: "0.2rem 0.55rem",
                            borderRadius: "var(--radius-full)",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            flexShrink: 0
                          }}
                        >
                          {item.hari} • {item.jam_mulai}-{item.jam_selesai}
                        </span>
                      </div>

                      {/* Content of Card */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                          <span className="truncate-1" style={{ color: theme.accent, fontWeight: 700, fontSize: "0.95rem" }}>
                            {item.mapel}
                          </span>
                          {item.jam_ke && (
                            <span
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--text-secondary)",
                                fontWeight: 700,
                                background: "rgba(0,0,0,0.04)",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "6px",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {item.jam_ke}
                            </span>
                          )}
                        </div>

                        <div className="truncate-1" style={{ color: "var(--text-main)", fontWeight: 600 }}>
                          Guru: {item.nama_guru}
                        </div>

                        <div
                          className="truncate-1"
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.78rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                        >
                          <MapPin size={12} color={theme.accent} /> Ruangan: {item.ruangan || "-"}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: "0.45rem",
                        paddingTop: "0.85rem",
                        borderTop: "1px solid rgba(0,0,0,0.06)"
                      }}
                    >
                      <button
                        type="button"
                        title="Duplikat Sesi Jadwal"
                        onClick={() => handleDuplicate(item)}
                        style={{
                          border: `1px solid ${theme.tagBorder}`,
                          background: theme.tagBg,
                          color: theme.tagText,
                          padding: "0.38rem 0.65rem",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.76rem",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}
                      >
                        <Copy size={13} /> Salin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(item)}
                        className="btn-neon-secondary"
                        style={{
                          padding: "0.38rem 0.75rem",
                          fontSize: "0.78rem",
                          background: "#ffffff",
                          borderColor: theme.border,
                          color: theme.accent
                        }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="btn-neon-danger"
                        style={{ padding: "0.38rem 0.7rem", fontSize: "0.78rem" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Schedule Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem"
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setModalOpen(false)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 23, 42, 0.5)",
                backdropFilter: "blur(4px)"
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "560px",
                maxHeight: "92vh",
                overflowY: "auto",
                background: "#ffffff",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-xl)",
                padding: "2rem",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)"
              }}
            >
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.25rem", color: "var(--text-main)" }}>
                {editingSched ? "Edit Jadwal Pelajaran" : "Buat Sesi Jadwal Baru"}
              </h2>

              <form onSubmit={handleSaveSchedule} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                      Hari Pelajaran *
                    </label>
                    <select
                      value={formData.hari}
                      onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                      className="neon-input"
                      style={{ cursor: "pointer", background: "#ffffff", fontWeight: 600 }}
                    >
                      {SCHEDULE_DAYS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                      Pilih Kelas *
                    </label>
                    <select
                      value={DAFTAR_KELAS.includes(formData.kelas) ? formData.kelas : "custom"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "custom") {
                          handleKelasChange("");
                        } else {
                          handleKelasChange(val);
                        }
                      }}
                      className="neon-input"
                      style={{ cursor: "pointer", background: "#ffffff", fontWeight: 700 }}
                    >
                      <optgroup label="── Tingkat Kelas VII (7) ──">
                        {DAFTAR_KELAS.filter((k) => k.startsWith("VII.")).map((k) => (
                          <option key={k} value={k}>Kelas {k}</option>
                        ))}
                      </optgroup>
                      <optgroup label="── Tingkat Kelas VIII (8) ──">
                        {DAFTAR_KELAS.filter((k) => k.startsWith("VIII.")).map((k) => (
                          <option key={k} value={k}>Kelas {k}</option>
                        ))}
                      </optgroup>
                      <optgroup label="── Tingkat Kelas IX (9) ──">
                        {DAFTAR_KELAS.filter((k) => k.startsWith("IX.")).map((k) => (
                          <option key={k} value={k}>Kelas {k}</option>
                        ))}
                      </optgroup>
                      <option value="custom">✏️ Kelas Lainnya...</option>
                    </select>
                    {!DAFTAR_KELAS.includes(formData.kelas) && (
                      <input
                        type="text"
                        required
                        value={formData.kelas}
                        onChange={(e) => handleKelasChange(e.target.value)}
                        placeholder="Ketik nama kelas..."
                        className="neon-input"
                        style={{ marginTop: "0.4rem" }}
                      />
                    )}
                  </div>
                </div>

                {/* Template Sesi Jam (I - X) */}
                <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
                    <Clock size={15} color="#0284c7" /> Pilih Sesi Jam Pelajaran (Template Otomatis)
                  </label>
                  <select
                    onChange={(e) => handleSesiChange(e.target.value)}
                    className="neon-input"
                    style={{ background: "#ffffff", cursor: "pointer", fontSize: "0.85rem" }}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Pilih Jam Ke I s/d X (Otomatis Isi Waktu) --</option>
                    <optgroup label="── Blok 2 Jam Pelajaran (Senin - Kamis) ──">
                      {DAFTAR_SESI_JAM.filter((s) => s.kategori.startsWith("Blok 2 Jam")).map((s) => (
                        <option key={s.label} value={s.label}>{s.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="── Blok 3 Jam Pelajaran (Senin - Kamis) ──">
                      {DAFTAR_SESI_JAM.filter((s) => s.kategori.startsWith("Blok 3 Jam")).map((s) => (
                        <option key={s.label} value={s.label}>{s.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="── Khusus Hari Jumat (I - VI) ──">
                      {DAFTAR_SESI_JAM.filter((s) => s.kategori.startsWith("Jumat")).map((s) => (
                        <option key={s.label} value={s.label}>{s.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="── Sesi Tunggal / Per 1 Jam (I s/d X) ──">
                      {DAFTAR_SESI_JAM.filter((s) => s.kategori.startsWith("Sesi 1 Jam")).map((s) => (
                        <option key={s.label} value={s.label}>{s.label}</option>
                      ))}
                    </optgroup>
                  </select>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.6rem", marginTop: "0.65rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
                        Label Sesi
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.jam_ke}
                        onChange={(e) => setFormData({ ...formData, jam_ke: e.target.value })}
                        placeholder="Contoh: Jam Ke I - II"
                        className="neon-input"
                        style={{ fontSize: "0.82rem", padding: "0.45rem 0.65rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
                        Jam Mulai
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.jam_mulai}
                        onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                        className="neon-input"
                        style={{ fontSize: "0.82rem", padding: "0.45rem 0.65rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
                        Jam Selesai
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.jam_selesai}
                        onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                        className="neon-input"
                        style={{ fontSize: "0.82rem", padding: "0.45rem 0.65rem" }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Guru Pengampu *
                  </label>
                  <select
                    value={formData.guru_id}
                    onChange={(e) => handleTeacherSelect(e.target.value)}
                    className="neon-input"
                    style={{ cursor: "pointer", background: "#ffffff", fontWeight: 600 }}
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama} ({t.mapel || "Guru"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Mata Pelajaran *
                  </label>
                  <select
                    value={DAFTAR_MAPEL.includes(formData.mapel) ? formData.mapel : "custom"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setFormData({ ...formData, mapel: "" });
                      } else {
                        setFormData({ ...formData, mapel: val });
                      }
                    }}
                    className="neon-input"
                    style={{ cursor: "pointer", background: "#ffffff" }}
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {DAFTAR_MAPEL.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="custom">✏️ Ketik Mapel Lainnya...</option>
                  </select>
                  {!DAFTAR_MAPEL.includes(formData.mapel) && (
                    <input
                      type="text"
                      required
                      value={formData.mapel}
                      onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                      placeholder="Ketik mata pelajaran..."
                      className="neon-input"
                      style={{ marginTop: "0.4rem" }}
                    />
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Ruangan Kelas / Fasilitas
                  </label>
                  <select
                    value={DAFTAR_RUANGAN.includes(formData.ruangan) ? formData.ruangan : "custom"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setFormData({ ...formData, ruangan: "" });
                      } else {
                        setFormData({ ...formData, ruangan: val });
                      }
                    }}
                    className="neon-input"
                    style={{ cursor: "pointer", background: "#ffffff" }}
                  >
                    <optgroup label="── Ruang Kelas (VII, VIII, IX) ──">
                      {DAFTAR_RUANGAN.filter((r) => r.startsWith("R. Kelas")).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    <optgroup label="── Laboratorium & Fasilitas ──">
                      {DAFTAR_RUANGAN.filter((r) => !r.startsWith("R. Kelas")).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    <option value="custom">✏️ Ketik Ruangan Lainnya...</option>
                  </select>
                  {!DAFTAR_RUANGAN.includes(formData.ruangan) && (
                    <input
                      type="text"
                      value={formData.ruangan}
                      onChange={(e) => setFormData({ ...formData, ruangan: e.target.value })}
                      placeholder="Contoh: R. Kelas VII.1 / Lab Komputer"
                      className="neon-input"
                      style={{ marginTop: "0.4rem" }}
                    />
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setModalOpen(false)}
                    className="btn-neon-secondary"
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-neon-primary"
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Jadwal"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem"
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 23, 42, 0.5)",
                backdropFilter: "blur(4px)"
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "380px",
                background: "#ffffff",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-xl)",
                padding: "2rem",
                textAlign: "center"
              }}
            >
              <AlertTriangle size={36} color="#dc2626" style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--text-main)" }}>
                Hapus Sesi Jadwal?
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
                Jadwal pelajaran ini akan dihapus dari sistem.
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="btn-neon-secondary"
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSchedule(deleteConfirmId)}
                  className="btn-neon-danger"
                  style={{ flex: 1 }}
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
