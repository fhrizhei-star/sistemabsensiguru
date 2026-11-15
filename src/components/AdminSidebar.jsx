"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Auth } from "@/lib/auth";
import { formatDriveUrl, getAvatarUrl } from "@/lib/drive";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileSpreadsheet,
  CheckCircle2,
  FileCheck,
  Sliders,
  ChevronRight,
  GraduationCap,
  Briefcase,
  FileText,
  Timer,
  X,
  LayoutGrid
} from "lucide-react";
import AdminPlpBadge from "@/components/AdminPlpBadge";

const MENU_ITEMS = [
  { href: "/admin", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
  { href: "/admin/guru", label: "Data Guru & Pegawai", shortLabel: "GTK", icon: Users, color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8" },
  { href: "/admin/jadwal", label: "Jadwal Pelajaran", shortLabel: "Jadwal", icon: CalendarDays, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  { href: "/admin/rekap/guru", label: "Presensi Guru", shortLabel: "Absen Guru", icon: GraduationCap, color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  { href: "/admin/rekap/pegawai", label: "Presensi Pegawai", shortLabel: "Absen Pegawai", icon: Briefcase, color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" },
  { href: "/admin/lkb/guru", label: "LKB Guru", shortLabel: "LKB Guru", icon: FileCheck, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { href: "/admin/lkb/pegawai", label: "LKB Pegawai", shortLabel: "LKB Pegawai", icon: FileText, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { href: "/admin/izin", label: "Verifikasi Izin", shortLabel: "Izin", icon: CheckCircle2, color: "#06b6d4", bg: "#ecfeff", border: "#a5f3fc" },
  { href: "/admin/setting", label: "Pengaturan Sistem", shortLabel: "Setting", icon: Sliders, color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" }
];

// 5 Menu Utama untuk Navigasi Bawah di Layar Mobile (Device HP)
const MOBILE_PRIMARY_ITEMS = [
  { href: "/admin", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
  { href: "/admin/guru", label: "Data GTK", shortLabel: "GTK", icon: Users, color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8" },
  { href: "/admin/rekap/guru", label: "Presensi", shortLabel: "Presensi", icon: GraduationCap, color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  { href: "/admin/lkb/guru", label: "LKB Bulanan", shortLabel: "LKB", icon: FileCheck, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { isMenuButton: true, label: "Semua Menu", shortLabel: "Menu", icon: LayoutGrid, color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" }
];

const AUTO_CLOSE_SECONDS = 5;

export default function AdminSidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);

  // --- State Navigasi Toggle & Auto-Close Timer ---
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("admin_sidebar_collapsed");
        if (saved !== null) return saved === "true";
      } catch (e) { }
    }
    return false;
  });
  const [isPinned, setIsPinned] = useState(false);
  const [timeLeft, setTimeLeft] = useState(AUTO_CLOSE_SECONDS);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  useEffect(() => {
    setMounted(true);
    setCurrentUser(Auth.getCurrentUser());

    try {
      const savedCollapsed = localStorage.getItem("admin_sidebar_collapsed");
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === "true");
      }
      const savedPinned = localStorage.getItem("admin_sidebar_pinned");
      if (savedPinned !== null) {
        setIsPinned(savedPinned === "true");
      }
    } catch (e) { }
  }, []);

  // Broadcast live state ke Navbar dan komponen lain
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth <= 768;
      const isOpen = isMobile ? isMobileDrawerOpen : !isCollapsed;
      window.dispatchEvent(
        new CustomEvent("admin-sidebar-state-changed", {
          detail: { isOpen, isCollapsed, isMobileDrawerOpen }
        })
      );
    }
  }, [isCollapsed, isMobileDrawerOpen]);

  // Tutup drawer mobile saat navigasi route berubah
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  // Sinkronisasi dengan tombol Toggle di Navbar
  useEffect(() => {
    const handleToggleEvent = () => {
      if (typeof window !== "undefined" && window.innerWidth <= 768) {
        setIsMobileDrawerOpen((prev) => {
          const next = !prev;
          if (next) setTimeLeft(AUTO_CLOSE_SECONDS);
          return next;
        });
        return;
      }

      setIsCollapsed((prev) => {
        const next = !prev;
        if (!next) {
          setTimeLeft(AUTO_CLOSE_SECONDS);
        }
        try {
          localStorage.setItem("admin_sidebar_collapsed", String(next));
        } catch (e) { }
        return next;
      });
    };

    window.addEventListener("toggle-admin-sidebar", handleToggleEvent);
    return () => window.removeEventListener("toggle-admin-sidebar", handleToggleEvent);
  }, []);

  // Auto-close countdown timer untuk desktop sidebar
  useEffect(() => {
    if (isCollapsed || isPinned || isHovered) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsCollapsed(true);
          try {
            localStorage.setItem("admin_sidebar_collapsed", "true");
          } catch (e) { }
          return AUTO_CLOSE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCollapsed, isPinned, isHovered]);

  // Auto-close countdown timer untuk mobile drawer
  useEffect(() => {
    if (!isMobileDrawerOpen || isHovered) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsMobileDrawerOpen(false);
          return AUTO_CLOSE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMobileDrawerOpen, isHovered]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (!next) {
        setTimeLeft(AUTO_CLOSE_SECONDS);
      }
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch (e) { }
      return next;
    });
  };

  const handleTogglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_pinned", String(next));
      } catch (e) { }
      return next;
    });
  };

  const checkIsActive = (href) => {
    if (pathname === href) return true;
    if (href === "/admin/rekap/guru" && pathname === "/admin/rekap") return true;
    if (href === "/admin/lkb/guru" && pathname === "/admin/lkb") return true;
    return false;
  };

  const isMobileItemActive = (item) => {
    if (item.isMenuButton) {
      return (
        isMobileDrawerOpen ||
        pathname === "/admin/jadwal" ||
        pathname === "/admin/izin" ||
        pathname === "/admin/setting"
      );
    }
    if (item.href === "/admin") return pathname === "/admin";
    if (item.href === "/admin/guru") return pathname === "/admin/guru";
    if (item.href === "/admin/rekap/guru") return pathname.startsWith("/admin/rekap");
    if (item.href === "/admin/lkb/guru") return pathname.startsWith("/admin/lkb");
    return pathname === item.href;
  };

  return (
    <>
      {/* =========================================================
          Desktop Sidebar (Collapsible with Auto-Close Countdown)
          ========================================================= */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          if (!isCollapsed && !isPinned) {
            setTimeLeft(AUTO_CLOSE_SECONDS);
          }
        }}
        style={{
          width: isCollapsed ? "78px" : "270px",
          flexShrink: 0,
          background: "#ffffff",
          borderRight: "1.5px solid var(--border-light)",
          padding: isCollapsed ? "1.15rem 0 1.15rem 0.45rem" : "1.25rem 0 1.25rem 0.95rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          minHeight: "calc(100vh - 72px)",
          transition: mounted ? "width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
          position: "relative",
          zIndex: 20
        }}
        className="admin-sidebar"
      >
        {/* Top Control Bar: Judul Navigasi & Auto-Close Timer */}
        {!isCollapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
              padding: "0 0.95rem 0 0.35rem"
            }}
          >
            <span
              style={{
                fontSize: "0.74rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 800,
                color: "#4f46e5"
              }}
            >
              Navigasi Admin
            </span>
            <span style={{ fontSize: "0.68rem", color: isHovered ? "#d97706" : "var(--text-muted)", fontWeight: 700 }}>
              {isHovered ? "Timer Dijeda" : `Auto-tutup ${timeLeft}s`}
            </span>
          </div>
        )}

        {/* Indikator Animasi Countdown Waktu Tutup Otomatis */}
        {!isCollapsed && (
          <div style={{ marginBottom: "0.6rem", padding: "0 0.95rem 0 0.35rem" }}>
            {!isPinned ? (
              <div>
                <div
                  style={{
                    width: "100%",
                    height: "3px",
                    borderRadius: "999px",
                    background: "#e2e8f0",
                    overflow: "hidden",
                    marginBottom: "0.3rem"
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(timeLeft / AUTO_CLOSE_SECONDS) * 100}%`,
                      background: "linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)",
                      transition: "width 1s linear"
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.68rem" }}>
                  {isHovered ? (
                    <span style={{ color: "#d97706", fontWeight: 700 }}>⏸️ Timer Dijeda (Sedang Memilih)</span>
                  ) : (
                    <span style={{ color: "#4f46e5", fontWeight: 700 }}>⏱️ Tutup otomatis dalam {timeLeft}s</span>
                  )}
                  <span style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>Unpinned</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span>📌 Navigasi Terkunci (Selalu Terbuka)</span>
              </div>
            )}
          </div>
        )}

        {/* Menu Items Navigation with Scooped Tab (Inverted Fillet) Active State */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.3rem", position: "relative" }}>
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = checkIsActive(item.href);

            return (
              <motion.div
                key={item.href}
                style={{
                  position: "relative",
                  marginRight: isActive ? "-1.5px" : (isCollapsed ? "0.45rem" : "0.95rem")
                }}
                onMouseEnter={() => setHoveredTooltip(item.href)}
                onMouseLeave={() => setHoveredTooltip(null)}
                whileHover={isActive ? {} : { x: 2, scale: 1.012 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 450, damping: 20 }}
              >
                <Link
                  href={item.href}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isCollapsed ? "center" : "space-between",
                    padding: isCollapsed ? "0.65rem 0.4rem" : "0.72rem 0.95rem",
                    borderRadius: isActive ? (isCollapsed ? "16px 0 0 16px" : "20px 0 0 20px") : "var(--radius-md)",
                    textDecoration: "none",
                    color: isActive ? item.color : "var(--text-secondary)",
                    fontWeight: isActive ? 800 : 600,
                    fontSize: "0.88rem",
                    transition: "color 0.15s ease"
                  }}
                >
                  {/* Efek Tab Aktif Cekung (Scooped Tab / Inverted Fillets) */}
                  {isActive && (
                    <motion.div
                      layoutId="adminSidebarScoopedActive"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 20,
                        mass: 0.8
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "var(--bg-main)",
                        borderTopLeftRadius: isCollapsed ? "16px" : "20px",
                        borderBottomLeftRadius: isCollapsed ? "16px" : "20px",
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        borderTop: "1.5px solid var(--border-light)",
                        borderBottom: "1.5px solid var(--border-light)",
                        borderLeft: "1.5px solid var(--border-light)",
                        borderRight: "none",
                        boxShadow: "-4px 2px 14px rgba(15, 23, 42, 0.04)",
                        zIndex: 0,
                        pointerEvents: "none"
                      }}
                    >
                      {/* Top Concave Fillet (Scoop Atas) */}
                      <div
                        style={{
                          position: "absolute",
                          top: "-20px",
                          right: 0,
                          width: "20px",
                          height: "20px",
                          pointerEvents: "none"
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M 20 0 C 20 11.046 11.046 20 0 20 H 20 Z"
                            fill="var(--bg-main)"
                          />
                          <path
                            d="M 20 0 C 20 11.046 11.046 20 0 20"
                            stroke="var(--border-light)"
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </svg>
                      </div>

                      {/* Bottom Concave Fillet (Scoop Bawah) */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-20px",
                          right: 0,
                          width: "20px",
                          height: "20px",
                          pointerEvents: "none"
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M 0 0 C 11.046 0 20 8.954 20 20 H 20 V 0 Z"
                            fill="var(--bg-main)"
                          />
                          <path
                            d="M 0 0 C 11.046 0 20 8.954 20 20"
                            stroke="var(--border-light)"
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </svg>
                      </div>
                    </motion.div>
                  )}

                  <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                    <motion.div
                      animate={isActive ? { scale: [1, 1.18, 0.94, 1.05, 1], rotate: [0, -3, 3, -1, 0] } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{
                        width: isCollapsed ? "38px" : "32px",
                        height: isCollapsed ? "38px" : "32px",
                        borderRadius: "10px",
                        background: isActive ? item.bg : "var(--bg-muted)",
                        border: `1.2px solid ${isActive ? item.border : "var(--border-light)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: isActive ? `0 2px 8px ${item.border}` : "none"
                      }}
                    >
                      <Icon size={isCollapsed ? 19 : 16} color={isActive ? item.color : "var(--text-secondary)"} />
                    </motion.div>

                    {!isCollapsed && (
                      <span
                        style={{
                          color: isActive ? item.color : "var(--text-main)",
                          fontWeight: isActive ? 800 : 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && isActive && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{ position: "relative", zIndex: 1, flexShrink: 0, display: "flex", alignItems: "center" }}
                    >
                      <ChevronRight size={15} color={item.color} />
                    </motion.div>
                  )}
                </Link>

                {/* Floating Tooltip saat sidebar ciut */}
                {isCollapsed && hoveredTooltip === item.href && (
                  <motion.div
                    initial={{ opacity: 0, x: -5, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -5, scale: 0.95 }}
                    style={{
                      position: "absolute",
                      left: "calc(100% + 10px)",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(15, 23, 42, 0.95)",
                      color: "#ffffff",
                      padding: "0.4rem 0.75rem",
                      borderRadius: "8px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.2)",
                      zIndex: 1000,
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem"
                    }}
                  >
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }} />
                    <span>{item.label}</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </nav>
      </aside>

      {/* =========================================================
          Mobile Slide-Over Drawer for Admin (App Launcher Grid)
          ========================================================= */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              display: "flex"
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsMobileDrawerOpen(false);
            }}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              onTouchStart={() => setIsHovered(true)}
              onTouchEnd={() => setIsHovered(false)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                width: "320px",
                maxWidth: "88vw",
                height: "100%",
                background: "#ffffff",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
                padding: "1.25rem 1rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
                overflowY: "auto"
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border-light)",
                  paddingBottom: "0.75rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                      border: "1px solid #c7d2fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <LayoutGrid size={18} color="#4f46e5" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-main)", margin: 0, lineHeight: 1.2 }}>
                      Menu Admin
                    </h3>
                    <span style={{ fontSize: "0.68rem", color: isHovered ? "#d97706" : isPinned ? "#059669" : "var(--text-muted)", fontWeight: 700 }}>
                      {isPinned ? "Auto-tutup Mati (Terkunci)" : isHovered ? "Hitung Mundur Dijeda" : `Auto-tutup dalam ${timeLeft}s`}
                    </span>
                  </div>
                </div>

                {/* Single Close Button */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  title="Tutup Menu Admin"
                  aria-label="Tutup Menu Admin"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    cursor: "pointer"
                  }}
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Progress bar countdown */}
              <div
                style={{
                  width: "100%",
                  height: "3.5px",
                  borderRadius: "999px",
                  background: "#f1f5f9",
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: isPinned ? "100%" : `${(timeLeft / AUTO_CLOSE_SECONDS) * 100}%`,
                    background: isPinned
                      ? "#10b981"
                      : isHovered
                        ? "#f59e0b"
                        : "linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)",
                    transition: isHovered ? "none" : "width 1s linear, background 0.2s ease"
                  }}
                />
              </div>

              {/* Profile Card */}
              {currentUser && (
                <div
                  style={{
                    padding: "0.7rem 0.8rem",
                    background: "linear-gradient(135deg, #eef2ff 0%, #fdf2f8 100%)",
                    border: "1px solid #c7d2fe",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem"
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "2px solid #4f46e5",
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={getAvatarUrl(currentUser.foto_url, currentUser.nama || "Admin")}
                      alt={currentUser.nama || "Admin"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ minWidth: 0, overflow: "hidden", flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }} className="truncate-1">
                      {currentUser.nama || "Administrator"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "1px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
                      <span style={{ fontSize: "0.7rem", color: "#4f46e5", fontWeight: 700 }}>
                        {currentUser.jabatan || "Admin Tata Usaha"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Menu Grid (2-Column Launcher) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = checkIsActive(item.href);

                    return (
                      <motion.div
                        key={item.href}
                        whileHover={{ scale: 1.025 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 450, damping: 20 }}
                        style={{ display: "flex", width: "100%" }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileDrawerOpen(false)}
                          style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.45rem",
                            padding: "0.65rem",
                            borderRadius: "12px",
                            textDecoration: "none",
                            background: isActive ? item.bg : "#ffffff",
                            border: `1.5px solid ${isActive ? item.border : "var(--border-light)"}`,
                            boxShadow: isActive ? `0 4px 12px ${item.border}` : "0 1px 3px rgba(0,0,0,0.03)",
                            transition: "all 0.15s ease",
                            position: "relative"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "9px",
                                background: item.bg,
                                border: `1px solid ${item.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              <Icon size={16} color={item.color} />
                            </div>
                            {isActive && (
                              <span
                                style={{
                                  fontSize: "0.6rem",
                                  fontWeight: 800,
                                  color: item.color,
                                  background: "#ffffff",
                                  padding: "0.1rem 0.35rem",
                                  borderRadius: "999px",
                                  border: `1px solid ${item.border}`
                                }}
                              >
                                Aktif
                              </span>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: "0.78rem",
                                color: isActive ? item.color : "var(--text-main)",
                                lineHeight: 1.2
                              }}
                              className="truncate-1"
                            >
                              {item.label}
                            </div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "1px" }} className="truncate-1">
                              {item.shortLabel}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer Notice */}
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  💡 Sentuh layar untuk jeda auto-tutup
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================
          Mobile Bottom Navigation Bar for Admin (5 Primary Items)
          ========================================================= */}
      <nav className="admin-bottom-nav">
        {MOBILE_PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isMobileItemActive(item);

          if (item.isMenuButton) {
            return (
              <motion.button
                key="menu-drawer-toggle"
                type="button"
                whileTap={{ scale: 0.91 }}
                transition={{ type: "spring", stiffness: 450, damping: 18 }}
                onClick={() => {
                  setIsMobileDrawerOpen((prev) => {
                    const next = !prev;
                    if (next) setTimeLeft(AUTO_CLOSE_SECONDS);
                    return next;
                  });
                }}
                className={`admin-bottom-item ${isActive ? "active" : ""}`}
                aria-label="Buka Semua Menu Admin"
              >
                {isActive && (
                  <motion.div
                    layoutId="adminMobileJellyNav"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 18,
                      mass: 0.75
                    }}
                    className="admin-bottom-active-bg"
                    style={{
                      background: item.bg,
                      border: `1.5px solid ${item.border}`,
                      boxShadow: `0 3px 12px ${item.border}`
                    }}
                  />
                )}
                <span className="admin-bottom-icon" style={{ position: "relative", zIndex: 1 }}>
                  <motion.span
                    animate={isActive ? { scale: [1, 1.22, 0.94, 1.06, 1], rotate: [0, -4, 4, -2, 0] } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ display: "inline-flex" }}
                  >
                    <Icon size={20} color={isActive ? item.color : "#64748b"} />
                  </motion.span>
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-6px",
                      fontSize: "0.55rem",
                      fontWeight: 800,
                      background: "#0284c7",
                      color: "#ffffff",
                      borderRadius: "999px",
                      padding: "0.05rem 0.28rem",
                      lineHeight: 1
                    }}
                  >
                    9
                  </span>
                </span>
                <span className="admin-bottom-label" style={{ color: isActive ? item.color : "#64748b", position: "relative", zIndex: 1 }}>
                  {item.shortLabel}
                </span>
              </motion.button>
            );
          }

          return (
            <motion.div
              key={item.href}
              whileTap={{ scale: 0.91 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              style={{
                flex: 1,
                minWidth: 0,
                maxWidth: "20%",
                display: "flex",
                justifyContent: "center",
                alignItems: "stretch"
              }}
            >
              <Link
                href={item.href}
                className={`admin-bottom-item ${isActive ? "active" : ""}`}
                style={{ width: "100%", maxWidth: "100%", flex: 1 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminMobileJellyNav"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 18,
                      mass: 0.75
                    }}
                    className="admin-bottom-active-bg"
                    style={{
                      background: item.bg,
                      border: `1.5px solid ${item.border}`,
                      boxShadow: `0 3px 12px ${item.border}`
                    }}
                  />
                )}
                <span className="admin-bottom-icon" style={{ position: "relative", zIndex: 1 }}>
                  <motion.span
                    animate={isActive ? { scale: [1, 1.22, 0.94, 1.06, 1], rotate: [0, -4, 4, -2, 0] } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ display: "inline-flex" }}
                  >
                    <Icon size={20} color={isActive ? item.color : "#64748b"} />
                  </motion.span>
                </span>
                <span className="admin-bottom-label" style={{ color: isActive ? item.color : "#64748b", position: "relative", zIndex: 1 }}>
                  {item.shortLabel}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Floating Badge PLP 2 MPI UINAM 2026 */}
      <AdminPlpBadge />
    </>
  );
}
