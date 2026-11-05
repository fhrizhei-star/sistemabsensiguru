"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "2.5rem 2rem",
          textAlign: "center",
          boxShadow: "0 20px 45px rgba(0,0,0,0.08)",
          border: "1.5px solid #e2e8f0"
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "18px",
            background: "#fee2e2",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem"
          }}
        >
          <AlertTriangle size={32} />
        </div>

        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.5rem" }}>
          404
        </h1>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#334155", marginBottom: "0.5rem" }}>
          Halaman Tidak Ditemukan
        </h2>
        <p style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5, marginBottom: "1.75rem" }}>
          Halaman yang Anda tuju tidak ditemukan atau URL telah diperbarui ke rute panel terbaru. Silakan kembali ke menu navigasi utama.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/admin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.7rem 1.25rem",
              borderRadius: "12px",
              background: "#059669",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.88rem",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)"
            }}
          >
            <Home size={16} /> Ke Dashboard Admin
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.7rem 1.25rem",
              borderRadius: "12px",
              background: "#f1f5f9",
              color: "#334155",
              fontWeight: 700,
              fontSize: "0.88rem",
              textDecoration: "none"
            }}
          >
            <ArrowLeft size={16} /> Halaman Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

