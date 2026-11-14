"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";
import TeacherNav from "@/components/TeacherNav";
import OfficialLkbIndividualDocument from "@/components/OfficialLkbIndividualDocument";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import { exportLkbToPdf } from "@/lib/pdfExport";
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Send,
  Camera,
  Filter,
  ShieldCheck,
  Lock,
  Printer,
  Download,
  FileDown,
  Loader2,
  FileSpreadsheet,
  FileCheck,
  Eye,
  X
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
  const [userAttendance, setUserAttendance] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  // Modal pratinjau jika pengguna ingin melihat lembar dokumen sebelum mencetak
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Filter state untuk Laporan Kinerja Bulanan (Evident Foto)
  const now = new Date();
  const [kinerjaBulan, setKinerjaBulan] = useState(MONTH_NAMES[now.getMonth()] || "Oktober");
  const [kinerjaTahun, setKinerjaTahun] = useState(String(now.getFullYear()));

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentUser(user);
    loadAllData(user.id);
  }, [router]);

  const loadAllData = async (userId) => {
    setLoading(true);
    try {
      const [resLkb, resAtt, resSet, resUsers] = await Promise.all([
        Api.request("GET", "getLkb", { user_id: userId }),
        Api.request("GET", "getAttendance", { user_id: userId }),
        Api.request("GET", "getSettings"),
        Api.request("GET", "getUsers")
      ]);

      if (resUsers && resUsers.users) {
        const found = resUsers.users.find(
          (u) => String(u.id) === String(userId) || (u.nip && currentUser?.nip && String(u.nip) === String(currentUser.nip))
        );
        if (found) {
          const merged = { ...currentUser, ...found };
          setCurrentUser(merged);
          Auth.setCurrentUser(merged, true);
        }
      }

      if (resLkb && resLkb.lkb) {
        setLkbList(resLkb.lkb);
      }
      if (resAtt && (resAtt.attendance || resAtt.list)) {
        setUserAttendance(resAtt.attendance || resAtt.list || []);
      }
      if (resSet && resSet.settings) {
        setSettings(resSet.settings);
      }
    } catch (err) {
      console.error("Gagal mengambil data LKB & Presensi:", err);
    } finally {
      setLoading(false);
    }
  };

  const reloadLkbList = async (userId) => {
    try {
      const res = await Api.request("GET", "getLkb", { user_id: userId });
      if (res && res.lkb) {
        setLkbList(res.lkb);
      }
    } catch (err) {
      console.error("Gagal refresh status LKB:", err);
    }
  };

  // Filter rekaman presensi per bulan & tahun yang dipilih
  const monthlyAttendance = useMemo(() => {
    const mIdx = MONTH_NAMES.indexOf(kinerjaBulan) + 1; // 1 - 12
    const padMonth = String(mIdx).padStart(2, "0");
    const yearStr = String(kinerjaTahun);

    return (userAttendance || []).filter((rec) => {
      if (!rec.tanggal) return false;
      const t = String(rec.tanggal).trim();
      if (t.startsWith(`${yearStr}-${padMonth}`)) return true;
      const d = new Date(t);
      if (!isNaN(d.getTime())) {
        return d.getFullYear() === Number(yearStr) && (d.getMonth() + 1) === mIdx;
      }
      return false;
    });
  }, [userAttendance, kinerjaBulan, kinerjaTahun]);

  // Cari record pengajuan LKB untuk bulan & tahun yang sedang aktif
  const currentLkbRecord = useMemo(() => {
    return lkbList.find((item) => {
      const uMatch = !currentUser ? true : (String(item.user_id) === String(currentUser.id) || (item.nip && currentUser.nip && String(item.nip) === String(currentUser.nip)));
      const bMatch = (item.bulan || "").toLowerCase() === kinerjaBulan.toLowerCase();
      const yMatch = String(item.tahun || "") === String(kinerjaTahun);
      return uMatch && bMatch && yMatch;
    });
  }, [lkbList, currentUser, kinerjaBulan, kinerjaTahun]);

  const approvalStatus = currentLkbRecord?.status || "Belum Diajukan";
  const isApproved = approvalStatus === "Disetujui";
  const isPending = approvalStatus === "Menunggu Verifikasi" || approvalStatus === "Menunggu";
  const isRejected = approvalStatus === "Ditolak";

  // Handler pengajuan otomatis LKB bulan berjalan ke Admin
  const handleAjukanLkb = async () => {
    if (monthlyAttendance.length === 0) {
      alert(`Belum ada data presensi berfoto pada bulan ${kinerjaBulan} ${kinerjaTahun}. Pastikan Anda telah melakukan presensi pada bulan ini.`);
      return;
    }

    setSubmitting(true);
    setNotice(null);

    try {
      const isPegawai = currentUser.role === "pegawai";
      const payload = {
        user_id: currentUser.id,
        nama: currentUser.nama || currentUser.username,
        nip: currentUser.nip || "-",
        role: currentUser.role || (currentUser.mapel ? "guru" : "pegawai"),
        satker: currentUser.satker || currentUser.satuan_kerja || settings?.satuan_kerja || settings?.satker || "PENDIS",
        mapel_jabatan: isPegawai
          ? (currentUser.jabatan || currentUser.mapel || "Staf Administrasi / Tata Usaha")
          : `${currentUser.jabatan || 'Guru'} / ${currentUser.mapel || 'Pengajar'}`,
        bulan: kinerjaBulan,
        tahun: kinerjaTahun,
        judul: `Laporan Capaian Kinerja Bulanan ASN - ${kinerjaBulan} ${kinerjaTahun}`,
        catatan: `Pengajuan LKB Otomatis Sistem (${monthlyAttendance.length} kegiatan presensi berfoto)`,
        file_name: `LKB_${kinerjaBulan}_${kinerjaTahun}.pdf`,
        file_url: "SISTEM_PRESENSI_OTOMATIS",
        file_size: `${monthlyAttendance.length} Kegiatan Terdata`,
        status: "Menunggu Verifikasi"
      };

      if (currentLkbRecord?.id) {
        payload.lkb_id = currentLkbRecord.id;
      }

      const res = await Api.request("POST", "submitLkb", {}, payload);

      if (res && res.success) {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.6 }
        });

        setNotice({
          type: "success",
          msg: `Laporan Kinerja Bulan ${kinerjaBulan} ${kinerjaTahun} berhasil diajukan ke Admin! Menunggu verifikasi & pengesahan agar dapat diexport.`
        });

        await reloadLkbList(currentUser.id);
      } else {
        setNotice({
          type: "error",
          msg: res?.message || "Gagal mengajukan LKB ke admin."
        });
      }
    } catch (err) {
      setNotice({
        type: "error",
        msg: "Terjadi kesalahan sistem saat mengirim pengajuan LKB."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Export Berkas PDF Langsung
  const handleExportPdfDocument = async () => {
    if (!isApproved) {
      alert("Dokumen LKB hanya dapat diexport setelah dikonfirmasi & disahkan oleh Admin.");
      return;
    }

    try {
      setIsExportingPdf(true);
      await exportLkbToPdf({
        elementId: "official-lkb-individual-print-area",
        namaASN: currentUser?.nama || currentUser?.username,
        satkerASN: currentUser?.satker || currentUser?.satuan_kerja || settings?.satuan_kerja || "PENDIS",
        bulan: kinerjaBulan,
        tahun: kinerjaTahun
      });
    } catch (err) {
      console.error("Gagal export PDF:", err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Berkas Excel (.xls)
  const handleDownloadExcel = () => {
    if (!isApproved) {
      alert("Dokumen LKB hanya dapat diexport setelah dikonfirmasi & disahkan oleh Admin.");
      return;
    }

    const tableElement = document.getElementById("lkb-excel-table");
    if (!tableElement) {
      alert("Tabel LKB sedang disiapkan, silakan klik tombol sekali lagi.");
      return;
    }

    const namaASN = currentUser?.nama || currentUser?.username || "ASN";
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>LKB_${kinerjaBulan}_${kinerjaTahun}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #000000; padding: 6px 10px; text-align: left; vertical-align: middle; }
          th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
          .center { text-align: center; }
          .title { font-size: 14pt; font-weight: bold; text-align: center; }
          .subtitle { font-size: 12pt; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        ${tableElement.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + htmlContent], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `LKB_${namaASN.replace(/[^a-zA-Z0-9]/g, "_")}_${kinerjaBulan}_${kinerjaTahun}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!currentUser) return null;

  const isPegawai = currentUser.role === "pegawai";

  return (
    <>
      <Navbar role={isPegawai ? "pegawai" : "guru"} />
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem", width: "100%" }}>
        <TeacherNav />

        {/* Header Title */}
        <div style={{ marginBottom: "1.5rem" }} className="no-print">
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.76rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            <ShieldCheck size={14} color="#059669" /> SISTEM LKB RESMI KEMENAG GOWA
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 900, color: "var(--text-main)", margin: "0 0 0.35rem 0" }}>
            Laporan Capaian Kinerja Bulanan (LKB)
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0 }}>
            Ajukan dan export Laporan Capaian Kinerja Bulanan {isPegawai ? "pegawai tata usaha" : "guru"} berbasis presensi kamera perangkat.
          </p>
        </div>

        {/* Notification Toast */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="no-print"
              style={{
                background: notice.type === "success" ? "#ecfdf5" : notice.type === "error" ? "#fef2f2" : "#eff6ff",
                border: `1.5px solid ${notice.type === "success" ? "#a7f3d0" : notice.type === "error" ? "#fecaca" : "#bfdbfe"}`,
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1.15rem",
                color: notice.type === "success" ? "#065f46" : notice.type === "error" ? "#991b1b" : "#1e40af",
                fontSize: "0.86rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                marginBottom: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                {notice.type === "success" ? <CheckCircle2 size={18} color="#059669" /> : <AlertTriangle size={18} color="#dc2626" />}
                <span>{notice.msg}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}
              >
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Filter Periode Bulan & Tahun */}
        <div
          className="glass-panel no-print"
          style={{
            padding: "1.25rem 1.5rem",
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
            border: "1.5px solid #bbf7d0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#dcfce7",
                border: "1px solid #86efac",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#059669",
                flexShrink: 0
              }}
            >
              <Filter size={22} />
            </div>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)" }}>
                Pilih Periode Bulan & Tahun
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Pilih bulan kinerja untuk meninjau status pengesahan dan mengexport LKB
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "var(--text-secondary)",
                  marginBottom: "0.25rem",
                  textTransform: "uppercase"
                }}
              >
                Bulan
              </label>
              <select
                value={kinerjaBulan}
                onChange={(e) => setKinerjaBulan(e.target.value)}
                className="neon-select"
                style={{
                  padding: "0.55rem 0.95rem",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  minWidth: "140px",
                  background: "#ffffff"
                }}
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "var(--text-secondary)",
                  marginBottom: "0.25rem",
                  textTransform: "uppercase"
                }}
              >
                Tahun
              </label>
              <select
                value={kinerjaTahun}
                onChange={(e) => setKinerjaTahun(e.target.value)}
                className="neon-select"
                style={{
                  padding: "0.55rem 0.95rem",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  minWidth: "100px",
                  background: "#ffffff"
                }}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => loadAllData(currentUser.id)}
              disabled={loading}
              className="btn-neon-secondary"
              style={{
                fontSize: "0.82rem",
                padding: "0.55rem 0.85rem",
                marginTop: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
              title="Perbarui Data"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* 2. Dua Card Utama: Card Pengajuan & Card Unduh (Clean Layout) */}
        <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>

          {/* CARD 1: Status & Pengajuan LKB */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: `1.5px solid ${isApproved ? "#a7f3d0" : isPending ? "#fde68a" : isRejected ? "#fecaca" : "#e2e8f0"}`,
              padding: "1.5rem",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              {/* Header Card 1 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: isApproved ? "#ecfdf5" : isPending ? "#fffbeb" : isRejected ? "#fef2f2" : "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isApproved ? "#059669" : isPending ? "#d97706" : isRejected ? "#dc2626" : "#64748b"
                    }}
                  >
                    {isApproved ? <CheckCircle2 size={20} /> : isPending ? <Clock size={20} /> : isRejected ? <AlertTriangle size={20} /> : <FileText size={20} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "#1e293b" }}>
                      Pengajuan LKB Bulanan
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
                      Periode: {kinerjaBulan} {kinerjaTahun}
                    </p>
                  </div>
                </div>

                {/* Badge Status */}
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    padding: "0.3rem 0.75rem",
                    borderRadius: "999px",
                    background: isApproved ? "#ecfdf5" : isPending ? "#fffbeb" : isRejected ? "#fef2f2" : "#f1f5f9",
                    color: isApproved ? "#065f46" : isPending ? "#92400e" : isRejected ? "#991b1b" : "#475569",
                    border: `1px solid ${isApproved ? "#a7f3d0" : isPending ? "#fde68a" : isRejected ? "#fecaca" : "#cbd5e1"}`
                  }}
                >
                  {isApproved ? "Disahkan Admin" : isPending ? "Menunggu Verifikasi" : isRejected ? "Perlu Revisi" : "Belum Diajukan"}
                </span>
              </div>

              {/* Rincian Ringkas */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "10px",
                  padding: "0.85rem 1rem",
                  marginBottom: "1rem",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.82rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ color: "#64748b" }}>Nama ASN:</span>
                  <span style={{ fontWeight: 700, color: "#1e293b" }}>{currentUser.nama || currentUser.username}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ color: "#64748b" }}>NIP:</span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>{currentUser.nip || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ color: "#64748b" }}>Jabatan:</span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>
                    {currentUser.jabatan || (isPegawai ? "Staf Tata Usaha" : (currentUser.mapel ? `Guru ${currentUser.mapel}` : "Guru"))}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ color: "#64748b" }}>Satuan Kerja:</span>
                  <span style={{ fontWeight: 800, color: "#059669" }}>
                    {currentUser.satker || currentUser.satuan_kerja || settings?.satuan_kerja || settings?.satker || "PENDIS"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ color: "#64748b" }}>Kegiatan Presensi:</span>
                  <span style={{ fontWeight: 800, color: monthlyAttendance.length > 0 ? "#059669" : "#dc2626" }}>
                    {monthlyAttendance.length} Sesi Terdata
                  </span>
                </div>
                {isApproved && currentLkbRecord?.diverifikasi_oleh && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Disahkan Oleh:</span>
                    <span style={{ fontWeight: 700, color: "#059669" }}>{currentLkbRecord.diverifikasi_oleh}</span>
                  </div>
                )}
              </div>

              {/* Status Note Box */}
              {isRejected && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                    fontSize: "0.8rem",
                    color: "#991b1b"
                  }}
                >
                  <strong>Catatan Revisi dari Admin:</strong>
                  <div style={{ marginTop: "0.2rem", fontStyle: "italic" }}>
                    &ldquo;{currentLkbRecord?.alasan_penolakan || "Harap periksa kembali rekaman presensi Anda."}&rdquo;
                  </div>
                </div>
              )}

              {isPending && (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                    fontSize: "0.8rem",
                    color: "#92400e"
                  }}
                >
                  Pengajuan LKB sedang ditinjau oleh Admin. Anda akan dapat mengexport dokumen setelah disahkan.
                </div>
              )}

              {isApproved && (
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                    fontSize: "0.8rem",
                    color: "#065f46"
                  }}
                >
                  Laporan Kinerja Bulanan periode ini telah resmi disahkan. Silakan gunakan <strong>Card Export Dokumen</strong> di samping.
                </div>
              )}
            </div>

            {/* Tombol Ajukan LKB */}
            <div>
              {(!isApproved && !isPending) ? (
                <button
                  type="button"
                  onClick={handleAjukanLkb}
                  disabled={submitting || monthlyAttendance.length === 0}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    background: monthlyAttendance.length === 0 ? "#cbd5e1" : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "0.75rem 1.25rem",
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    cursor: submitting || monthlyAttendance.length === 0 ? "not-allowed" : "pointer",
                    boxShadow: monthlyAttendance.length === 0 ? "none" : "0 4px 12px rgba(5, 150, 105, 0.25)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <Send size={16} />
                  <span>
                    {submitting
                      ? "Mengirim Pengajuan..."
                      : isRejected
                        ? `Ajukan Ulang LKB ${kinerjaBulan} ke Admin`
                        : `Ajukan LKB ${kinerjaBulan} ${kinerjaTahun} ke Admin`}
                  </span>
                </button>
              ) : isPending ? (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "#b45309",
                    padding: "0.6rem",
                    background: "#fef3c7",
                    borderRadius: "8px"
                  }}
                >
                  Menunggu Konfirmasi Admin...
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    color: "#065f46",
                    padding: "0.6rem",
                    background: "#d1fae5",
                    borderRadius: "8px"
                  }}
                >
                  ✓ Pengajuan Telah Disetujui
                </div>
              )}

              {monthlyAttendance.length === 0 && !isApproved && (
                <div style={{ fontSize: "0.74rem", color: "#ef4444", marginTop: "0.4rem", textAlign: "center" }}>
                  * Belum ada presensi kamera mengajar/kerja pada bulan ini
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: Export Dokumen LKB */}
          <div
            style={{
              background: isApproved ? "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)" : "#ffffff",
              borderRadius: "16px",
              border: `1.5px solid ${isApproved ? "#86efac" : "#e2e8f0"}`,
              padding: "1.5rem",
              boxShadow: isApproved ? "0 4px 20px rgba(5, 150, 105, 0.08)" : "0 4px 20px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              {/* Header Card 2 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: isApproved ? "#dcfce7" : "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isApproved ? "#059669" : "#94a3b8"
                    }}
                  >
                    {isApproved ? <FileCheck size={20} /> : <Lock size={20} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "#1e293b" }}>
                      Export Dokumen LKB
                    </h3>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    padding: "0.3rem 0.75rem",
                    borderRadius: "999px",
                    background: isApproved ? "#ecfdf5" : "#f1f5f9",
                    color: isApproved ? "#065f46" : "#64748b",
                    border: `1px solid ${isApproved ? "#a7f3d0" : "#cbd5e1"}`
                  }}
                >
                  {isApproved ? "Siap Export" : "Terkunci"}
                </span>
              </div>

              {/* State Description */}
              {!isApproved ? (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "1.25rem 1rem",
                    textAlign: "center",
                    marginBottom: "1.25rem"
                  }}
                >
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem auto", color: "#64748b" }}>
                    <Lock size={20} />
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#334155", marginBottom: "0.25rem" }}>
                    Dokumen Belum Dapat Diexport
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.4, maxWidth: "340px", margin: "0 auto" }}>
                    Sesuai ketentuan, dokumen LKB baru dapat diexport (PDF / Excel) setelah diverifikasi dan disahkan oleh Admin.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "12px",
                    padding: "1rem",
                    marginBottom: "1.25rem",
                    fontSize: "0.82rem",
                    color: "#065f46"
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: "0.25rem" }}>
                    Dokumen LKB Resmi Telah Disahkan!
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#047857", lineHeight: 1.4 }}>
                    Anda dapat mengexport langsung format resmi berfoto (PDF) atau mengexport lembar kerja format Excel (.xls).
                  </div>
                </div>
              )}
            </div>

            {/* Tombol-Tombol Aksi Export */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                {/* Tombol Export PDF Langsung */}
                <button
                  type="button"
                  onClick={handleExportPdfDocument}
                  disabled={!isApproved || isExportingPdf}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    background: isApproved ? "linear-gradient(135deg, #059669 0%, #10b981 100%)" : "#e2e8f0",
                    color: isApproved ? "#ffffff" : "#94a3b8",
                    border: "none",
                    borderRadius: "10px",
                    padding: "0.7rem 0.9rem",
                    fontSize: "0.84rem",
                    fontWeight: 800,
                    cursor: isApproved && !isExportingPdf ? "pointer" : "not-allowed",
                    boxShadow: isApproved ? "0 4px 12px rgba(5, 150, 105, 0.25)" : "none",
                    transition: "all 0.2s ease",
                    opacity: isExportingPdf ? 0.75 : 1
                  }}
                  title={!isApproved ? "Terkunci: Menunggu persetujuan Admin" : "Export Berkas PDF Resmi"}
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Mengexport...</span>
                    </>
                  ) : isApproved ? (
                    <>
                      <FileDown size={16} />
                      <span>Export PDF</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Export PDF</span>
                    </>
                  )}
                </button>

                {/* Tombol Export Excel */}
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={!isApproved}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    background: isApproved ? "#ffffff" : "#f1f5f9",
                    color: isApproved ? "#059669" : "#94a3b8",
                    border: `1.5px solid ${isApproved ? "#059669" : "#cbd5e1"}`,
                    borderRadius: "10px",
                    padding: "0.7rem 0.9rem",
                    fontSize: "0.84rem",
                    fontWeight: 800,
                    cursor: isApproved ? "pointer" : "not-allowed",
                    boxShadow: isApproved ? "0 2px 8px rgba(5, 150, 105, 0.12)" : "none",
                    transition: "all 0.2s ease"
                  }}
                  title={!isApproved ? "Terkunci: Menunggu persetujuan Admin" : "Export Dokumen Excel (.xls)"}
                >
                  {isApproved ? <FileSpreadsheet size={16} /> : <Lock size={15} />}
                  <span>Export Excel</span>
                </button>
              </div>

              {/* Tombol Pratinjau Bersih (Modal) */}
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  background: "transparent",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <Eye size={14} />
                <span>Lihat Pratinjau Dokumen ({monthlyAttendance.length} Kegiatan)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. MODAL POPUP PRATINJAU DOKUMEN (Hanya Tampil Saat Tombol Pratinjau Diklik) */}
        <AnimatePresence>
          {showPreviewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="no-print"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(4px)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem"
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                style={{
                  background: "#f8fafc",
                  borderRadius: "16px",
                  width: "100%",
                  maxWidth: "920px",
                  maxHeight: "92vh",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  border: "1px solid #e2e8f0"
                }}
              >
                {/* Modal Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 1.5rem",
                    background: "#ffffff",
                    borderBottom: "1px solid #e2e8f0"
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                      Pratinjau Dokumen LKB - {kinerjaBulan} {kinerjaTahun}
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
                      Dokumen Resmi Laporan Capaian Kinerja ASN Kemenag Gowa (Tanpa Stempel)
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    {isApproved && (
                      <button
                        type="button"
                        onClick={handleExportPdfDocument}
                        disabled={isExportingPdf}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "0.5rem 0.9rem",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: isExportingPdf ? "not-allowed" : "pointer",
                          opacity: isExportingPdf ? 0.75 : 1
                        }}
                      >
                        {isExportingPdf ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Mengexport...</span>
                          </>
                        ) : (
                          <>
                            <FileDown size={14} />
                            <span>Export PDF</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(false)}
                      style={{
                        background: "#f1f5f9",
                        border: "none",
                        borderRadius: "8px",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#475569",
                        cursor: "pointer"
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Modal Body: Scrollable Document View */}
                <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
                  <OfficialLkbIndividualDocument
                    user={currentUser}
                    bulan={kinerjaBulan}
                    tahun={kinerjaTahun}
                    attendanceRecords={monthlyAttendance}
                    settings={settings}
                    approvalStatus={approvalStatus}
                    verifiedBy={currentLkbRecord?.diverifikasi_oleh || ""}
                    verifiedAt={currentLkbRecord?.tanggal_verifikasi || ""}
                    rejectionNote={currentLkbRecord?.alasan_penolakan || ""}
                    isViewerAdmin={false}
                    showActionBar={false}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. DOKUMEN CETAK & EXCEL TERSEMBUNYI (Hidden on screen, Active on print) */}
        <div className="lkb-print-container">
          <OfficialLkbIndividualDocument
            user={currentUser}
            bulan={kinerjaBulan}
            tahun={kinerjaTahun}
            attendanceRecords={monthlyAttendance}
            settings={settings}
            approvalStatus={approvalStatus}
            verifiedBy={currentLkbRecord?.diverifikasi_oleh || ""}
            verifiedAt={currentLkbRecord?.tanggal_verifikasi || ""}
            rejectionNote={currentLkbRecord?.alasan_penolakan || ""}
            isViewerAdmin={false}
            showActionBar={false}
          />
        </div>
      </main>

      <style jsx global>{`
        @media screen {
          .lkb-print-container {
            position: absolute !important;
            left: -9999px !important;
            top: 0 !important;
            width: 820px !important;
            background: #ffffff !important;
            pointer-events: none !important;
            opacity: 0.01 !important;
          }
        }
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          header, nav, .teacher-bottom-nav, .no-print, .admin-sidebar, .admin-bottom-nav {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .lkb-print-container {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #official-lkb-individual-print-area {
            box-shadow: none !important;
            padding: 10px 15px !important;
            max-width: 100% !important;
            border: none !important;
          }
        }
      `}</style>
    </>
  );
}
