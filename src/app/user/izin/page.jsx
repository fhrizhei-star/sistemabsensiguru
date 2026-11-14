"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";
import TeacherNav from "@/components/TeacherNav";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import { getTodayDateStr } from "@/lib/mockData";
import {
  FileText,
  Calendar,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileCheck,
  X,
  UserCheck,
  Briefcase
} from "lucide-react";

export default function TeacherIzinPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [leavesList, setLeavesList] = useState([]);
  const [tipe, setTipe] = useState("Sakit");
  const [tglMulai, setTglMulai] = useState(getTodayDateStr());
  const [tglSelesai, setTglSelesai] = useState(getTodayDateStr());
  const [alasan, setAlasan] = useState("");
  const [buktiNama, setBuktiNama] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    fetchLeaves(user.id);
  }, [router]);

  const fetchLeaves = async (userId) => {
    const res = await Api.request("GET", "getLeaves", { user_id: userId });
    if (res && res.leaves) {
      setLeavesList(res.leaves);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBuktiNama(e.target.files[0].name);
    }
  };

  const handleRemoveFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setBuktiNama("");
  };

  // Hitung jumlah hari izin
  const durasiHari = useMemo(() => {
    if (!tglMulai || !tglSelesai) return 1;
    const d1 = new Date(tglMulai);
    const d2 = new Date(tglSelesai);
    const diffTime = d2.getTime() - d1.getTime();
    if (isNaN(diffTime) || diffTime < 0) return 1;
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [tglMulai, tglSelesai]);

  const isPegawai = currentUser?.role === "pegawai";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!alasan.trim()) {
      setNotice({ type: "error", msg: "Harap isi keterangan alasan permohonan izin!" });
      return;
    }

    if (tglMulai && tglSelesai && tglMulai > tglSelesai) {
      setNotice({ type: "error", msg: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai!" });
      return;
    }

    setLoading(true);
    try {
      const body = {
        user_id: currentUser.id,
        nama: currentUser.nama || currentUser.username,
        nip: currentUser.nip || "-",
        mapel: currentUser.mapel || (isPegawai ? (currentUser.jabatan || "Tenaga Administrasi") : "Guru"),
        tipe,
        tgl_mulai: tglMulai,
        tgl_selesai: tglSelesai,
        durasi_hari: durasiHari,
        alasan,
        bukti: buktiNama || "Surat_Permohonan.pdf"
      };

      const res = await Api.request("POST", "submitLeave", {}, body);
      if (res && res.success) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });

        setNotice({ type: "success", msg: "Permohonan izin berhasil diajukan dan sedang menunggu verifikasi Tata Usaha / Pimpinan." });
        setAlasan("");
        setBuktiNama("");
        fetchLeaves(currentUser.id);
      } else {
        setNotice({ type: "error", msg: res?.message || "Gagal mengajukan izin." });
      }
    } catch (err) {
      setNotice({ type: "error", msg: "Terjadi gangguan sistem. Silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <Navbar role={isPegawai ? "pegawai" : "guru"} />
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem", width: "100%", boxSizing: "border-box" }}>
        <TeacherNav />

        {/* Page Header */}
        <div style={{ marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                Pengajuan Cuti & Izin
              </h1>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.65rem",
                  borderRadius: "9999px",
                  background: isPegawai ? "#ecfdf5" : "#eff6ff",
                  color: isPegawai ? "#047857" : "#1d4ed8",
                  border: `1px solid ${isPegawai ? "#a7f3d0" : "#bfdbfe"}`
                }}
              >
                {isPegawai ? "Staf Pegawai / TU" : "Guru Pendidik"}
              </span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.86rem" }}>
              Layanan permohonan dispensasi, surat sakit dokter, cuti tahunan, atau tugas dinas luar
            </p>
          </div>
        </div>

        {/* Responsive Grid Container */}
        <div className="izin-grid">
          {/* Form Pengajuan Izin */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel izin-card"
            style={{
              border: "1.5px solid #fde68a",
              background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
              boxShadow: "0 4px 20px rgba(245, 158, 11, 0.08)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "1.25rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "#fef3c7",
                  border: "1.5px solid #fde68a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <FileText size={20} color="#d97706" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.2 }}>
                  Formulir Permohonan
                </h2>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Isi data izin dan lampirkan dokumen pendukung
                </span>
              </div>
            </div>

            <AnimatePresence>
              {notice && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: "1.15rem" }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  style={{
                    background: notice.type === "success" ? "#ecfdf5" : "#fff1f2",
                    border: `1.5px solid ${notice.type === "success" ? "#a7f3d0" : "#fecdd3"}`,
                    color: notice.type === "success" ? "#065f46" : "#be123c",
                    padding: "0.75rem 0.95rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.84rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.55rem",
                    fontWeight: 600,
                    overflow: "hidden"
                  }}
                >
                  <span style={{ flexShrink: 0, marginTop: "2px" }}>
                    {notice.type === "success" ? <CheckCircle2 size={18} color="#059669" /> : <AlertCircle size={18} color="#e11d48" />}
                  </span>
                  <span style={{ flex: 1 }}>{notice.msg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Kategori */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Kategori Permohonan
                </label>
                <select
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value)}
                  className="neon-input"
                  style={{ cursor: "pointer", background: "#ffffff", width: "100%" }}
                >
                  <option value="Sakit">Sakit (Dengan Surat Keterangan Dokter)</option>
                  <option value="Tugas Dinas Luar">Tugas Kedinasan Luar / Pelatihan / MGMP</option>
                  <option value="Cuti Tahunan">Cuti Tahunan</option>
                  <option value="Cuti Alasan Penting">Cuti Alasan Penting / Keperluan Keluarga</option>
                  <option value="Izin Pribadi">Izin Terlambat / Pulang Lebih Awal</option>
                </select>
              </div>

              {/* Tanggal Mulai & Selesai - Responsive Grid */}
              <div>
                <div className="izin-date-grid">
                  <div className="izin-date-col">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                      <Calendar size={13} color="#d97706" />
                      <span>Tanggal Mulai</span>
                    </label>
                    <input
                      type="date"
                      value={tglMulai}
                      onChange={(e) => setTglMulai(e.target.value)}
                      className="neon-input"
                      style={{ background: "#ffffff" }}
                    />
                  </div>
                  <div className="izin-date-col">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                      <Calendar size={13} color="#d97706" />
                      <span>Tanggal Selesai</span>
                    </label>
                    <input
                      type="date"
                      value={tglSelesai}
                      onChange={(e) => setTglSelesai(e.target.value)}
                      className="neon-input"
                      style={{ background: "#ffffff" }}
                    />
                  </div>
                </div>

                {/* Info Durasi Hari */}
                <div
                  style={{
                    marginTop: "0.55rem",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "8px",
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    color: "#92400e",
                    fontWeight: 600
                  }}
                >
                  <span>Durasi Permohonan:</span>
                  <span style={{ fontWeight: 800, background: "#fef3c7", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>
                    {durasiHari} Hari Kerja
                  </span>
                </div>
              </div>

              {/* Alasan */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Alasan / Keterangan Lengkap
                </label>
                <textarea
                  rows={3}
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder="Jelaskan keperluan izin atau cuti Anda secara rinci..."
                  className="neon-input"
                  style={{ resize: "vertical", background: "#ffffff", width: "100%", minHeight: "85px" }}
                />
              </div>

              {/* Lampiran Dokumen Bukti */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Lampiran Dokumen Bukti (PDF / Foto Surat)
                </label>
                <label className="izin-upload-box">
                  {buktiNama ? (
                    <>
                      <FileCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
                      <span className="izin-upload-text" style={{ color: "#065f46" }}>
                        {buktiNama}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        title="Hapus file terpilih"
                        style={{
                          background: "#fee2e2",
                          border: "none",
                          borderRadius: "50%",
                          width: "22px",
                          height: "22px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          marginLeft: "auto",
                          flexShrink: 0
                        }}
                      >
                        <X size={12} color="#dc2626" />
                      </button>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={18} color="#d97706" style={{ flexShrink: 0 }} />
                      <span className="izin-upload-text">
                        Pilih Surat Dokter / Surat Tugas (PDF/Foto)
                      </span>
                    </>
                  )}
                  <input type="file" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn-neon-primary"
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: "0.4rem",
                  background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
                  boxShadow: "0 4px 14px rgba(217, 119, 6, 0.35)",
                  border: "none",
                  color: "#ffffff",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.92rem",
                  borderRadius: "var(--radius-md)"
                }}
              >
                {loading ? (
                  <span>Mengirim Permohonan...</span>
                ) : (
                  <>
                    <Send size={18} />
                    <span>KIRIM PERMOHONAN IZIN</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Riwayat Permohonan Izin */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-panel izin-card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              border: "1.5px solid #bae6fd",
              background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
              boxShadow: "0 4px 20px rgba(2, 132, 199, 0.08)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "#e0f2fe",
                    border: "1.5px solid #bae6fd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <Clock size={20} color="#0284c7" />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.2 }}>
                    Riwayat Permohonan
                  </h2>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Pantau status verifikasi pengajuan Anda
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "#0284c7",
                  fontWeight: 800,
                  background: "#e0f2fe",
                  border: "1px solid #bae6fd",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "var(--radius-full)"
                }}
              >
                {leavesList.length} Pengajuan
              </span>
            </div>

            {leavesList.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3.5rem 1.25rem",
                  color: "var(--text-muted)",
                  border: "1.5px dashed #bae6fd",
                  borderRadius: "var(--radius-md)",
                  background: "#ffffff"
                }}
              >
                <Clock size={36} color="#94a3b8" style={{ margin: "0 auto 0.75rem", opacity: 0.6 }} />
                <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)", marginBottom: "0.25rem" }}>
                  Belum Ada Permohonan
                </p>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Pengajuan izin atau cuti yang Anda kirim akan muncul dan dipantau di sini.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxHeight: "600px", overflowY: "auto", paddingRight: "0.25rem" }}>
                {leavesList.map((item, idx) => {
                  const isApproved = item.status === "Disetujui";
                  const isRejected = item.status === "Ditolak";
                  const cardBorder = isApproved ? "#a7f3d0" : isRejected ? "#fecdd3" : "#fde68a";
                  const cardBg = isApproved
                    ? "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)"
                    : isRejected
                    ? "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)";

                  return (
                    <motion.div
                      key={item.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      style={{
                        padding: "1rem 1.15rem",
                        borderRadius: "var(--radius-md)",
                        background: cardBg,
                        border: `1.5px solid ${cardBorder}`,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        boxSizing: "border-box",
                        overflow: "hidden"
                      }}
                    >
                      {/* Baris Judul & Status */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: "0.45rem",
                          marginBottom: "0.45rem"
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)", wordBreak: "break-word" }}>
                          {item.tipe}
                        </span>
                        <span
                          className={`badge-status ${
                            isApproved
                              ? "badge-hadir"
                              : isRejected
                              ? "badge-alpha"
                              : "badge-terlambat"
                          }`}
                          style={{ flexShrink: 0 }}
                        >
                          {item.status}
                        </span>
                      </div>

                      {/* Baris Tanggal & Durasi */}
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "0.45rem",
                          marginBottom: "0.45rem"
                        }}
                      >
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                          <Calendar size={13} color="#059669" />
                          <span style={{ fontWeight: 600 }}>
                            {item.tgl_mulai} s/d {item.tgl_selesai}
                          </span>
                        </div>
                        {item.durasi_hari && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              background: "rgba(5, 150, 105, 0.1)",
                              color: "#065f46",
                              padding: "0.1rem 0.45rem",
                              borderRadius: "4px"
                            }}
                          >
                            {item.durasi_hari} Hari
                          </span>
                        )}
                      </div>

                      {/* Alasan */}
                      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0, wordBreak: "break-word", lineHeight: 1.4 }}>
                        <strong style={{ color: "var(--text-main)" }}>Alasan:</strong> {item.alasan}
                      </p>

                      {/* Lampiran */}
                      {item.bukti && (
                        <div
                          style={{
                            marginTop: "0.4rem",
                            fontSize: "0.75rem",
                            color: "#0369a1",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            background: "rgba(2, 132, 199, 0.08)",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "6px",
                            maxWidth: "100%",
                            overflow: "hidden"
                          }}
                        >
                          <FileText size={12} color="#0284c7" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.bukti}
                          </span>
                        </div>
                      )}

                      {/* Catatan Admin Jika Ditolak */}
                      {item.rejection_reason && (
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "#be123c",
                            marginTop: "0.45rem",
                            padding: "0.4rem 0.65rem",
                            borderRadius: "6px",
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                            fontWeight: 600
                          }}
                        >
                          Catatan Admin: {item.rejection_reason}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </>
  );
}
