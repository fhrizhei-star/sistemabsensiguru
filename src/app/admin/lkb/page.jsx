"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import OfficialLkbIndividualDocument from "@/components/OfficialLkbIndividualDocument";
import { OfficialLkbSummaryDocument, PrintLkbSummaryModal } from "@/components/OfficialLkbSummaryDocument";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import { getAvatarUrl } from "@/lib/drive";
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
  RefreshCw,
  Filter,
  Check,
  X,
  Printer,
  GraduationCap,
  Briefcase,
  Camera,
  Download,
  Eye,
  UserCheck,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [String(CURRENT_YEAR - 1), String(CURRENT_YEAR), String(CURRENT_YEAR + 1)];

export default function AdminLkbPage({ fixedRole = null }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [lkbList, setLkbList] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Tab Utama: "preview_dokumen" (Pratinjau & Pengesahan) | "monitoring_asn" (Monitoring Status Semua ASN)
  const [activeTab, setActiveTab] = useState("preview_dokumen");

  // Filter Kategori ASN: "Semua" | "guru" | "pegawai"
  const [roleFilter, setRoleFilter] = useState(fixedRole || "Semua");

  // State Pilihan ASN & Periode untuk Pratinjau Dokumen
  const now = new Date();
  const [selectedAsnId, setSelectedAsnId] = useState("");
  const [kinerjaBulan, setKinerjaBulan] = useState(MONTH_NAMES[now.getMonth()] || "Oktober");
  const [kinerjaTahun, setKinerjaTahun] = useState(String(CURRENT_YEAR));

  // Search query di tabel monitoring
  const [searchQuery, setSearchQuery] = useState("");

  // Reject Modal State
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Modal Cetak Rekap Keseluruhan LKB
  const [showPrintSummaryModal, setShowPrintSummaryModal] = useState(false);
  const [summaryOrientation, setSummaryOrientation] = useState("landscape");

  // Toast Notification
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (fixedRole) {
      setRoleFilter(fixedRole);
    }
  }, [fixedRole]);

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
      const [res, tRes, aRes, sRes] = await Promise.all([
        Api.request("GET", "getLkb", {}),
        Api.request("GET", "getUsers"),
        Api.request("GET", "getAttendance", {}),
        Api.request("GET", "getSettings")
      ]);

      if (res && res.lkb) setLkbList(res.lkb);

      if (tRes && tRes.users) {
        const nonAdmin = tRes.users.filter((u) => u.role !== "admin");
        setTeachers(nonAdmin);
        if (nonAdmin.length > 0 && !selectedAsnId) {
          // Prioritaskan Zulhana jika ada, atau ASN pertama
          const zul = nonAdmin.find((u) => (u.nama || "").toLowerCase().includes("zulhana"));
          setSelectedAsnId(zul ? zul.id : nonAdmin[0].id);
        }
      }

      if (aRes && (aRes.attendance || aRes.list)) {
        setAllAttendance(aRes.attendance || aRes.list || []);
      }

      if (sRes && sRes.settings) setSettings(sRes.settings);
    } catch (err) {
      console.error("Gagal mengambil data LKB & Presensi:", err);
      showToast("error", "Gagal memuat data LKB dari server.");
    } finally {
      setLoading(false);
    }
  };

  // List opsi ASN yang disaring berdasarkan fixedRole atau roleFilter
  const asnOptions = useMemo(() => {
    let list = teachers;
    if (roleFilter === "guru") list = list.filter((t) => t.role === "guru");
    if (roleFilter === "pegawai") list = list.filter((t) => t.role === "pegawai");
    return list;
  }, [teachers, roleFilter]);

  // ASN yang sedang aktif dipilih untuk pratinjau & pengesahan
  const selectedAsnUser = useMemo(() => {
    if (!asnOptions || asnOptions.length === 0) return null;
    const found = asnOptions.find((t) => t.id === selectedAsnId);
    return found || asnOptions[0];
  }, [asnOptions, selectedAsnId]);

  // Presensi berfoto milik ASN terpilih pada bulan & tahun terpilih
  const selectedAsnAttendance = useMemo(() => {
    if (!selectedAsnUser) return [];
    const mIdx = MONTH_NAMES.indexOf(kinerjaBulan) + 1; // 1 - 12
    const padMonth = String(mIdx).padStart(2, "0");
    const yearStr = String(kinerjaTahun);

    return (allAttendance || []).filter((rec) => {
      if (String(rec.user_id) !== String(selectedAsnUser.id) && String(rec.nip) !== String(selectedAsnUser.nip)) return false;
      if (!rec.tanggal) return false;
      const t = String(rec.tanggal).trim();
      if (t.startsWith(`${yearStr}-${padMonth}`)) return true;
      const d = new Date(t);
      if (!isNaN(d.getTime())) {
        return d.getFullYear() === Number(yearStr) && d.getMonth() + 1 === mIdx;
      }
      return false;
    });
  }, [allAttendance, selectedAsnUser, kinerjaBulan, kinerjaTahun]);

  // Record pengajuan LKB milik ASN terpilih pada bulan & tahun terpilih
  const selectedAsnLkbRecord = useMemo(() => {
    if (!selectedAsnUser) return null;
    return lkbList.find((item) => {
      const isUserMatch = String(item.user_id) === String(selectedAsnUser.id) ||
        (item.nip && item.nip === selectedAsnUser.nip) ||
        (item.nama && selectedAsnUser.nama && item.nama.toLowerCase() === selectedAsnUser.nama.toLowerCase());
      const isBulanMatch = (item.bulan || "").toLowerCase() === kinerjaBulan.toLowerCase();
      const isTahunMatch = String(item.tahun || "") === String(kinerjaTahun);
      return isUserMatch && isBulanMatch && isTahunMatch;
    });
  }, [lkbList, selectedAsnUser, kinerjaBulan, kinerjaTahun]);

  const approvalStatus = selectedAsnLkbRecord?.status || "Belum Diajukan";

  // Pengesahan LKB (Konfirmasi & Approve) Langsung oleh Admin
  const handleApproveCurrentAsn = async (customAsn = null) => {
    const targetUser = customAsn || selectedAsnUser;
    if (!targetUser) return;

    setActionLoading(true);
    try {
      const isPegawai = targetUser.role === "pegawai";
      const count = customAsn
        ? (allAttendance || []).filter((r) => {
          const mIdx = MONTH_NAMES.indexOf(kinerjaBulan) + 1;
          const padMonth = String(mIdx).padStart(2, "0");
          const t = String(r.tanggal || "").trim();
          return (String(r.user_id) === String(targetUser.id) || String(r.nip) === String(targetUser.nip)) && t.startsWith(`${kinerjaTahun}-${padMonth}`);
        }).length
        : selectedAsnAttendance.length;

      const verifikator = currentUser?.nama || settings?.kepala_madrasah || "Admin Madrasah";
      const todayDate = getTodayDateStr();

      // Cari apakah sudah ada pengajuan LKB sebelumnya
      const existing = lkbList.find((item) => {
        const matchU = String(item.user_id) === String(targetUser.id) || (item.nip && item.nip === targetUser.nip);
        const matchB = (item.bulan || "").toLowerCase() === kinerjaBulan.toLowerCase();
        const matchY = String(item.tahun || "") === String(kinerjaTahun);
        return matchU && matchB && matchY;
      });

      let res;
      if (existing?.id) {
        // Dokumen sudah ada di database -> perbarui status menjadi Disetujui
        res = await Api.request("POST", "updateLkbStatus", {}, {
          id: existing.id,
          user_id: targetUser.id,
          nip: targetUser.nip || "-",
          bulan: kinerjaBulan,
          tahun: kinerjaTahun,
          status: "Disetujui",
          alasan_penolakan: "",
          diverifikasi_oleh: verifikator,
          tanggal_verifikasi: todayDate
        });
      } else {
        // Direct Approve: dokumen belum diajukan oleh guru -> buatkan record langsung berstatus Disetujui
        const payload = {
          user_id: targetUser.id,
          nama: targetUser.nama || targetUser.username,
          nip: targetUser.nip || "-",
          role: targetUser.role || (targetUser.mapel ? "guru" : "pegawai"),
          satker: targetUser.satker || targetUser.satuan_kerja || settings?.satuan_kerja || settings?.satker || "PENDIS",
          mapel_jabatan: isPegawai
            ? (targetUser.jabatan || "Staf Tata Usaha")
            : (targetUser.mapel || "Guru Mata Pelajaran"),
          bulan: kinerjaBulan,
          tahun: kinerjaTahun,
          judul: `Laporan Capaian Kinerja Bulanan ASN - ${kinerjaBulan} ${kinerjaTahun}`,
          catatan: `Disahkan oleh Admin/Verifikator (${count} sesi presensi berfoto)`,
          status: "Disetujui",
          diverifikasi_oleh: verifikator,
          tanggal_verifikasi: todayDate,
          file_name: `LKB_${kinerjaBulan}_${kinerjaTahun}.pdf`,
          file_url: "SISTEM_PRESENSI_OTOMATIS",
          file_size: `${count} Sesi Terdata`
        };
        res = await Api.request("POST", "submitLkb", {}, payload);
      }

      if (res && (res.success || res.status === "success")) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
        showToast("success", `Dokumen LKB Bulan ${kinerjaBulan} milik ${targetUser.nama || targetUser.username} BERHASIL DISAHKAN!`);
        await fetchData();
      } else {
        showToast("error", res?.message || "Gagal mengesahkan LKB.");
      }
    } catch (err) {
      console.error("Error approving LKB:", err);
      showToast("error", "Terjadi kesalahan sistem saat mengesahkan LKB.");
    } finally {
      setActionLoading(false);
    }
  };

  // Buka Modal Penolakan / Catatan Revisi
  const openRejectModal = (customAsn = null) => {
    setRejectModalItem(customAsn || selectedAsnUser);
    setRejectionReason("");
  };

  const closeRejectModal = () => {
    setRejectModalItem(null);
    setRejectionReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalItem) return;
    if (!rejectionReason.trim()) {
      alert("Harap masukkan catatan revisi atau alasan penolakan agar ASN mengetahui bagian mana yang perlu diperbaiki.");
      return;
    }

    setActionLoading(true);
    try {
      const verifikator = currentUser?.nama || "Admin Madrasah";
      const todayDate = getTodayDateStr();

      const existing = lkbList.find((item) => {
        const matchU = String(item.user_id) === String(rejectModalItem.id) || (item.nip && item.nip === rejectModalItem.nip);
        const matchB = (item.bulan || "").toLowerCase() === kinerjaBulan.toLowerCase();
        const matchY = String(item.tahun || "") === String(kinerjaTahun);
        return matchU && matchB && matchY;
      });

      let res;
      if (existing?.id) {
        res = await Api.request("POST", "updateLkbStatus", {}, {
          id: existing.id,
          user_id: rejectModalItem.id,
          nip: rejectModalItem.nip || "-",
          bulan: kinerjaBulan,
          tahun: kinerjaTahun,
          status: "Ditolak",
          alasan_penolakan: rejectionReason.trim(),
          diverifikasi_oleh: verifikator,
          tanggal_verifikasi: todayDate
        });
      } else {
        const isPegawai = rejectModalItem.role === "pegawai";
        const payload = {
          user_id: rejectModalItem.id,
          nama: rejectModalItem.nama || rejectModalItem.username,
          nip: rejectModalItem.nip || "-",
          role: rejectModalItem.role || (rejectModalItem.mapel ? "guru" : "pegawai"),
          satker: rejectModalItem.satker || rejectModalItem.satuan_kerja || settings?.satuan_kerja || "PENDIS",
          mapel_jabatan: isPegawai ? (rejectModalItem.jabatan || "Staf TU") : (rejectModalItem.mapel || "Guru"),
          bulan: kinerjaBulan,
          tahun: kinerjaTahun,
          judul: `Laporan Capaian Kinerja Bulanan ASN - ${kinerjaBulan} ${kinerjaTahun}`,
          catatan: `Perlu perbaikan: ${rejectionReason.trim()}`,
          status: "Ditolak",
          alasan_penolakan: rejectionReason.trim(),
          diverifikasi_oleh: verifikator,
          tanggal_verifikasi: todayDate,
          file_name: `LKB_${kinerjaBulan}_${kinerjaTahun}.pdf`,
          file_url: "SISTEM_PRESENSI_OTOMATIS",
          file_size: "Perlu Revisi"
        };
        res = await Api.request("POST", "submitLkb", {}, payload);
      }

      if (res && (res.success || res.status === "success")) {
        showToast("info", `Dokumen LKB milik ${rejectModalItem.nama || rejectModalItem.username} dikembalikan dengan catatan revisi.`);
        closeRejectModal();
        await fetchData();
      } else {
        showToast("error", res?.message || "Gagal memperbarui status.");
      }
    } catch (err) {
      console.error("Error rejecting LKB:", err);
      showToast("error", "Terjadi kesalahan sistem saat menolak LKB.");
    } finally {
      setActionLoading(false);
    }
  };

  // Data Tabel Monitoring Seluruh ASN pada Bulan & Tahun yang Dipilih
  const monitoringData = useMemo(() => {
    const mIdx = MONTH_NAMES.indexOf(kinerjaBulan) + 1;
    const padMonth = String(mIdx).padStart(2, "0");
    const yearStr = String(kinerjaTahun);

    return asnOptions.map((user) => {
      // Hitung sesi presensi berfoto pada bulan ini
      const attCount = (allAttendance || []).filter((r) => {
        if (String(r.user_id) !== String(user.id) && String(r.nip) !== String(user.nip)) return false;
        const t = String(r.tanggal || "").trim();
        return t.startsWith(`${yearStr}-${padMonth}`);
      }).length;

      // Cari status LKB
      const lkbRec = lkbList.find((item) => {
        const isUserMatch = String(item.user_id) === String(user.id) ||
          (item.nip && item.nip === user.nip) ||
          (item.nama && user.nama && item.nama.toLowerCase() === user.nama.toLowerCase());
        const isBulanMatch = (item.bulan || "").toLowerCase() === kinerjaBulan.toLowerCase();
        const isTahunMatch = String(item.tahun || "") === String(kinerjaTahun);
        return isUserMatch && isBulanMatch && isTahunMatch;
      });

      return {
        user,
        attCount,
        lkbRec,
        status: lkbRec?.status || (attCount > 0 ? "Belum Diajukan" : "Belum Ada Presensi")
      };
    }).filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const n = (item.user.nama || "").toLowerCase();
      const nip = (item.user.nip || "").toLowerCase();
      const m = (item.user.mapel || item.user.jabatan || "").toLowerCase();
      return n.includes(q) || nip.includes(q) || m.includes(q);
    });
  }, [asnOptions, allAttendance, lkbList, kinerjaBulan, kinerjaTahun, searchQuery]);

  // Statistik Pengesahan Bulan Terpilih
  const monthStats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    let unsubmitted = 0;

    monitoringData.forEach((d) => {
      if (d.status === "Disetujui") approved++;
      else if (d.status === "Menunggu Verifikasi" || d.status === "Menunggu") pending++;
      else if (d.status === "Ditolak") rejected++;
      else unsubmitted++;
    });

    return { total: monitoringData.length, approved, pending, rejected, unsubmitted };
  }, [monitoringData]);

  // Ekspor Rekapitulasi Seluruh LKB ASN ke Excel (.xls)
  const handleExportExcelAll = () => {
    const kota = settings?.kota || "Kabupaten Gowa";
    const namaSekolah = settings?.nama_sekolah || "MTsN GOWA";
    const today = new Date();
    const tglCetak = `${today.getDate()} ${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;

    let rowsHtml = "";
    monitoringData.forEach((item, idx) => {
      const isPegawai = item.user.role === "pegawai";
      const satkerDisplay = item.user.satker || item.user.satuan_kerja || settings?.satuan_kerja || "PENDIS";
      const jabatanDisplay = isPegawai ? (item.user.jabatan || "Staf Tata Usaha") : (item.user.mapel || "Guru Mapel");

      rowsHtml += `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
          <td style="text-align: left; font-weight: 600; border: 1px solid #cbd5e1; padding: 6px 8px;">${item.user.nama || item.user.username}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; mso-number-format: '\\@';">${String(item.user.nip || "-").replace(/^'/, "")}</td>
          <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${jabatanDisplay}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${satkerDisplay}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${isPegawai ? "Pegawai TU" : "Guru"}</td>
          <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${item.attCount || 0}</td>
          <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${item.status}</td>
          <td style="text-align: left; border: 1px solid #cbd5e1; padding: 6px 8px;">${item.status === "Disetujui" ? `Disahkan (${item.lkbRec?.tanggal_verifikasi || tglCetak})` : "-"}</td>
        </tr>
      `;
    });

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
          .th-header { background-color: #065f46; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #000; padding: 8px; }
          td { mso-number-format: '\\@'; }
        </style>
      </head>
      <body>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td colspan="9" style="text-align: center; font-size: 14pt; font-weight: bold; padding: 8px;">
              KEMENTERIAN AGAMA REPUBLIK INDONESIA - ${namaSekolah.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td colspan="9" style="text-align: center; font-size: 12pt; font-weight: bold; padding: 4px;">
              REKAPITULASI LAPORAN CAPAIAN KINERJA BULANAN (LKB) SELURUH ASN
            </td>
          </tr>
          <tr>
            <td colspan="9" style="text-align: center; font-size: 11pt; padding: 4px;">
              Periode: Bulan ${kinerjaBulan} Tahun ${kinerjaTahun} | Dicetak: ${tglCetak}
            </td>
          </tr>
          <tr><td colspan="9"></td></tr>
          <thead>
            <tr>
              <th class="th-header" style="width: 40px;">NO</th>
              <th class="th-header" style="width: 220px;">NAMA LENGKAP ASN</th>
              <th class="th-header" style="width: 160px;">NIP</th>
              <th class="th-header" style="width: 180px;">JABATAN</th>
              <th class="th-header" style="width: 120px;">SATKER</th>
              <th class="th-header" style="width: 100px;">KATEGORI</th>
              <th class="th-header" style="width: 90px;">TOTAL SESI</th>
              <th class="th-header" style="width: 130px;">STATUS LKB</th>
              <th class="th-header" style="width: 180px;">KETERANGAN PENGESAHAN</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `REKAP_LKB_${kinerjaBulan.toUpperCase()}_${kinerjaTahun}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!currentUser) return null;

  return (
    <>
      <Navbar role="admin" />
      <div className="no-print" style={{ display: "flex", flex: 1 }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "2rem", overflowX: "hidden" }}>
          {/* Header Title */}
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
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "0.2rem 0.7rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.35rem" }}>
                <ShieldCheck size={14} color="#059669" /> PANEL PENGESAHAN LKB RESMI
              </div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-main)", margin: "0 0 0.25rem" }}>
                {roleFilter === "pegawai"
                  ? "Verifikasi LKB Pegawai"
                  : roleFilter === "guru"
                    ? "Verifikasi LKB Guru"
                    : "Verifikasi LKB ASN"}
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                Pemeriksaan evident kamera dan pengesahan resmi Laporan Kinerja Bulanan {roleFilter === "pegawai" ? "pegawai tata usaha" : roleFilter === "guru" ? "guru madrasah" : "seluruh ASN"}.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={fetchData}
                style={{
                  padding: "0.5rem 0.9rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border-light)",
                  background: "#ffffff",
                  color: "var(--text-main)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                }}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Segarkan Data
              </button>
            </div>
          </div>

          {/* Tab Utama: Pratinjau Dokumen vs Tabel Monitoring Semua ASN */}
          <div
            style={{
              display: "flex",
              gap: "0.65rem",
              marginBottom: "1.25rem",
              flexWrap: "wrap"
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("preview_dokumen")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.15rem",
                borderRadius: "10px",
                border: activeTab === "preview_dokumen" ? "2px solid #059669" : "1.5px solid var(--border-light)",
                background: activeTab === "preview_dokumen" ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" : "#ffffff",
                color: activeTab === "preview_dokumen" ? "#065f46" : "var(--text-secondary)",
                fontWeight: 800,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: activeTab === "preview_dokumen" ? "0 4px 12px rgba(5, 150, 105, 0.18)" : "var(--shadow-sm)",
                transition: "all 0.2s ease"
              }}
            >
              <Eye size={17} color={activeTab === "preview_dokumen" ? "#059669" : "#64748b"} />
              <span>Pratinjau Dokumen</span>
              <span
                style={{
                  fontSize: "0.72rem",
                  background: activeTab === "preview_dokumen" ? "#059669" : "#f1f5f9",
                  color: activeTab === "preview_dokumen" ? "#ffffff" : "#64748b",
                  padding: "0.1rem 0.5rem",
                  borderRadius: "999px",
                  fontWeight: 600
                }}
              >
                {selectedAsnAttendance.length} Sesi
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("monitoring_asn")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.15rem",
                borderRadius: "10px",
                border: activeTab === "monitoring_asn" ? "2px solid #2563eb" : "1.5px solid var(--border-light)",
                background: activeTab === "monitoring_asn" ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" : "#ffffff",
                color: activeTab === "monitoring_asn" ? "#1e40af" : "var(--text-secondary)",
                fontWeight: 800,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: activeTab === "monitoring_asn" ? "0 4px 12px rgba(37, 99, 235, 0.18)" : "var(--shadow-sm)",
                transition: "all 0.2s ease"
              }}
            >
              <FileCheck size={17} color={activeTab === "monitoring_asn" ? "#2563eb" : "#64748b"} />
              <span>Daftar LKB ASN</span>
              <span
                style={{
                  fontSize: "0.72rem",
                  background: activeTab === "monitoring_asn" ? "#2563eb" : monthStats.pending > 0 ? "#f59e0b" : "#f1f5f9",
                  color: activeTab === "monitoring_asn" || monthStats.pending > 0 ? "#ffffff" : "#64748b",
                  padding: "0.1rem 0.5rem",
                  borderRadius: "999px",
                  fontWeight: 600
                }}
              >
                {monthStats.pending > 0 ? `${monthStats.pending} Perlu Tindakan` : `${monthStats.total} ASN`}
              </span>
            </button>
          </div>

          {/* Sub-Filter Kategori Peran: SEMUA PERAN vs GURU vs PEGAWAI (Jika panel umum) */}
          {!fixedRole && (
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
                Kategori ASN:
              </span>

              {[
                { id: "Semua", label: "Semua ASN", icon: UserCheck, color: "#4f46e5" },
                { id: "guru", label: "Guru / Pendidik", icon: GraduationCap, color: "#059669" },
                { id: "pegawai", label: "Pegawai / Staf TU", icon: Briefcase, color: "#0284c7" }
              ].map((r) => {
                const active = roleFilter === r.id;
                const IconComp = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoleFilter(r.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      padding: "0.42rem 0.95rem",
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
                  </button>
                );
              })}
            </div>
          )}

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
                  background: toast.type === "success" ? "#065f46" : toast.type === "info" ? "#1e40af" : "#9f1239",
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

          {/* TAB 1: PRATINJAU DOKUMEN & PENGESAHAN LANGSUNG */}
          {activeTab === "preview_dokumen" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Filter Bar Pemilihan ASN & Periode */}
              <div
                className="glass-panel"
                style={{
                  padding: "1.25rem 1.5rem",
                  borderRadius: "var(--radius-lg)",
                  background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
                  border: "1.5px solid #bbf7d0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
                      color: "#059669"
                    }}
                  >
                    <Camera size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)" }}>
                      Pilih ASN & Periode Bulan
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      Dokumen resmi tabel 5 kolom otomatis tersusun dari data presensi kamera madrasah
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, color: "var(--text-secondary)", marginBottom: "0.25rem", textTransform: "uppercase" }}>
                      Nama Guru / Pegawai
                    </label>
                    <select
                      value={selectedAsnId}
                      onChange={(e) => setSelectedAsnId(e.target.value)}
                      className="neon-select"
                      style={{ padding: "0.55rem 0.95rem", fontSize: "0.88rem", fontWeight: 700, borderRadius: "8px", minWidth: "220px", background: "#ffffff" }}
                    >
                      {asnOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nama || u.username} ({u.role === "pegawai" ? "Pegawai" : "Guru"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, color: "var(--text-secondary)", marginBottom: "0.25rem", textTransform: "uppercase" }}>
                      Bulan
                    </label>
                    <select
                      value={kinerjaBulan}
                      onChange={(e) => setKinerjaBulan(e.target.value)}
                      className="neon-select"
                      style={{ padding: "0.55rem 0.95rem", fontSize: "0.88rem", fontWeight: 700, borderRadius: "8px", minWidth: "130px", background: "#ffffff" }}
                    >
                      {MONTH_NAMES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, color: "var(--text-secondary)", marginBottom: "0.25rem", textTransform: "uppercase" }}>
                      Tahun
                    </label>
                    <select
                      value={kinerjaTahun}
                      onChange={(e) => setKinerjaTahun(e.target.value)}
                      className="neon-select"
                      style={{ padding: "0.55rem 0.95rem", fontSize: "0.88rem", fontWeight: 700, borderRadius: "8px", minWidth: "100px", background: "#ffffff" }}
                    >
                      {YEAR_OPTIONS.map((y) => (
                        <option key={y} value={String(y)}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Komponen Dokumen Cetak A4, Live Preview & One-Click Approval */}
              {selectedAsnUser ? (
                <OfficialLkbIndividualDocument
                  user={selectedAsnUser}
                  bulan={kinerjaBulan}
                  tahun={kinerjaTahun}
                  attendanceRecords={selectedAsnAttendance}
                  settings={settings}
                  approvalStatus={approvalStatus}
                  verifiedBy={selectedAsnLkbRecord?.diverifikasi_oleh || ""}
                  verifiedAt={selectedAsnLkbRecord?.tanggal_verifikasi || ""}
                  rejectionNote={selectedAsnLkbRecord?.alasan_penolakan || ""}
                  isViewerAdmin={true}
                  onApprove={() => handleApproveCurrentAsn()}
                  onReject={() => openRejectModal()}
                />
              ) : (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                  Silakan pilih ASN untuk melihat laporan kinerja bulanan.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MONITORING PENGESAHAN SELURUH ASN */}
          {activeTab === "monitoring_asn" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Stat Cards Monitoring Bulan Terpilih */}
              <div className="admin-metrics-grid" style={{ gap: "1rem" }}>
                <div className="glass-panel" style={{ padding: "1.15rem 1.25rem", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)", border: "1.5px solid #c7d2fe" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase" }}>Total Seluruh ASN</div>
                      <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "var(--text-main)", marginTop: "0.2rem" }}>{monthStats.total}</div>
                    </div>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <UserCheck size={20} color="#4f46e5" />
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: "1.15rem 1.25rem", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)", border: "1.5px solid #a7f3d0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>Telah Disahkan</div>
                      <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#047857", marginTop: "0.2rem" }}>{monthStats.approved}</div>
                    </div>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle2 size={20} color="#059669" />
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: "1.15rem 1.25rem", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)", border: "1.5px solid #fde68a" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#d97706", textTransform: "uppercase" }}>Menunggu Konfirmasi</div>
                      <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#b45309", marginTop: "0.2rem" }}>{monthStats.pending}</div>
                    </div>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Clock size={20} color="#d97706" />
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: "1.15rem 1.25rem", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", border: "1.5px solid #cbd5e1" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Belum Mengajukan</div>
                      <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#475569", marginTop: "0.2rem" }}>{monthStats.unsubmitted}</div>
                    </div>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AlertTriangle size={20} color="#64748b" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Rekapitulasi & Export Semua LKB */}
              <div
                className="glass-panel"
                style={{
                  padding: "1.25rem 1.5rem",
                  borderRadius: "var(--radius-lg)",
                  background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                  border: "1.5px solid #a7f3d0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "#059669",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
                    }}
                  >
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#065f46", margin: 0 }}>
                      Rekapitulasi Laporan Kinerja Bulanan (LKB) Seluruh ASN
                    </h3>
                    <p style={{ fontSize: "0.82rem", color: "#047857", margin: "0.2rem 0 0 0" }}>
                      Export dan pratinjau rekap data LKB gabungan seluruh Guru & Pegawai periode {kinerjaBulan} {kinerjaTahun} berformat resmi kedinasan.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleExportExcelAll}
                    className="btn-neon-secondary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      background: "#ffffff",
                      color: "#059669",
                      borderColor: "#a7f3d0",
                      fontWeight: 700,
                      fontSize: "0.84rem",
                      padding: "0.55rem 1rem",
                      borderRadius: "8px",
                      boxShadow: "0 2px 6px rgba(5, 150, 105, 0.12)"
                    }}
                  >
                    <Download size={15} />
                    <span>Export Rekap Excel (.xls)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrintSummaryModal(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 800,
                      fontSize: "0.84rem",
                      padding: "0.55rem 1.15rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)"
                    }}
                  >
                    <Printer size={15} />
                    <span>Pratinjau & Cetak Rekap (A4)</span>
                  </button>
                </div>
              </div>

              {/* Bar Filter & Search Monitoring */}
              <div
                className="glass-panel"
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "var(--radius-lg)",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.85rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: "1 1 280px" }}>
                  <Search size={18} color="#94a3b8" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama guru, pegawai, NIP, atau mapel..."
                    className="neon-input"
                    style={{ padding: "0.5rem 0.85rem", fontSize: "0.88rem" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                    Periode:
                  </span>
                  <select
                    value={kinerjaBulan}
                    onChange={(e) => setKinerjaBulan(e.target.value)}
                    className="neon-select"
                    style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", fontWeight: 700 }}
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={kinerjaTahun}
                    onChange={(e) => setKinerjaTahun(e.target.value)}
                    className="neon-select"
                    style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", fontWeight: 700 }}
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabel Ringkasan Monitoring ASN */}
              <div className="glass-panel" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#ffffff", border: "1px solid var(--border-light)" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid var(--border-light)", color: "var(--text-secondary)", textAlign: "left" }}>
                        <th style={{ padding: "0.85rem 0.75rem", width: "45px", textAlign: "center" }}>No</th>
                        <th style={{ padding: "0.85rem 1rem", minWidth: "220px" }}>Nama ASN & NIP</th>
                        <th style={{ padding: "0.85rem 1rem", minWidth: "200px" }}>Jabatan & Satker</th>
                        <th style={{ padding: "0.85rem 1rem", textAlign: "center", width: "150px" }}>Status LKB</th>
                        <th style={{ padding: "0.85rem 1rem", textAlign: "center", width: "170px" }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monitoringData.length > 0 ? (
                        monitoringData.map((item, idx) => {
                          const isApproved = item.status === "Disetujui";
                          const isPending = item.status === "Menunggu Verifikasi" || item.status === "Menunggu";
                          const isRejected = item.status === "Ditolak";
                          const isPegawai = item.user.role === "pegawai";
                          const satkerDisplay = item.user.satker || item.user.satuan_kerja || settings?.satuan_kerja || settings?.satker || "PENDIS";
                          const jabatanDisplay = isPegawai ? (item.user.jabatan || "Staf Tata Usaha") : (item.user.mapel || "Guru Mata Pelajaran");

                          return (
                            <tr
                              key={item.user.id || idx}
                              style={{
                                borderBottom: "1px solid var(--border-light)",
                                transition: "background 0.15s ease",
                                background: idx % 2 === 0 ? "#ffffff" : "#fcfcfd"
                              }}
                            >
                              <td style={{ padding: "0.85rem 0.75rem", textAlign: "center", color: "var(--text-muted)", fontWeight: 700 }}>
                                {idx + 1}
                              </td>

                              {/* Kolom Nama & NIP */}
                              <td style={{ padding: "0.85rem 0.1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  <img
                                    src={getAvatarUrl(item.user.foto_url, item.user.nama || item.user.username)}
                                    alt={item.user.nama}
                                    style={{ width: "35px", height: "35px", borderRadius: "10px", objectFit: "cover", flexShrink: 0, border: "1px solid #e2e8f0" }}
                                  />
                                  <div style={{ minWidth: 0, maxWidth: "180px" }}>
                                    <div
                                      title={item.user.nama || item.user.username}
                                      style={{
                                        fontWeight: 800,
                                        color: "var(--text-main)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                      }}
                                    >
                                      {item.user.nama || item.user.username}
                                    </div>
                                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      NIP: {item.user.nip || "-"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Kolom Jabatan & Satker (Clean Typography) */}
                              <td style={{ padding: "0.85rem 0.1rem" }}>
                                <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.84rem" }}>
                                  {jabatanDisplay}
                                </div>
                                <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                  <span style={{ fontWeight: 700, color: isPegawai ? "#0284c7" : "#059669" }}>
                                    {isPegawai ? "Pegawai TU" : "Guru"}
                                  </span>
                                  <span>•</span>
                                  <span>Satker: <strong>{satkerDisplay}</strong></span>
                                </div>
                              </td>

                              {/* Kolom Status LKB */}
                              <td style={{ padding: "0.85rem 2rem", textAlign: "center" }}>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                    fontSize: "0.74rem",
                                    fontWeight: 800,
                                    padding: "0.25rem 0.65rem ",
                                    borderRadius: "999px",
                                    whiteSpace: "nowrap",
                                    background: isApproved ? "#ecfdf5" : isPending ? "#fffbeb" : isRejected ? "#fef2f2" : "#f8fafc",
                                    color: isApproved ? "#065f46" : isPending ? "#92400e" : isRejected ? "#991b1b" : "#475569",
                                    border: `1px solid ${isApproved ? "#a7f3d0" : isPending ? "#fde68a" : isRejected ? "#fecaca" : "#cbd5e1"}`
                                  }}
                                >
                                  {isApproved && <CheckCircle2 size={12} color="#059669" />}
                                  {isPending && <Clock size={12} color="#d97706" />}
                                  {isRejected && <XCircle size={12} color="#dc2626" />}
                                  {!isApproved && !isPending && !isRejected && <AlertTriangle size={12} color="#64748b" />}
                                  {isApproved ? "Disetujui" : isPending ? "Menunggu Verifikasi" : isRejected ? "Perlu Revisi" : "Belum Diajukan"}
                                </span>
                              </td>

                              {/* Kolom Aksi */}
                              <td style={{ padding: "0.85rem 0.8rem", textAlign: "center" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAsnId(item.user.id);
                                      setActiveTab("preview_dokumen");
                                    }}
                                    className="btn-neon-secondary"
                                    style={{
                                      fontSize: "0.76rem",
                                      padding: "0.32rem 0.65rem",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.3rem",
                                      borderRadius: "8px",
                                      whiteSpace: "nowrap"
                                    }}
                                    title="Buka Dokumen LKB"
                                  >
                                    <Eye size={13} /> Lihat
                                  </button>

                                  {!isApproved && item.attCount > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => handleApproveCurrentAsn(item.user)}
                                      disabled={actionLoading}
                                      style={{
                                        fontSize: "0.76rem",
                                        padding: "0.32rem 0.75rem",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.3rem",
                                        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: 800,
                                        cursor: actionLoading ? "not-allowed" : "pointer",
                                        whiteSpace: "nowrap",
                                        boxShadow: "0 2px 6px rgba(5, 150, 105, 0.2)"
                                      }}
                                      title="Sahkan Dokumen LKB ASN"
                                    >
                                      <Check size={13} /> Sahkan
                                    </button>
                                  ) : isApproved ? (
                                    <span
                                      style={{
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        color: "#059669",
                                        background: "#ecfdf5",
                                        border: "1px solid #a7f3d0",
                                        padding: "0.22rem 0.5rem",
                                        borderRadius: "6px",
                                        whiteSpace: "nowrap"
                                      }}
                                    >
                                      ✓ Sah
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                            Tidak ada ASN yang sesuai dengan pencarian Anda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Reject / Revision Modal */}
      <AnimatePresence>
        {rejectModalItem && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem"
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeRejectModal}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 23, 42, 0.5)",
                backdropFilter: "blur(4px)"
              }}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "480px",
                background: "#ffffff",
                borderRadius: "var(--radius-xl)",
                padding: "1.75rem",
                boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.2)",
                zIndex: 101
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                    Minta Perbaikan Dokumen LKB
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                    ASN: <strong>{rejectModalItem.nama}</strong> ({kinerjaBulan} {kinerjaTahun})
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Catatan Perbaikan / Alasan Penolakan:
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Foto evident pada tanggal 12 kurang jelas, mohon periksa catatan materi mengajar..."
                  className="neon-input"
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="btn-neon-secondary"
                  style={{ fontSize: "0.85rem", padding: "0.6rem 1rem" }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  disabled={actionLoading}
                  className="btn-neon-danger"
                  style={{ fontSize: "0.85rem", padding: "0.6rem 1.25rem" }}
                >
                  {actionLoading ? "Menyimpan..." : "Kirim Catatan Revisi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Pratinjau & Cetak Rekapitulasi LKB Seluruh ASN */}
      <AnimatePresence>
        {showPrintSummaryModal && (
          <PrintLkbSummaryModal
            data={monitoringData}
            settings={settings}
            currentUser={currentUser}
            bulan={kinerjaBulan}
            tahun={kinerjaTahun}
            roleFilter={roleFilter}
            orientation={summaryOrientation}
            setOrientation={setSummaryOrientation}
            onClose={() => setShowPrintSummaryModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
