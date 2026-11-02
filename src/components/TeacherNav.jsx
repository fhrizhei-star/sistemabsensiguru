"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { UserCheck, History, FileText, FileUp } from "lucide-react";
import { Auth } from "@/lib/auth";

export default function TeacherNav() {
  const pathname = usePathname();
  const [isPegawai, setIsPegawai] = useState(false);

  useEffect(() => {
    const u = Auth.getCurrentUser();
    if (u?.role === "pegawai") setIsPegawai(true);
  }, []);

  const links = [
    { href: "/user", label: "Presensi", fullLabel: isPegawai ? "Presensi Masuk & Pulang" : "Presensi Mengajar", icon: UserCheck, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
    { href: "/user/riwayat", label: "Riwayat", fullLabel: "Riwayat Presensi", icon: History, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    { href: "/user/izin", label: "Izin / Cuti", fullLabel: "Pengajuan Cuti / Izin", icon: FileText, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    { href: "/user/lkb", label: "LKB", fullLabel: isPegawai ? "Dokumen LKB Pegawai" : "Dokumen LKB Guru", icon: FileUp, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" }
  ];

  return (
    <nav className="teacher-bottom-nav">
      {links.map((item) => {
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

