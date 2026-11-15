"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { UserCheck, History, FileText, FileUp, CreditCard } from "lucide-react";

export default function TeacherNav() {
  const pathname = usePathname();

  const links = [
    { href: "/user", label: "Presensi", fullLabel: "Presensi", icon: UserCheck, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
    { href: "/user/riwayat", label: "Riwayat", fullLabel: "Riwayat", icon: History, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    { href: "/user/izin", label: "Izin / Cuti", fullLabel: "Izin / Cuti", icon: FileText, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    { href: "/user/lkb", label: "LKB", fullLabel: "LKB Bulanan", icon: FileUp, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  ];

  return (
    <nav className="teacher-bottom-nav">
      {links.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <motion.div
            key={item.href}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 450, damping: 20 }}
            style={{ position: "relative", display: "inline-flex" }}
          >
            <Link
              href={item.href}
              className={`teacher-nav-item ${isActive ? "active" : ""}`}
              style={{
                color: isActive ? item.color : "var(--text-secondary)"
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="teacherNavPill"
                  transition={{ type: "spring", stiffness: 380, damping: 18, mass: 0.8 }}
                  className="nav-active-bg"
                  style={{
                    background: item.bg,
                    border: `1.5px solid ${item.border}`,
                    boxShadow: `0 3px 12px ${item.border}`
                  }}
                />
              )}

              <motion.span
                className="nav-icon-wrapper"
                animate={isActive ? { scale: [1, 1.2, 0.94, 1.06, 1], rotate: [0, -3, 3, -1, 0] } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.4 }}
                style={{ position: "relative", zIndex: 1, display: "inline-flex" }}
              >
                <Icon size={20} color={isActive ? item.color : "#64748b"} />
              </motion.span>
              <span className="nav-label-desktop" style={{ color: isActive ? item.color : "inherit", position: "relative", zIndex: 1 }}>
                {item.fullLabel}
              </span>
              <span className="nav-label-mobile" style={{ color: isActive ? item.color : "inherit", position: "relative", zIndex: 1 }}>
                {item.label}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}

