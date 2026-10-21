"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import TeacherNav from "@/components/TeacherNav";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import {
  History,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Filter,
  Eye,
  X,
  FileCheck
} from "lucide-react";

export default function TeacherRiwayatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    const fetchHistory = async () => {
      setLoading(true);
      const res = await Api.request("GET", "getAttendance", {
        user_id: user.id
      });
      if (res && res.attendance) {
        setAttendanceList(res.attendance);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [router]);

  const filtered = attendanceList.filter((item) => {
    if (filterStatus === "Semua") return true;
    return item.status === filterStatus;
  });

  const totalHadir = attendanceList.filter((a) => a.status === "Hadir").length;
  const totalTerlambat = attendanceList.filter((a) => a.status === "Terlambat").length;

  if (!currentUser) return null;

  return (
    <>
      <Navbar role="guru" />
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem", width: "100%" }}>
        <TeacherNav />

        {/* Header Title & Counters */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--text-main)" }}>
              Riwayat Presensi Saya
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
              Log riwayat kehadiran dan sesi jam mengajar kelas Anda
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)",
                border: "1.5px solid #a7f3d0",
                borderRadius: "var(--radius-md)",
                padding: "0.5rem 1.15rem",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.12)"
              }}
            >
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#059669" }}>{totalHadir}</div>
              <div style={{ fontSize: "0.7rem", color: "#047857", textTransform: "uppercase", fontWeight: 700 }}>
                Total Hadir
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
                border: "1.5px solid #fde68a",
                borderRadius: "var(--radius-md)",
                padding: "0.5rem 1.15rem",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(217, 119, 6, 0.12)"
              }}
            >
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#d97706" }}>{totalTerlambat}</div>
              <div style={{ fontSize: "0.7rem", color: "#b45309", textTransform: "uppercase", fontWeight: 700 }}>
                Terlambat
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "1.5rem",
            overflowX: "auto",
            paddingBottom: "0.25rem"
          }}
        >
          <Filter size={16} color="#64748b" style={{ marginRight: "0.25rem" }} />
          {[
            { label: "Semua", color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
            { label: "Hadir", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
            { label: "Terlambat", color: "#d97706", bg: "#fffbeb", border: "#fde68a" }
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

        {/* Records List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            Memuat catatan presensi...
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: "3rem",
              textAlign: "center",
              border: "1px dashed var(--border-light)"
            }}
          >
            <History size={40} color="#94a3b8" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--text-main)" }}>
              Belum Ada Catatan Presensi
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Silakan lakukan presensi pada menu Presensi Mengajar.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {filtered.map((item, idx) => {
              const isHadir = item.status === "Hadir";
              return (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="glass-panel"
                  style={{
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    border: isHadir ? "1.5px solid #a7f3d0" : "1.5px solid #fde68a",
                    background: isHadir
                      ? "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)"
                      : "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
                  }}
                >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: item.status === "Hadir" ? "var(--primary-light)" : "var(--warning-light)",
                      border: `1px solid ${item.status === "Hadir" ? "var(--primary-border)" : "#fde68a"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: item.status === "Hadir" ? "var(--primary)" : "var(--warning)"
                    }}
                  >
                    <FileCheck size={22} />
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-main)" }}>
                        {item.kelas || item.tipe_absen || "Presensi Mengajar"}
                      </span>
                      <span
                        className={`badge-status ${
                          item.status === "Hadir" ? "badge-hadir" : "badge-terlambat"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "1rem",
                        marginTop: "0.25rem",
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)"
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Calendar size={14} color="#059669" />
                        {item.hari}, {item.tanggal}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock size={14} color="#0284c7" />
                        {item.jam_absen} WIB
                      </span>
                      {item.koordinat && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <MapPin size={14} color="#d97706" />
                          {item.koordinat}
                        </span>
                      )}
                    </div>

                    {item.keterangan && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                        Catatan: {item.keterangan}
                      </p>
                    )}
                  </div>
                </div>

                {/* Photo Preview Button */}
                {item.foto && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setSelectedPhoto(item.foto)}
                    className="btn-neon-secondary"
                    style={{ fontSize: "0.82rem", padding: "0.45rem 0.85rem" }}
                  >
                    <Eye size={15} /> Lihat Foto Selfie
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
      </main>

      {/* Photo Zoom Modal */}
      <AnimatePresence>
        {selectedPhoto && (
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
              onClick={() => setSelectedPhoto(null)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(4px)"
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "440px",
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                border: "2px solid var(--primary)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
                background: "#000"
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "rgba(0, 0, 0, 0.7)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 10
                }}
              >
                <X size={18} />
              </button>
              <img
                src={selectedPhoto}
                alt="Foto Selfie Presensi"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
