"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LOGO_KEMENAG, LOGO_SEKOLAH } from "@/lib/logos";
import { Printer, ExternalLink, X, FileSpreadsheet, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Komponen Dokumen Cetak Rekapitulasi Capaian Kinerja Bulanan (LKB) Seluruh ASN
 * Berformat resmi kedinasan Kemenag (Kop Surat, Tabel Ringkasan, Pengesahan)
 */
export function OfficialLkbSummaryDocument({
  data = [],
  settings = {},
  bulan = "Oktober",
  tahun = "2026",
  currentUser = null,
  roleFilter = "Semua"
}) {
  const safeData = Array.isArray(data) ? data : [];
  const safeSettings = settings || {};

  const totalAsn = safeData.length;
  const totalApproved = safeData.filter((d) => d.status === "Disetujui").length;
  const totalPending = safeData.filter((d) => d.status === "Menunggu Verifikasi" || d.status === "Menunggu").length;
  const totalUnsubmitted = safeData.filter((d) => d.status !== "Disetujui" && d.status !== "Menunggu Verifikasi" && d.status !== "Menunggu").length;

  const namaSekolah = safeSettings.nama_sekolah || "MADRASAH TSANAWIYAH NEGERI GOWA";
  const kepalaSekolah = safeSettings.kepala_sekolah || safeSettings.kepala_madrasah || safeSettings.nama_kepsek || "Dr. H. Suharto, M.Pd";
  const nipKepalaSekolah = safeSettings.nip_kepsek || safeSettings.nip_kepala_madrasah || safeSettings.nip_kepala_sekolah || "196805121993031002";
  const kota = safeSettings.kota || "Kabupaten Gowa";
  const namaOperator = currentUser?.nama || safeSettings.operator_nama || "Operator Kepegawaian";
  const nipOperator = safeSettings.operator_nip || safeSettings.nip_operator || currentUser?.nip || "___________________________";

  const today = new Date();
  const todayStr = `${today.getDate()} ${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;

  const kategoriLabel = roleFilter === "guru" ? "GURU" : roleFilter === "pegawai" ? "PEGAWAI / TATA USAHA" : "GURU & PEGAWAI";

  return (
    <div
      id="native-lkb-summary-print"
      className="official-lkb-summary-document"
      style={{
        width: "100%",
        background: "#ffffff",
        color: "#000000",
        fontFamily: "'Times New Roman', Times, Georgia, serif",
        fontSize: "9pt",
        lineHeight: 1.3
      }}
    >
      {/* ===== KOP SURAT RESMI ===== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          paddingBottom: "0.5rem"
        }}
      >
        <div style={{ width: "80px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <img src={LOGO_KEMENAG} alt="Logo Kemenag" style={{ width: "70px", height: "auto", maxHeight: "80px", objectFit: "contain" }} />
        </div>

        <div style={{ textAlign: "center", flex: 1, padding: "0 0.5rem" }}>
          <div style={{ fontSize: "10pt", fontWeight: 700, color: "#000", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.25 }}>
            KEMENTERIAN AGAMA REPUBLIK INDONESIA
          </div>
          <div style={{ fontSize: "9.5pt", fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "0.03em", marginTop: "2px", lineHeight: 1.25 }}>
            KANTOR KEMENTERIAN AGAMA {kota.toUpperCase()}
          </div>
          <div style={{ fontSize: "13pt", fontWeight: 900, color: "#000", letterSpacing: "0.02em", margin: "2px 0", lineHeight: 1.2, textTransform: "uppercase" }}>
            {namaSekolah}
          </div>
          <div style={{ fontSize: "8pt", color: "#222", fontStyle: "italic", marginTop: "2px" }}>
            <span>{safeSettings.alamat_sekolah || "Jl. Pendidikan Nasional, Kabupaten Gowa, Sulawesi Selatan"}</span>
            <span style={{ margin: "0 6px", fontStyle: "normal" }}>•</span>
            <span>Telp: {safeSettings.no_telp || safeSettings.telepon || "(0411) 861234"}</span>
          </div>
        </div>

        <div style={{ width: "80px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <img src={LOGO_SEKOLAH} alt="Logo Madrasah" style={{ width: "70px", height: "auto", maxHeight: "80px", objectFit: "contain" }} />
        </div>
      </div>

      {/* Garis Ganda Kop Surat */}
      <div style={{ borderBottom: "3px solid #000", width: "100%", margin: "3px 0 2px 0" }} />
      <div style={{ borderBottom: "1px solid #000", width: "100%", margin: "0 0 12px 0" }} />

      {/* ===== JUDUL LAPORAN ===== */}
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "11pt", fontWeight: 900, textDecoration: "underline", color: "#000", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          REKAPITULASI LAPORAN CAPAIAN KINERJA BULANAN (LKB) ASN {kategoriLabel}
        </div>
        <div style={{ fontSize: "9pt", fontWeight: 700, color: "#111", marginTop: "3px" }}>
          PERIODE: BULAN {bulan.toUpperCase()} TAHUN {tahun}
        </div>
      </div>

      {/* ===== RINGKASAN METRIK LKB ===== */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px", fontSize: "8pt", flexWrap: "wrap" }}>
        <div style={{ border: "1px solid #333", padding: "3px 8px", borderRadius: "4px" }}>
          <strong>Total ASN:</strong> {totalAsn} Orang
        </div>
        <div style={{ border: "1px solid #059669", background: "#f0fdf4", color: "#065f46", padding: "3px 8px", borderRadius: "4px" }}>
          <strong>Disahkan:</strong> {totalApproved}
        </div>
        <div style={{ border: "1px solid #d97706", background: "#fffbeb", color: "#b45309", padding: "3px 8px", borderRadius: "4px" }}>
          <strong>Menunggu Verifikasi:</strong> {totalPending}
        </div>
        <div style={{ border: "1px solid #64748b", background: "#f8fafc", color: "#475569", padding: "3px 8px", borderRadius: "4px" }}>
          <strong>Belum Mengajukan:</strong> {totalUnsubmitted}
        </div>
      </div>

      {/* ===== TABEL DATA REKAP LKB ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8pt", border: "1.5px solid #000" }}>
        <thead>
          <tr style={{ background: "#065f46", color: "#ffffff" }}>
            <th style={{ border: "1px solid #333", padding: "5px 4px", textAlign: "center", width: "30px", color: "#ffffff" }}>No</th>
            <th style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "left", color: "#ffffff" }}>Nama Lengkap ASN & NIP</th>
            <th style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "left", width: "130px", color: "#ffffff" }}>Jabatan & Satker</th>
            <th style={{ border: "1px solid #333", padding: "5px 4px", textAlign: "center", width: "70px", color: "#ffffff" }}>Kategori</th>
            <th style={{ border: "1px solid #333", padding: "5px 4px", textAlign: "center", width: "65px", color: "#ffffff" }}>Total Sesi</th>
            <th style={{ border: "1px solid #333", padding: "5px 4px", textAlign: "center", width: "95px", color: "#ffffff" }}>Status LKB</th>
            <th style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "left", width: "120px", color: "#ffffff" }}>Keterangan / TTE</th>
          </tr>
        </thead>
        <tbody>
          {safeData.length > 0 ? (
            safeData.map((item, idx) => {
              const isApproved = item.status === "Disetujui";
              const isPegawai = item.user.role === "pegawai";
              const satkerDisplay = item.user.satker || item.user.satuan_kerja || safeSettings?.satuan_kerja || "PENDIS";
              const jabatanDisplay = isPegawai ? (item.user.jabatan || "Staf Tata Usaha") : (item.user.mapel || "Guru Mapel");

              return (
                <tr key={item.user.id || idx} style={{ background: idx % 2 === 0 ? "#ffffff" : "#fbfbfb" }}>
                  <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: 700 }}>
                    {idx + 1}
                  </td>
                  <td style={{ border: "1px solid #333", padding: "4px 6px" }}>
                    <div style={{ fontWeight: 700 }}>{item.user.nama || item.user.username}</div>
                    <div style={{ fontSize: "7.5pt", color: "#333", fontFamily: "monospace" }}>NIP. {item.user.nip || "-"}</div>
                  </td>
                  <td style={{ border: "1px solid #333", padding: "4px 6px" }}>
                    <div>{jabatanDisplay}</div>
                    <div style={{ fontSize: "7.5pt", color: "#555" }}>Satker: {satkerDisplay}</div>
                  </td>
                  <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: 600 }}>
                    {isPegawai ? "Pegawai TU" : "Guru"}
                  </td>
                  <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: 700 }}>
                    {item.attCount || 0}
                  </td>
                  <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: 700 }}>
                    <span style={{ color: isApproved ? "#047857" : item.status.includes("Menunggu") ? "#b45309" : "#475569" }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ border: "1px solid #333", padding: "4px 6px", fontSize: "7.5pt" }}>
                    {isApproved
                      ? `Disahkan (${item.lkbRec?.tanggal_verifikasi || todayStr})`
                      : item.status === "Menunggu Verifikasi"
                      ? "Menunggu Konfirmasi"
                      : item.status === "Ditolak"
                      ? "Perlu Revisi"
                      : "-"}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} style={{ border: "1px solid #333", padding: "16px", textAlign: "center", color: "#64748b", fontStyle: "italic" }}>
                Tidak ada data LKB ASN pada periode ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ===== LEMBAR TANDA TANGAN RESMI ===== */}
      <div
        style={{
          marginTop: "24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2.5rem",
          pageBreakInside: "avoid"
        }}
      >
        {/* Kiri: Kepala Madrasah */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "8pt", color: "#333", marginBottom: "2px" }}>Mengetahui,</div>
          <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "#000" }}>Kepala {namaSekolah}</div>
          {(safeSettings.ttd_kepsek_url || safeSettings.stempel_sekolah_url) ? (
            <div style={{ position: "relative", width: "180px", height: "55px", margin: "4px auto 4px auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {safeSettings.stempel_sekolah_url && (
                <img
                  src={safeSettings.stempel_sekolah_url}
                  alt="Stempel"
                  style={{
                    position: "absolute",
                    left: "10px",
                    width: "55px",
                    height: "55px",
                    objectFit: "contain",
                    opacity: 0.88,
                    transform: "rotate(-5deg)",
                    pointerEvents: "none",
                    zIndex: 2
                  }}
                />
              )}
              {safeSettings.ttd_kepsek_url && (
                <img
                  src={safeSettings.ttd_kepsek_url}
                  alt="Tanda Tangan"
                  style={{
                    position: "relative",
                    width: "130px",
                    height: "50px",
                    objectFit: "contain",
                    zIndex: 1
                  }}
                />
              )}
            </div>
          ) : (
            <div style={{ height: "55px", margin: "6px auto", borderBottom: "1px solid #000", width: "70%" }} />
          )}
          <div style={{ fontSize: "9pt", fontWeight: 800, color: "#000" }}>{kepalaSekolah}</div>
          <div style={{ fontSize: "8pt", color: "#333" }}>NIP. {nipKepalaSekolah}</div>
        </div>

        {/* Kanan: Pengelola LKB / Operator */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "8pt", color: "#333", marginBottom: "2px" }}>
            {kota}, {todayStr}
          </div>
          <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "#000" }}>
            Pengelola LKB / Operator Kepegawaian
          </div>
          <div style={{ height: "55px", margin: "6px auto", borderBottom: "1px solid #000", width: "70%" }} />
          <div style={{ fontSize: "9pt", fontWeight: 800, color: "#000" }}>{namaOperator}</div>
          <div style={{ fontSize: "8pt", color: "#333" }}>NIP. {nipOperator}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal Pratinjau Cetak Rekap LKB Keseluruhan ASN (A4 Landscape / Portrait)
 */
export function PrintLkbSummaryModal({
  data = [],
  settings = {},
  currentUser = null,
  bulan = "Oktober",
  tahun = "2026",
  roleFilter = "Semua",
  orientation = "landscape",
  setOrientation = null,
  onClose = null
}) {
  const handlePrint = () => {
    window.print();
  };

  const handleOpenNewTab = () => {
    const printEl = document.getElementById("native-lkb-summary-print");
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
        <title>Rekapitulasi LKB ASN - ${bulan} ${tahun} - ${settings?.nama_sekolah || "Sekolah"}</title>
        <style>
          @page { size: A4 ${orientation}; margin: ${pageMargin}; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
          body { font-family: 'Times New Roman', Times, Georgia, serif; margin: 0; padding: 1.2cm; color: #000; background: #fff; }
          * { font-family: 'Times New Roman', Times, Georgia, serif !important; }
          table { width: 100%; border-collapse: collapse; page-break-inside: auto; break-inside: auto; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          thead { display: table-header-group; }
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: orientation === "landscape" ? "1100px" : "860px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
          transition: "max-width 0.25s ease"
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#065f46", margin: 0 }}>
              Pratinjau Cetak Rekapitulasi LKB ASN
            </h3>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.15rem 0 0 0" }}>
              Bulan {bulan} {tahun} • Format Resmi Dokumen Kedinasan Kemenag
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* Orientasi Toggle */}
            {setOrientation && (
              <div style={{ display: "flex", background: "#e2e8f0", borderRadius: "8px", padding: "2px" }}>
                <button
                  type="button"
                  onClick={() => setOrientation("landscape")}
                  style={{
                    padding: "0.3rem 0.65rem",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    borderRadius: "6px",
                    border: "none",
                    background: orientation === "landscape" ? "#065f46" : "transparent",
                    color: orientation === "landscape" ? "#ffffff" : "#475569",
                    cursor: "pointer"
                  }}
                >
                  Landscape (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation("portrait")}
                  style={{
                    padding: "0.3rem 0.65rem",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    borderRadius: "6px",
                    border: "none",
                    background: orientation === "portrait" ? "#065f46" : "transparent",
                    color: orientation === "portrait" ? "#ffffff" : "#475569",
                    cursor: "pointer"
                  }}
                >
                  Portrait
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleOpenNewTab}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.75rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                color: "#475569",
                cursor: "pointer"
              }}
              title="Buka dokumen di tab baru browser"
            >
              <ExternalLink size={14} />
              <span>Tab Baru</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 1rem",
                fontSize: "0.82rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)"
              }}
            >
              <Printer size={15} />
              <span>Cetak Sekarang</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b"
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Isi Dokumen (Scrollable Paper Preview) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem", background: "#e2e8f0" }}>
          <div
            style={{
              background: "#ffffff",
              padding: "2rem",
              borderRadius: "4px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              margin: "0 auto",
              maxWidth: "100%"
            }}
          >
            <OfficialLkbSummaryDocument
              data={data}
              settings={settings}
              bulan={bulan}
              tahun={tahun}
              currentUser={currentUser}
              roleFilter={roleFilter}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

