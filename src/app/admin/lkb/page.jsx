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
import { LOGO_KEMENAG, LOGO_SEKOLAH } from "@/lib/logos";
import { getTodayDateStr } from "@/lib/mockData";
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
  Inbox,
  Printer,
  GraduationCap,
  Briefcase
} from "lucide-react";

const MONTH_NAMES = [
  "Semua",
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = ["Semua", String(CURRENT_YEAR - 1), String(CURRENT_YEAR), String(CURRENT_YEAR + 1)];

function formatTanggalIndonesia(dateStr) {
  if (!dateStr) return "-";
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return "-";
    const d = dateStr.getDate();
    const m = dateStr.getMonth();
    const y = dateStr.getFullYear();
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${d} ${bulan[m]} ${y}`;
  }
  const s = String(dateStr).trim();
  if (!s || s === "null" || s === "undefined") return "-";
  const mYmd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (mYmd) {
    const y = mYmd[1];
    const m = parseInt(mYmd[2], 10) - 1;
    const d = parseInt(mYmd[3], 10);
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${d} ${bulan[m] || mYmd[2]} ${y}`;
  }
  return s;
}

// --- Komponen Dokumen Cetak Format Resmi LKB Sekolah ---
function OfficialLkbDocument({ data = [], settings = {}, currentUser = null, filterBulan, filterTahun, roleFilter = "Semua" }) {
  const safeData = Array.isArray(data) ? data : [];
  const safeSettings = settings || {};
  const todayStr = formatTanggalIndonesia(getTodayDateStr());

  const roleLabel = roleFilter === "pegawai"
    ? "PEGAWAI / TATA USAHA"
    : roleFilter === "guru"
    ? "GURU / PENDIDIK"
    : "GURU & PEGAWAI";

  const periodeLabel = `Periode: Bulan ${filterBulan} Tahun ${filterTahun}`;

  const namaOperator = safeSettings.operator_nama || safeSettings.nama_operator || currentUser?.nama || "___________________________";
  const nipOperator = safeSettings.operator_nip || safeSettings.nip_operator || currentUser?.nip || "___________________________";

  const totalDisetujui = safeData.filter(d => d.status === "Disetujui").length;
  const totalMenunggu = safeData.filter(d => d.status === "Menunggu Verifikasi" || d.status === "Menunggu").length;
  const totalDitolak = safeData.filter(d => d.status === "Ditolak").length;

  return (
    <div className="official-school-document" style={{
      width: "100%",
      background: "#ffffff",
      color: "#000000",
      fontFamily: "'Times New Roman', Times, Georgia, serif",
      fontSize: "9.5pt",
      lineHeight: 1.35
    }}>
      {/* ===== KOP SURAT RESMI ===== */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        paddingBottom: "0.5rem"
      }}>
        <div style={{ width: "82px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <img src={LOGO_KEMENAG} alt="Logo Kementerian Agama" style={{ width: "72px", height: "auto", maxHeight: "82px", objectFit: "contain", display: "block" }} />
        </div>

        <div style={{ textAlign: "center", flex: 1, padding: "0 0.5rem" }}>
          <div style={{ fontSize: "10.5pt", fontWeight: 700, color: "#000", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.25 }}>
            KEMENTERIAN AGAMA REPUBLIK INDONESIA
          </div>
          <div style={{ fontSize: "10pt", fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "0.03em", marginTop: "2px", lineHeight: 1.25 }}>
            KANTOR KEMENTERIAN AGAMA {safeSettings.kota ? safeSettings.kota.toUpperCase() : "KABUPATEN GOWA"}
          </div>
          <div style={{ fontSize: "14pt", fontWeight: 900, color: "#000", letterSpacing: "0.02em", margin: "3px 0", lineHeight: 1.2, textTransform: "uppercase" }}>
            {safeSettings.nama_sekolah || "MADRASAH TSANAWIYAH NEGERI GOWA"}
          </div>
          <div style={{ fontSize: "8.5pt", color: "#222", fontStyle: "italic", marginTop: "2px", lineHeight: 1.3 }}>
            <span>{safeSettings.alamat_sekolah || "Jl. Pendidikan Nasional, Kabupaten Gowa, Sulawesi Selatan"}</span>
            <span style={{ margin: "0 6px", fontStyle: "normal" }}>•</span>
            <span>Telp: {safeSettings.no_telp || safeSettings.telepon || safeSettings.telepon_sekolah || "(0411) 861234"}</span>
          </div>
        </div>

        <div style={{ width: "82px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <img src={LOGO_SEKOLAH} alt="Logo Sekolah" style={{ width: "72px", height: "auto", maxHeight: "82px", objectFit: "contain", display: "block" }} />
        </div>
      </div>

      <div style={{ borderBottom: "3px solid #000", width: "100%", margin: "4px 0 2px 0" }} />
      <div style={{ borderBottom: "1px solid #000", width: "100%", margin: "0 0 14px 0" }} />

      {/* ===== JUDUL LAPORAN ===== */}
      <div style={{ textAlign: "center", marginBottom: "14px" }}>
        <div style={{ fontSize: "11.5pt", fontWeight: 900, textDecoration: "underline", letterSpacing: "0.04em", color: "#000", textTransform: "uppercase" }}>
          REKAPITULASI DOKUMEN LEMBAR KINERJA BULANAN (LKB) {roleLabel}
        </div>
        <div style={{ fontSize: "9.5pt", fontWeight: 600, color: "#222", marginTop: "3px" }}>
          {periodeLabel}
        </div>
      </div>

      {/* ===== RINGKASAN LKB ===== */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "12px", fontSize: "8.5pt" }}>
        <div style={{ border: "1px solid #999", padding: "4px 10px", borderRadius: "4px" }}>
          <strong>Total Dokumen:</strong> {safeData.length}
        </div>
        <div style={{ border: "1px solid #059669", background: "#f0fdf4", color: "#065f46", padding: "4px 10px", borderRadius: "4px" }}>
          <strong>Disetujui:</strong> {totalDisetujui}
        </div>
        <div style={{ border: "1px solid #d97706", background: "#fffbeb", color: "#b45309", padding: "4px 10px", borderRadius: "4px" }}>
          <strong>Menunggu:</strong> {totalMenunggu}
        </div>
        <div style={{ border: "1px solid #e11d48", background: "#fff1f2", color: "#be123c", padding: "4px 10px", borderRadius: "4px" }}>
          <strong>Ditolak:</strong> {totalDitolak}
        </div>
      </div>

      {/* ===== TABEL REKAP ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5pt", border: "1.5px solid #000" }}>
        <thead>
          <tr style={{ background: "#4338ca", color: "#ffffff" }}>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "30px", color: "#ffffff" }}>No</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "85px", color: "#ffffff" }}>Periode</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", color: "#ffffff" }}>Nama</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "115px", color: "#ffffff" }}>NIP</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", color: "#ffffff" }}>Peran & Jabatan</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", color: "#ffffff" }}>Judul Dokumen</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "85px", color: "#ffffff" }}>Status</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "95px", color: "#ffffff" }}>Tgl Verifikasi</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", color: "#ffffff" }}>Catatan / Revisi</th>
          </tr>
        </thead>
        <tbody>
          {safeData.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: "center", padding: "1.5rem", color: "#666", fontStyle: "italic", border: "1px solid #333" }}>
                Tidak ada dokumen LKB untuk periode ini
              </td>
            </tr>
          ) : safeData.map((row, idx) => (
            <tr key={row.id || idx} style={{
              background: idx % 2 === 0 ? "#ffffff" : "#fbfbff",
              pageBreakInside: "avoid"
            }}>
              <td style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "center" }}>{idx + 1}</td>
              <td style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "center", whiteSpace: "nowrap" }}>
                {row.bulan} {row.tahun}
              </td>
              <td style={{ border: "1px solid #333", padding: "5px 6px", fontWeight: 700 }}>{row.nama || "-"}</td>
              <td style={{ border: "1px solid #333", padding: "5px 6px", fontSize: "8.5pt" }}>{row.nip || "-"}</td>
              <td style={{ border: "1px solid #333", padding: "5px 6px" }}>{row.mapel_jabatan || "-"}</td>
              <td style={{ border: "1px solid #333", padding: "5px 6px" }}>{row.judul || row.file_name || "-"}</td>
              <td style={{
                border: "1px solid #333", padding: "5px 6px", textAlign: "center", fontWeight: 700,
                color: row.status === "Disetujui" ? "#065f46" : row.status === "Ditolak" ? "#be123c" : "#b45309"
              }}>
                {row.status || "-"}
              </td>
              <td style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "center", fontSize: "8pt" }}>
                {row.diverifikasi_pada ? String(row.diverifikasi_pada).slice(0, 16) : "-"}
              </td>
              <td style={{ border: "1px solid #333", padding: "5px 6px", fontSize: "8pt", color: "#333" }}>
                {row.alasan_penolakan || row.catatan || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== FOOTER TANDA TANGAN ===== */}
      <div className="print-signature-area" style={{
        marginTop: "32px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "2.5rem",
        pageBreakInside: "avoid"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "8.5pt", color: "#333", marginBottom: "2px" }}>Mengetahui,</div>
          <div style={{ fontSize: "9pt", fontWeight: 700, color: "#000" }}>Kepala {safeSettings.nama_sekolah || "MTsN GOWA"}</div>
          <div style={{ height: "65px", margin: "8px auto", borderBottom: "1px solid #000", width: "70%" }} />
          <div style={{ fontSize: "9.5pt", fontWeight: 800, color: "#000" }}>{safeSettings.kepala_sekolah || "___________________________"}</div>
          <div style={{ fontSize: "8pt", color: "#333" }}>NIP. {safeSettings.nip_kepsek || "___________________________"}</div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "8.5pt", color: "#333", marginBottom: "2px" }}>{safeSettings.kota || "Kabupaten Gowa"}, {todayStr}</div>
          <div style={{ fontSize: "9pt", fontWeight: 700, color: "#000" }}>Kepala Tata Usaha / Verifikator</div>
          <div style={{ height: "65px", margin: "8px auto", borderBottom: "1px solid #000", width: "70%" }} />
          <div style={{ fontSize: "9.5pt", fontWeight: 800, color: "#000" }}>{namaOperator}</div>
          <div style={{ fontSize: "8pt", color: "#333" }}>NIP. {nipOperator}</div>
        </div>
      </div>
    </div>
  );
}

