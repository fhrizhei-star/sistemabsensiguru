"use client";

import React, { useRef, useState } from "react";
import { LOGO_KEMENAG, LOGO_SEKOLAH } from "@/lib/logos";
import { Printer, Download, FileSpreadsheet, FileDown, Loader2, CheckCircle2, AlertTriangle, Clock, Lock, Send, ShieldCheck, XCircle, Camera } from "lucide-react";
import { exportLkbToPdf } from "@/lib/pdfExport";
import { SAMPLE_EVIDENT_PHOTO } from "@/lib/mockData";
import { formatRapatJudulAktivitas } from "@/lib/api";

const INDO_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Format tanggal sistem: DD/MM/YYYY (contoh: 13/11/2026)
 */
function formatTanggalSistem(dateStr) {
  if (!dateStr) return "-";
  try {
    const str = String(dateStr).trim();
    const parts = str.split("-");
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, "0");
      const d = parts[2].padStart(2, "0");
      return `${d}/${m}/${y}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}

/**
 * Komponen Dokumen Laporan Capaian Kinerja Bulanan ASN per-Individu (Guru / Pegawai)
 * Format presisi sesuai dokumen resmi Kemenag Gowa (Lampiran Foto Referensi)
 */
export default function OfficialLkbIndividualDocument({
  user = {},
  bulan = "Oktober",
  tahun = "2026",
  attendanceRecords = [],
  settings = {},
  approvalStatus = "Belum Diajukan", // "Disetujui" | "Menunggu Verifikasi" | "Belum Diajukan" | "Ditolak"
  verifiedBy = "",
  verifiedAt = "",
  rejectionNote = "",
  isViewerAdmin = false,
  showActionBar = true,
  onApprove = null,
  onReject = null,
  onSubmitLkb = null,
  submitting = false,
  onClose = null
}) {
  const printAreaRef = useRef(null);

  const namaASN = user?.nama || user?.username;
  const nipASN = user?.nip || "-";
  const roleASN = user?.role || (user?.mapel ? "guru" : "pegawai");
  const jabatanASN = user?.jabatan || (roleASN === "pegawai" ? "Staf Tata Usaha" : "Guru");
  const satkerASN = user?.satker || user?.satuan_kerja || settings?.satuan_kerja || settings?.satker || "PENDIS";
  const namaSekolah = settings?.nama_sekolah || "MTsN GOWA";
  const kepalaMadrasah = settings?.kepala_madrasah || settings?.kepala_sekolah || settings?.nama_kepsek || "Dr. H. Suharto, M.Pd";
  const nipKepalaMadrasah = settings?.nip_kepala_madrasah || settings?.nip_kepala_sekolah || settings?.nip_kepsek || "196805121993031002";

  // Tanggal sistem standar (DD/MM/YYYY) untuk running header & sistem
  const now = new Date();
  const systemDateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

  // Khusus Titik Mangsa & Tanda Tangan: Berformat Indonesia ("13 November 2026")
  const ttdDateStr = `${now.getDate()} ${INDO_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  // Logika Status Pengesahan
  const isApproved = approvalStatus === "Disetujui";
  const isPending = approvalStatus === "Menunggu Verifikasi" || approvalStatus === "Menunggu";
  const isRejected = approvalStatus === "Ditolak";
  const isDraft = !isApproved && !isPending && !isRejected;

  // Izin cetak & unduh: Admin selalu boleh, Guru/Pegawai HANYA jika sudah disetujui admin
  const canPrintOrDownload = isViewerAdmin || isApproved;

  // Mapping data presensi menjadi butir kegiatan capaian kinerja LKB (kolom tetap format sistem)
  const lkbItems = (attendanceRecords || []).map((rec, index) => {
    const tglFormatted = formatTanggalSistem(rec.tanggal);

    let judulAktivitas = "";
    if (
      rec.is_rapat ||
      rec.tipe_absen === "rapat" ||
      rec.jadwal_id === "RAPAT" ||
      (rec.catatan && rec.catatan.toLowerCase().includes("rapat")) ||
      (rec.keterangan && rec.keterangan.toLowerCase().includes("rapat"))
    ) {
      judulAktivitas = formatRapatJudulAktivitas(rec);
    } else if (rec.is_pengganti || rec.guru_asli_nama) {
      const mapelStr = rec.mapel && rec.mapel !== "-" ? rec.mapel : "Pembelajaran";
      const kelasStr = rec.kelas && rec.kelas !== "-" ? `kelas ${rec.kelas}` : "kelas";
      const guruStr = rec.guru_asli_nama ? ` (Menggantikan ${rec.guru_asli_nama})` : " (Guru Pengganti)";
      if (rec.catatan && (rec.catatan.includes("Menggantikan") || rec.catatan.includes("Pengganti"))) {
        judulAktivitas = rec.catatan.trim();
      } else if (rec.catatan && rec.catatan.trim()) {
        judulAktivitas = `Melaksanakan tugas Guru Pengganti: Mengajar ${kelasStr} ${mapelStr.toLowerCase()}${guruStr} - ${rec.catatan.trim()}`;
      } else {
        judulAktivitas = `Melaksanakan tugas Guru Pengganti: Mengajar ${kelasStr} ${mapelStr.toLowerCase()}${guruStr}`;
      }
    } else if (rec.catatan && rec.catatan.trim()) {
      judulAktivitas = rec.catatan.trim();
    } else if (roleASN === "guru" || rec.kelas || rec.mapel) {
      const mapelStr = rec.mapel && rec.mapel !== "-" ? rec.mapel : "Pembelajaran";
      const kelasStr = rec.kelas && rec.kelas !== "-" ? `kelas ${rec.kelas}` : "kelas";
      judulAktivitas = `Mengajar di ${kelasStr} ${mapelStr.toLowerCase()}`;
    } else if (rec.tipe_absen === "pulang" || rec.jadwal_id === "PULANG") {
      judulAktivitas = "Penyelesaian tugas kedinasan dan presensi kepulangan kerja";
    } else {
      judulAktivitas = "Pelaksanaan tugas kedisiplinan dan layanan operasional madrasah";
    }

    const rawFoto = rec.foto || rec.evident || "";
    // Jika user memiliki foto kamera asli (base64 JPEG/PNG valid), pakai itu.
    // Jika kosong, null, format SVG lama, atau tidak valid, otomatis gunakan SAMPLE_EVIDENT_PHOTO agar dokumen resmi selalu menampilkan evident foto!
    const isRealCameraPhoto = rawFoto && typeof rawFoto === "string" && rawFoto.trim() !== "" && !rawFoto.startsWith("data:image/svg+xml") && rawFoto.length > 50 && (rawFoto.startsWith("data:image/jpeg") || rawFoto.startsWith("data:image/png") || rawFoto.startsWith("http"));
    const finalFoto = isRealCameraPhoto ? rawFoto : SAMPLE_EVIDENT_PHOTO;

    return {
      no: index + 1,
      tanggal: tglFormatted,
      judulAktivitas,
      volume: "1 Kegiatan",
      foto: finalFoto,
      status: "Selesai"
    };
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Export Berkas PDF Langsung (Bukan Print Dialog)
  const handleExportPdf = async () => {
    if (!canPrintOrDownload) {
      alert("Dokumen LKB ini belum dikonfirmasi/disetujui oleh Admin. Dokumen hanya dapat diexport setelah disahkan.");
      return;
    }
    try {
      setIsExportingPdf(true);
      await exportLkbToPdf({
        elementId: "official-lkb-individual-print-area",
        namaASN,
        satkerASN,
        bulan,
        tahun
      });
    } catch (err) {
      console.error("Gagal export PDF:", err);
      alert("Terjadi kendala saat export PDF langsung. Sistem akan membuka pratinjau cetak browser.");
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Berkas Excel (.xls)
  const handleDownloadExcel = () => {
    if (!canPrintOrDownload) {
      alert("Dokumen LKB ini belum dikonfirmasi/disetujui oleh Admin. Dokumen hanya dapat diexport setelah disahkan.");
      return;
    }

    const tableElement = document.getElementById("lkb-excel-table");
    if (!tableElement) return;

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>LKB_${bulan}_${tahun}</x:Name>
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
    link.download = `LKB_${namaASN.replace(/[^a-zA-Z0-9]/g, "_")}_${bulan}_${tahun}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Action Bar (Hanya tampil di layar jika showActionBar aktif, disembunyikan saat dicetak) */}
      {showActionBar && (
        <div
          className="no-print"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
            background: "#ffffff",
            border: `1.5px solid ${isApproved ? "#a7f3d0" : isPending ? "#fde68a" : isRejected ? "#fecaca" : "#cbd5e1"}`,
            borderRadius: "14px",
            padding: "1.15rem 1.35rem",
            marginBottom: "1.5rem",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            {/* Info Kiri */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: isApproved ? "#ecfdf5" : isPending ? "#fffbeb" : isRejected ? "#fef2f2" : "#f1f5f9",
                  border: `1px solid ${isApproved ? "#a7f3d0" : isPending ? "#fde68a" : isRejected ? "#fecaca" : "#cbd5e1"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isApproved ? "#059669" : isPending ? "#d97706" : isRejected ? "#dc2626" : "#64748b"
                }}
              >
                {isApproved ? <ShieldCheck size={24} /> : isPending ? <Clock size={24} /> : isRejected ? <XCircle size={24} /> : <Camera size={24} />}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b" }}>
                    Laporan Capaian Kinerja ASN (Evident Foto)
                  </span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "0.2rem 0.6rem",
                      borderRadius: "999px",
                      background: isApproved ? "#ecfdf5" : isPending ? "#fffbeb" : isRejected ? "#fef2f2" : "#f1f5f9",
                      color: isApproved ? "#065f46" : isPending ? "#92400e" : isRejected ? "#991b1b" : "#475569",
                      border: `1px solid ${isApproved ? "#a7f3d0" : isPending ? "#fde68a" : isRejected ? "#fecaca" : "#cbd5e1"}`,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    {isApproved && <CheckCircle2 size={12} />}
                    {isPending && <Clock size={12} />}
                    {isRejected && <XCircle size={12} />}
                    {isDraft && <Lock size={12} />}
                    {isApproved ? "Disahkan Admin" : isPending ? "Menunggu Konfirmasi" : isRejected ? "Perlu Revisi" : "Draft (Belum Diajukan)"}
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.15rem" }}>
                  ASN: <strong>{namaASN}</strong><span style={{ marginLeft: "0.5rem" }}>Periode: <strong>{bulan} {tahun}</strong></span><span style={{ marginLeft: "0.5rem" }}>Total Kegiatan: <strong>{lkbItems.length} Sesi Terdata</strong></span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Kanan */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              {/* Tombol Ajukan (Sisi Guru/Pegawai) jika belum diajukan atau ditolak */}
              {!isViewerAdmin && (isDraft || isRejected) && onSubmitLkb && (
                <button
                  type="button"
                  onClick={onSubmitLkb}
                  disabled={submitting || lkbItems.length === 0}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.6rem 1.15rem",
                    fontSize: "0.84rem",
                    fontWeight: 800,
                    cursor: submitting || lkbItems.length === 0 ? "not-allowed" : "pointer",
                    opacity: submitting || lkbItems.length === 0 ? 0.6 : 1,
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
                  }}
                >
                  <Send size={15} />
                  <span>{submitting ? "Mengirim..." : `Ajukan LKB ${bulan} ke Admin`}</span>
                </button>
              )}

              {/* Tombol Persetujuan Khusus Admin */}
              {isViewerAdmin && !isApproved && (
                <>
                  {onReject && (
                    <button
                      type="button"
                      onClick={onReject}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "#fff",
                        color: "#dc2626",
                        border: "1.5px solid #fecaca",
                        borderRadius: "8px",
                        padding: "0.55rem 0.85rem",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      <XCircle size={15} /> Minta Revisi
                    </button>
                  )}
                  {onApprove && (
                    <button
                      type="button"
                      onClick={onApprove}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.55rem 1rem",
                        fontSize: "0.84rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)"
                      }}
                    >
                      <CheckCircle2 size={15} /> Sahkan LKB
                    </button>
                  )}
                </>
              )}

              {/* Tombol Export Excel & Export PDF Khusus Sisi Guru/Pegawai (Disembunyikan di Panel Admin Sesuai Permintaan) */}
              {!isViewerAdmin && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    disabled={!canPrintOrDownload}
                    title={!canPrintOrDownload ? "Dokumen hanya dapat diexport setelah dikonfirmasi oleh Admin" : "Export LKB Format Excel (.xls)"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background: canPrintOrDownload ? "#ffffff" : "#f1f5f9",
                      color: canPrintOrDownload ? "#059669" : "#94a3b8",
                      border: `1.5px solid ${canPrintOrDownload ? "#059669" : "#cbd5e1"}`,
                      borderRadius: "8px",
                      padding: "0.55rem 0.85rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: canPrintOrDownload ? "pointer" : "not-allowed",
                      boxShadow: canPrintOrDownload ? "0 2px 6px rgba(5, 150, 105, 0.12)" : "none",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {!canPrintOrDownload ? <Lock size={14} /> : <FileSpreadsheet size={14} />}
                    <span>Export Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={!canPrintOrDownload || isExportingPdf}
                    title={!canPrintOrDownload ? "Dokumen hanya dapat diexport setelah dikonfirmasi oleh Admin" : "Export Berkas PDF Resmi"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background: canPrintOrDownload
                        ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                        : "#e2e8f0",
                      color: canPrintOrDownload ? "#ffffff" : "#94a3b8",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.55rem 1rem",
                      fontSize: "0.84rem",
                      fontWeight: 800,
                      cursor: canPrintOrDownload && !isExportingPdf ? "pointer" : "not-allowed",
                      whiteSpace: "nowrap",
                      boxShadow: canPrintOrDownload ? "0 2px 8px rgba(5, 150, 105, 0.25)" : "none",
                      transition: "all 0.2s ease",
                      opacity: isExportingPdf ? 0.75 : 1
                    }}
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Mengexport PDF...</span>
                      </>
                    ) : !canPrintOrDownload ? (
                      <>
                        <Lock size={14} />
                        <span>Export PDF</span>
                      </>
                    ) : (
                      <>
                        <FileDown size={14} />
                        <span>Export PDF</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "0.6rem 0.85rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Tutup
                </button>
              )}
            </div>
          </div>

          {/* Banner Keterangan Status untuk Pengguna */}
          {!canPrintOrDownload && !isViewerAdmin && (
            <div
              style={{
                background: isPending ? "#fffbeb" : isRejected ? "#fef2f2" : "#f8fafc",
                border: `1px solid ${isPending ? "#fde68a" : isRejected ? "#fecaca" : "#e2e8f0"}`,
                borderRadius: "8px",
                padding: "0.65rem 0.95rem",
                fontSize: "0.8rem",
                color: isPending ? "#92400e" : isRejected ? "#991b1b" : "#475569",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {isPending ? (
                <>
                  <Clock size={16} color="#d97706" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>LKB sedang dalam proses verifikasi Admin.</strong> Tombol <strong>Export PDF</strong> dan <strong>Export Excel</strong> terkunci sementara dan akan aktif otomatis begitu Admin mengesahkan LKB bulan {bulan}.
                  </span>
                </>
              ) : isRejected ? (
                <>
                  <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Perlu Perbaikan dari Admin:</strong> &ldquo;{rejectionNote || "Harap periksa kembali rekaman presensi Anda."}&rdquo; Silakan klik tombol <strong>Ajukan Ulang LKB</strong> setelah data diperbaiki.
                  </span>
                </>
              ) : (
                <>
                  <Lock size={16} color="#64748b" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Status Draft:</strong> Dokumen LKB ini belum diajukan ke Admin. Silakan tekan tombol <strong>Ajukan LKB {bulan} ke Admin</strong> di atas agar diverifikasi dan disahkan untuk dicetak/diexport.
                  </span>
                </>
              )}
            </div>
          )}

          {/* Banner Khusus Admin saat Memeriksa LKB */}
          {isViewerAdmin && !isApproved && (
            <div
              style={{
                background: isPending ? "#fffbeb" : "#f0fdf4",
                border: `1px solid ${isPending ? "#fde68a" : "#bbf7d0"}`,
                borderRadius: "8px",
                padding: "0.65rem 0.95rem",
                fontSize: "0.82rem",
                color: isPending ? "#92400e" : "#166534",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {isPending ? (
                <>
                  <Clock size={16} color="#d97706" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Pengajuan Menunggu Persetujuan Admin:</strong> Tinjau butir kegiatan berfoto di bawah, lalu klik tombol <strong>Sahkan LKB</strong> di atas.
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Persetujuan Langsung (Direct Approve):</strong> Dokumen belum diajukan mandiri oleh ASN. Anda dapat langsung mengesahkannya dengan tombol <strong>Sahkan LKB</strong> di atas.
                  </span>
                </>
              )}
            </div>
          )}

          {isApproved && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
                padding: "0.65rem 0.95rem",
                fontSize: "0.8rem",
                color: "#065f46",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
              <span>
                <strong>LKB Resmi Telah Disahkan:</strong> Dokumen telah diverifikasi dan disetujui {verifiedBy ? `oleh ${verifiedBy}` : "oleh Admin"}{verifiedAt ? ` pada tanggal ${formatTanggalSistem(verifiedAt)}` : ""}. Anda dapat mengexport berkas PDF resmi dan mengexport format Excel kapan saja.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Dokumen Resmi Format Cetak A4 */}
      <div
        ref={printAreaRef}
        id="official-lkb-individual-print-area"
        style={{
          width: "100%",
          maxWidth: "820px",
          margin: "0 auto",
          background: "#ffffff",
          color: "#000000",
          fontFamily: "'Times New Roman', Times, Georgia, serif",
          fontSize: "10pt",
          lineHeight: 1.4,
          padding: "20px 24px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          borderRadius: "8px",
          boxSizing: "border-box",
          position: "relative"
        }}
      >
        {/* 1. Header Ringkas Atas (Running Header Dokumen Resmi) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "8.5pt",
            color: "#475569",
            borderBottom: "1px solid #cbd5e1",
            paddingBottom: "4px",
            marginBottom: "14px"
          }}
        >
          <span>LAPORAN CAPAIAN KINERJA BULANAN - {bulan.toUpperCase()} {tahun}</span>
          <span>{systemDateStr}</span>
        </div>

        {/* 2. Kop Laporan Resmi */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
            position: "relative"
          }}
        >
          {/* Logo Kemenag (Kiri) */}
          <div style={{ width: "85px", flexShrink: 0 }}>
            <img
              src={LOGO_KEMENAG}
              alt="Logo Kemenag"
              style={{
                width: "72px",
                height: "auto",
                maxHeight: "75px",
                objectFit: "contain",
                display: "block"
              }}
            />
          </div>

          {/* Teks Judul Kop (Tengah) */}
          <div
            style={{
              textAlign: "center",
              flex: 1,
              padding: "0 10px"
            }}
          >
            <h1
              style={{
                fontSize: "13pt",
                fontWeight: 900,
                letterSpacing: "0.03em",
                margin: "0 0 3px 0",
                textTransform: "uppercase",
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              LAPORAN CAPAIAN KINERJA BULANAN
            </h1>
            <h2
              style={{
                fontSize: "12pt",
                fontWeight: 900,
                letterSpacing: "0.02em",
                margin: "0 0 3px 0",
                textTransform: "uppercase",
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              BULAN {bulan.toUpperCase()} {tahun}
            </h2>
            <h3
              style={{
                fontSize: "11pt",
                fontWeight: 800,
                letterSpacing: "0.02em",
                margin: 0,
                textTransform: "uppercase",
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              ASN DALAM LINGKUP KEMENAG GOWA
            </h3>
          </div>

          {/* Logo Sekolah (Kanan) */}
          <div style={{ width: "85px", flexShrink: 0, textAlign: "right" }}>
            <img
              src={LOGO_SEKOLAH}
              alt="Logo Sekolah"
              style={{
                width: "72px",
                height: "auto",
                maxHeight: "75px",
                objectFit: "contain",
                display: "block",
                marginLeft: "auto"
              }}
            />
          </div>
        </div>

        {/* Garis Pembatas Kop */}
        <div style={{ borderBottom: "2px solid #000000", marginBottom: "16px" }} />

        {/* 3. Biodata Pegawai / ASN */}
        <table
          className="table-identitas-asn no-border-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "none",
            marginBottom: "18px",
            fontSize: "10.5pt",
            color: "#000000"
          }}
        >
          <tbody>
            <tr style={{ border: "none" }}>
              <td style={{ width: "90px", padding: "3px 0", border: "none" }}>Nama</td>
              <td style={{ width: "15px", padding: "3px 0", border: "none" }}>:</td>
              <td style={{ padding: "3px 0", border: "none" }}>{namaASN}</td>
            </tr>
            <tr style={{ border: "none" }}>
              <td style={{ padding: "3px 0", border: "none" }}>NIP</td>
              <td style={{ padding: "3px 0", border: "none" }}>:</td>
              <td style={{ padding: "3px 0", border: "none" }}>{nipASN}</td>
            </tr>
            <tr style={{ border: "none" }}>
              <td style={{ padding: "3px 0", border: "none" }}>Jabatan</td>
              <td style={{ padding: "3px 0", border: "none" }}>:</td>
              <td style={{ padding: "3px 0", border: "none" }}>{jabatanASN}</td>
            </tr>
            <tr style={{ border: "none" }}>
              <td style={{ padding: "3px 0", border: "none" }}>Satuan Kerja</td>
              <td style={{ padding: "3px 0", border: "none" }}>:</td>
              <td style={{ padding: "3px 0", border: "none" }}>{satkerASN}</td>
            </tr>
          </tbody>
        </table>

        {/* 4. Tabel 5 Kolom Sesuai Persis dengan Format Kemenag Gowa */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1.5px solid #000000",
            marginBottom: "24px"
          }}
        >
          <thead>
            <tr style={{ background: "#ffffff" }}>
              <th
                style={{
                  border: "1.5px solid #000000",
                  padding: "16px 8px",
                  fontSize: "10pt",
                  fontWeight: 800,
                  textAlign: "center",
                  width: "14%"
                }}
              >
                Tanggal
              </th>
              <th
                style={{
                  border: "1.5px solid #000000",
                  padding: "16px 10px",
                  fontSize: "10pt",
                  fontWeight: 800,
                  textAlign: "center",
                  width: "42%"
                }}
              >
                Judul Aktivitas
              </th>
              <th
                style={{
                  border: "1.5px solid #000000",
                  padding: "16px 8px",
                  fontSize: "10pt",
                  fontWeight: 800,
                  textAlign: "center",
                  width: "16%"
                }}
              >
                Volume
              </th>
              <th
                style={{
                  border: "1.5px solid #000000",
                  padding: "16px 8px",
                  fontSize: "10pt",
                  fontWeight: 800,
                  textAlign: "center",
                  width: "16%"
                }}
              >
                Evident
              </th>
              <th
                style={{
                  border: "1.5px solid #000000",
                  padding: "16px 8px",
                  fontSize: "10pt",
                  fontWeight: 800,
                  textAlign: "center",
                  width: "12%"
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {lkbItems.length > 0 ? (
              lkbItems.map((item, idx) => (
                <tr key={idx} style={{ pageBreakInside: "avoid" }}>
                  <td
                    style={{
                      border: "1.5px solid #000000",
                      padding: "8px 6px",
                      fontSize: "9.5pt",
                      textAlign: "center",
                      verticalAlign: "middle"
                    }}
                  >
                    {item.tanggal}
                  </td>
                  <td
                    style={{
                      border: "1.5px solid #000000",
                      padding: "8px 12px",
                      fontSize: "9.5pt",
                      textAlign: "left",
                      verticalAlign: "middle",
                      lineHeight: 1.35
                    }}
                  >
                    {item.judulAktivitas}
                  </td>
                  <td
                    style={{
                      border: "1.5px solid #000000",
                      padding: "8px 6px",
                      fontSize: "9.5pt",
                      textAlign: "center",
                      verticalAlign: "middle"
                    }}
                  >
                    {item.volume}
                  </td>
                  <td
                    style={{
                      border: "1.5px solid #000000ff",
                      padding: "6px 6px",
                      textAlign: "center",
                      verticalAlign: "middle"
                    }}
                  >
                    <img
                      src={item.foto || SAMPLE_EVIDENT_PHOTO}
                      alt="Evident Foto Presensi"
                      width="65"
                      height="65"
                      style={{
                        width: "90px",
                        height: "80px",
                        display: "inline-block",
                        margin: "0 auto",
                        borderRadius: "1px",
                        backgroundColor: "#f8fafc"
                      }}
                    />
                  </td>
                  <td
                    style={{
                      border: "1.5px solid #000000",
                      padding: "8px 6px",
                      fontSize: "9.5pt",
                      textAlign: "center",
                      verticalAlign: "middle"
                    }}
                  >
                    {item.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    border: "1.5px solid #000000",
                    padding: "24px 12px",
                    textAlign: "center",
                    color: "#64748b",
                    fontStyle: "italic"
                  }}
                >
                  Belum ada rekaman presensi mengajar / dinas berfoto pada bulan {bulan} {tahun}.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 5. Lembar Tanda Tangan Resmi Pengesahan */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "30px",
            pageBreakInside: "avoid",
            fontSize: "10pt"
          }}
        >
          {/* Kolom Kiri: Kepala Madrasah */}
          <div style={{ textAlign: "center", width: "45%" }}>
            <div>Mengetahui,</div>
            <div style={{ fontWeight: 700, marginBottom: isApproved ? "6px" : "60px" }}>
              Kepala Madrasah
            </div>

            {isApproved ? (
              (settings?.ttd_kepsek_url || settings?.stempel_sekolah_url) ? (
                <div style={{ position: "relative", width: "200px", height: "65px", margin: "2px auto 6px auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {settings.stempel_sekolah_url && (
                    <img
                      src={settings.stempel_sekolah_url}
                      alt="Stempel Dinas"
                      style={{
                        position: "absolute",
                        left: "12px",
                        width: "66px",
                        height: "66px",
                        objectFit: "contain",
                        opacity: 0.88,
                        transform: "rotate(-5deg)",
                        pointerEvents: "none",
                        zIndex: 2
                      }}
                    />
                  )}
                  {settings.ttd_kepsek_url && (
                    <img
                      src={settings.ttd_kepsek_url}
                      alt="Tanda Tangan Kepala Sekolah"
                      style={{
                        paddingTop: "0.5rem",
                        position: "relative",
                        width: "155px",
                        height: "155px",
                        objectFit: "contain",
                        zIndex: 1
                      }}
                    />
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px 12px",
                    margin: "2px auto 8px auto",
                    border: "1.5px dashed #059669",
                    borderRadius: "8px",
                    background: "#f0fdf4",
                    color: "#065f46"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "7.5pt", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <span>✓ DISAHKAN SECARA ELEKTRONIK</span>
                  </div>
                  <div style={{ fontSize: "7pt", color: "#047857", marginTop: "2px", fontWeight: 700 }}>
                    TTE Kepala Madrasah / Sekolah
                  </div>
                  <div style={{ fontSize: "6.5pt", color: "#64748b", fontFamily: "monospace", marginTop: "1px" }}>
                    Tgl: {verifiedAt ? formatTanggalSistem(verifiedAt) : systemDateStr} • ID: LKB-{tahun}{bulan.substring(0, 3).toUpperCase()}-{String(user?.id || "OK")}
                  </div>
                </div>
              )
            ) : (
              <div style={{ height: "60px" }} />
            )}

            <div style={{ fontWeight: 800, textDecoration: "underline" }}>
              {kepalaMadrasah}
            </div>
            <div style={{ fontSize: "9.5pt" }}>NIP. {nipKepalaMadrasah}</div>
          </div>

          {/* Kolom Kanan: Guru / Pegawai yang Bersangkutan */}
          <div style={{ textAlign: "center", width: "45%" }}>
            <div>Gowa, {ttdDateStr}</div>
            <div style={{ fontWeight: 700, marginBottom: "60px" }}>
              Pegawai / Guru Yang Bersangkutan
            </div>
            <div style={{ fontWeight: 800, textDecoration: "underline" }}>
              {namaASN}
            </div>
            <div style={{ fontSize: "9.5pt" }}>NIP. {nipASN}</div>
          </div>
        </div>

        {/* Garis Pemisah & Keterangan Footer Dokumen LKB (Tampil di Layar / Pratinjau & Cetak) */}
        <div
          className="lkb-screen-footer"
          style={{
            marginTop: "36px",
            paddingTop: "10px",
            borderTop: "1.5px solid #334155",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "8.5pt",
            color: "#334155",
            pageBreakInside: "avoid"
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {namaASN} - {satkerASN}
          </div>
          <div>
            Laporan Capaian Kinerja Bulanan (LKB) • {bulan} {tahun}
          </div>
        </div>
      </div>

      {/* Hidden Table Khusus untuk Unduh Format Excel (.xls) */}
      <div id="lkb-excel-table" style={{ display: "none" }}>
        <table>
          <tbody>
            <tr>
              <td colSpan={5} style={{ fontSize: "14pt", fontWeight: "bold", textAlign: "center" }}>
                LAPORAN CAPAIAN KINERJA BULANAN
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ fontSize: "12pt", fontWeight: "bold", textAlign: "center" }}>
                BULAN {bulan.toUpperCase()} {tahun}
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ fontSize: "11pt", fontWeight: "bold", textAlign: "center" }}>
                ASN DALAM LINGKUP KEMENAG GOWA
              </td>
            </tr>
            <tr><td colSpan={5}></td></tr>
            <tr>
              <td style={{ fontWeight: "bold" }}>Nama</td>
              <td colSpan={4}>: {namaASN}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold" }}>NIP</td>
              <td colSpan={4}>: &apos;{nipASN}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold" }}>Jabatan</td>
              <td colSpan={4}>: {jabatanASN}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold" }}>Satuan Kerja</td>
              <td colSpan={4}>: {satkerASN}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold" }}>Status Dokumen</td>
              <td colSpan={4}>: {approvalStatus.toUpperCase()} {verifiedBy ? `(Diverifikasi oleh: ${verifiedBy})` : ""}</td>
            </tr>
            <tr><td colSpan={5}></td></tr>
            <tr style={{ background: "#f1f5f9", fontWeight: "bold", textAlign: "center" }}>
              <th style={{ width: "120px" }}>Tanggal</th>
              <th style={{ width: "320px" }}>Judul Aktivitas</th>
              <th style={{ width: "120px" }}>Volume</th>
              <th style={{ width: "140px" }}>Evident</th>
              <th style={{ width: "100px" }}>Status</th>
            </tr>
            {lkbItems.map((item, idx) => (
              <tr key={idx} style={{ height: "70px" }}>
                <td style={{ textAlign: "center", verticalAlign: "middle" }}>{item.tanggal}</td>
                <td style={{ verticalAlign: "middle" }}>{item.judulAktivitas}</td>
                <td style={{ textAlign: "center", verticalAlign: "middle" }}>{item.volume}</td>
                <td style={{ textAlign: "center", verticalAlign: "middle", width: "120px", height: "70px" }}>
                  <img
                    src={item.foto || SAMPLE_EVIDENT_PHOTO}
                    alt="Evident Presensi"
                    width="60"
                    height="60"
                    style={{
                      display: "inline-block",
                      margin: "auto",
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      verticalAlign: "middle"
                    }}
                  />
                </td>
                <td style={{ textAlign: "center", verticalAlign: "middle" }}>{item.status}</td>
              </tr>
            ))}
            <tr><td colSpan={5}></td></tr>
            <tr>
              <td colSpan={2} style={{ textAlign: "center" }}>
                Mengetahui,<br />
                Kepala Madrasah<br /><br /><br /><br />
                <b><u>{kepalaMadrasah}</u></b><br />
                NIP. &apos;{nipKepalaMadrasah}
              </td>
              <td></td>
              <td colSpan={2} style={{ textAlign: "center" }}>
                Gowa, {ttdDateStr}<br />
                Pegawai / Guru Yang Bersangkutan<br /><br /><br /><br />
                <b><u>{namaASN}</u></b><br />
                NIP. &apos;{nipASN}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          header, .no-print, nav, .teacher-bottom-nav, .admin-sidebar, .admin-bottom-nav {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          #official-lkb-individual-print-area {
            box-shadow: none !important;
            padding: 10px 15px !important;
            max-width: 100% !important;
            border: none !important;
          }
          #official-lkb-individual-print-area .table-identitas-asn,
          #official-lkb-individual-print-area .table-identitas-asn tbody,
          #official-lkb-individual-print-area .table-identitas-asn tr,
          #official-lkb-individual-print-area .table-identitas-asn td {
            border: none !important;
            border-width: 0 !important;
            border-style: none !important;
            box-shadow: none !important;
            outline: none !important;
          }
          .draft-watermark {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
