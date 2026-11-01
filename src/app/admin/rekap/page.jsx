"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import { getTodayDateStr } from "@/lib/mockData";
import {
  FileSpreadsheet,
  Printer,
  Eye,
  X,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { LOGO_KEMENAG, LOGO_SEKOLAH } from "@/lib/logos";

// --- Format tanggal Indonesia ---
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
  // Deteksi format YYYY-MM-DD
  const mYmd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (mYmd) {
    const y = mYmd[1];
    const m = parseInt(mYmd[2], 10) - 1;
    const d = parseInt(mYmd[3], 10);
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${d} ${bulan[m] || mYmd[2]} ${y}`;
  }
  // Deteksi format DD-MM-YYYY
  const mDmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (mDmy) {
    const d = parseInt(mDmy[1], 10);
    const m = parseInt(mDmy[2], 10) - 1;
    const y = mDmy[3];
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${d} ${bulan[m] || mDmy[2]} ${y}`;
  }
  return s;
}

function getMonthYear(dateStr) {
  if (!dateStr) return "-";
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return "-";
    const m = dateStr.getMonth();
    const y = dateStr.getFullYear();
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${bulan[m]} ${y}`;
  }
  const s = String(dateStr).trim();
  const mYmd = s.match(/^(\d{4})[-/](\d{1,2})/);
  if (mYmd) {
    const y = mYmd[1];
    const m = parseInt(mYmd[2], 10) - 1;
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${bulan[m] || mYmd[2]} ${y}`;
  }
  return s;
}