// --- Print Preview Modal untuk LKB ---
function LkbPrintPreviewModal({ data = [], settings = {}, currentUser, filterBulan, filterTahun, roleFilter, orientation, setOrientation, onClose }) {
  const safeData = Array.isArray(data) ? data : [];
  const handlePrint = () => {
    window.print();
  };

  const handleOpenNewTab = () => {
    const printEl = document.getElementById("native-lkb-print");
    if (!printEl) return;
    const newWin = window.open("", "_blank");
    if (!newWin) {
      alert("Izinkan pop-up untuk membuka dokumen cetak di tab baru.");
      return;
    }
    const pageMargin = orientation === "landscape" ? "12mm 15mm 12mm 15mm" : "15mm 12mm 15mm 12mm";
    newWin.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Rekap Dokumen LKB - ${settings.nama_sekolah || "Sekolah"}</title>
        <style>
          @page { size: A4 ${orientation}; margin: ${pageMargin}; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
          body { font-family: 'Times New Roman', Times, Georgia, serif; margin: 0; padding: 1.5cm; color: #000; background: #fff; }
          * { font-family: 'Times New Roman', Times, Georgia, serif !important; }
          table { width: 100%; border-collapse: collapse; page-break-inside: auto; break-inside: auto; }
          tr { page-break-inside: avoid; break-inside: avoid; page-break-after: auto; break-after: auto; }
          thead { display: table-header-group; }
          .print-signature-area { page-break-inside: avoid; break-inside: avoid; }
          @media print { body { padding: 0 !important; } }
        </style>
      </head>
      <body>
        ${printEl.innerHTML}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    newWin.document.close();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <motion.div
        className="modal-print-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}
      />

      <motion.div
        className="modal-print-container"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        style={{
          position: "relative", width: "100%",
          maxWidth: orientation === "landscape" ? "1100px" : "860px",
          maxHeight: "92vh", display: "flex", flexDirection: "column",
          background: "#ffffff", borderRadius: "16px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)", overflow: "hidden",
          transition: "max-width 0.25s ease"
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.5rem", borderBottom: "1px solid #e2e8f0",
          background: "linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)",
          flexWrap: "wrap", gap: "0.75rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <FileSpreadsheet size={22} color="#4f46e5" />
            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "#3730a3" }}>Preview Cetak Dokumen LKB</div>
              <div style={{ fontSize: "0.78rem", color: "#6366f1" }}>Bulan {filterBulan} {filterTahun} • {safeData.length} data</div>
            </div>
          </div>

          <div style={{ display: "flex", background: "#ffffff", padding: "3px", borderRadius: "10px", border: "1.5px solid #c7d2fe" }}>
            <button
              type="button"
              onClick={() => setOrientation("landscape")}
              style={{
                padding: "0.35rem 0.8rem", borderRadius: "7px", border: "none", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                background: orientation === "landscape" ? "#4f46e5" : "transparent",
                color: orientation === "landscape" ? "#ffffff" : "#475569"
              }}
            >
              📄 Landscape (Mendatar)
            </button>
            <button
              type="button"
              onClick={() => setOrientation("portrait")}
              style={{
                padding: "0.35rem 0.8rem", borderRadius: "7px", border: "none", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                background: orientation === "portrait" ? "#4f46e5" : "transparent",
                color: orientation === "portrait" ? "#ffffff" : "#475569"
              }}
            >
              📋 Portrait (Tegak)
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleOpenNewTab}
              style={{
                display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.55rem 0.9rem",
                background: "#ffffff", color: "#4f46e5", border: "1.5px solid #c7d2fe", borderRadius: "10px",
                fontWeight: 700, fontSize: "0.82rem", cursor: "pointer"
              }}
            >
              <ExternalLink size={15} /> Tab Baru
            </button>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.1rem",
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                color: "#fff", border: "none", borderRadius: "10px",
                fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                boxShadow: "0 4px 12px rgba(79,70,229,0.3)"
              }}
            >
              <Printer size={16} /> Cetak Sekarang
            </button>
            <button type="button" onClick={onClose}
              style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={18} color="#64748b" />
            </button>
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: "1.75rem", flex: 1, background: "#f8fafc" }}>
          <div style={{
            background: "#ffffff", padding: "2rem 2.25rem", borderRadius: "8px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            maxWidth: orientation === "landscape" ? "1020px" : "800px", margin: "0 auto"
          }}>
            <OfficialLkbDocument
              data={safeData}
              settings={settings}
              currentUser={currentUser}
              filterBulan={filterBulan}
              filterTahun={filterTahun}
              roleFilter={roleFilter}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ====== MAIN PAGE ======
