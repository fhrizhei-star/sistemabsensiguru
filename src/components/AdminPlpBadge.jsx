"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * PREVIEW_MODE:
 * Set 'true' saat ingin mengatur/mengedit tampilan agar card selalu muncul (tidak hilang otomatis).
 * Set 'false' jika ingin mengembalikan fitur auto-tutup 30 detik setelah login.
 */
const PREVIEW_MODE = false;

const DISPLAY_DURATION_SECONDS = 30;
const STORAGE_KEY_HIDDEN = "plp_card_hidden_session";
const STORAGE_KEY_START = "plp_card_start_time";

export default function AdminPlpBadge() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Jika dalam PREVIEW_MODE, card selalu muncul
    if (PREVIEW_MODE) {
      setVisible(true);
      return;
    }

    try {
      const isHidden = sessionStorage.getItem(STORAGE_KEY_HIDDEN) === "true";
      if (isHidden) {
        setVisible(false);
        return;
      }

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

      setVisible(true);

      const timer = setTimeout(() => {
        try {
          sessionStorage.setItem(STORAGE_KEY_HIDDEN, "true");
        } catch (e) { }
        setVisible(false);
      }, remaining * 1000);

      return () => clearTimeout(timer);
    } catch (e) {
      setVisible(true);
    }
  }, []);

  if (!mounted || !visible) return null;

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
            boxSizing: "border-box",
            pointerEvents: "auto"
          }}
        >
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "99px",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.94) 100%)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1.5px solid rgba(16, 185, 129, 0.35)",
              boxShadow: "0 10px 28px -4px rgba(16, 185, 129, 0.20), 0 4px 12px rgba(15, 23, 42, 0.08)",
              padding: "0.65rem 0.95rem",
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              minWidth: "110px",
              cursor: "default"
            }}
          >
            {/* Glowing Academic Icon Badge */}
            <div
              style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 300,
                  fontFamily: "var(--font-display, sans-serif)",
                  letterSpacing: "0.09em",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <Sparkles size={12} />created by
              </div>
            </div>

            {/* Main Text Content */}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 900,
                  fontFamily: "var(--font-display, sans-serif)",
                  letterSpacing: "0.02em",
                  background: "linear-gradient(135deg, #065f46 0%, #059669 50%, #0284c7 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1.25,
                  whiteSpace: "nowrap"
                }}
              >
                PLP 2 MPI UINAM 2026
              </div>
            </div>
          </motion.div>
        </motion.div>
      )
      }
    </AnimatePresence >
  );
}
