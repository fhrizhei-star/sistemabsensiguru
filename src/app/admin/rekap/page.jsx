"use client";

import { useState, useEffect, useMemo } from "react";
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
  ExternalLink,
  GraduationCap,
  Briefcase,
  Sun,
  Moon
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
function OfficialSchoolDocument({ data = [], settings = {}, currentUser = null, filterDate, filterMonth, mode, roleTab = "guru" }) {
  const safeData = Array.isArray(data) ? data : [];
  const safeSettings = settings || {};
  const isPegawai = roleTab === "pegawai";
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
          {isPegawai ? "REKAPITULASI PRESENSI KERJA PEGAWAI / TATA USAHA" : "REKAPITULASI PRESENSI MENGAJAR GURU"}
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
          <tr style={{ background: isPegawai ? "#0369a1" : "#065f46", color: "#ffffff" }}>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "32px", color: "#ffffff" }}>No</th>
            {mode === "bulanan" && (
              <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "90px", color: "#ffffff" }}>Tanggal</th>
            )}
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", color: "#ffffff" }}>{isPegawai ? "Nama Pegawai" : "Nama Guru"}</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "120px", color: "#ffffff" }}>NIP</th>
            {isPegawai ? (
              <>
                <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", color: "#ffffff" }}>Jabatan / Unit Kerja</th>
                <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "90px", color: "#ffffff" }}>Jenis Presensi</th>
                <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "95px", color: "#ffffff" }}>Jam Kerja</th>
              </>
            ) : (
              <>
                <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", color: "#ffffff" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "65px", color: "#ffffff" }}>Kelas</th>
              </>
            )}
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "75px", color: "#ffffff" }}>Jam Absen</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", width: "80px", color: "#ffffff" }}>Status</th>
            <th style={{ border: "1px solid #333", padding: "6px 8px", textAlign: "center", color: "#ffffff" }}>{isPegawai ? "Catatan Aktivitas" : "Keterangan"}</th>
          </tr>
        </thead>
        <tbody>
          {safeData.length === 0 ? (
            <tr>
              <td colSpan={mode === "bulanan" ? (isPegawai ? 10 : 9) : (isPegawai ? 9 : 8)} style={{ textAlign: "center", padding: "1.5rem", color: "#666", fontStyle: "italic", border: "1px solid #333" }}>
                Tidak ada data presensi {isPegawai ? "pegawai" : "guru"} untuk periode ini
              </td>
            </tr>
          ) : safeData.map((row, idx) => {
            const isPulang = String(row.jadwal_id || "").toUpperCase() === "PULANG" || String(row.keterangan || "").toLowerCase().includes("pulang");
            return (
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
                {isPegawai ? (
                  <>
                    <td style={{ border: "1px solid #333", padding: "5px 6px" }}>{row.kelas || row.mapel || "Tata Usaha / Administrasi"}</td>
                    <td style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "center", fontWeight: 700 }}>
                      {isPulang ? "Pulang" : "Masuk"}
                    </td>
                    <td style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "center", fontSize: "8pt" }}>{row.jam_jadwal || "-"}</td>
                  </>
                ) : (
                  <>
                    <td style={{ border: "1px solid #333", padding: "5px 6px" }}>{row.mapel || "-"}</td>
                    <td style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "center" }}>{row.kelas || "-"}</td>
                  </>
                )}
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
            );
          })}
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
function PrintPreviewModal({ data = [], settings = {}, currentUser, filterDate, filterMonth, mode, roleTab = "guru", orientation, setOrientation, onClose }) {
  const safeData = Array.isArray(data) ? data : [];
  const safeSettings = settings || {};
  const isPegawai = roleTab === "pegawai";
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
        <title>Rekap Presensi ${isPegawai ? "Pegawai" : "Guru"} - ${settings.nama_sekolah || "Sekolah"}</title>
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
          background: isPegawai
            ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
            : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          flexWrap: "wrap", gap: "0.75rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {isPegawai ? <Briefcase size={22} color="#0284c7" /> : <FileText size={22} color="#059669" />}
            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: isPegawai ? "#0369a1" : "#065f46" }}>
                Preview Cetak Rekap {isPegawai ? "Pegawai" : "Guru"}
              </div>
              <div style={{ fontSize: "0.78rem", color: isPegawai ? "#0284c7" : "#059669" }}>{periodeLabel} • {data.length} data</div>
            </div>
          </div>

          {/* Orientasi Switcher */}
          <div style={{
            display: "flex",
            background: "#ffffff",
            padding: "3px",
            borderRadius: "10px",
            border: `1.5px solid ${isPegawai ? "#bae6fd" : "#a7f3d0"}`
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
                background: orientation === "landscape" ? (isPegawai ? "#0284c7" : "#059669") : "transparent",
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
                background: orientation === "portrait" ? (isPegawai ? "#0284c7" : "#059669") : "transparent",
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
                color: isPegawai ? "#0369a1" : "#065f46",
                border: `1.5px solid ${isPegawai ? "#bae6fd" : "#a7f3d0"}`,
                borderRadius: "10px",
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
                background: isPegawai
                  ? "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)"
                  : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                color: "#fff", border: "none", borderRadius: "10px",
                fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                boxShadow: isPegawai ? "0 4px 12px rgba(2,132,199,0.3)" : "0 4px 12px rgba(5,150,105,0.3)"
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
              roleTab={roleTab}
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

  // Tab Pemisah Peran: "guru" | "pegawai"
  const [roleTab, setRoleTab] = useState("guru");

  // Filters
  const [filterDate, setFilterDate] = useState(getTodayDateStr());
  const [filterMonth, setFilterMonth] = useState(getTodayDateStr().substring(0, 7)); // YYYY-MM
  const [filterUser, setFilterUser] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterTipePegawai, setFilterTipePegawai] = useState("Semua"); // "Semua" | "masuk" | "pulang"

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
    const tRes = await Api.request("GET", "getUsers");
    if (tRes && tRes.users) setTeachers(tRes.users.filter(u => u.role !== "admin"));
    const sRes = await Api.request("GET", "getSettings");
    if (sRes && sRes.settings) setSettings(sRes.settings);
    setLoading(false);
  };

  // Map users for fast lookup
  const userMap = useMemo(() => {
    const m = {};
    (teachers || []).forEach(u => {
      if (u && u.id) m[String(u.id)] = u;
    });
    return m;
  }, [teachers]);

  // Cek apakah item adalah presensi Pegawai
  const isPegawaiItem = (item) => {
    if (!item) return false;
    const u = userMap[String(item.user_id)];
    if (u && u.role === "pegawai") return true;
    const jId = String(item.jadwal_id || "").toUpperCase();
    if (jId === "MASUK" || jId === "PULANG") return true;
    const mapelLower = String(item.mapel || "").toLowerCase();
    const kelasLower = String(item.kelas || "").toLowerCase();
    if (mapelLower.includes("staf") || mapelLower.includes("administrasi") || mapelLower.includes("tata usaha")) return true;
    if (kelasLower.includes("tata usaha") || kelasLower.includes("administrasi")) return true;
    return false;
  };

  // Filter dataset berdasarkan roleTab
  const guruAttendanceList = useMemo(() => {
    return (attendance || []).filter(item => !isPegawaiItem(item));
  }, [attendance, userMap]);

  const pegawaiAttendanceList = useMemo(() => {
    return (attendance || []).filter(item => isPegawaiItem(item));
  }, [attendance, userMap]);

  const activeDataset = roleTab === "pegawai" ? pegawaiAttendanceList : guruAttendanceList;
  const guruUsers = useMemo(() => (teachers || []).filter(u => u.role !== "pegawai"), [teachers]);
  const pegawaiUsers = useMemo(() => (teachers || []).filter(u => u.role === "pegawai"), [teachers]);
  const activeUserOptions = roleTab === "pegawai" ? pegawaiUsers : guruUsers;

  // Filter untuk tampilan tabel aktif
  const filtered = useMemo(() => {
    return activeDataset.filter((item) => {
      if (!item) return false;
      const itemTgl = String(item.tanggal || "").trim();
      if (filterDate && itemTgl !== filterDate) return false;
      if (filterUser !== "Semua" && String(item.user_id) !== String(filterUser)) return false;
      if (filterStatus !== "Semua" && item.status !== filterStatus) return false;

      if (roleTab === "pegawai" && filterTipePegawai !== "Semua") {
        const jId = String(item.jadwal_id || "").toLowerCase();
        const ket = String(item.keterangan || "").toLowerCase();
        if (filterTipePegawai === "masuk" && !jId.includes("masuk") && !ket.includes("masuk")) return false;
        if (filterTipePegawai === "pulang" && !jId.includes("pulang") && !ket.includes("pulang")) return false;
      }

      return true;
    });
  }, [activeDataset, filterDate, filterUser, filterStatus, roleTab, filterTipePegawai]);

  // Filter untuk cetak (harian atau bulanan)
  const printData = useMemo(() => {
    return activeDataset.filter((item) => {
      if (!item) return false;
      const itemTgl = String(item.tanggal || "").trim();
      if (printMode === "harian") {
        if (filterDate && itemTgl !== filterDate) return false;
      } else {
        if (filterMonth && !itemTgl.startsWith(filterMonth)) return false;
      }
      if (filterUser !== "Semua" && String(item.user_id) !== String(filterUser)) return false;
      if (filterStatus !== "Semua" && item.status !== filterStatus) return false;

      if (roleTab === "pegawai" && filterTipePegawai !== "Semua") {
        const jId = String(item.jadwal_id || "").toLowerCase();
        const ket = String(item.keterangan || "").toLowerCase();
        if (filterTipePegawai === "masuk" && !jId.includes("masuk") && !ket.includes("masuk")) return false;
        if (filterTipePegawai === "pulang" && !jId.includes("pulang") && !ket.includes("pulang")) return false;
      }

      return true;
    });
  }, [activeDataset, printMode, filterDate, filterMonth, filterUser, filterStatus, roleTab, filterTipePegawai]);

  const exportExcelRapi = () => {
    const isPegawai = roleTab === "pegawai";
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

      if (isPegawai) {
        const isPulang = String(row.jadwal_id || "").toUpperCase() === "PULANG" || String(row.keterangan || "").toLowerCase().includes("pulang");
        rowsHtml += `
          <tr>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${i + 1}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; mso-number-format: 'yyyy\\-mm\\-dd';">${row.tanggal || "-"}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${row.hari || "-"}</td>
            <td style="text-align: left; font-weight: 600; border: 1px solid #cbd5e1; padding: 6px 8px;">${row.nama || "-"}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; mso-number-format: '\\@';">${String(row.nip || "-").replace(/^'/, "")}</td>
            <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${row.kelas || row.mapel || "Tata Usaha / Administrasi"}</td>
            <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${isPulang ? "Presensi Pulang" : "Presensi Masuk"}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${row.jam_jadwal || "-"}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; mso-number-format: 'hh\\:mm'; font-weight: bold;">${row.jam_absen || "-"}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; ${statusStyle}">${row.status || "-"}</td>
            <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${row.keterangan || "-"}</td>
          </tr>
        `;
      } else {
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
      }
    });

    const headerThemeColor = isPegawai ? "#0369a1" : "#065f46";
    const headerBorderColor = isPegawai ? "#0284c7" : "#044e39";

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Rekap Presensi ${isPegawai ? "Pegawai" : "Guru"}</x:Name>
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
          .th-header { background-color: ${headerThemeColor}; color: #ffffff; font-weight: bold; text-align: center; padding: 9px 6px; border: 1px solid ${headerBorderColor}; font-size: 10pt; }
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
            <td colspan="11" style="text-align: center; font-size: 15pt; font-weight: 800; text-transform: uppercase; color: ${headerThemeColor}; padding: 3px 0;">
              ${namaSekolah}
            </td>
          </tr>
          <tr>
            <td colspan="11" style="text-align: center; font-size: 8.5pt; color: #64748b; font-style: italic;">
              ${alamatSekolah} • Telp: ${telpSekolah}
            </td>
          </tr>
          <tr>
            <td colspan="11" style="border-bottom: 2.5px solid ${headerThemeColor}; height: 6px;"></td>
          </tr>
          <tr><td colspan="11" style="height: 10px;"></td></tr>

          <!-- JUDUL LAPORAN -->
          <tr>
            <td colspan="11" style="text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #0f172a;">
              ${isPegawai ? "LAPORAN REKAPITULASI PRESENSI KERJA PEGAWAI / TATA USAHA" : "LAPORAN REKAPITULASI PRESENSI MENGAJAR GURU"}
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
              <th class="th-header" style="width: 230px;">${isPegawai ? "NAMA PEGAWAI" : "NAMA GURU"}</th>
              <th class="th-header" style="width: 180px;">NIP</th>
              ${isPegawai ? `
                <th class="th-header" style="width: 190px;">JABATAN / UNIT KERJA</th>
                <th class="th-header" style="width: 130px;">JENIS PRESENSI</th>
                <th class="th-header" style="width: 130px;">JAM KERJA</th>
              ` : `
                <th class="th-header" style="width: 165px;">MATA PELAJARAN</th>
                <th class="th-header" style="width: 95px;">KELAS</th>
                <th class="th-header" style="width: 110px;">JAM JADWAL</th>
              `}
              <th class="th-header" style="width: 95px;">JAM ABSEN</th>
              <th class="th-header" style="width: 115px;">STATUS</th>
              <th class="th-header" style="width: 175px;">${isPegawai ? "CATATAN AKTIVITAS" : "KETERANGAN"}</th>
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
              TOTAL ${isPegawai ? "PRESENSI PEGAWAI" : "SESI MENGAJAR"}:
            </td>
            <td colspan="8" style="background-color: #f8fafc; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px; color: #0f172a;">
              ${totalSesi} ${isPegawai ? "Data Presensi Kerja" : "Sesi Pelajaran"}
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
    const cleanFileName = `Rekap_Presensi_${isPegawai ? "Pegawai" : "Guru"}_${namaSekolah.replace(/[^a-zA-Z0-9]/g, "_")}_${printMode === "bulanan" ? filterMonth : (filterDate || "Semua")}.xls`;
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
          nav,
          .admin-sidebar,
          .edu-background,
          .no-print,
          button,
          .modal-print-backdrop,
          .modal-print-container {
            display: none !important;
          }
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
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--text-main)" }}>
                Rekapitulasi Kehadiran
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Laporan dan arsip presensi terpisah antara guru mengajar dan pegawai administrasi
              </p>
            </div>

            <div className="no-print" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                onClick={exportExcelRapi}
                style={{
                  display: "flex", alignItems: "center", gap: "0.45rem",
                  fontSize: "0.85rem", padding: "0.6rem 1.15rem",
                  background: "#ffffff",
                  border: `1.5px solid ${roleTab === "pegawai" ? "#0284c7" : "#10b981"}`,
                  color: roleTab === "pegawai" ? "#0369a1" : "#059669",
                  borderRadius: "10px", fontWeight: 700, cursor: "pointer",
                  boxShadow: roleTab === "pegawai" ? "0 2px 8px rgba(2, 132, 199, 0.15)" : "0 2px 8px rgba(16, 185, 129, 0.15)",
                  transition: "all 0.2s"
                }}
              >
                <FileSpreadsheet size={17} color={roleTab === "pegawai" ? "#0284c7" : "#059669"} />
                Ekspor Excel ({roleTab === "pegawai" ? "Pegawai" : "Guru"})
              </button>
              <button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.45rem",
                  fontSize: "0.85rem", padding: "0.6rem 1.15rem",
                  background: roleTab === "pegawai"
                    ? "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)"
                    : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  border: "none", color: "#ffffff", borderRadius: "10px",
                  fontWeight: 700, cursor: "pointer",
                  boxShadow: roleTab === "pegawai" ? "0 4px 14px rgba(2,132,199,0.3)" : "0 4px 14px rgba(16,185,129,0.3)"
                }}
              >
                <Printer size={16} /> Cetak Format Sekolah
              </button>
            </div>
          </div>

          {/* TAB PEMISAH PERAN: GURU VS PEGAWAI */}
          <div className="no-print" style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap"
          }}>
            <button
              type="button"
              onClick={() => {
                setRoleTab("guru");
                setFilterUser("Semua");
                setFilterTipePegawai("Semua");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.75rem 1.35rem",
                borderRadius: "14px",
                border: roleTab === "guru" ? "2px solid #059669" : "1.5px solid var(--border-light)",
                background: roleTab === "guru" ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" : "#ffffff",
                color: roleTab === "guru" ? "#065f46" : "var(--text-secondary)",
                fontWeight: 800,
                fontSize: "0.92rem",
                cursor: "pointer",
                boxShadow: roleTab === "guru" ? "0 4px 14px rgba(5, 150, 105, 0.2)" : "var(--shadow-sm)",
                transition: "all 0.2s ease"
              }}
            >
              <GraduationCap size={20} color={roleTab === "guru" ? "#059669" : "#64748b"} />
              <span>Rekap Presensi Guru</span>
              <span style={{
                fontSize: "0.74rem",
                background: roleTab === "guru" ? "#059669" : "#f1f5f9",
                color: roleTab === "guru" ? "#ffffff" : "#64748b",
                padding: "0.15rem 0.55rem",
                borderRadius: "999px",
                fontWeight: 800
              }}>
                {guruAttendanceList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleTab("pegawai");
                setFilterUser("Semua");
                setFilterTipePegawai("Semua");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.75rem 1.35rem",
                borderRadius: "14px",
                border: roleTab === "pegawai" ? "2px solid #0284c7" : "1.5px solid var(--border-light)",
                background: roleTab === "pegawai" ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)" : "#ffffff",
                color: roleTab === "pegawai" ? "#0369a1" : "var(--text-secondary)",
                fontWeight: 800,
                fontSize: "0.92rem",
                cursor: "pointer",
                boxShadow: roleTab === "pegawai" ? "0 4px 14px rgba(2, 132, 199, 0.2)" : "var(--shadow-sm)",
                transition: "all 0.2s ease"
              }}
            >
              <Briefcase size={19} color={roleTab === "pegawai" ? "#0284c7" : "#64748b"} />
              <span>Rekap Presensi Pegawai</span>
              <span style={{
                fontSize: "0.74rem",
                background: roleTab === "pegawai" ? "#0284c7" : "#f1f5f9",
                color: roleTab === "pegawai" ? "#ffffff" : "#64748b",
                padding: "0.15rem 0.55rem",
                borderRadius: "999px",
                fontWeight: 800
              }}>
                {pegawaiAttendanceList.length}
              </span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="glass-panel no-print" style={{
            padding: "1.15rem", marginBottom: "1.5rem",
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
            gap: "0.85rem", alignItems: "end",
            border: `1.5px solid ${roleTab === "pegawai" ? "#bae6fd" : "#a7f3d0"}`,
            background: roleTab === "pegawai"
              ? "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)"
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
                Filter {roleTab === "pegawai" ? "Pegawai" : "Guru"}
              </label>
              <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}
                className="neon-input" style={{ padding: "0.55rem 0.85rem", cursor: "pointer" }}>
                <option value="Semua">Semua {roleTab === "pegawai" ? "Pegawai" : "Guru"}</option>
                {activeUserOptions.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nama} ({roleTab === "pegawai" ? (t.jabatan || "Pegawai") : (t.mapel || "Guru")})
                  </option>
                ))}
              </select>
            </div>

            {/* Khusus Pegawai: Filter Jenis Presensi (Masuk vs Pulang) */}
            {roleTab === "pegawai" && (
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Jenis Presensi
                </label>
                <select value={filterTipePegawai} onChange={(e) => setFilterTipePegawai(e.target.value)}
                  className="neon-input" style={{ padding: "0.55rem 0.85rem", cursor: "pointer" }}>
                  <option value="Semua">Semua Jenis</option>
                  <option value="masuk">🌅 Presensi Masuk</option>
                  <option value="pulang">🌙 Presensi Pulang</option>
                </select>
              </div>
            )}

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
              <button type="button" onClick={() => { setFilterDate(""); setFilterUser("Semua"); setFilterStatus("Semua"); setFilterTipePegawai("Semua"); }}
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
                  border: `2px solid ${printMode === m ? (roleTab === "pegawai" ? "#0284c7" : "#059669") : "#e2e8f0"}`,
                  background: printMode === m ? (roleTab === "pegawai" ? "#e0f2fe" : "#dcfce7") : "#ffffff",
                  color: printMode === m ? (roleTab === "pegawai" ? "#0369a1" : "#065f46") : "#6b7280",
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
          <div className="glass-panel" style={{
            padding: "0",
            overflow: "hidden",
            border: `1.5px solid ${roleTab === "pegawai" ? "#bae6fd" : "#d1fae5"}`
          }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                Memuat data presensi {roleTab === "pegawai" ? "pegawai" : "guru"}...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "var(--text-muted)" }}>
                <Clock size={36} color="#94a3b8" style={{ margin: "0 auto 0.75rem" }} />
                <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "1rem" }}>
                  Tidak ada data presensi {roleTab === "pegawai" ? "pegawai" : "guru"}
                </div>
                <div style={{ fontSize: "0.82rem", marginTop: "0.25rem" }}>
                  Tidak ditemukan presensi yang cocok dengan kriteria filter saat ini.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{
                      background: roleTab === "pegawai"
                        ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                        : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                      borderBottom: `1.5px solid ${roleTab === "pegawai" ? "#bae6fd" : "#a7f3d0"}`
                    }}>
                      <th style={{ padding: "1rem 1.25rem", color: roleTab === "pegawai" ? "#0369a1" : "#065f46", fontWeight: 800 }}>
                        {roleTab === "pegawai" ? "Nama Pegawai" : "Nama Guru"}
                      </th>
                      {roleTab === "pegawai" ? (
                        <>
                          <th style={{ padding: "1rem 1.25rem", color: "#0369a1", fontWeight: 800 }}>Jabatan / Unit Kerja</th>
                          <th style={{ padding: "1rem 1.25rem", color: "#0369a1", fontWeight: 800 }}>Jenis Presensi</th>
                          <th style={{ padding: "1rem 1.25rem", color: "#0369a1", fontWeight: 800 }}>Jam Kerja</th>
                        </>
                      ) : (
                        <>
                          <th style={{ padding: "1rem 1.25rem", color: "#065f46", fontWeight: 800 }}>Mata Pelajaran</th>
                          <th style={{ padding: "1rem 1.25rem", color: "#065f46", fontWeight: 800 }}>Kelas & Sesi</th>
                        </>
                      )}
                      <th style={{ padding: "1rem 1.25rem", color: roleTab === "pegawai" ? "#0369a1" : "#065f46", fontWeight: 800 }}>Jam Absen</th>
                      <th style={{ padding: "1rem 1.25rem", color: roleTab === "pegawai" ? "#0369a1" : "#065f46", fontWeight: 800 }}>Status</th>
                      <th style={{ padding: "1rem 1.25rem", color: roleTab === "pegawai" ? "#0369a1" : "#065f46", fontWeight: 700 }}>
                        {roleTab === "pegawai" ? "Catatan Aktivitas" : "Keterangan"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, idx) => {
                      const isPulang = String(row.jadwal_id || "").toUpperCase() === "PULANG" || String(row.keterangan || "").toLowerCase().includes("pulang");
                      return (
                        <tr key={row.id || idx} style={{
                          borderBottom: "1px solid var(--border-light)",
                          background: idx % 2 === 0 ? "#ffffff" : (roleTab === "pegawai" ? "#fbfdff" : "#f8fffe")
                        }}>
                          <td style={{ padding: "1rem 1.25rem" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{row.nama}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NIP: {row.nip || "-"}</div>
                          </td>

                          {roleTab === "pegawai" ? (
                            <>
                              <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "var(--text-main)" }}>
                                {row.kelas || row.mapel || "Tata Usaha / Administrasi"}
                              </td>
                              <td style={{ padding: "1rem 1.25rem" }}>
                                {isPulang ? (
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", gap: "0.35rem",
                                    background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
                                    padding: "0.22rem 0.65rem", borderRadius: "999px", fontSize: "0.76rem", fontWeight: 800
                                  }}>
                                    <Moon size={13} color="#2563eb" /> Presensi Pulang
                                  </span>
                                ) : (
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", gap: "0.35rem",
                                    background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a",
                                    padding: "0.22rem 0.65rem", borderRadius: "999px", fontSize: "0.76rem", fontWeight: 800
                                  }}>
                                    <Sun size={13} color="#d97706" /> Presensi Masuk
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                                {row.jam_jadwal || "-"}
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: "1rem 1.25rem", color: "#059669", fontWeight: 700 }}>{row.mapel || "-"}</td>
                              <td style={{ padding: "1rem 1.25rem" }}>
                                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{row.kelas || "-"}</span>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.jam_jadwal || "-"}</div>
                              </td>
                            </>
                          )}

                          <td style={{
                            padding: "1rem 1.25rem",
                            fontFamily: "var(--font-mono)",
                            color: roleTab === "pegawai" ? "#0284c7" : "#059669",
                            fontWeight: 700
                          }}>
                            {row.jam_absen}
                          </td>
                          <td style={{ padding: "1rem 1.25rem" }}>{statusBadge(row.status)}</td>
                          <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                            {row.keterangan || "-"}
                          </td>
                        </tr>
                      );
                    })}
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
            roleTab={roleTab}
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
          roleTab={roleTab}
        />
      </div>
    </>
  );
}
