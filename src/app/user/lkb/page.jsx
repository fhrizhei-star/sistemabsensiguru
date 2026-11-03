"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";
import TeacherNav from "@/components/TeacherNav";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import {
  FileUp,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Trash2,
  Paperclip,
  Check,
  X,
  FileCheck,
  AlertCircle
} from "lucide-react";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function TeacherLkbPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [lkbList, setLkbList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  // Form states
  const now = new Date();
  const [bulan, setBulan] = useState(MONTH_NAMES[now.getMonth()]);
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [judul, setJudul] = useState("");
  const [catatan, setCatatan] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [fileBase64, setFileBase64] = useState("");
  const [fileSizeStr, setFileSizeStr] = useState("");

  // Revision state
  const [revisionLkbId, setRevisionLkbId] = useState(null);

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentUser(user);
    fetchLkb(user.id);
  }, [router]);

  const fetchLkb = async (userId) => {
    setLoading(true);
    try {
      const res = await Api.request("GET", "getLkb", { user_id: userId });
      if (res && res.lkb) {
        setLkbList(res.lkb);
      }
    } catch (err) {
      console.error("Gagal mengambil data LKB:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Batas ukuran 10 MB
    if (file.size > 10 * 1024 * 1024) {
      setNotice({
        type: "error",
        msg: "Ukuran file terlalu besar! Maksimal 10 MB agar proses upload cepat dan lancar."
      });
      return;
    }

    setFileObj(file);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setFileSizeStr(file.size < 1024 * 1024 ? (file.size / 1024).toFixed(1) + " KB" : `${sizeInMb} MB`);

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const startRevision = (item) => {
    setRevisionLkbId(item.id);
    setBulan(item.bulan || MONTH_NAMES[now.getMonth()]);
    setTahun(String(item.tahun || now.getFullYear()));
    setJudul(item.judul || "");
    setCatatan(item.catatan || "");
    setFileObj(null);
    setFileBase64("");
    setFileSizeStr("");
    setNotice({
      type: "info",
      msg: `Anda sedang memperbaiki dokumen: "${item.judul || 'LKB'}". Pilih file baru yang telah direvisi lalu klik Unggah Revisi.`
    });
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const cancelRevision = () => {
    setRevisionLkbId(null);
    setJudul("");
    setCatatan("");
    setFileObj(null);
    setFileBase64("");
    setFileSizeStr("");
    setNotice(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!fileBase64 && !revisionLkbId) {
      setNotice({ type: "error", msg: "Harap pilih dokumen file LKB yang akan diunggah!" });
      return;
    }

    setSubmitting(true);
    try {
      const isPegawai = currentUser.role === "pegawai";
      const payload = {
        user_id: currentUser.id,
        nama: currentUser.nama || currentUser.username,
        nip: currentUser.nip || "-",
        role: currentUser.role || (currentUser.mapel ? "guru" : "pegawai"),
        mapel_jabatan: isPegawai
          ? (currentUser.jabatan || currentUser.mapel || "Staf Administrasi / Tata Usaha")
          : `${currentUser.jabatan || 'Guru'} / ${currentUser.mapel || 'Pengajar'}`,
        bulan,
        tahun,
        judul: judul.trim() || `LKB Bulan ${bulan} ${tahun}`,
        catatan: catatan.trim(),
        file_name: fileObj?.name || (revisionLkbId ? "Dokumen_Revisi_LKB.pdf" : "Dokumen_LKB.pdf"),
        file_size: fileSizeStr || "-",
        file_base64: fileBase64 || ""
      };

      if (revisionLkbId) {
        payload.lkb_id = revisionLkbId;
      }

      const res = await Api.request("POST", "submitLkb", {}, payload);

      if (res && res.success) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });

        setNotice({
          type: "success",
          msg: revisionLkbId
            ? "Revisi dokumen LKB berhasil diunggah! Status telah diperbarui menjadi Menunggu Verifikasi."
            : "Dokumen LKB berhasil diunggah dan disimpan ke cloud. Menunggu verifikasi admin."
        });

        // Reset form
        setRevisionLkbId(null);
        setJudul("");
        setCatatan("");
        setFileObj(null);
        setFileBase64("");
        setFileSizeStr("");

        // Refresh list
        fetchLkb(currentUser.id);
      } else {
        setNotice({ type: "error", msg: res?.message || "Gagal mengunggah dokumen LKB." });
      }
    } catch (err) {
      setNotice({ type: "error", msg: "Terjadi gangguan koneksi saat mengunggah file." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan dan menghapus dokumen pengajuan LKB ini?")) {
      return;
    }
    const res = await Api.request("POST", "deleteLkb", {}, { id });
    if (res && res.success) {
      setNotice({ type: "success", msg: "Dokumen LKB berhasil dihapus." });
      fetchLkb(currentUser.id);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <Navbar role="guru" />
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem", width: "100%" }}>
        <TeacherNav />

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--text-main)" }}>
            Lembar Kinerja Bulanan (LKB)
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
            Unggah berkas Laporan Kinerja Bulanan {currentUser.role === "pegawai" ? "pegawai tata usaha" : "guru"} & pantau persetujuan langsung dari pimpinan
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
          {/* Form Upload LKB */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel"
            style={{
              padding: "1.75rem",
              border: revisionLkbId ? "2px solid #a855f7" : "1.5px solid #ddd6fe",
              background: revisionLkbId
                ? "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "#ede9fe",
                    border: "1px solid #ddd6fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <FileUp size={20} color="#7c3aed" />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                    {revisionLkbId ? "Perbaiki / Revisi Dokumen LKB" : "Unggah Dokumen LKB"}
                  </h2>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Format: PDF, Word, atau Excel (Maks. 10 MB)
                  </p>
                </div>
              </div>

              {revisionLkbId && (
                <button
                  type="button"
                  onClick={cancelRevision}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid #fecdd3",
                    background: "#fff1f2",
                    color: "#be123c",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  <X size={14} /> Batal Revisi
                </button>
              )}
            </div>

            {/* Alert / Notice */}
            <AnimatePresence>
              {notice && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    background:
                      notice.type === "success" ? "#ecfdf5" : notice.type === "info" ? "#eff6ff" : "#fff1f2",
                    border: `1px solid ${
                      notice.type === "success" ? "#a7f3d0" : notice.type === "info" ? "#bfdbfe" : "#fecdd3"
                    }`,
                    color:
                      notice.type === "success" ? "#065f46" : notice.type === "info" ? "#1e40af" : "#be123c",
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
                  {notice.type === "success" ? (
                    <CheckCircle2 size={18} color="#059669" />
                  ) : notice.type === "info" ? (
                    <AlertCircle size={18} color="#2563eb" />
                  ) : (
                    <AlertTriangle size={18} color="#e11d48" />
                  )}
                  <span>{notice.msg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {/* Periode Bulan & Tahun */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem" }}>
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
                    Bulan Periode
                  </label>
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    className="neon-input"
                    style={{ background: "#ffffff", cursor: "pointer" }}
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

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
                    Tahun
                  </label>
                  <select
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    className="neon-input"
                    style={{ background: "#ffffff", cursor: "pointer" }}
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Judul Dokumen */}
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
                  Judul Dokumen (Opsional)
                </label>
                <input
                  type="text"
                  placeholder={`Contoh: LKB Bulan ${bulan} ${tahun} - ${currentUser.mapel || 'Guru'}`}
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="neon-input"
                  style={{ background: "#ffffff" }}
                />
              </div>

              {/* File Input Box */}
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
                  Pilih Dokumen File LKB <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <div
                  style={{
                    border: "2px dashed #c4b5fd",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.25rem",
                    textAlign: "center",
                    background: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onClick={() => document.getElementById("lkb-file-input")?.click()}
                >
                  <input
                    id="lkb-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  {fileObj ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <FileCheck size={20} color="#059669" />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)" }}>
                          {fileObj.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 600 }}>
                          {fileSizeStr} • Siap diunggah
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Paperclip size={24} color="#7c3aed" style={{ margin: "0 auto 0.5rem" }} />
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#6d28d9" }}>
                        Klik di sini untuk memilih dokumen
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                        Format PDF sangat disarankan agar dapat langsung ditinjau oleh Admin
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Catatan / Keterangan */}
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
                  Catatan Tambahan untuk Admin (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tambahkan keterangan atau ringkasan capaian kinerja bulan ini..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="neon-input"
                  style={{ background: "#ffffff", resize: "vertical" }}
                />
              </div>

              {/* Tombol Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="neon-button"
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  background: revisionLkbId
                    ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                    : "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                  boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  cursor: submitting ? "not-allowed" : "pointer"
                }}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Mengunggah ke Server...
                  </>
                ) : revisionLkbId ? (
                  <>
                    <FileCheck size={18} /> Simpan & Unggah Dokumen Revisi
                  </>
                ) : (
                  <>
                    <FileUp size={18} /> Unggah Dokumen LKB
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Riwayat Dokumen LKB Guru */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel"
            style={{
              padding: "1.75rem",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <FileText size={20} color="#059669" />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                    Riwayat LKB Saya
                  </h2>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    {lkbList.length} dokumen telah diajukan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchLkb(currentUser.id)}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-muted)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  cursor: "pointer"
                }}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Segarkan
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
                Memuat riwayat LKB...
              </div>
            ) : lkbList.length === 0 ? (
              <div
                style={{
                  padding: "3rem 1.5rem",
                  textAlign: "center",
                  border: "1px dashed var(--border-light)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-muted)",
                  margin: "auto 0"
                }}
              >
                <FileUp size={38} color="#a855f7" style={{ margin: "0 auto 0.75rem" }} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.25rem" }}>
                  Belum Ada Dokumen LKB
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Gunakan formulir di samping untuk mengunggah dokumen Lembar Kinerja Bulanan Anda.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", overflowY: "auto", maxHeight: "560px" }}>
                {lkbList.map((item) => {
                  const isApproved = item.status === "Disetujui";
                  const isRejected = item.status === "Ditolak";
                  const isPending = !isApproved && !isRejected;

                  const badgeBg = isApproved ? "#ecfdf5" : isRejected ? "#fff1f2" : "#fffbeb";
                  const badgeBorder = isApproved ? "#a7f3d0" : isRejected ? "#fecdd3" : "#fde68a";
                  const badgeColor = isApproved ? "#059669" : isRejected ? "#e11d48" : "#d97706";

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: "1rem 1.15rem",
                        borderRadius: "var(--radius-lg)",
                        border: `1.5px solid ${badgeBorder}`,
                        background: isApproved ? "#fafffd" : isRejected ? "#fffdfd" : "#fffdf8",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem"
                      }}
                    >
                      {/* Top Bar: Bulan/Tahun & Status */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span
                            style={{
                              background: "#f3e8ff",
                              color: "#6d28d9",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "var(--radius-full)",
                              fontSize: "0.75rem",
                              fontWeight: 700
                            }}
                          >
                            {item.bulan} {item.tahun}
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                            • {item.created_at ? String(item.created_at).slice(0, 16) : ""}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          style={{
                            background: badgeBg,
                            border: `1px solid ${badgeBorder}`,
                            color: badgeColor,
                            padding: "0.25rem 0.65rem",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                        >
                          {isApproved && <Check size={13} />}
                          {isPending && <Clock size={13} />}
                          {isRejected && <AlertTriangle size={13} />}
                          {item.status}
                        </span>
                      </div>

                      {/* Judul & Catatan */}
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
                          {item.judul || `LKB ${item.bulan} ${item.tahun}`}
                        </div>
                        {item.catatan && (
                          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                            "{item.catatan}"
                          </div>
                        )}
                      </div>

                      {/* Info File */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.45rem 0.75rem",
                          background: "#ffffff",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-light)",
                          fontSize: "0.8rem"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", overflow: "hidden" }}>
                          <Paperclip size={14} color="#6b7280" />
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--text-main)",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              maxWidth: "220px"
                            }}
                          >
                            {item.file_name || "Dokumen_LKB.pdf"}
                          </span>
                          {item.file_size && item.file_size !== "-" && (
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                              ({item.file_size})
                            </span>
                          )}
                        </div>

                        {item.file_url && item.file_url !== "" && item.file_url !== "https://drive.google.com" ? (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              color: "#2563eb",
                              fontWeight: 700,
                              textDecoration: "none",
                              fontSize: "0.78rem"
                            }}
                          >
                            Buka File <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Tersimpan</span>
                        )}
                      </div>

                      {/* Catatan Penolakan Jika Ditolak */}
                      {isRejected && (
                        <div
                          style={{
                            padding: "0.65rem 0.85rem",
                            borderRadius: "var(--radius-md)",
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                            fontSize: "0.82rem"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#be123c", fontWeight: 700, marginBottom: "0.2rem" }}>
                            <AlertTriangle size={14} /> Catatan Perbaikan dari Admin:
                          </div>
                          <div style={{ color: "#9f1239", lineHeight: 1.4 }}>
                            {item.alasan_penolakan || "Mohon periksa kembali kelengkapan lampiran dokumen LKB Anda."}
                          </div>
                          <div style={{ marginTop: "0.5rem" }}>
                            <button
                              type="button"
                              onClick={() => startRevision(item)}
                              style={{
                                padding: "0.35rem 0.75rem",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid #be123c",
                                background: "#be123c",
                                color: "#ffffff",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem"
                              }}
                            >
                              <FileUp size={12} /> Unggah Ulang / Perbaiki LKB Ini
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Info Persetujuan Jika Disetujui */}
                      {isApproved && item.diverifikasi_oleh && (
                        <div style={{ fontSize: "0.75rem", color: "#065f46", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <CheckCircle2 size={13} color="#059669" />
                          <span>Disetujui oleh {item.diverifikasi_oleh} {item.diverifikasi_pada ? `(${item.diverifikasi_pada})` : ""}</span>
                        </div>
                      )}

                      {/* Opsi hapus jika masih menunggu verifikasi */}
                      {isPending && (
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
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
                            <Trash2 size={13} /> Batalkan Pengajuan
                          </button>
                        </div>
                      )}
                    </div>
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

