"use client";

import { useState, useEffect } from "react";
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
  School
} from "lucide-react";
import {
  DAFTAR_KELAS,
  DAFTAR_MAPEL,
  DAFTAR_RUANGAN,
  DAFTAR_SESI_JAM
} from "@/lib/constants";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

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
  const [selectedDay, setSelectedDay] = useState("Senin");
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSched, setEditingSched] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
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
  }, [router, selectedDay]);

  const fetchData = async () => {
    const sRes = await Api.request("GET", "getSchedules", { hari: selectedDay });
    if (sRes && sRes.schedules) setSchedules(sRes.schedules);

    const tRes = await Api.request("GET", "getUsers", { role: "guru" });
    if (tRes && tRes.users) {
      setTeachers(tRes.users);
      if (tRes.users.length > 0 && !formData.guru_id) {
        setFormData((prev) => ({
          ...prev,
          guru_id: tRes.users[0].id,
          mapel: tRes.users[0].mapel || prev.mapel || DAFTAR_MAPEL[0]
        }));
      }
    }
  };

  const handleOpenModal = (sched = null) => {
    if (sched) {
      setEditingSched(sched);
      setFormData({
        hari: sched.hari || selectedDay,
        kelas: sched.kelas || "VII.1",
        guru_id: sched.guru_id || (teachers[0]?.id || ""),
        mapel: sched.mapel || (teachers[0]?.mapel || DAFTAR_MAPEL[0]),
        jam_ke: sched.jam_ke || "Jam Ke I - II",
        jam_mulai: sched.jam_mulai || "07:30",
        jam_selesai: sched.jam_selesai || "08:50",
        ruangan: sched.ruangan || `R. Kelas ${sched.kelas || "VII.1"}`
      });
    } else {
      setEditingSched(null);
      const isJumat = selectedDay === "Jumat";
      setFormData({
        hari: selectedDay,
        kelas: "VII.1",
        guru_id: teachers[0]?.id || "",
        mapel: teachers[0]?.mapel || DAFTAR_MAPEL[0],
        jam_ke: "Jam Ke I - II",
        jam_mulai: isJumat ? "07:00" : "07:30",
        jam_selesai: isJumat ? "08:20" : "08:50",
        ruangan: "R. Kelas VII.1"
      });
    }
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
    const t = teachers.find((item) => item.id === formData.guru_id);
    const payload = {
      ...formData,
      id: editingSched ? editingSched.id : null,
      nama_guru: t?.nama || "Guru",
      nip: t?.nip || "-"
    };

    const res = await Api.request("POST", "saveSchedule", {}, { ...payload, schedule: payload });
    if (res && res.success) {
      setModalOpen(false);
      const targetDay = payload.hari || selectedDay;
      const newId = res.id || payload.id;

      if (targetDay !== selectedDay) {
        setSelectedDay(targetDay);
      } else {
        if (editingSched) {
          setSchedules((prev) =>
            prev.map((s) => (s.id === editingSched.id ? { ...s, ...payload } : s))
          );
        } else if (newId) {
          setSchedules((prev) => [...prev, { ...payload, id: newId }]);
        }
      }
      await fetchData();
    } else {
      alert("Gagal menyimpan jadwal: " + (res?.message || "Terjadi kesalahan"));
    }
  };

  const handleDeleteSchedule = async (id) => {
    const res = await Api.request("POST", "deleteSchedule", {}, { id });
    if (res && res.success) {
      setDeleteConfirmId(null);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      await fetchData();
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
                Jadwal Sesi Pelajaran
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Atur jadwal mengajar kelas guru per hari untuk presensi otomatis
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => handleOpenModal(null)}
              className="btn-neon-primary"
            >
              <Plus size={18} /> Buat Sesi Jadwal Baru
            </motion.button>
          </div>

          {/* Day Navigation Tabs */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              background: "#ffffff",
              padding: "0.4rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-sm)",
              width: "fit-content",
              marginBottom: "1.75rem",
              overflowX: "auto"
            }}
          >
            {DAYS.map((day) => {
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
                    padding: "0.6rem 1.4rem",
                    borderRadius: "var(--radius-full)",
                    color: isSelected ? "#ffffff" : "var(--text-secondary)",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
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

          {/* Schedule Cards Grid */}
          {schedules.length === 0 ? (
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
                Tidak Ada Jadwal Pada Hari {selectedDay}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                Klik tombol "Buat Sesi Jadwal Baru" untuk menambahkan jam pelajaran di hari ini.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1.25rem"
              }}
            >
              {schedules.map((item, idx) => {
                const theme = CARD_THEMES[idx % CARD_THEMES.length];
                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="glass-panel"
                    style={{
                      padding: "1.35rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "1rem",
                      border: `1.5px solid ${theme.border}`,
                      background: theme.bg,
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <span
                          style={{
                            fontSize: "1.15rem",
                            fontWeight: 800,
                            color: "var(--text-main)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem"
                          }}
                        >
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: theme.accent }} />
                          {item.kelas}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.82rem",
                            color: theme.tagText,
                            background: theme.tagBg,
                            border: `1px solid ${theme.tagBorder}`,
                            padding: "0.25rem 0.65rem",
                            borderRadius: "var(--radius-full)",
                            fontWeight: 700
                          }}
                        >
                          {item.jam_mulai} - {item.jam_selesai}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem" }}>
                        <div style={{ color: theme.accent, fontWeight: 700, fontSize: "0.95rem" }}>
                          {item.mapel}
                        </div>
                        <div style={{ color: "var(--text-main)", fontWeight: 600 }}>
                          Guru: {item.nama_guru}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <MapPin size={13} color={theme.accent} /> Ruangan: {item.ruangan}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.5rem",
                        paddingTop: "0.85rem",
                        borderTop: "1px solid rgba(0,0,0,0.06)"
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenModal(item)}
                        className="btn-neon-secondary"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.78rem", background: "#ffffff", borderColor: theme.border, color: theme.accent }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="btn-neon-danger"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.78rem" }}
                      >
                        <Trash2 size={13} /> Hapus
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
              onClick={() => setModalOpen(false)}
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
                maxWidth: "540px",
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
                      Hari Pelajaran
                    </label>
                    <select
                      value={formData.hari}
                      onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                      className="neon-input"
                      style={{ cursor: "pointer", background: "#ffffff" }}
                    >
                      {DAYS.map((d) => (
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
                        {DAFTAR_KELAS.filter(k => k.startsWith("VII.")).map(k => (
                          <option key={k} value={k}>Kelas {k}</option>
                        ))}
                      </optgroup>
                      <optgroup label="── Tingkat Kelas VIII (8) ──">
                        {DAFTAR_KELAS.filter(k => k.startsWith("VIII.")).map(k => (
                          <option key={k} value={k}>Kelas {k}</option>
                        ))}
                      </optgroup>
                      <optgroup label="── Tingkat Kelas IX (9) ──">
                        {DAFTAR_KELAS.filter(k => k.startsWith("IX.")).map(k => (
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

                {/* Template Sesi Jam (I - VIII) */}
                <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
                    <Clock size={15} color="#0284c7" /> Pilih Sesi Jam Pelajaran (I - VIII)
                  </label>
                  <select
                    onChange={(e) => handleSesiChange(e.target.value)}
                    className="neon-input"
                    style={{ background: "#ffffff", cursor: "pointer", fontSize: "0.85rem" }}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Pilih Jam Ke I s/d VIII (Otomatis Isi Waktu) --</option>
                    <optgroup label="── Blok 2 Jam Pelajaran (Senin - Kamis & Sabtu) ──">
                      {DAFTAR_SESI_JAM.filter(s => s.kategori.startsWith("Blok 2 Jam")).map(s => (
                        <option key={s.label} value={s.label}>{s.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="── Khusus Hari Jumat (I - VI) ──">
                      {DAFTAR_SESI_JAM.filter(s => s.kategori.startsWith("Jumat")).map(s => (
                        <option key={s.label} value={s.label}>{s.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="── Sesi Tunggal / Per 1 Jam (I s/d VIII) ──">
                      {DAFTAR_SESI_JAM.filter(s => s.kategori.startsWith("Sesi 1 Jam")).map(s => (
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
                    Guru Pengampu
                  </label>
                  <select
                    value={formData.guru_id}
                    onChange={(e) => handleTeacherSelect(e.target.value)}
                    className="neon-input"
                    style={{ cursor: "pointer", background: "#ffffff" }}
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
                      {DAFTAR_RUANGAN.filter(r => r.startsWith("R. Kelas")).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    <optgroup label="── Laboratorium & Fasilitas ──">
                      {DAFTAR_RUANGAN.filter(r => !r.startsWith("R. Kelas")).map(r => (
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
                    onClick={() => setModalOpen(false)}
                    className="btn-neon-secondary"
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn-neon-primary" style={{ flex: 1 }}>
                    Simpan Jadwal
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
