"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function AdminIzinPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    fetchLeaves();
  }, [router]);

  const fetchLeaves = async () => {
    setLoading(true);
    const res = await Api.request("GET", "getLeaves", {});
    if (res && res.leaves) setLeaves(res.leaves);
    setLoading(false);
  };

  const handleApprove = async (id) => {
    const res = await Api.request("POST", "updateLeaveStatus", {}, { id, status: "Disetujui" });
    if (res && res.success) {
      fetchLeaves();
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalId) return;
    const res = await Api.request("POST", "updateLeaveStatus", {}, {
      id: rejectModalId,
      status: "Ditolak",
      rejection_reason: rejectReason || "Permohonan tidak memenuhi syarat dinas"
    });
    if (res && res.success) {
      setRejectModalId(null);
      setRejectReason("");
      fetchLeaves();
    }
  };

  const filtered = leaves.filter((l) => {
    if (filterStatus === "Semua") return true;
    return l.status === filterStatus;
  });

  const pendingCount = leaves.filter((l) => l.status === "Menunggu Verifikasi").length;

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
                Verifikasi Cuti & Izin Guru
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Persetujuan permohonan dispensasi, dinas luar, dan surat sakit guru
              </p>
            </div>

            {pendingCount > 0 && (
              <span
                style={{
                  background: "var(--warning-light)",
                  border: "1px solid #fde68a",
                  color: "var(--warning)",
                  padding: "0.45rem 1rem",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <Clock size={16} /> {pendingCount} Menunggu Verifikasi
              </span>
            )}
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
                    padding: "0.5rem 1.1rem",
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

          {/* List of Leaves */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Memuat permohonan izin...
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: "3.5rem",
                textAlign: "center",
                border: "1px dashed var(--border-light)",
                background: "var(--bg-muted)"
              }}
            >
              <FileText size={42} color="#94a3b8" style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.3rem", color: "var(--text-main)" }}>
                Tidak Ada Permohonan Izin
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                Tidak ada data pengajuan yang sesuai dengan filter yang dipilih.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filtered.map((item, idx) => {
                const isApproved = item.status === "Disetujui";
                const isRejected = item.status === "Ditolak";
                const isPending = !isApproved && !isRejected;

                const cardBorder = isApproved ? "#a7f3d0" : isRejected ? "#fecdd3" : "#fde68a";
                const cardBg = isApproved
                  ? "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)"
                  : isRejected
                  ? "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)"
                  : "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)";

                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="glass-panel"
                    style={{
                      padding: "1.5rem",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1.25rem",
                      border: `1.5px solid ${cardBorder}`,
                      background: cardBg,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
                    }}
                  >
                    <div style={{ flex: "1 1 340px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-main)" }}>{item.nama}</span>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>NIP: {item.nip || "-"}</span>
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

                      <div style={{ color: isApproved ? "#059669" : isRejected ? "#e11d48" : "#d97706", fontWeight: 700, fontSize: "0.92rem", marginBottom: "0.3rem" }}>
                        {item.tipe} &bull; {item.mapel || "Guru"}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                        <Calendar size={14} color="#059669" />
                        <span>{item.tgl_mulai} s/d {item.tgl_selesai}</span>
                      </div>

                      <p style={{ fontSize: "0.88rem", color: "var(--text-main)", background: "#ffffff", padding: "0.65rem 0.85rem", borderRadius: "8px", border: `1px solid ${cardBorder}` }}>
                        "{item.alasan}"
                      </p>

                      {item.rejection_reason && (
                        <p style={{ fontSize: "0.8rem", color: "#e11d48", marginTop: "0.4rem", fontWeight: 600 }}>
                          Alasan Penolakan: {item.rejection_reason}
                        </p>
                      )}
                    </div>

                    {item.status === "Menunggu Verifikasi" && (
                      <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => handleApprove(item.id)}
                          className="btn-neon-primary"
                          style={{
                            fontSize: "0.85rem",
                            padding: "0.65rem 1.25rem",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                            border: "none"
                          }}
                        >
                          <CheckCircle2 size={16} /> Setujui Izin
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => setRejectModalId(item.id)}
                          className="btn-neon-danger"
                          style={{
                            fontSize: "0.85rem",
                            padding: "0.65rem 1.25rem",
                            background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                            boxShadow: "0 4px 14px rgba(225, 29, 72, 0.3)",
                            border: "none",
                            color: "#fff"
                          }}
                        >
                          <XCircle size={16} /> Tolak
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Rejection Modal with Reason Input */}
      <AnimatePresence>
        {rejectModalId && (
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
              onClick={() => setRejectModalId(null)}
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
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "440px",
                background: "#ffffff",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-xl)",
                padding: "2rem",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)"
              }}
            >
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.4rem", color: "var(--text-main)" }}>
                Tolak Permohonan Izin
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                Berikan catatan alasan penolakan yang dapat dilihat oleh guru pemohon:
              </p>

              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Jadwal bertabrakan dengan ujian semester / bukti belum lengkap..."
                className="neon-input"
                style={{ marginBottom: "1.25rem" }}
              />

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setRejectModalId(null)}
                  className="btn-neon-secondary"
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  className="btn-neon-danger"
                  style={{ flex: 1 }}
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
