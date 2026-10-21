"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { UserCheck, History, FileText } from "lucide-react";

const TEACHER_LINKS = [
  { href: "/user", label: "Presensi", fullLabel: "Presensi Mengajar", icon: UserCheck, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  { href: "/user/riwayat", label: "Riwayat", fullLabel: "Riwayat Presensi", icon: History, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { href: "/user/izin", label: "Izin / Cuti", fullLabel: "Pengajuan Cuti / Izin", icon: FileText, color: "#d97706", bg: "#fffbeb", border: "#fde68a" }
];

export default function TeacherNav() {
  const pathname = usePathname();

  return (
    <nav className="teacher-bottom-nav">
      {TEACHER_LINKS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`teacher-nav-item ${isActive ? "active" : ""}`}
            style={{
              color: isActive ? item.color : "var(--text-secondary)"
            }}
          >
            {isActive && (
              <motion.div
                layoutId="teacherNavPill"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="nav-active-bg"
                style={{
                  background: item.bg,
                  border: `1.5px solid ${item.border}`,
                  boxShadow: `0 3px 12px ${item.border}`
                }}
              />
            )}

            <span className="nav-icon-wrapper">
              <Icon size={20} color={isActive ? item.color : "#64748b"} />
            </span>
            <span className="nav-label-desktop" style={{ color: isActive ? item.color : "inherit" }}>
              {item.fullLabel}
            </span>
            <span className="nav-label-mobile" style={{ color: isActive ? item.color : "inherit" }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

