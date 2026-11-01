"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import { formatDriveUrl, getAvatarUrl } from "@/lib/drive";
import {
  FileCheck,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Clock,
  AlertTriangle,
  Search,
  ExternalLink,
  RefreshCw,
  Trash2,
  Filter,
  Check,
  X,
  FileUp,
  Inbox
} from "lucide-react";

const MONTH_NAMES = [
  "Semua",
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = ["Semua", String(CURRENT_YEAR - 1), String(CURRENT_YEAR), String(CURRENT_YEAR + 1)];

export default function AdminLkbPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [lkbList, setLkbList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterBulan, setFilterBulan] = useState("Semua");
  const [filterTahun, setFilterTahun] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Reject Modal
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Toast / notification
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    setCurrentUser(user);
    fetchLkb();
    Api.request("GET", "getSettings").then((res) => {
      if (res && res.settings) setSettings(res.settings);
    }).catch(() => {});
  }, [router]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLkb = async () => {
    setLoading(true);
    try {
      const res = await Api.request("GET", "getLkb", {});
      if (res && res.lkb) {
        setLkbList(res.lkb);
      }
    } catch (err) {
      console.error("Gagal mengambil data LKB:", err);
      showToast("error", "Gagal memuat data LKB dari server.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item) => {
    setActionLoading(true);
    try {
      const res = await Api.request("POST", "updateLkbStatus", {}, {
        id: item.id,
        status: "Disetujui",
        alasan_penolakan: "",
        diverifikasi_oleh: currentUser?.nama || "Admin"
      });

      if (res && res.success) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
        showToast("success", `Dokumen LKB milik ${item.nama} berhasil disetujui!`);
        fetchLkb();
      } else {
        showToast("error", res?.message || "Gagal menyetujui dokumen.");
      }
    } catch (err) {
      showToast("error", "Terjadi kesalahan koneksi.");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (item) => {
    setRejectModalItem(item);
    setRejectionReason("");
  };

  const closeRejectModal = () => {
    setRejectModalItem(null);
    setRejectionReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalItem) return;
    if (!rejectionReason.trim()) {
      alert("Harap masukkan alasan penolakan atau catatan revisi agar guru tahu apa yang harus diperbaiki.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await Api.request("POST", "updateLkbStatus", {}, {
        id: rejectModalItem.id,
        status: "Ditolak",
        alasan_penolakan: rejectionReason.trim(),
        diverifikasi_oleh: currentUser?.nama || "Admin"
      });

      if (res && res.success) {
        showToast("success", `Dokumen LKB ${rejectModalItem.nama} telah ditolak dengan catatan revisi.`);
        closeRejectModal();
        fetchLkb();
      } else {
        showToast("error", res?.message || "Gagal memperbarui status.");
      }
    } catch (err) {
      showToast("error", "Terjadi gangguan sistem.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Hapus pengajuan LKB milik ${nama}? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const res = await Api.request("POST", "deleteLkb", {}, { id });
      if (res && res.success) {
        showToast("success", "Dokumen LKB berhasil dihapus.");
        fetchLkb();
      }
    } catch (err) {
      showToast("error", "Gagal menghapus dokumen.");
    }
  };

  const exportLkbExcel = () => {
    const dataToExport = filteredList;
    const kota = settings.kota || "Kabupaten Gowa";
    const namaSekolah = settings.nama_sekolah || "MADRASAH TSANAWIYAH NEGERI GOWA";
    const alamatSekolah = settings.alamat_sekolah || "Jl. Pendidikan Nasional, Kabupaten Gowa, Sulawesi Selatan";
    const telpSekolah = settings.no_telp || settings.telepon || "(0411) 861234";
    const namaKepsek = settings.kepala_sekolah || "Drs. H. Mulyadi, M.Pd";
    const nipKepsek = settings.nip_kepsek || "196805121994031004";
    const namaAdmin = settings.operator_nama || settings.nama_operator || currentUser?.nama || "Bpk. Hendra Gunawan, S.Kom";
    const nipAdmin = settings.operator_nip || settings.nip_operator || currentUser?.nip || "198001012005011001";
    const nowStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    let rowsHtml = "";
    dataToExport.forEach((item, i) => {
      let statusStyle = "background-color: #dcfce7; color: #065f46; font-weight: bold; text-align: center;";
      if (item.status === "Menunggu Verifikasi" || item.status === "Menunggu") {
        statusStyle = "background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center;";
      } else if (item.status === "Ditolak") {
        statusStyle = "background-color: #fff1f2; color: #be123c; font-weight: bold; text-align: center;";
      }

      rowsHtml += `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${i + 1}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.bulan} ${item.tahun}</td>
          <td style="text-align: left; font-weight: 600; border: 1px solid #cbd5e1; padding: 6px 8px;">${item.nama || "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; mso-number-format: '\\@';">${String(item.nip || "-").replace(/^'/, "")}</td>
          <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${item.mapel_jabatan || "-"}</td>
          <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${item.judul || "-"}</td>
          <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${item.file_name || "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.file_size || "-"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; ${statusStyle}">${item.status || "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.created_at || "-"}</td>
          <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${item.diverifikasi_oleh || "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.diverifikasi_pada || "-"}</td>
          <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${item.alasan_penolakan || item.catatan || "-"}</td>
        </tr>
      `;
    });

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Rekap LKB Guru</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                  <x:FitToPage/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; }
          table { border-collapse: collapse; width: 100%; }
          .th-header { background-color: #6d28d9; color: #ffffff; font-weight: bold; text-align: center; padding: 9px 6px; border: 1px solid #5b21b6; font-size: 10pt; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="13" style="text-align: center; font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1e293b; padding-top: 8px;">
              KEMENTERIAN AGAMA REPUBLIK INDONESIA
            </td>
          </tr>
          <tr>
            <td colspan="13" style="text-align: center; font-size: 10pt; font-weight: bold; text-transform: uppercase; color: #334155;">
              KANTOR KEMENTERIAN AGAMA ${kota.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td colspan="13" style="text-align: center; font-size: 15pt; font-weight: 800; text-transform: uppercase; color: #6d28d9; padding: 3px 0;">
              ${namaSekolah}
            </td>
          </tr>
          <tr>
            <td colspan="13" style="text-align: center; font-size: 8.5pt; color: #64748b; font-style: italic;">
              ${alamatSekolah} • Telp: ${telpSekolah}
            </td>
          </tr>
          <tr>
            <td colspan="13" style="border-bottom: 2.5px solid #6d28d9; height: 6px;"></td>
          </tr>
          <tr><td colspan="13" style="height: 10px;"></td></tr>

          <tr>
            <td colspan="13" style="text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #0f172a;">
              REKAPITULASI DOKUMEN LEMBAR KINERJA BULANAN (LKB) GURU
            </td>
          </tr>
          <tr>
            <td colspan="13" style="text-align: center; font-size: 10pt; color: #475569; font-weight: 600;">
              Periode: ${filterBulan} ${filterTahun} • Status: ${filterStatus}
            </td>
          </tr>
          <tr>
            <td colspan="13" style="text-align: right; font-size: 8.5pt; color: #64748b; font-style: italic; padding-bottom: 6px;">
              Dicetak pada: ${nowStr} melalui Sistem Informasi Sekolah
            </td>
          </tr>

          <thead>
            <tr>
              <th class="th-header" style="width: 45px;">NO</th>
              <th class="th-header" style="width: 110px;">PERIODE</th>
              <th class="th-header" style="width: 230px;">NAMA GURU</th>
              <th class="th-header" style="width: 180px;">NIP</th>
              <th class="th-header" style="width: 170px;">JABATAN / MAPEL</th>
              <th class="th-header" style="width: 220px;">JUDUL DOKUMEN</th>
              <th class="th-header" style="width: 180px;">NAMA FILE</th>
              <th class="th-header" style="width: 85px;">UKURAN</th>
              <th class="th-header" style="width: 140px;">STATUS</th>
              <th class="th-header" style="width: 130px;">TGL UNGGAH</th>
              <th class="th-header" style="width: 180px;">VERIFIKATOR</th>
              <th class="th-header" style="width: 130px;">TGL VERIFIKASI</th>
              <th class="th-header" style="width: 220px;">CATATAN / REVISI</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>

          <tr><td colspan="13" style="height: 12px;"></td></tr>
          <tr>
            <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px;">
              RINGKASAN LKB:
            </td>
            <td colspan="10" style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 7px; font-size: 9.5pt;">
              Total Dokumen: <strong>${dataToExport.length}</strong> &nbsp;|&nbsp;
              <span style="color: #059669; font-weight: bold;">Disetujui: ${dataToExport.filter(d => d.status === "Disetujui").length}</span> &nbsp;|&nbsp;
              <span style="color: #d97706; font-weight: bold;">Menunggu: ${dataToExport.filter(d => d.status === "Menunggu Verifikasi" || d.status === "Menunggu").length}</span> &nbsp;|&nbsp;
              <span style="color: #be123c; font-weight: bold;">Ditolak: ${dataToExport.filter(d => d.status === "Ditolak").length}</span>
            </td>
          </tr>

          <tr><td colspan="13" style="height: 25px;"></td></tr>
          <tr>
            <td colspan="7" style="text-align: center; font-size: 9.5pt;">
              Mengetahui,<br><strong>Kepala Madrasah / Sekolah</strong>
            </td>
            <td colspan="6" style="text-align: center; font-size: 9.5pt;">
              ${kota}, ${nowStr}<br><strong>Kepala Tata Usaha / Verifikator</strong>
            </td>
          </tr>
          <tr><td colspan="13" style="height: 55px;"></td></tr>
          <tr>
            <td colspan="7" style="text-align: center; font-size: 10.5pt; font-weight: bold; text-decoration: underline;">
              ${namaKepsek}
            </td>
            <td colspan="6" style="text-align: center; font-size: 10.5pt; font-weight: bold; text-decoration: underline;">
              ${namaAdmin}
            </td>
          </tr>
          <tr>
            <td colspan="7" style="text-align: center; font-size: 9pt; color: #334155; mso-number-format: '\\@';">
              NIP. ${nipKepsek}
            </td>
            <td colspan="6" style="text-align: center; font-size: 9pt; color: #334155; mso-number-format: '\\@';">
              NIP. ${nipAdmin}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_LKB_Guru_${filterBulan}_${filterTahun}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return lkbList.filter((item) => {
      // Filter status
      if (filterStatus !== "Semua" && item.status !== filterStatus) return false;

      // Filter bulan
      if (filterBulan !== "Semua" && (item.bulan || "").toLowerCase() !== filterBulan.toLowerCase()) return false;

      // Filter tahun
      if (filterTahun !== "Semua" && String(item.tahun) !== String(filterTahun)) return false;

      // Search query (nama, nip, judul)
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchNama = (item.nama || "").toLowerCase().includes(q);
        const matchNip = (item.nip || "").toLowerCase().includes(q);
        const matchJudul = (item.judul || "").toLowerCase().includes(q);
        const matchMapel = (item.mapel_jabatan || "").toLowerCase().includes(q);
        if (!matchNama && !matchNip && !matchJudul && !matchMapel) return false;
      }

      return true;
    });
  }, [lkbList, filterStatus, filterBulan, filterTahun, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = lkbList.length;
    const pending = lkbList.filter((l) => l.status === "Menunggu Verifikasi" || l.status === "Menunggu").length;
    const approved = lkbList.filter((l) => l.status === "Disetujui").length;
    const rejected = lkbList.filter((l) => l.status === "Ditolak").length;
    return { total, pending, approved, rejected };
  }, [lkbList]);

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
                Verifikasi Dokumen LKB Guru
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Pemeriksaan, persetujuan, dan penolakan Lembar Kinerja Bulanan guru & tenaga pendidik
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={exportLkbExcel}
                style={{
                  padding: "0.5rem 1.1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1.5px solid #a855f7",
                  background: "#ffffff",
                  color: "#7c3aed",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(124, 58, 237, 0.15)",
                  transition: "all 0.2s"
                }}
              >
                <FileSpreadsheet size={16} color="#7c3aed" />
                Ekspor Rekap LKB (.xls)
              </button>

              <button
                type="button"
                onClick={fetchLkb}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  background: "#ffffff",
                  color: "var(--text-main)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                Segarkan Data
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                style={{
                  position: "fixed",
                  top: "85px",
                  right: "25px",
                  zIndex: 9999,
                  background: toast.type === "success" ? "#065f46" : "#9f1239",
                  color: "#ffffff",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem"
                }}
              >
                {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{toast.msg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Statistik Ringkasan Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "1rem",
              marginBottom: "1.75rem"
            }}
          >
            {/* Total Dokumen */}
            <div
              className="glass-panel"
              style={{
                padding: "1.25rem",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)",
                border: "1.5px solid #c7d2fe"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase" }}>
                    Total Dokumen
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginTop: "0.2rem" }}>
                    {stats.total}
                  </div>
                </div>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Inbox size={22} color="#4f46e5" />
                </div>
              </div>
            </div>

            {/* Menunggu Verifikasi */}
            <div
              className="glass-panel"
              style={{
                padding: "1.25rem",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
                border: "1.5px solid #fde68a"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#d97706", textTransform: "uppercase" }}>
                    Menunggu Review
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#b45309", marginTop: "0.2rem" }}>
                    {stats.pending}
                  </div>
                </div>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={22} color="#d97706" />
                </div>
              </div>
            </div>

            {/* Disetujui */}
            <div
              className="glass-panel"
              style={{
                padding: "1.25rem",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)",
                border: "1.5px solid #a7f3d0"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>
                    Telah Disetujui
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#047857", marginTop: "0.2rem" }}>
                    {stats.approved}
                  </div>
                </div>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={22} color="#059669" />
                </div>
              </div>
            </div>

            {/* Ditolak */}
            <div
              className="glass-panel"
              style={{
                padding: "1.25rem",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)",
                border: "1.5px solid #fecdd3"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e11d48", textTransform: "uppercase" }}>
                    Ditolak / Revisi
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#be123c", marginTop: "0.2rem" }}>
                    {stats.rejected}
                  </div>
                </div>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ffe4e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <XCircle size={22} color="#e11d48" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div
            className="glass-panel"
            style={{
              padding: "1.25rem",
              borderRadius: "var(--radius-lg)",
              background: "#ffffff",
              marginBottom: "1.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            {/* Search Input */}
            <div style={{ flex: "1 1 280px", position: "relative" }}>
              <Search
                size={17}
                color="#9ca3af"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Cari nama guru, NIP, atau judul LKB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neon-input"
                style={{ paddingLeft: "2.35rem", fontSize: "0.88rem" }}
              />
            </div>

            {/* Dropdown Filters */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
              {/* Filter Bulan */}
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="neon-input"
                style={{ width: "auto", fontSize: "0.82rem", padding: "0.5rem 0.8rem", cursor: "pointer" }}
              >
                <option value="Semua">Semua Bulan</option>
                {MONTH_NAMES.filter((m) => m !== "Semua").map((m) => (
                  <option key={m} value={m}>
                    Bulan {m}
                  </option>
                ))}
              </select>

              {/* Filter Tahun */}
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="neon-input"
                style={{ width: "auto", fontSize: "0.82rem", padding: "0.5rem 0.8rem", cursor: "pointer" }}
              >
                <option value="Semua">Semua Tahun</option>
                {YEAR_OPTIONS.filter((y) => y !== "Semua").map((y) => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Status Pills */}
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              marginBottom: "1.5rem",
              overflowX: "auto",
              paddingBottom: "0.25rem"
            }}
          >
            {[
              { label: "Semua", color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
              { label: "Menunggu Verifikasi", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
              { label: "Disetujui", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
              { label: "Ditolak", color: "#e11d48", bg: "#fff1f2", border: "#fecdd3" }
            ].map((f) => {
              const active = filterStatus === f.label;
              return (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFilterStatus(f.label)}
                  style={{
                    padding: "0.45rem 1.1rem",
                    borderRadius: "var(--radius-full)",
                    border: `1.5px solid ${active ? f.color : f.border}`,
                    background: active ? f.color : f.bg,
                    color: active ? "#ffffff" : f.color,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: active ? `0 4px 12px ${f.color}35` : "none"
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Daftar Dokumen LKB */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 0.75rem" }} />
              Memuat data dokumen LKB guru...
            </div>
          ) : filteredList.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: "3.5rem",
                textAlign: "center",
                border: "1px dashed var(--border-light)",
                background: "var(--bg-muted)",
                borderRadius: "var(--radius-xl)"
              }}
            >
              <FileCheck size={44} color="#94a3b8" style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.3rem", color: "var(--text-main)" }}>
                Tidak Ada Dokumen LKB
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                Tidak ada dokumen pengajuan yang sesuai dengan kriteria filter saat ini.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredList.map((item, idx) => {
                const isApproved = item.status === "Disetujui";
                const isRejected = item.status === "Ditolak";
                const isPending = !isApproved && !isRejected;

                const cardBorder = isApproved ? "#a7f3d0" : isRejected ? "#fecdd3" : "#fde68a";
                const cardBg = isApproved
                  ? "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)"
                  : isRejected
                  ? "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)"
                  : "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)";

                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="glass-panel"
                    style={{
                      padding: "1.5rem",
                      borderRadius: "var(--radius-xl)",
                      border: `1.5px solid ${cardBorder}`,
                      background: cardBg,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1.25rem",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
                    }}
                  >
                    {/* Sisi Kiri: Profil Guru & Detail Dokumen */}
                    <div style={{ flex: "1 1 360px", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      {/* Avatar Guru */}
                      <img
                        src={getAvatarUrl("", item.nama)}
                        alt={item.nama}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "14px",
                          objectFit: "cover",
                          border: "2px solid #ffffff",
                          boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                          flexShrink: 0
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)" }}>
                            {item.nama}
                          </h3>
                          <span
                            style={{
                              background: "#f3e8ff",
                              color: "#7c3aed",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "var(--radius-full)"
                            }}
                          >
                            Periode {item.bulan} {item.tahun}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                          NIP: {item.nip || "-"} • {item.mapel_jabatan || "Tenaga Pendidik"}
                        </div>

                        {/* Judul & Catatan */}
                        <div style={{ marginTop: "0.6rem" }}>
                          <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-main)" }}>
                            📄 {item.judul || `LKB Bulan ${item.bulan} ${item.tahun}`}
                          </div>
                          {item.catatan && (
                            <div
                              style={{
                                fontSize: "0.82rem",
                                color: "#4b5563",
                                background: "rgba(255,255,255,0.7)",
                                padding: "0.4rem 0.65rem",
                                borderRadius: "var(--radius-md)",
                                marginTop: "0.35rem",
                                borderLeft: "3px solid #8b5cf6"
                              }}
                            >
                              Catatan Guru: "{item.catatan}"
                            </div>
                          )}
                        </div>

                        {/* File preview badge & waktu upload */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-secondary)",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem"
                            }}
                          >
                            <Calendar size={13} /> Diunggah: {item.created_at ? String(item.created_at).slice(0, 16) : "-"}
                          </div>

                          {item.file_name && (
                            <div style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>
                              📁 {item.file_name} {item.file_size && item.file_size !== "-" ? `(${item.file_size})` : ""}
                            </div>
                          )}
                        </div>

                        {/* Banner Catatan Penolakan Jika Ditolak */}
                        {isRejected && (
                          <div
                            style={{
                              marginTop: "0.75rem",
                              padding: "0.6rem 0.85rem",
                              background: "#fff1f2",
                              borderRadius: "var(--radius-md)",
                              border: "1px solid #fecdd3",
                              fontSize: "0.82rem"
                            }}
                          >
                            <span style={{ fontWeight: 700, color: "#be123c" }}>Catatan Revisi: </span>
                            <span style={{ color: "#9f1239" }}>{item.alasan_penolakan || "Perlu revisi dokumen."}</span>
                          </div>
                        )}

                        {/* Info Disetujui */}
                        {isApproved && item.diverifikasi_oleh && (
                          <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#065f46", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <CheckCircle2 size={14} color="#059669" /> Disetujui oleh {item.diverifikasi_oleh} {item.diverifikasi_pada ? `pada ${item.diverifikasi_pada}` : ""}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sisi Kanan: Aksi & Tombol Verifikasi */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem" }}>
                      {/* Status Badge */}
                      <span
                        style={{
                          background: isApproved ? "#ecfdf5" : isRejected ? "#fff1f2" : "#fffbeb",
                          border: `1.5px solid ${isApproved ? "#a7f3d0" : isRejected ? "#fecdd3" : "#fde68a"}`,
                          color: isApproved ? "#059669" : isRejected ? "#e11d48" : "#d97706",
                          padding: "0.35rem 0.85rem",
                          borderRadius: "var(--radius-full)",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem"
                        }}
                      >
                        {isApproved && <Check size={14} />}
                        {isPending && <Clock size={14} />}
                        {isRejected && <X size={14} />}
                        {item.status}
                      </span>

                      {/* Tombol Buka File Dokumen (Google Drive) */}
                      {item.file_url && item.file_url !== "" && item.file_url !== "https://drive.google.com" ? (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.45rem 0.9rem",
                            borderRadius: "var(--radius-md)",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            color: "#1d4ed8",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            textDecoration: "none",
                            transition: "all 0.2s"
                          }}
                        >
                          <ExternalLink size={14} /> Buka / Preview File
                        </a>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>File tersimpan di server</span>
                      )}

                      {/* Tombol Verifikasi (Terima / Tolak) */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                        {/* Tombol Terima */}
                        <button
                          type="button"
                          disabled={actionLoading || isApproved}
                          onClick={() => handleApprove(item)}
                          style={{
                            padding: "0.45rem 0.85rem",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid #059669",
                            background: isApproved ? "#f0fdf4" : "#059669",
                            color: isApproved ? "#059669" : "#ffffff",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            cursor: isApproved ? "default" : "pointer",
                            opacity: isApproved ? 0.7 : 1,
                            transition: "all 0.2s"
                          }}
                        >
                          <CheckCircle2 size={14} /> {isApproved ? "Disetujui" : "Terima LKB"}
                        </button>

                        {/* Tombol Tolak */}
                        <button
                          type="button"
                          disabled={actionLoading || isRejected}
                          onClick={() => openRejectModal(item)}
                          style={{
                            padding: "0.45rem 0.85rem",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid #e11d48",
                            background: isRejected ? "#fff1f2" : "#e11d48",
                            color: isRejected ? "#e11d48" : "#ffffff",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            cursor: isRejected ? "default" : "pointer",
                            opacity: isRejected ? 0.7 : 1,
                            transition: "all 0.2s"
                          }}
                        >
                          <XCircle size={14} /> {isRejected ? "Ditolak" : "Tolak / Revisi"}
                        </button>

                        {/* Tombol Hapus */}
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.nama)}
                          title="Hapus data LKB"
                          style={{
                            padding: "0.45rem",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border-light)",
                            background: "#ffffff",
                            color: "#9ca3af",
                            cursor: "pointer"
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal Popup Penolakan LKB */}
      <AnimatePresence>
        {rejectModalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.55)",
              backdropFilter: "blur(4px)",
              zIndex: 99999,
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
                background: "#ffffff",
                borderRadius: "var(--radius-2xl)",
                maxWidth: "480px",
                width: "100%",
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "#ffe4e6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <XCircle size={24} color="#e11d48" />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                    Tolak & Minta Revisi LKB
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Guru: <strong>{rejectModalItem.nama}</strong> ({rejectModalItem.bulan} {rejectModalItem.tahun})
                  </p>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    marginBottom: "0.4rem"
                  }}
                >
                  Catatan Alasan Penolakan / Yang Perlu Diperbaiki <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Contoh: Lampiran jurnal mengajar minggu ke-3 belum lengkap, atau tanda tangan kepala program keahlian belum ada..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="neon-input"
                  style={{ resize: "vertical", fontSize: "0.85rem" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginTop: "0.3rem" }}>
                  Catatan ini akan langsung terbaca oleh guru bersangkutan agar dapat mengunggah revisi dokumen.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={closeRejectModal}
                  style={{
                    padding: "0.55rem 1.15rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    background: "#ffffff",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleRejectConfirm}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: "#e11d48",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)"
                  }}
                >
                  {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={15} />}
                  Kirim Penolakan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

