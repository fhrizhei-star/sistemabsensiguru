"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import { formatDriveUrl, getAvatarUrl } from "@/lib/drive";
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  AlertTriangle,
  Camera,
  Upload,
  X,
  Loader2
} from "lucide-react";

const GURU_CARD_THEMES = [
  { border: "#c7d2fe", bg: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)", accent: "#4f46e5", ring: "#818cf8" },
  { border: "#a7f3d0", bg: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)", accent: "#059669", ring: "#34d399" },
  { border: "#bae6fd", bg: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", accent: "#0284c7", ring: "#38bdf8" },
  { border: "#fde68a", bg: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)", accent: "#d97706", ring: "#fbbf24" },
  { border: "#fecdd3", bg: "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)", accent: "#e11d48", ring: "#fb7185" },
  { border: "#ddd6fe", bg: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)", accent: "#7c3aed", ring: "#a78bfa" }
];

export default function AdminGuruPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    username: "",
    password: "",
    mapel: "",
    jabatan: "Guru Pertama",
    no_hp: "",
    email: "",
    status: "aktif",
    foto_url: ""
  });

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    setCurrentUser(user);
    fetchTeachers();
  }, [router]);

  const fetchTeachers = async () => {
    const res = await Api.request("GET", "getUsers", { role: "guru" });
    if (res && res.users) {
      setTeachers(res.users);
    }
  };

  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoBase64, setFotoBase64] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const compressImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const maxWidth = 600;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Pilih file gambar (JPG, PNG, atau WebP)!");
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      setFotoBase64(compressed);
      setFotoPreview(compressed);
      setFormData((prev) => ({ ...prev, foto_url: compressed }));
    } catch (err) {
      console.error("Gagal membaca foto:", err);
    }
  };

  const handleRemoveFoto = () => {
    setFotoBase64("");
    setFotoPreview("");
    setFormData((prev) => ({ ...prev, foto_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenModal = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        nama: teacher.nama || "",
        nip: teacher.nip || "",
        username: teacher.username || "",
        password: teacher.password || "",
        mapel: teacher.mapel || "",
        jabatan: teacher.jabatan || "Guru Pertama",
        no_hp: teacher.no_hp || "",
        email: teacher.email || "",
        status: teacher.status || "aktif",
        foto_url: teacher.foto_url || ""
      });
      setFotoPreview(teacher.foto_url || "");
      setFotoBase64("");
    } else {
      setEditingTeacher(null);
      setFormData({
        nama: "",
        nip: "",
        username: "",
        password: "guru" + Math.floor(100 + Math.random() * 900),
        mapel: "",
        jabatan: "Guru Pertama",
        no_hp: "",
        email: "",
        status: "aktif",
        foto_url: ""
      });
      setFotoPreview("");
      setFotoBase64("");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        foto: fotoBase64 || formData.foto_url,
        foto_base64: fotoBase64 || "",
        foto_url: fotoBase64 || formData.foto_url,
        role: "guru",
        id: editingTeacher ? editingTeacher.id : null
      };

      const res = await Api.request("POST", "saveUser", {}, { ...payload, user: payload });
      if (res && res.success) {
        setModalOpen(false);
        const savedFoto = res.foto_url || payload.foto_url;
        if (savedFoto && editingTeacher) {
          setTeachers((prev) =>
            prev.map((t) => (t.id === editingTeacher.id ? { ...t, ...payload, foto_url: savedFoto } : t))
          );
        } else if (savedFoto && res.id) {
          setTeachers((prev) => [
            { ...payload, id: res.id, foto_url: savedFoto },
            ...prev
          ]);
        }
        await fetchTeachers();
      } else {
        alert("Gagal menyimpan data guru: " + (res?.message || "Terjadi kesalahan"));
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan data guru");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id) => {
    const res = await Api.request("POST", "deleteUser", {}, { id });
    if (res && res.success) {
      setDeleteConfirmId(null);
      fetchTeachers();
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.nama && t.nama.toLowerCase().includes(q)) ||
      (t.nip && t.nip.includes(q)) ||
      (t.mapel && t.mapel.toLowerCase().includes(q))
    );
  });

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
                Manajemen Data Guru
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Kelola akun tenaga pendidik, NIP, mata pelajaran, dan kredensial login
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => handleOpenModal(null)}
              className="btn-neon-primary"
            >
              <UserPlus size={18} /> Tambah Guru Baru
            </motion.button>
          </div>

          {/* Search bar */}
          <div
            style={{
              position: "relative",
              maxWidth: "440px",
              marginBottom: "1.5rem"
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama guru, NIP, atau mata pelajaran..."
              className="neon-input"
              style={{ paddingLeft: "2.75rem" }}
            />
            <Search
              size={18}
              color="#94a3b8"
              style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }}
            />
          </div>

          {/* Teacher Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.25rem"
            }}
          >
            {filteredTeachers.map((teacher, idx) => {
              const theme = GURU_CARD_THEMES[idx % GURU_CARD_THEMES.length];
              return (
                <motion.div
                  key={teacher.id || idx}
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
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "18px",
                          overflow: "hidden",
                          background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.ring} 100%)`,
                          color: "#ffffff",
                          fontWeight: 900,
                          fontSize: "1.4rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          border: `2.5px solid ${theme.accent}`,
                          boxShadow: `0 4px 14px ${theme.accent}35`
                        }}
                      >
                        <img
                          src={getAvatarUrl(teacher.foto_url, teacher.nama)}
                          alt={teacher.nama}
                          referrerPolicy="no-referrer"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            e.target.src = getAvatarUrl("", teacher.nama);
                          }}
                        />
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {teacher.nama}
                        </h3>
                        <p style={{ fontSize: "0.8rem", color: theme.accent, fontWeight: 700 }}>
                          {teacher.mapel || "Guru Mata Pelajaran"}
                        </p>
                      </div>
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <div>NIP: <strong style={{ color: "var(--text-main)" }}>{teacher.nip || "-"}</strong></div>
                      <div>Jabatan: {teacher.jabatan || "Tenaga Pendidik"}</div>
                      {teacher.no_hp && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Phone size={13} color="#059669" /> {teacher.no_hp}
                        </div>
                      )}
                      {teacher.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Mail size={13} color="#0284c7" /> {teacher.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "0.85rem",
                      borderTop: "1px solid rgba(0, 0, 0, 0.06)"
                    }}
                  >
                    <span className={`badge-status ${teacher.status === "aktif" ? "badge-hadir" : "badge-alpha"}`}>
                      {teacher.status || "Aktif"}
                    </span>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(teacher)}
                        className="btn-neon-secondary"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.78rem", background: "#ffffff", borderColor: theme.border, color: theme.accent }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(teacher.id)}
                        className="btn-neon-danger"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.78rem" }}
                      >
                        <Trash2 size={13} /> Hapus
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Add / Edit Modal */}
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
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "640px",
                maxHeight: "92vh",
                background: "#ffffff",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              {/* Modal Header (Fixed) */}
              <div
                style={{
                  padding: "1.25rem 1.75rem",
                  borderBottom: "1px solid var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#ffffff",
                  zIndex: 2
                }}
              >
                <div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                    {editingTeacher ? "Edit Data Guru" : "Tambah Guru Baru"}
                  </h2>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    Lengkapi identitas tenaga pendidik, akun login, dan pasfoto resmi
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748b",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e2e8f0";
                    e.currentTarget.style.color = "#0f172a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.color = "#64748b";
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Container */}
              <form
                onSubmit={handleSaveTeacher}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  overflow: "hidden"
                }}
              >
                {/* Scrollable Form Body */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1.5rem 1.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.1rem"
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                      Nama Lengkap & Gelar
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Contoh: Drs. Bambang Sudarsono, M.Pd"
                      className="neon-input"
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                        NIP / Nomor Identitas
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nip}
                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                        placeholder="1985..."
                        className="neon-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                        Mata Pelajaran
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.mapel}
                        onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                        placeholder="Contoh: Matematika"
                        className="neon-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                        Jabatan / Golongan
                      </label>
                      <select
                        value={formData.jabatan}
                        onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                        className="neon-input"
                        style={{ background: "#ffffff" }}
                      >
                        <option value="Guru Pertama">Guru Pertama</option>
                        <option value="Guru Muda">Guru Muda</option>
                        <option value="Guru Madya">Guru Madya</option>
                        <option value="Guru Utama">Guru Utama</option>
                        <option value="Guru Pengajar">Guru Pengajar</option>
                        <option value="Guru Honorer / GTT">Guru Honorer / GTT</option>
                        <option value="Kepala Sekolah">Kepala Sekolah</option>
                        <option value="Wakil Kepala Sekolah">Wakil Kepala Sekolah</option>
                        <option value="Staf Tata Usaha">Staf Tata Usaha</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                        Status Kepegawaian
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="neon-input"
                        style={{ background: "#ffffff" }}
                      >
                        <option value="aktif">Aktif Mengajar</option>
                        <option value="nonaktif">Nonaktif / Cuti</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                        Username Login
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Username atau NIP"
                        className="neon-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                        Password Login
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Password login"
                        className="neon-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                        Nomor HP / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={formData.no_hp}
                        onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                        placeholder="0812..."
                        className="neon-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="guru@sekolah.sch.id"
                        className="neon-input"
                      />
                    </div>
                  </div>

                  {/* Upload Foto Guru Langsung (Otomatis ke Google Drive) */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                      border: "1.5px dashed #cbd5e1",
                      borderRadius: "14px",
                      padding: "1rem 1.15rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <label style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Camera size={16} color="var(--primary)" /> Pasfoto Guru (Otomatis ke Google Drive)
                      </label>
                      {fotoPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveFoto}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem"
                          }}
                        >
                          <X size={14} /> Hapus Foto
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      {/* Preview box */}
                      <div
                        style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "14px",
                          overflow: "hidden",
                          border: "2px solid var(--primary)",
                          background: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 4px 12px rgba(5, 150, 105, 0.2)"
                        }}
                      >
                        {fotoPreview ? (
                          <img
                            src={formatDriveUrl(fotoPreview)}
                            alt="Preview Foto Guru"
                            referrerPolicy="no-referrer"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Camera size={26} color="#94a3b8" />
                        )}
                      </div>

                      {/* Button Upload & Info */}
                      <div style={{ flex: 1 }}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                          id="guru-file-upload-input"
                        />
                        <label
                          htmlFor="guru-file-upload-input"
                          className="btn-neon-secondary"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.55rem 1rem",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            borderRadius: "10px",
                            marginBottom: "0.35rem"
                          }}
                        >
                          <Upload size={15} /> Pilih File dari Komputer / HP
                        </label>
                        <p style={{ fontSize: "0.74rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.35 }}>
                          Pilih pasfoto guru. Sistem akan <strong>otomatis menyimpannya ke Google Drive sekolah</strong> saat Anda klik Simpan.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Modal Footer */}
                <div
                  style={{
                    padding: "1rem 1.75rem",
                    borderTop: "1px solid var(--border-light)",
                    background: "#f8fafc",
                    display: "flex",
                    gap: "0.75rem",
                    zIndex: 2
                  }}
                >
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setModalOpen(false)}
                    className="btn-neon-secondary"
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-neon-primary"
                    style={{ flex: 1.5, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Menyimpan & Upload Foto...
                      </>
                    ) : (
                      "Simpan Guru"
                    )}
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
                Hapus Data Guru?
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
                Akun guru ini akan dihapus dari sistem presensi.
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
                  onClick={() => handleDeleteTeacher(deleteConfirmId)}
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
