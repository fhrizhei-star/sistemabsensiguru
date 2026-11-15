"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Sparkles, X } from "lucide-react";

const DISPLAY_DURATION_SECONDS = 15;
const STORAGE_KEY_HIDDEN = "plp_card_hidden_session";
const STORAGE_KEY_START = "plp_card_start_time";

export default function AdminPlpBadge() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DISPLAY_DURATION_SECONDS);

  useEffect(() => {
    setMounted(true);

    try {
      // Periksa apakah badge sudah pernah disembunyikan dalam sesi login ini
      const isHidden = sessionStorage.getItem(STORAGE_KEY_HIDDEN) === "true";
      if (isHidden) {
        setVisible(false);
        return;
      }

      // Hitung sisa waktu jika halaman di-refresh saat badge sedang tampil
      let startStr = sessionStorage.getItem(STORAGE_KEY_START);
      let startTime = startStr ? parseInt(startStr, 10) : null;
      const now = Date.now();

      if (!startTime || isNaN(startTime)) {
        startTime = now;
        sessionStorage.setItem(STORAGE_KEY_START, String(now));
      }

      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = DISPLAY_DURATION_SECONDS - elapsed;

      if (remaining <= 0) {
        sessionStorage.setItem(STORAGE_KEY_HIDDEN, "true");
        setVisible(false);
        return;
      }

      setTimeLeft(remaining);
      setVisible(true);
    } catch (e) {
      // Fallback jika sessionStorage tidak dapat diakses
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          try {
            sessionStorage.setItem(STORAGE_KEY_HIDDEN, "true");
          } catch (e) {}
          setVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY_HIDDEN, "true");
    } catch (e) {}
    setVisible(false);
  };

  if (!mounted) return null;

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / DISPLAY_DURATION_SECONDS) * 100));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.88, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 20, scale: 0.9, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 420, damping: 24, mass: 0.85 }}
          className="admin-plp-floating-card"
          style={{
            position: "fixed",
            zIndex: 998,
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.92) 100%)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1.5px solid rgba(16, 185, 129, 0.35)",
              boxShadow: "0 10px 28px -4px rgba(16, 185, 129, 0.18), 0 4px 12px rgba(15, 23, 42, 0.08)",
              padding: "0.65rem 0.85rem 0.75rem 0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.45rem",
              minWidth: "220px",
              maxWidth: "260px"
            }}
          >
            {/* Top Row: Icon, Title, and Close Button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", minWidth: 0 }}>
                {/* Glowing Academic Icon Badge */}
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    boxShadow: "0 3px 10px rgba(16, 185, 129, 0.38)",
                    flexShrink: 0,
                    position: "relative"
                  }}
                >
                  <GraduationCap size={18} />
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#f59e0b",
                      border: "1.5px solid #ffffff",
                      boxShadow: "0 0 6px #f59e0b"
                    }}
                  />
                </div>

                {/* Main Text Content */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      fontFamily: "var(--font-display, sans-serif)",
                      letterSpacing: "0.02em",
                      background: "linear-gradient(135deg, #065f46 0%, #059669 50%, #0284c7 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      lineHeight: 1.2
                    }}
                  >
                    PLP 2 MPI UINAM 2026
                  </div>
                  <div
                    style={{
                      fontSize: "0.64rem",
                      color: "var(--text-muted, #64748b)",
                      fontWeight: 700,
                      marginTop: "1px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}
                  >
                    <Sparkles size={10} color="#f59e0b" />
                    <span>Sistem Absensi Digital</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleDismiss}
                title="Tutup sekarang"
                aria-label="Tutup badge PLP"
                style={{
                  background: "rgba(241, 245, 249, 0.9)",
                  border: "1px solid #e2e8f0",
                  borderRadius: "7px",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                  padding: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#dc2626";
                  e.currentTarget.style.borderColor = "#fca5a5";
                  e.currentTarget.style.background = "#fee2e2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background = "rgba(241, 245, 249, 0.9)";
                }}
              >
                <X size={12} />
              </button>
            </div>

            {/* Bottom Row: Auto-dismiss countdown bar & pill */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginTop: "2px" }}>
              <div
                style={{
                  flex: 1,
                  height: "3.5px",
                  borderRadius: "999px",
                  background: "#e2e8f0",
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progressPercent}%`,
                    background: "linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #4f46e5 100%)",
                    transition: "width 1s linear"
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 800,
                  color: "#059669",
                  background: "#ecfdf5",
                  padding: "0.08rem 0.35rem",
                  borderRadius: "999px",
                  border: "1px solid #a7f3d0",
                  flexShrink: 0,
                  lineHeight: 1
                }}
              >
                {timeLeft}s
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