// --- Komponen Dokumen Cetak Format Resmi Sekolah ---
function OfficialSchoolDocument({ data = [], settings = {}, currentUser = null, filterDate, filterMonth, mode }) {
  const safeData = Array.isArray(data) ? data : [];
  const safeSettings = settings || {};
  const todayStr = formatTanggalIndonesia(getTodayDateStr());
  const periodeLabel = mode === "bulanan"
    ? `Bulan: ${getMonthYear(filterMonth ? filterMonth + "-01" : "")}`
    : `Tanggal: ${formatTanggalIndonesia(filterDate)}`;

  const namaOperator = safeSettings.operator_nama || safeSettings.nama_operator || currentUser?.nama || "___________________________";
  const nipOperator = safeSettings.operator_nip || safeSettings.nip_operator || currentUser?.nip || "___________________________";

  // Hitung ringkasan
  const totalHadir = safeData.filter(r => r && r.status === "Hadir").length;
  const totalTerlambat = safeData.filter(r => r && r.status === "Terlambat").length;
  const totalIzin = safeData.filter(r => r && (r.status === "Izin" || r.status === "Sakit")).length;

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
        {/* 1. Logo Kementerian Agama (Sebelah Kiri) */}
        <div style={{
          width: "82px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          <img
            src={LOGO_KEMENAG}
            alt="Logo Kementerian Agama"
            style={{
              width: "72px",
              height: "auto",
              maxHeight: "82px",
              objectFit: "contain",
              display: "block"
            }}
          />
        </div>

        {/* 2. Info Resmi Instansi & Madrasah (Tengah) */}
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

        {/* 3. Logo Sekolah / Madrasah (Sebelah Kanan) */}
        <div style={{
          width: "82px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          <img
            src={LOGO_SEKOLAH}
            alt="Logo Sekolah"
            style={{
              width: "72px",
              height: "auto",
              maxHeight: "82px",
              objectFit: "contain",
              display: "block"
            }}
          />
        </div>
      </div>

      {/* Garis Ganda Kop Surat (Tebal atas, Tipis bawah) */}
      <div style={{ borderBottom: "3px solid #000", width: "100%", margin: "4px 0 2px 0" }} />
      <div style={{ borderBottom: "1px solid #000", width: "100%", margin: "0 0 14px 0" }} />

      {/* ===== JUDUL LAPORAN ===== */}
      <div style={{ textAlign: "center", marginBottom: "14px" }}>
        <div style={{ fontSize: "11.5pt", fontWeight: 900, textDecoration: "underline", letterSpacing: "0.04em", color: "#000", textTransform: "uppercase" }}>
          REKAPITULASI PRESENSI GURU
        </div>
        <div style={{ fontSize: "9.5pt", fontWeight: 600, color: "#222", marginTop: "3px" }}>
          {periodeLabel}
        </div>
      </div>

      {/* ===== RINGKASAN KEHADIRAN ===== */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "12px",
        fontSize: "8.5pt"
      }}>
        <div style={{ border: "1px solid #999", padding: "4px 10px", borderRadius: "4px" }}>
          <strong>Total Data:</strong> {safeData.length}
        </div>
        <div style={{ border: "1px solid #059669", background: "#f0fdf4", color: "#065f46", padding: "4px 10px", borderRadius: "4px" }}>
          <strong>Hadir:</strong> {totalHadir}
        </div>
        <div style={{ border: "1px solid #d97706", background: "#fffbeb", color: "#b45309", padding: "4px 10px", borderRadius: "4px" }}>
          <strong>Terlambat:</strong> {totalTerlambat}
        </div>
        {totalIzin > 0 && (
          <div style={{ border: "1px solid #0284c7", background: "#f0f9ff", color: "#0369a1", padding: "4px 10px", borderRadius: "4px" }}>
            <strong>Izin/Sakit:</strong> {totalIzin}
          </div>
        )}
      </div>

      {/* ===== TABEL REKAP ===== */}
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "8.5pt",
        border: "1.5px solid #000"
      }}>
        <thead>
          <tr style={{ background: "#065f46", color: "#ffffff" }}>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "32px", color: "#ffffff" }}>No</th>
            {mode === "bulanan" && (
              <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "90px", color: "#ffffff" }}>Tanggal</th>
            )}
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", color: "#ffffff" }}>Nama Guru</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "120px", color: "#ffffff" }}>NIP</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", color: "#ffffff" }}>Mata Pelajaran</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "65px", color: "#ffffff" }}>Kelas</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "75px", color: "#ffffff" }}>Jam Absen</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "80px", color: "#ffffff" }}>Status</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", color: "#ffffff" }}>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {safeData.length === 0 ? (
            <tr>
              <td colSpan={mode === "bulanan" ? 9 : 8} style={{ textAlign: "center", padding: "1.5rem", color: "#666", fontStyle: "italic", border: "1px solid #333" }}>
                Tidak ada data presensi untuk periode ini
              </td>
            </tr>
          ) : safeData.map((row, idx) => (
            <tr key={row.id || idx} style={{
              background: idx % 2 === 0 ? "#ffffff" : "#f9fbf9",
              pageBreakInside: "avoid"
            }}>
              <td style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "center" }}>{idx + 1}</td>
              {mode === "bulanan" && (
                <td style={{ border: "1px solid #333", padding: "5px 6px", whiteSpace: "nowrap" }}>
                  {formatTanggalIndonesia(row.tanggal)}
                </td>
              )}
              <td style={{ border: "1px solid #333", padding: "5px 6px", fontWeight: 700 }}>{row.nama || "-"}</td>
              <td style={{ border: "1px solid #333", padding: "5px 6px", fontSize: "8.5pt" }}>{row.nip || "-"}</td>
              <td style={{ border: "1px solid #333", padding: "5px 6px" }}>{row.mapel || "-"}</td>
              <td style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "center" }}>{row.kelas || "-"}</td>
              <td style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "center", fontSize: "8.5pt" }}>{row.jam_absen || "-"}</td>
              <td style={{
                border: "1px solid #333", padding: "5px 6px", textAlign: "center", fontWeight: 700,
                color: row.status === "Hadir" ? "#065f46" : row.status === "Terlambat" ? "#b45309" : "#b91c1c"
              }}>
                {row.status || "-"}
              </td>
              <td style={{ border: "1px solid #333", padding: "5px 6px", fontSize: "8pt", color: "#333" }}>
                {row.keterangan || "-"}
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
        {/* Kiri: Kepala Sekolah */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "8.5pt", color: "#333", marginBottom: "2px" }}>
            Mengetahui,
          </div>
          <div style={{ fontSize: "9pt", fontWeight: 700, color: "#000" }}>
            Kepala {safeSettings.nama_sekolah || "MTsN GOWA"}
          </div>
          <div style={{ height: "65px", margin: "8px auto", borderBottom: "1px solid #000", width: "70%" }} />
          <div style={{ fontSize: "9.5pt", fontWeight: 800, color: "#000" }}>
            {safeSettings.kepala_sekolah || "___________________________"}
          </div>
          <div style={{ fontSize: "8pt", color: "#333" }}>
            NIP. {safeSettings.nip_kepsek || "___________________________"}
          </div>
        </div>

        {/* Kanan: Tata Usaha / Operator */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "8.5pt", color: "#333", marginBottom: "2px" }}>
            {safeSettings.kota || "Kabupaten Gowa"}, {todayStr}
          </div>
          <div style={{ fontSize: "9pt", fontWeight: 700, color: "#000" }}>
            Operator / Tata Usaha
          </div>
          <div style={{ height: "65px", margin: "8px auto", borderBottom: "1px solid #000", width: "70%" }} />
          <div style={{ fontSize: "9.5pt", fontWeight: 800, color: "#000" }}>
            {namaOperator}
          </div>
          <div style={{ fontSize: "8pt", color: "#333" }}>
            NIP. {nipOperator}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Print Preview Modal ---
