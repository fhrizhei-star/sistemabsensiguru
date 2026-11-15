"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import { formatDriveUrl, getAvatarUrl } from "@/lib/drive";
import { Clock, School, LogOut, AlertTriangle, KeyRound, PanelLeftClose } from "lucide-react";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function Navbar({ role = "guru" }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [schoolName, setSchoolName] = useState("MTsN GOWA");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth <= 768) return false;
      try {
        const saved = localStorage.getItem("admin_sidebar_collapsed");
        if (saved !== null) return saved !== "true";
      } catch (e) { }
    }
    return true;
  });

  useEffect(() => {
    // Sync sidebar state from window & localStorage on mount
    if (typeof window !== "undefined") {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        try {
          const saved = localStorage.getItem("admin_sidebar_collapsed");
          setIsSidebarOpen(saved !== "true");
        } catch (e) {
          setIsSidebarOpen(true);
        }
      }
    }

    const handleStateChange = (e) => {
      if (e?.detail && typeof e.detail.isOpen === "boolean") {
        setIsSidebarOpen(e.detail.isOpen);
      }
    };

    window.addEventListener("admin-sidebar-state-changed", handleStateChange);
    return () => window.removeEventListener("admin-sidebar-state-changed", handleStateChange);
  }, []);

  useEffect(() => {
    const user = Auth.getCurrentUser();
    setCurrentUser(user);

    Api.request("GET", "getSettings").then((res) => {
      if (res?.settings?.nama_sekolah) {
        setSchoolName(res.settings.nama_sekolah);
      }
    }).catch(() => { });

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
      setCurrentDate(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    Auth.logout();
    router.push("/");
  };

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--border-light)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)"
        }}
      >
        <div
          style={{
            maxWidth: role === "admin" ? "1400px" : "1280px",
            margin: "0 auto",
            padding: "0.85rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem"
          }}
        >
          {/* Brand Logo & Name (With Sidebar Toggle Button for Admin) */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            {role === "admin" && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("toggle-admin-sidebar"));
                  }
                }}
                title={isSidebarOpen ? "Tutup Navigasi Admin" : "Buka Navigasi Admin"}
                aria-label={isSidebarOpen ? "Tutup Navigasi Admin" : "Buka Navigasi Admin"}
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  border: isSidebarOpen ? "1.5px solid #818cf8" : "1.5px solid var(--border-light)",
                  background: isSidebarOpen
                    ? "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)"
                    : "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: isSidebarOpen
                    ? "0 4px 14px rgba(79, 70, 229, 0.22)"
                    : "0 2px 6px rgba(0, 0, 0, 0.04)",
                  transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
                  padding: 0,
                  flexShrink: 0
                }}
              >
                {/* Modern Morphing Animated Hamburger to 'X' */}
                <div
                  style={{
                    width: "20px",
                    height: "15px",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  {/* Top Bar */}
                  <motion.span
                    animate={
                      isSidebarOpen
                        ? { rotate: 45, y: 6.5, backgroundColor: "#4f46e5" }
                        : { rotate: 0, y: 0, backgroundColor: "#334155" }
                    }
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    style={{
                      display: "block",
                      width: "100%",
                      height: "2.5px",
                      borderRadius: "999px",
                      transformOrigin: "center"
                    }}
                  />

                  {/* Middle Bar (short sleek line that fades away when open) */}
                  <motion.span
                    animate={
                      isSidebarOpen
                        ? { opacity: 0, scaleX: 0, backgroundColor: "#4f46e5" }
                        : { opacity: 1, scaleX: 1, backgroundColor: "#334155" }
                    }
                    transition={{ duration: 0.18 }}
                    style={{
                      display: "block",
                      width: "70%",
                      height: "2.5px",
                      borderRadius: "999px",
                      alignSelf: "flex-start",
                      transformOrigin: "left"
                    }}
                  />

                  {/* Bottom Bar */}
                  <motion.span
                    animate={
                      isSidebarOpen
                        ? { rotate: -45, y: -6.5, backgroundColor: "#4f46e5" }
                        : { rotate: 0, y: 0, backgroundColor: "#334155" }
                    }
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    style={{
                      display: "block",
                      width: "100%",
                      height: "2.5px",
                      borderRadius: "999px",
                      transformOrigin: "center"
                    }}
                  />
                </div>
              </motion.button>
            )}

            <Link
              href={role === "admin" ? "/admin" : "/user"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                  border: "1.5px solid #a7f3d0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.2)",
                  padding: "4px"
                }}
              >
                <img
                  src="/img/logo-sekolah.png"
                  alt="Logo Sekolah"
                  style={{ width: "32px", height: "32px", objectFit: "contain" }}
                />
              </motion.div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 900,
                      fontSize: "1.25rem",
                      color: "var(--text-main)",
                      letterSpacing: "0.2em"
                    }}
                  >
                    SIDIAN
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    color: "#059669",
                    letterSpacing: "0.03em",
                    textTransform: "uppercase"
                  }}
                >
                  {schoolName}
                </p>
              </div>
            </Link>
          </div>

          {/* Center Digital Clock (Stable, No Re-animation on page switch) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: "linear-gradient(135deg, #eef2ff 0%, #ecfeff 100%)",
              border: "1px solid #c7d2fe",
              borderRadius: "var(--radius-full)",
              padding: "0.45rem 1.15rem",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)"
            }}
            className="hidden-mobile"
          >
            <Clock size={16} color="#4f46e5" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="digital-clock" style={{ fontSize: "1rem", lineHeight: 1.2, color: "#4f46e5" }}>
                {currentTime || "00:00:00"}
              </span>
              <span style={{ fontSize: "0.68rem", color: "#6366f1", fontWeight: 600 }}>
                {currentDate || "Memuat waktu..."}
              </span>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            {currentUser && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  background: "#ffffff",
                  border: "1.5px solid var(--border-light)",
                  borderRadius: "var(--radius-full)",
                  padding: "0.2rem 0.75rem 0.2rem 0.2rem",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid var(--primary)",
                    background: "var(--primary-gradient)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 3px 8px rgba(5, 150, 105, 0.25)",
                    flexShrink: 0
                  }}
                >
                  <img
                    src={getAvatarUrl(currentUser.foto_url, currentUser.nama || currentUser.username)}
                    alt={currentUser.nama || "User"}
                    referrerPolicy="no-referrer"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = getAvatarUrl("", currentUser.nama || currentUser.username);
                    }}
                  />
                </div>
                <div style={{ textAlign: "left", lineHeight: 1.2 }} className="hidden-mobile">
                  <p
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: 800,
                      color: "var(--text-main)",
                      maxWidth: "160px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {currentUser.nama || currentUser.username}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 700 }}>
                    {currentUser.role === "admin"
                      ? "Admin Tata Usaha"
                      : currentUser.role === "pegawai"
                        ? currentUser.jabatan || "Pegawai"
                        : currentUser.mapel || "Guru"}
                  </p>
                </div>
              </div>
            )}

            {currentUser && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPasswordModal(true)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  color: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                title="Ganti Password Akun"
              >
                <KeyRound size={18} />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLogoutModal(true)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "var(--danger-light)",
                border: "1px solid #fecaca",
                color: "var(--danger)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              title="Keluar dari Sistem"
            >
              <LogOut size={18} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Confirmation Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
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
              onClick={() => setShowLogoutModal(false)}
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
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "400px",
                background: "#ffffff",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-xl)",
                padding: "2rem",
                boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15)",
                textAlign: "center"
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "18px",
                  background: "var(--danger-light)",
                  color: "var(--danger)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem"
                }}
              >
                <AlertTriangle size={28} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.4rem", color: "var(--text-main)" }}>
                Konfirmasi Keluar
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
                Apakah Anda yakin ingin keluar dari sesi sistem absensi saat ini?
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="btn-neon-secondary"
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-neon-danger"
                  style={{ flex: 1 }}
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        currentUser={currentUser}
        onPasswordChanged={(updated) => setCurrentUser(updated)}
      />
    </>
  );
}