export default function AdminLkbPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [lkbList, setLkbList] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Tab Utama: "persetujuan" | "rekap"
  const [activeTab, setActiveTab] = useState("persetujuan");

  // Sub-filter Kategori Peran: "Semua" | "guru" | "pegawai"
  const [roleFilter, setRoleFilter] = useState("Semua");

  // Filters
  const [filterStatus, setFilterStatus] = useState("Menunggu Verifikasi"); // Default to pending for persetujuan
  const [filterBulan, setFilterBulan] = useState("Semua");
  const [filterTahun, setFilterTahun] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrientation, setPrintOrientation] = useState("landscape");

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
    fetchData();
  }, [router]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await Api.request("GET", "getLkb", {});
      if (res && res.lkb) setLkbList(res.lkb);

      const tRes = await Api.request("GET", "getUsers");
      if (tRes && tRes.users) setTeachers(tRes.users.filter(u => u.role !== "admin"));

      const sRes = await Api.request("GET", "getSettings");
      if (sRes && sRes.settings) setSettings(sRes.settings);
    } catch (err) {
      console.error("Gagal mengambil data LKB:", err);
      showToast("error", "Gagal memuat data LKB dari server.");
    } finally {
      setLoading(false);
    }
  };

  // Map users untuk mendeteksi role guru vs pegawai
  const userRoleMap = useMemo(() => {
    const m = {};
    (teachers || []).forEach(u => {
      if (u && u.id) m[String(u.id)] = u;
    });
    return m;
  }, [teachers]);

  const getItemRole = (item) => {
    if (!item) return "guru";
    if (item.role) return item.role;
    const u = userRoleMap[String(item.user_id)];
    if (u && u.role) return u.role;
    const mj = String(item.mapel_jabatan || "").toLowerCase();
    if (mj.includes("tata usaha") || mj.includes("pegawai") || mj.includes("administrasi") || mj.includes("staf")) {
      return "pegawai";
    }
    return "guru";
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
        fetchData();
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
      alert("Harap masukkan alasan penolakan atau catatan revisi agar pengguna tahu apa yang harus diperbaiki.");
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
        fetchData();
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
        fetchData();
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

    const roleTitle = roleFilter === "pegawai"
      ? "PEGAWAI / TATA USAHA"
      : roleFilter === "guru"
      ? "GURU / PENDIDIK"
      : "GURU & PEGAWAI";

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
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.created_at ? String(item.created_at).slice(0, 16) : "-"}</td>
          <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${item.diverifikasi_oleh || "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.diverifikasi_pada ? String(item.diverifikasi_pada).slice(0, 16) : "-"}</td>
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
                <x:Name>Rekap LKB ${roleTitle}</x:Name>
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
              REKAPITULASI DOKUMEN LEMBAR KINERJA BULANAN (LKB) ${roleTitle}
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
              <th class="th-header" style="width: 230px;">NAMA</th>
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
    link.download = `Rekap_LKB_${roleFilter}_${filterBulan}_${filterTahun}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return lkbList.filter((item) => {
      // Filter Kategori Peran (Guru vs Pegawai)
      if (roleFilter !== "Semua") {
        const itemRole = getItemRole(item);
        if (itemRole !== roleFilter) return false;
      }

      // Filter status
      if (filterStatus !== "Semua" && item.status !== filterStatus) return false;

      // Filter bulan
      if (filterBulan !== "Semua" && (item.bulan || "").toLowerCase() !== filterBulan.toLowerCase()) return false;

      // Filter tahun
      if (filterTahun !== "Semua" && String(item.tahun) !== String(filterTahun)) return false;

      // Search query (nama, nip, judul, mapel_jabatan)
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
  }, [lkbList, roleFilter, filterStatus, filterBulan, filterTahun, searchQuery, userRoleMap]);

  // Statistics global & filtered
  const stats = useMemo(() => {
    const list = roleFilter === "Semua" ? lkbList : lkbList.filter(l => getItemRole(l) === roleFilter);
    const total = list.length;
    const pending = list.filter((l) => l.status === "Menunggu Verifikasi" || l.status === "Menunggu").length;
    const approved = list.filter((l) => l.status === "Disetujui").length;
    const rejected = list.filter((l) => l.status === "Ditolak").length;
    return { total, pending, approved, rejected };
  }, [lkbList, roleFilter, userRoleMap]);

  if (!currentUser) return null;

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 ${printOrientation};
            margin: ${printOrientation === "landscape" ? "12mm 15mm 12mm 15mm" : "15mm 12mm 15mm 12mm"};
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
          }
          nav,
          .admin-sidebar,
          .edu-background,
          .no-print,
          button,
          .modal-print-backdrop,
          .modal-print-container {
            display: none !important;
          }
          #native-lkb-print {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
            visibility: visible !important;
          }
          #native-lkb-print * {
            visibility: visible !important;
          }
          #native-lkb-print table {
            page-break-inside: auto !important;
            break-inside: auto !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          #native-lkb-print tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
            break-after: auto !important;
          }
          #native-lkb-print thead {
            display: table-header-group !important;
          }
          #native-lkb-print .print-signature-area {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
        @media screen {
          #native-lkb-print {
            display: none !important;
          }
        }
      `}</style>

      <Navbar role="admin" />
      <div className="no-print" style={{ display: "flex", flex: 1 }}>
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
              marginBottom: "1.25rem"
            }}
          >
            <div>
              <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--text-main)" }}>
                Lembar Kinerja Bulanan (LKB)
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Pemisahan modul persetujuan/verifikasi berkas dan modul rekapitulasi laporan dokumen
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              {activeTab === "rekap" && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(true)}
                    style={{
                      padding: "0.55rem 1.1rem",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                      transition: "all 0.2s"
                    }}
                  >
                    <Printer size={16} />
                    Cetak Format Resmi
                  </button>

                  <button
                    type="button"
                    onClick={exportLkbExcel}
                    style={{
                      padding: "0.55rem 1.1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1.5px solid #10b981",
                      background: "#ffffff",
                      color: "#059669",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)",
                      transition: "all 0.2s"
                    }}
                  >
                    <FileSpreadsheet size={16} color="#059669" />
                    Ekspor Excel (.xls)
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={fetchData}
                style={{
                  padding: "0.55rem 1rem",
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
                Segarkan
              </button>
            </div>
          </div>

          {/* TAB UTAMA: PERSETUJUAN VS REKAPITULASI */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap"
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab("persetujuan");
                setFilterStatus("Menunggu Verifikasi");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.75rem 1.4rem",
                borderRadius: "14px",
                border: activeTab === "persetujuan" ? "2px solid #7c3aed" : "1.5px solid var(--border-light)",
                background: activeTab === "persetujuan" ? "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)" : "#ffffff",
                color: activeTab === "persetujuan" ? "#6d28d9" : "var(--text-secondary)",
                fontWeight: 800,
                fontSize: "0.92rem",
                cursor: "pointer",
                boxShadow: activeTab === "persetujuan" ? "0 4px 14px rgba(124, 58, 237, 0.2)" : "var(--shadow-sm)",
                transition: "all 0.2s ease"
              }}
            >
              <FileCheck size={19} color={activeTab === "persetujuan" ? "#7c3aed" : "#64748b"} />
              <span>Persetujuan Dokumen LKB</span>
              <span style={{
                fontSize: "0.74rem",
                background: activeTab === "persetujuan" ? "#7c3aed" : (stats.pending > 0 ? "#f59e0b" : "#f1f5f9"),
                color: activeTab === "persetujuan" || stats.pending > 0 ? "#ffffff" : "#64748b",
                padding: "0.15rem 0.55rem",
                borderRadius: "999px",
                fontWeight: 800
              }}>
                {stats.pending} Menunggu
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("rekap");
                setFilterStatus("Semua");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.75rem 1.4rem",
                borderRadius: "14px",
                border: activeTab === "rekap" ? "2px solid #059669" : "1.5px solid var(--border-light)",
                background: activeTab === "rekap" ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" : "#ffffff",
                color: activeTab === "rekap" ? "#065f46" : "var(--text-secondary)",
                fontWeight: 800,
                fontSize: "0.92rem",
                cursor: "pointer",
                boxShadow: activeTab === "rekap" ? "0 4px 14px rgba(5, 150, 105, 0.2)" : "var(--shadow-sm)",
                transition: "all 0.2s ease"
              }}
            >
              <FileSpreadsheet size={19} color={activeTab === "rekap" ? "#059669" : "#64748b"} />
              <span>Rekapitulasi & Arsip LKB</span>
              <span style={{
                fontSize: "0.74rem",
                background: activeTab === "rekap" ? "#059669" : "#f1f5f9",
                color: activeTab === "rekap" ? "#ffffff" : "#64748b",
                padding: "0.15rem 0.55rem",
                borderRadius: "999px",
                fontWeight: 800
              }}>
                {stats.total} Dokumen
              </span>
            </button>
          </div>

          {/* Sub-Filter Kategori Peran: SEMUA PERAN vs GURU vs PEGAWAI */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              marginBottom: "1.25rem",
              flexWrap: "wrap"
            }}
          >
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
              Kategori Pengirim:
            </span>

            {[
              { id: "Semua", label: "Semua Peran", icon: Inbox, color: "#6366f1" },
              { id: "guru", label: "Khusus Guru", icon: GraduationCap, color: "#7c3aed" },
              { id: "pegawai", label: "Khusus Pegawai", icon: Briefcase, color: "#0284c7" }
            ].map(r => {
              const active = roleFilter === r.id;
              const IconComp = r.icon;
              const count = r.id === "Semua"
                ? lkbList.length
                : lkbList.filter(l => getItemRole(l) === r.id).length;

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoleFilter(r.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.45rem 0.95rem",
                    borderRadius: "999px",
                    border: `1.5px solid ${active ? r.color : "var(--border-light)"}`,
                    background: active ? r.color : "#ffffff",
                    color: active ? "#ffffff" : "var(--text-secondary)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: active ? `0 2px 8px ${r.color}35` : "none"
                  }}
                >
                  <IconComp size={15} color={active ? "#ffffff" : r.color} />
                  <span>{r.label}</span>
                  <span style={{
                    fontSize: "0.72rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "999px",
                    background: active ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                    color: active ? "#ffffff" : "#64748b"
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
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

          {/* Statistik Ringkasan Cards (Khusus Rekapitulasi) */}
          {activeTab === "rekap" && (
            <div className="admin-metrics-grid" style={{ gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)", border: "1.5px solid #c7d2fe" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase" }}>Total Dokumen</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginTop: "0.2rem" }}>{stats.total}</div>
                  </div>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Inbox size={22} color="#4f46e5" />
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)", border: "1.5px solid #fde68a" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#d97706", textTransform: "uppercase" }}>Menunggu Review</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#b45309", marginTop: "0.2rem" }}>{stats.pending}</div>
                  </div>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Clock size={22} color="#d97706" />
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)", border: "1.5px solid #a7f3d0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>Telah Disetujui</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#047857", marginTop: "0.2rem" }}>{stats.approved}</div>
                  </div>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={22} color="#059669" />
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)", border: "1.5px solid #fecdd3" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e11d48", textTransform: "uppercase" }}>Ditolak / Revisi</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#be123c", marginTop: "0.2rem" }}>{stats.rejected}</div>
                  </div>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ffe4e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <XCircle size={22} color="#e11d48" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar & Search */}
          <div
            className="glass-panel"
            style={{
              padding: "1.15rem",
              borderRadius: "var(--radius-lg)",
              background: "#ffffff",
              marginBottom: "1.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.85rem",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            {/* Search Input */}
            <div style={{ flex: "1 1 260px", position: "relative" }}>
              <Search size={17} color="#9ca3af" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder={`Cari nama ${roleFilter === 'pegawai' ? 'pegawai' : roleFilter === 'guru' ? 'guru' : 'guru / pegawai'}, NIP, atau judul LKB...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neon-input"
                style={{ paddingLeft: "2.35rem", fontSize: "0.88rem" }}
              />
            </div>

            {/* Dropdown Filters */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="neon-input"
                style={{ width: "auto", fontSize: "0.82rem", padding: "0.5rem 0.8rem", cursor: "pointer" }}
              >
                <option value="Semua">Semua Bulan</option>
                {MONTH_NAMES.filter((m) => m !== "Semua").map((m) => (
                  <option key={m} value={m}>Bulan {m}</option>
                ))}
              </select>

              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="neon-input"
                style={{ width: "auto", fontSize: "0.82rem", padding: "0.5rem 0.8rem", cursor: "pointer" }}
              >
                <option value="Semua">Semua Tahun</option>
                {YEAR_OPTIONS.filter((y) => y !== "Semua").map((y) => (
                  <option key={y} value={y}>Tahun {y}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => { setFilterBulan("Semua"); setFilterTahun("Semua"); setSearchQuery(""); }}
                style={{
                  padding: "0.5rem 0.85rem",
                  fontSize: "0.82rem",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  cursor: "pointer",
                  color: "#6b7280",
                  fontWeight: 600
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Filter Status Pills */}
          <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
            {[
              { label: "Menunggu Verifikasi", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
              { label: "Semua", color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
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

          {/* KONTEN BERDASARKAN TAB AKTIF */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 0.75rem" }} />
              Memuat data dokumen LKB...
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
                Tidak ada dokumen pengajuan yang sesuai dengan kriteria filter ({roleFilter === 'pegawai' ? 'Pegawai' : roleFilter === 'guru' ? 'Guru' : 'Semua Peran'}).
              </p>
            </div>
          ) : activeTab === "persetujuan" ? (
            /* TAB 1: KARTU PERSETUJUAN & AKSI CEPAT */
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredList.map((item, idx) => {
                const isApproved = item.status === "Disetujui";
                const isRejected = item.status === "Ditolak";
                const isPending = !isApproved && !isRejected;
                const isItemPegawai = getItemRole(item) === "pegawai";

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
                    {/* Sisi Kiri: Profil & Dokumen */}
                    <div style={{ flex: "1 1 360px", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
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

                          {/* Role Badge */}
                          <span
                            style={{
                              background: isItemPegawai ? "#e0f2fe" : "#f3e8ff",
                              color: isItemPegawai ? "#0369a1" : "#7c3aed",
                              border: `1px solid ${isItemPegawai ? "#bae6fd" : "#ddd6fe"}`,
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              padding: "0.15rem 0.55rem",
                              borderRadius: "999px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem"
                            }}
                          >
                            {isItemPegawai ? <Briefcase size={12} /> : <GraduationCap size={12} />}
                            {isItemPegawai ? "Pegawai" : "Guru"}
                          </span>

                          <span
                            style={{
                              background: "#f1f5f9",
                              color: "#475569",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "var(--radius-full)"
                            }}
                          >
                            Periode {item.bulan} {item.tahun}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                          NIP: {item.nip || "-"} • {item.mapel_jabatan || (isItemPegawai ? "Staf Tata Usaha" : "Tenaga Pendidik")}
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
                                borderLeft: `3px solid ${isItemPegawai ? "#0284c7" : "#8b5cf6"}`
                              }}
                            >
                              Catatan Pengaju: "{item.catatan}"
                            </div>
                          )}
                        </div>

                        {/* File preview badge & waktu upload */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
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
                          <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.85rem", background: "#fff1f2", borderRadius: "var(--radius-md)", border: "1px solid #fecdd3", fontSize: "0.82rem" }}>
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
                        {isApproved && <CheckCircle2 size={14} />}
                        {isRejected && <XCircle size={14} />}
                        {isPending && <Clock size={14} />}
                        {item.status || "Menunggu Verifikasi"}
                      </span>

                      {/* Tombol Aksi */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        {item.file_url && (
                          <button
                            type="button"
                            onClick={() => window.open(formatDriveUrl(item.file_url), "_blank")}
                            style={{
                              padding: "0.45rem 0.85rem",
                              borderRadius: "var(--radius-md)",
                              border: "1px solid var(--border-light)",
                              background: "#ffffff",
                              color: "var(--text-main)",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              cursor: "pointer",
                              boxShadow: "var(--shadow-sm)"
                            }}
                          >
                            <ExternalLink size={14} /> Lihat File
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={actionLoading || isApproved}
                          onClick={() => handleApprove(item)}
                          style={{
                            padding: "0.45rem 0.85rem",
                            borderRadius: "var(--radius-md)",
                            border: "none",
                            background: isApproved ? "#dcfce7" : "#059669",
                            color: isApproved ? "#065f46" : "#ffffff",
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
                          <CheckCircle2 size={14} /> {isApproved ? "Disetujui" : "Setujui LKB"}
                        </button>

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
          ) : (
            /* TAB 2: TABEL REKAPITULASI & ARSIP LENGKAP */
            <div className="glass-panel" style={{ padding: "0", overflow: "hidden", border: "1.5px solid #c7d2fe" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)", borderBottom: "1.5px solid #c7d2fe" }}>
                      <th style={{ padding: "1rem 1.15rem", color: "#4338ca", fontWeight: 800 }}>Periode</th>
                      <th style={{ padding: "1rem 1.15rem", color: "#4338ca", fontWeight: 800 }}>Nama & NIP</th>
                      <th style={{ padding: "1rem 1.15rem", color: "#4338ca", fontWeight: 800 }}>Peran & Jabatan</th>
                      <th style={{ padding: "1rem 1.15rem", color: "#4338ca", fontWeight: 800 }}>Judul Dokumen</th>
                      <th style={{ padding: "1rem 1.15rem", color: "#4338ca", fontWeight: 800 }}>Status</th>
                      <th style={{ padding: "1rem 1.15rem", color: "#4338ca", fontWeight: 800 }}>Verifikator</th>
                      <th style={{ padding: "1rem 1.15rem", color: "#4338ca", fontWeight: 800 }}>Catatan</th>
                      <th style={{ padding: "1rem 1.15rem", color: "#4338ca", fontWeight: 800, textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((item, idx) => {
                      const isItemPegawai = getItemRole(item) === "pegawai";
                      const isApproved = item.status === "Disetujui";
                      const isRejected = item.status === "Ditolak";

                      return (
                        <tr key={item.id || idx} style={{
                          borderBottom: "1px solid var(--border-light)",
                          background: idx % 2 === 0 ? "#ffffff" : "#fdfdff"
                        }}>
                          <td style={{ padding: "1rem 1.15rem", whiteSpace: "nowrap", fontWeight: 700 }}>
                            {item.bulan} {item.tahun}
                          </td>
                          <td style={{ padding: "1rem 1.15rem" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{item.nama}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NIP: {item.nip || "-"}</div>
                          </td>
                          <td style={{ padding: "1rem 1.15rem" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: "0.3rem",
                              background: isItemPegawai ? "#e0f2fe" : "#f3e8ff",
                              color: isItemPegawai ? "#0369a1" : "#7c3aed",
                              padding: "0.15rem 0.5rem", borderRadius: "999px",
                              fontSize: "0.72rem", fontWeight: 800, marginBottom: "0.2rem"
                            }}>
                              {isItemPegawai ? <Briefcase size={12} /> : <GraduationCap size={12} />}
                              {isItemPegawai ? "Pegawai" : "Guru"}
                            </span>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                              {item.mapel_jabatan || (isItemPegawai ? "Tata Usaha" : "Pendidik")}
                            </div>
                          </td>
                          <td style={{ padding: "1rem 1.15rem" }}>
                            <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{item.judul || "-"}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {item.file_name} {item.file_size && item.file_size !== "-" ? `(${item.file_size})` : ""}
                            </div>
                          </td>
                          <td style={{ padding: "1rem 1.15rem" }}>
                            <span style={{
                              background: isApproved ? "#ecfdf5" : isRejected ? "#fff1f2" : "#fffbeb",
                              border: `1px solid ${isApproved ? "#a7f3d0" : isRejected ? "#fecdd3" : "#fde68a"}`,
                              color: isApproved ? "#059669" : isRejected ? "#e11d48" : "#d97706",
                              padding: "0.25rem 0.65rem", borderRadius: "999px",
                              fontSize: "0.76rem", fontWeight: 700, whiteSpace: "nowrap"
                            }}>
                              {item.status || "Menunggu"}
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.15rem", fontSize: "0.82rem" }}>
                            <div style={{ fontWeight: 600 }}>{item.diverifikasi_oleh || "-"}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {item.diverifikasi_pada ? String(item.diverifikasi_pada).slice(0, 16) : "-"}
                            </div>
                          </td>
                          <td style={{ padding: "1rem 1.15rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            {item.alasan_penolakan || item.catatan || "-"}
                          </td>
                          <td style={{ padding: "1rem 1.15rem", textAlign: "center" }}>
                            {item.file_url ? (
                              <button
                                type="button"
                                onClick={() => window.open(formatDriveUrl(item.file_url), "_blank")}
                                style={{
                                  padding: "0.35rem 0.7rem",
                                  borderRadius: "8px",
                                  border: "1px solid #c7d2fe",
                                  background: "#ffffff",
                                  color: "#4f46e5",
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem"
                                }}
                              >
                                <ExternalLink size={13} /> Berkas
                              </button>
                            ) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Cetak Rekap LKB */}
      <AnimatePresence>
        {showPrintModal && (
          <LkbPrintPreviewModal
            data={filteredList}
            settings={settings}
            currentUser={currentUser}
            filterBulan={filterBulan}
            filterTahun={filterTahun}
            roleFilter={roleFilter}
            orientation={printOrientation}
            setOrientation={setPrintOrientation}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Native Browser Print Target for LKB */}
      <div id="native-lkb-print">
        <OfficialLkbDocument
          data={filteredList}
          settings={settings}
          currentUser={currentUser}
          filterBulan={filterBulan}
          filterTahun={filterTahun}
          roleFilter={roleFilter}
        />
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
                    {getItemRole(rejectModalItem) === 'pegawai' ? 'Pegawai' : 'Guru'}: <strong>{rejectModalItem.nama}</strong> ({rejectModalItem.bulan} {rejectModalItem.tahun})
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
                  placeholder="Contoh: Lampiran laporan kinerja belum lengkap, atau tanda tangan atasan langsung belum ada..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="neon-input"
                  style={{ resize: "vertical", fontSize: "0.85rem" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginTop: "0.3rem" }}>
                  Catatan ini akan langsung terbaca oleh yang bersangkutan agar dapat mengunggah revisi dokumen.
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
