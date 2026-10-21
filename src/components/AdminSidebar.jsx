"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Auth } from "@/lib/auth";
import { formatDriveUrl, getAvatarUrl } from "@/lib/drive";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileSpreadsheet,
  CheckCircle2,
  Sliders,
  ChevronRight
} from "lucide-react";

const MENU_ITEMS = [
  { href: "/admin", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
  { href: "/admin/guru", label: "Data Guru", shortLabel: "Guru", icon: Users, color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8" },
  { href: "/admin/jadwal", label: "Jadwal Pelajaran", shortLabel: "Jadwal", icon: CalendarDays, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  { href: "/admin/rekap", label: "Rekap Presensi", shortLabel: "Rekap", icon: FileSpreadsheet, color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  { href: "/admin/izin", label: "Verifikasi Izin", shortLabel: "Izin", icon: CheckCircle2, color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" },
  { href: "/admin/setting", label: "Pengaturan Sistem", shortLabel: "Setting", icon: Sliders, color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(Auth.getCurrentUser());
  }, []);

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile <= 768px via CSS) */}
      <aside
        style={{
          width: "270px",
          flexShrink: 0,
          background: "#ffffff",
          borderRight: "1px solid var(--border-light)",
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          minHeight: "calc(100vh - 72px)"
        }}
        className="admin-sidebar"
      >
        {/* Admin Profile Section with Colorful Multi-Gradient */}
        {currentUser && (
          <div
            style={{
              padding: "1rem",
              background: "linear-gradient(135deg, #eef2ff 0%, #fdf2f8 50%, #f0fdf4 100%)",
              border: "1.5px solid #c7d2fe",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              marginBottom: "0.75rem",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.08)"
            }}
          >
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "16px",
                overflow: "hidden",
                border: "2.5px solid #4f46e5",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.28)",
                flexShrink: 0,
                background: "var(--primary-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "1.3rem"
              }}
            >
              <img
                src={getAvatarUrl(currentUser.foto_url, currentUser.nama || "Admin")}
                alt={currentUser.nama || "Admin"}
                referrerPolicy="no-referrer"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = getAvatarUrl("", currentUser.nama || "Admin");
                }}
              />
            </div>

            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  color: "var(--text-main)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
                title={currentUser.nama}
              >
                {currentUser.nama || "Administrator"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#4f46e5", fontWeight: 700 }}>
                {currentUser.jabatan || "Kepala TU / Admin"}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                NIP: {currentUser.nip || "-"}
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: "0 0.5rem 0.5rem" }}>
          <p
            style={{
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 800,
              color: "#4f46e5",
              marginBottom: "0.15rem"
            }}
          >
            Navigasi Utama
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 0.95rem",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  color: isActive ? item.color : "var(--text-secondary)",
                  fontWeight: isActive ? 800 : 600,
                  fontSize: "0.9rem",
                  transition: "all 0.2s ease"
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "var(--radius-md)",
                      background: item.bg,
                      border: `1.5px solid ${item.border}`,
                      boxShadow: `0 3px 12px ${item.border}`,
                      zIndex: 0
                    }}
                  />
                )}

                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      background: item.bg,
                      border: `1px solid ${item.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <Icon size={17} color={item.color} />
                  </div>
                  <span style={{ color: isActive ? item.color : "var(--text-main)" }}>{item.label}</span>
                </div>

                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ position: "relative", zIndex: 1 }}
                  >
                    <ChevronRight size={16} color={item.color} />
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation for Admin */}
      <nav className="admin-bottom-nav">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-bottom-item ${isActive ? "active" : ""}`}
            >
              {isActive && (
                <motion.div
                  layoutId="adminMobileNavPill"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="admin-bottom-active-bg"
                  style={{
                    background: item.bg,
                    border: `1px solid ${item.border}`
                  }}
                />
              )}
              <span className="admin-bottom-icon">
                <Icon size={20} color={isActive ? item.color : "#64748b"} />
              </span>
              <span className="admin-bottom-label" style={{ color: isActive ? item.color : "#64748b" }}>
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