function PrintPreviewModal({ data = [], settings = {}, currentUser, filterDate, filterMonth, mode, orientation, setOrientation, onClose }) {
  const safeData = Array.isArray(data) ? data : [];
  const safeSettings = settings || {};
  const periodeLabel = mode === "bulanan"
    ? `Bulan: ${getMonthYear(filterMonth ? filterMonth + "-01" : "")}`
    : `Tanggal: ${formatTanggalIndonesia(filterDate)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleOpenNewTab = () => {
    const printEl = document.getElementById("native-school-print");
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
        <title>Rekap Presensi Guru - ${settings.nama_sekolah || "Sekolah"}</title>
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
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem"
    }}>
      {/* Backdrop */}
      <motion.div
        className="modal-print-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}
      />

      {/* Modal Container */}
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
        {/* Modal Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #e2e8f0",
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          flexWrap: "wrap", gap: "0.75rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <FileText size={22} color="#059669" />
            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "#065f46" }}>Preview Cetak Rekap</div>
              <div style={{ fontSize: "0.78rem", color: "#059669" }}>{periodeLabel} • {data.length} data</div>
            </div>
          </div>

          {/* Orientasi Switcher */}
          <div style={{
            display: "flex",
            background: "#ffffff",
            padding: "3px",
            borderRadius: "10px",
            border: "1.5px solid #a7f3d0"
          }}>
            <button
              type="button"
              onClick={() => setOrientation("landscape")}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "7px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                background: orientation === "landscape" ? "#059669" : "transparent",
                color: orientation === "landscape" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease"
              }}
            >
              📄 Landscape (Mendatar)
            </button>
            <button
              type="button"
              onClick={() => setOrientation("portrait")}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "7px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                background: orientation === "portrait" ? "#059669" : "transparent",
                color: orientation === "portrait" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease"
              }}
            >
              📋 Portrait (Tegak)
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleOpenNewTab}
              title="Buka dokumen di tab baru"
              style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                padding: "0.55rem 0.9rem",
                background: "#ffffff",
                color: "#065f46", border: "1.5px solid #a7f3d0", borderRadius: "10px",
                fontWeight: 700, fontSize: "0.82rem", cursor: "pointer"
              }}
            >
              <ExternalLink size={15} /> Tab Baru
            </button>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.55rem 1.1rem",
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                color: "#fff", border: "none", borderRadius: "10px",
                fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                boxShadow: "0 4px 12px rgba(5,150,105,0.3)"
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

        {/* Modal Scrollable Preview Area */}
        <div style={{ overflowY: "auto", padding: "1.75rem", flex: 1, background: "#f8fafc" }}>
          <div style={{
            background: "#ffffff",
            padding: "2rem 2.25rem",
            borderRadius: "8px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            maxWidth: orientation === "landscape" ? "1020px" : "800px",
            margin: "0 auto",
            transition: "max-width 0.25s ease"
          }}>
            <OfficialSchoolDocument
              data={data}
              settings={settings}
              currentUser={currentUser}
              filterDate={filterDate}
              filterMonth={filterMonth}
              mode={mode}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ====== MAIN PAGE ======
export default function AdminRekapPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [settings, setSettings] = useState({});
  const [filterDate, setFilterDate] = useState(getTodayDateStr());
  const [filterMonth, setFilterMonth] = useState(getTodayDateStr().substring(0, 7)); // YYYY-MM
  const [filterGuru, setFilterGuru] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [printMode, setPrintMode] = useState("harian"); // "harian" | "bulanan"
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printOrientation, setPrintOrientation] = useState("landscape"); // "landscape" | "portrait"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== "admin") { router.push("/"); return; }
    setCurrentUser(user);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    const aRes = await Api.request("GET", "getAttendance", {});
    if (aRes && aRes.attendance) setAttendance(aRes.attendance);
    const tRes = await Api.request("GET", "getUsers", { role: "guru" });
    if (tRes && tRes.users) setTeachers(tRes.users);
    const sRes = await Api.request("GET", "getSettings");
    if (sRes && sRes.settings) setSettings(sRes.settings);
    setLoading(false);
  };

  // Filter untuk tampilan tabel
  const filtered = (attendance || []).filter((item) => {
    if (!item) return false;
    const itemTgl = String(item.tanggal || "").trim();
    if (filterDate && itemTgl !== filterDate) return false;
    if (filterGuru !== "Semua" && item.user_id !== filterGuru) return false;
    if (filterStatus !== "Semua" && item.status !== filterStatus) return false;
    return true;
  });

  // Filter untuk cetak (harian atau bulanan)
  const printData = (attendance || []).filter((item) => {
    if (!item) return false;
    const itemTgl = String(item.tanggal || "").trim();
    if (printMode === "harian") {
      if (filterDate && itemTgl !== filterDate) return false;
    } else {
      if (filterMonth && !itemTgl.startsWith(filterMonth)) return false;
    }
    if (filterGuru !== "Semua" && item.user_id !== filterGuru) return false;
    if (filterStatus !== "Semua" && item.status !== filterStatus) return false;
    return true;
  });

  const exportExcelRapi = () => {
    const exportDataset = printData && printData.length > 0 ? printData : filtered;

    const periodeStr = printMode === "bulanan"
      ? `Bulan ${getMonthYear(filterMonth ? filterMonth + "-01" : "")}`
      : `Tanggal ${formatTanggalIndonesia(filterDate)}`;

    const totalHadir = exportDataset.filter(r => r.status === "Hadir").length;
    const totalTerlambat = exportDataset.filter(r => r.status === "Terlambat").length;
    const totalIzin = exportDataset.filter(r => r.status === "Izin").length;
    const totalSakit = exportDataset.filter(r => r.status === "Sakit").length;
    const totalSesi = exportDataset.length;
    const persentaseHadir = totalSesi > 0 ? (((totalHadir + totalTerlambat) / totalSesi) * 100).toFixed(1) : "0";

    const kota = settings.kota || "Kabupaten Gowa";
    const tglCetak = formatTanggalIndonesia(getTodayDateStr());
    const namaSekolah = settings.nama_sekolah || "MADRASAH TSANAWIYAH NEGERI GOWA";
    const alamatSekolah = settings.alamat_sekolah || "Jl. Pendidikan Nasional, Kabupaten Gowa, Sulawesi Selatan";
    const telpSekolah = settings.no_telp || settings.telepon || "(0411) 861234";
    const namaKepsek = settings.kepala_sekolah || "Drs. H. Mulyadi, M.Pd";
    const nipKepsek = settings.nip_kepsek || "196805121994031004";
    const namaAdmin = settings.operator_nama || settings.nama_operator || currentUser?.nama || "Bpk. Hendra Gunawan, S.Kom";
    const nipAdmin = settings.operator_nip || settings.nip_operator || currentUser?.nip || "198001012005011001";

    let rowsHtml = "";
    exportDataset.forEach((row, i) => {
      let statusStyle = "background-color: #dcfce7; color: #065f46; font-weight: bold; text-align: center;";
      if (row.status === "Terlambat") {
        statusStyle = "background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center;";
      } else if (row.status === "Izin") {
        statusStyle = "background-color: #eff6ff; color: #1e40af; font-weight: bold; text-align: center;";
      } else if (row.status === "Sakit") {
        statusStyle = "background-color: #fff1f2; color: #be123c; font-weight: bold; text-align: center;";
      }

      rowsHtml += `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${i + 1}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; mso-number-format: 'yyyy\\-mm\\-dd';">${row.tanggal || "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${row.hari || "-"}</td>
          <td style="text-align: left; font-weight: 600; border: 1px solid #cbd5e1; padding: 6px 8px;">${row.nama || "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; mso-number-format: '\\@';">${String(row.nip || "-").replace(/^'/, "")}</td>
          <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${row.mapel || "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${row.kelas || "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${row.jam_jadwal || "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; mso-number-format: 'hh\\:mm'; font-weight: bold;">${row.jam_absen || "-"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; ${statusStyle}">${row.status || "-"}</td>
          <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${row.keterangan || "-"}</td>
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
                <x:Name>Rekap Presensi Guru</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                  <x:FitToPage/>
                  <x:Print>
                    <x:ValidPrinterInfo/>
                    <x:PaperSizeIndex>9</x:PaperSizeIndex>
                    <x:Scale>85</x:Scale>
                  </x:Print>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; }
          table { border-collapse: collapse; width: 100%; }
          .th-header { background-color: #065f46; color: #ffffff; font-weight: bold; text-align: center; padding: 9px 6px; border: 1px solid #044e39; font-size: 10pt; }
        </style>
      </head>
      <body>
        <table>
          <!-- KOP SURAT RESMI SEKOLAH -->
          <tr>
            <td colspan="11" style="text-align: center; font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1e293b; padding-top: 8px;">
              KEMENTERIAN AGAMA REPUBLIK INDONESIA
            </td>
          </tr>
          <tr>
            <td colspan="11" style="text-align: center; font-size: 10pt; font-weight: bold; text-transform: uppercase; color: #334155;">
              KANTOR KEMENTERIAN AGAMA ${kota.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td colspan="11" style="text-align: center; font-size: 15pt; font-weight: 800; text-transform: uppercase; color: #065f46; padding: 3px 0;">
              ${namaSekolah}
            </td>
          </tr>
          <tr>
            <td colspan="11" style="text-align: center; font-size: 8.5pt; color: #64748b; font-style: italic;">
              ${alamatSekolah} • Telp: ${telpSekolah}
            </td>
          </tr>
          <tr>
            <td colspan="11" style="border-bottom: 2.5px solid #065f46; height: 6px;"></td>
          </tr>
          <tr><td colspan="11" style="height: 10px;"></td></tr>

          <!-- JUDUL LAPORAN -->
          <tr>
            <td colspan="11" style="text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #0f172a;">
              LAPORAN REKAPITULASI PRESENSI MENGAJAR GURU
            </td>
          </tr>
          <tr>
            <td colspan="11" style="text-align: center; font-size: 10pt; color: #475569; font-weight: 600;">
              Periode: ${periodeStr}
            </td>
          </tr>
          <tr>
            <td colspan="11" style="text-align: right; font-size: 8.5pt; color: #64748b; font-style: italic; padding-bottom: 6px;">
              Dicetak pada: ${tglCetak} melalui Sistem Absensi Sekolah
            </td>
          </tr>

          <!-- HEADER TABEL -->
          <thead>
            <tr>
              <th class="th-header" style="width: 45px;">NO</th>
              <th class="th-header" style="width: 105px;">TANGGAL</th>
              <th class="th-header" style="width: 80px;">HARI</th>
              <th class="th-header" style="width: 230px;">NAMA GURU</th>
              <th class="th-header" style="width: 180px;">NIP</th>
              <th class="th-header" style="width: 165px;">MATA PELAJARAN</th>
              <th class="th-header" style="width: 95px;">KELAS</th>
              <th class="th-header" style="width: 110px;">JAM JADWAL</th>
              <th class="th-header" style="width: 95px;">JAM ABSEN</th>
              <th class="th-header" style="width: 115px;">STATUS</th>
              <th class="th-header" style="width: 165px;">KETERANGAN</th>
            </tr>
          </thead>

          <!-- DATA BARIS -->
          <tbody>
            ${rowsHtml}
          </tbody>

          <!-- RINGKASAN REKAPITULASI -->
          <tr><td colspan="11" style="height: 12px;"></td></tr>
          <tr>
            <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px;">
              TOTAL SESI / PERTEMUAN:
            </td>
            <td colspan="8" style="background-color: #f8fafc; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px; color: #0f172a;">
              ${totalSesi} Sesi Pelajaran
            </td>
          </tr>
          <tr>
            <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px;">
              RINCIAN KEHADIRAN:
            </td>
            <td colspan="8" style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 7px; font-size: 9.5pt;">
              <span style="color: #065f46; font-weight: bold;">Hadir Tepat Waktu: ${totalHadir}</span> &nbsp;|&nbsp; 
              <span style="color: #92400e; font-weight: bold;">Terlambat: ${totalTerlambat}</span> &nbsp;|&nbsp; 
              <span style="color: #1e40af; font-weight: bold;">Izin: ${totalIzin}</span> &nbsp;|&nbsp; 
              <span style="color: #be123c; font-weight: bold;">Sakit: ${totalSakit}</span> &nbsp;|&nbsp; 
              <span style="color: #065f46; font-weight: bold;">Tingkat Kehadiran: ${persentaseHadir}%</span>
            </td>
          </tr>

          <!-- LEMBAR TANDA TANGAN RESMI -->
          <tr><td colspan="11" style="height: 25px;"></td></tr>
          <tr>
            <td colspan="6" style="text-align: center; font-size: 9.5pt;">
              Mengetahui,<br><strong>Kepala Madrasah / Sekolah</strong>
            </td>
            <td colspan="5" style="text-align: center; font-size: 9.5pt;">
              ${kota}, ${tglCetak}<br><strong>Kepala Tata Usaha / Verifikator</strong>
            </td>
          </tr>
          <tr><td colspan="11" style="height: 55px;"></td></tr>
          <tr>
            <td colspan="6" style="text-align: center; font-size: 10.5pt; font-weight: bold; text-decoration: underline;">
              ${namaKepsek}
            </td>
            <td colspan="5" style="text-align: center; font-size: 10.5pt; font-weight: bold; text-decoration: underline;">
              ${namaAdmin}
            </td>
          </tr>
          <tr>
            <td colspan="6" style="text-align: center; font-size: 9pt; color: #334155; mso-number-format: '\\@';">
              NIP. ${nipKepsek}
            </td>
            <td colspan="5" style="text-align: center; font-size: 9pt; color: #334155; mso-number-format: '\\@';">
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
    const cleanFileName = `Rekap_Presensi_${namaSekolah.replace(/[^a-zA-Z0-9]/g, "_")}_${printMode === "bulanan" ? filterMonth : (filterDate || "Semua")}.xls`;
    link.href = url;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status) => {
    const map = {
      Hadir: { bg: "#dcfce7", color: "#065f46", border: "#86efac" },
      Terlambat: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
      Izin: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
      Sakit: { bg: "#fef3c7", color: "#92400e", border: "#fde68a" }
    };
    const s = map[status] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
    return (
      <span style={{
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        padding: "3px 10px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700
      }}>
        {status}
      </span>
    );
  };

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
          /* Sembunyikan elemen website biasa, navbar, sidebar, modal */
          nav,
          .admin-sidebar,
          .edu-background,
          .no-print,
          button,
          .modal-print-backdrop,
          .modal-print-container {
            display: none !important;
          }
          /* Tampilkan area dokumen sekolah resmi */
          #native-school-print {
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
          #native-school-print * {
            visibility: visible !important;
          }
          #native-school-print table {
            page-break-inside: auto !important;
            break-inside: auto !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          #native-school-print tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
            break-after: auto !important;
          }
          #native-school-print thead {
            display: table-header-group !important;
          }
          #native-school-print .print-signature-area {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
        @media screen {
          #native-school-print {
            display: none !important;
          }
        }
      `}</style>

      <Navbar role="admin" />
      <div className="no-print" style={{ display: "flex", flex: 1 }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: "2rem", overflowX: "hidden" }}>

          {/* Header */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.75rem" }}>
            <div>
              <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--text-main)" }}>
                Rekapitulasi Kehadiran
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Laporan dan arsip presensi jam mengajar seluruh guru
              </p>
            </div>

            <div className="no-print" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                onClick={exportExcelRapi}
                style={{
                  display: "flex", alignItems: "center", gap: "0.45rem",
                  fontSize: "0.85rem", padding: "0.6rem 1.15rem",
                  background: "#ffffff", border: "1.5px solid #10b981",
                  color: "#059669", borderRadius: "10px", fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)",
                  transition: "all 0.2s"
                }}
              >
                <FileSpreadsheet size={17} color="#059669" /> Ekspor Excel (.xls)
              </button>
              <button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.45rem",
                  fontSize: "0.85rem", padding: "0.6rem 1.15rem",
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  border: "none", color: "#ffffff", borderRadius: "10px",
                  fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(16,185,129,0.3)"
                }}
              >
                <Printer size={16} /> Cetak Format Sekolah
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="glass-panel no-print" style={{
            padding: "1.25rem", marginBottom: "1.5rem",
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem", alignItems: "end",
            border: "1.5px solid #a7f3d0",
            background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)"
          }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                Filter Tanggal
              </label>
              <input type="date" value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="neon-input" style={{ padding: "0.55rem 0.85rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                Filter Guru
              </label>
              <select value={filterGuru} onChange={(e) => setFilterGuru(e.target.value)}
                className="neon-input" style={{ padding: "0.55rem 0.85rem", cursor: "pointer" }}>
                <option value="Semua">Semua Guru</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                Status Kehadiran
              </label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="neon-input" style={{ padding: "0.55rem 0.85rem", cursor: "pointer" }}>
                <option value="Semua">Semua Status</option>
                <option value="Hadir">Hadir Tepat Waktu</option>
                <option value="Terlambat">Terlambat</option>
              </select>
            </div>
            <div>
              <button type="button" onClick={() => { setFilterDate(""); setFilterGuru("Semua"); setFilterStatus("Semua"); }}
                style={{
                  width: "100%", padding: "0.55rem", fontSize: "0.82rem",
                  background: "#ffffff", border: "1px solid #d1d5db",
                  borderRadius: "10px", cursor: "pointer", fontWeight: 600, color: "#6b7280"
                }}>
                Reset Filter
              </button>
            </div>
          </div>

          {/* Mode Cetak Selector */}
          <div className="no-print" style={{
            display: "flex", alignItems: "center", gap: "1rem",
            marginBottom: "1rem", flexWrap: "wrap"
          }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>Mode Cetak:</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {["harian", "bulanan"].map(m => (
                <button key={m} type="button" onClick={() => setPrintMode(m)} style={{
                  padding: "0.4rem 1rem", borderRadius: "999px",
                  border: `2px solid ${printMode === m ? "#059669" : "#e2e8f0"}`,
                  background: printMode === m ? "#dcfce7" : "#ffffff",
                  color: printMode === m ? "#065f46" : "#6b7280",
                  fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", textTransform: "capitalize"
                }}>
                  {m === "harian" ? "📅 Harian" : "📆 Bulanan"}
                </button>
              ))}
            </div>
            {printMode === "bulanan" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>Bulan:</label>
                <input type="month" value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="neon-input" style={{ padding: "0.4rem 0.75rem", fontSize: "0.82rem" }} />
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="glass-panel" style={{ padding: "0", overflow: "hidden", border: "1.5px solid #d1fae5" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Memuat data presensi...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                Tidak ada data yang cocok dengan kriteria filter.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderBottom: "1.5px solid #a7f3d0" }}>
                      <th style={{ padding: "1rem 1.25rem", color: "#065f46", fontWeight: 800 }}>Nama Guru</th>
                      <th style={{ padding: "1rem 1.25rem", color: "#065f46", fontWeight: 800 }}>Mata Pelajaran</th>
                      <th style={{ padding: "1rem 1.25rem", color: "#065f46", fontWeight: 800 }}>Kelas & Sesi</th>
                      <th style={{ padding: "1rem 1.25rem", color: "#065f46", fontWeight: 800 }}>Jam Absen</th>
                      <th style={{ padding: "1rem 1.25rem", color: "#065f46", fontWeight: 800 }}>Status</th>
                      <th style={{ padding: "1rem 1.25rem", color: "#065f46", fontWeight: 700 }}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, idx) => (
                      <tr key={row.id || idx} style={{
                        borderBottom: "1px solid var(--border-light)",
                        background: idx % 2 === 0 ? "#ffffff" : "#f8fffe"
                      }}>
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{row.nama}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NIP: {row.nip || "-"}</div>
                        </td>
                        <td style={{ padding: "1rem 1.25rem", color: "#059669", fontWeight: 700 }}>{row.mapel || "-"}</td>
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{row.kelas || "-"}</span>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.jam_jadwal || "-"}</div>
                        </td>
                        <td style={{ padding: "1rem 1.25rem", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 600 }}>
                          {row.jam_absen}
                        </td>
                        <td style={{ padding: "1rem 1.25rem" }}>{statusBadge(row.status)}</td>
                        <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                          {row.keterangan || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Print Preview Modal */}
      <AnimatePresence>
        {showPrintPreview && (
          <PrintPreviewModal
            data={printData}
            settings={settings}
            currentUser={currentUser}
            filterDate={filterDate}
            filterMonth={filterMonth}
            mode={printMode}
            orientation={printOrientation}
            setOrientation={setPrintOrientation}
            onClose={() => setShowPrintPreview(false)}
          />
        )}
      </AnimatePresence>

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ position: "relative", width: "100%", maxWidth: "440px", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "2px solid #059669", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", background: "#000" }}>
              <button type="button" onClick={() => setSelectedPhoto(null)}
                style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}>
                <X size={18} />
              </button>
              <img src={selectedPhoto} alt="Foto Presensi" style={{ width: "100%", height: "auto", display: "block" }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Native Browser Print Target (Auto-triggered on Ctrl+P or window.print) */}
      <div id="native-school-print">
        <OfficialSchoolDocument
          data={printData}
          settings={settings}
          currentUser={currentUser}
          filterDate={filterDate}
          filterMonth={filterMonth}
          mode={printMode}
        />
      </div>
    </>
  );
}
