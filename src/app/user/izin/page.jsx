"use client";

import { useState, useEffect } from "react";
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
  UploadCloud
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!alasan.trim()) {
      setNotice({ type: "error", msg: "Harap isi keterangan alasan permohonan izin!" });
      return;
    }

    setLoading(true);
    try {
      const body = {
        user_id: currentUser.id,
        nama: currentUser.nama || currentUser.username,
        nip: currentUser.nip || "-",
        mapel: currentUser.mapel || "Guru",
        tipe,
        tgl_mulai: tglMulai,
        tgl_selesai: tglSelesai,
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

        setNotice({ type: "success", msg: "Permohonan izin berhasil diajukan dan sedang menunggu verifikasi Tata Usaha." });
        setAlasan("");
        setBuktiNama("");
        fetchLeaves(currentUser.id);
      } else {
        setNotice({ type: "error", msg: res?.message || "Gagal mengajukan izin." });
      }
    } catch (err) {
      setNotice({ type: "error", msg: "Terjadi gangguan sistem." });
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

        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--text-main)" }}>
            Pengajuan Cuti & Izin
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
            Ajukan permohonan dispensasi, surat sakit dokter, atau penugasan dinas luar sekolah
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
          {/* Form Pengajuan Izin */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel"
            style={{ padding: "1.75rem", border: "1.5px solid #fde68a", background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef3c7", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={20} color="#d97706" />
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                Formulir Permohonan
              </h2>
            </div>

            <AnimatePresence>
              {notice && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    background: notice.type === "success" ? "#ecfdf5" : "#fff1f2",
                    border: `1px solid ${notice.type === "success" ? "#a7f3d0" : "#fecdd3"}`,
                    color: notice.type === "success" ? "#065f46" : "#be123c",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1.25rem",
                    fontWeight: 600
                  }}
                >
                  {notice.type === "success" ? <CheckCircle2 size={18} color="#059669" /> : <AlertCircle size={18} color="#e11d48" />}
                  <span>{notice.msg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Kategori Permohonan
                </label>
                <select
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value)}
                  className="neon-input"
                  style={{ cursor: "pointer", background: "#ffffff" }}
                >
                  <option value="Sakit">Sakit (Dengan Surat Dokter)</option>
                  <option value="Tugas Dinas Luar">Tugas Dinas Luar / MGMP</option>
                  <option value="Cuti Tahunan">Cuti Tahunan</option>
                  <option value="Izin Pribadi">Izin Keperluan Pribadi</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={tglMulai}
                    onChange={(e) => setTglMulai(e.target.value)}
                    className="neon-input"
                    style={{ background: "#ffffff" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                    Tanggal Selesai
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

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Alasan / Keterangan Lengkap
                </label>
                <textarea
                  rows={3}
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder="Jelaskan alasan permohonan izin Anda..."
                  className="neon-input"
                  style={{ resize: "vertical", background: "#ffffff" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Lampiran Dokumen Bukti (PDF / Foto)
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.85rem",
                    borderRadius: "var(--radius-md)",
                    border: "1.5px dashed #f59e0b",
                    background: "#ffffff",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: "#d97706",
                    fontWeight: 600
                  }}
                >
                  <UploadCloud size={18} color="#d97706" />
                  <span>{buktiNama ? `Terpilih: ${buktiNama}` : "Pilih Dokumen / Surat Keterangan"}</span>
                  <input type="file" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn-neon-primary"
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
                  boxShadow: "0 4px 14px rgba(217, 119, 6, 0.35)",
                  border: "none",
                  color: "#ffffff"
                }}
              >
                {loading ? (
                  <span>Mengirim Permohonan...</span>
                ) : (
                  <>
                    <Send size={18} />
                    <span>KIRIM PERMOHONAN</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Riwayat Permohonan Izin */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel"
            style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem", border: "1.5px solid #bae6fd", background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#e0f2fe", border: "1px solid #bae6fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={20} color="#0284c7" />
                </div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Status Permohonan Anda
                </h2>
              </div>
              <span style={{ fontSize: "0.78rem", color: "#0284c7", fontWeight: 700, background: "#e0f2fe", padding: "0.3rem 0.75rem", borderRadius: "var(--radius-full)" }}>
                {leavesList.length} Pengajuan
              </span>
            </div>

            {leavesList.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem 1rem",
                  color: "var(--text-muted)",
                  border: "1px dashed #bae6fd",
                  borderRadius: "var(--radius-md)",
                  background: "#ffffff"
                }}
              >
                Belum ada permohonan izin yang diajukan.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
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
                      transition={{ delay: idx * 0.04 }}
                      style={{
                        padding: "1rem 1.25rem",
                        borderRadius: "var(--radius-md)",
                        background: cardBg,
                        border: `1.5px solid ${cardBorder}`,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)" }}>{item.tipe}</span>
                        <span
                          className={`badge-status ${
                            isApproved
                              ? "badge-hadir"
                              : isRejected
                              ? "badge-alpha"
                              : "badge-terlambat"
                          }`}
                        >
                        {item.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Calendar size={13} color="#059669" />
                      <span>{item.tgl_mulai} s/d {item.tgl_selesai}</span>
                    </div>

                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                      Alasan: {item.alasan}
                    </p>

                    {item.rejection_reason && (
                      <p style={{ fontSize: "0.78rem", color: "var(--danger)", marginTop: "0.25rem", fontWeight: 600 }}>
                        Catatan Admin: {item.rejection_reason}
                      </p>
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
