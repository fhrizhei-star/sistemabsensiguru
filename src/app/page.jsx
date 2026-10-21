"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Auth } from "@/lib/auth";
import { Api } from "@/lib/api";
import {
  School,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  GraduationCap
} from "lucide-react";

// --- Welcome Screen Component ---
function WelcomeScreen({ user, onDone }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user.role === "admin") router.push("/admin");
      else router.push("/user");
    }, 3200);
    return () => clearTimeout(timer);
  }, [user, router]);

  const particles = Array.from({ length: 18 });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 35%, #047857 65%, #059669 100%)",
        overflow: "hidden"
      }}
    >
      {/* Radial glow center */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)"
      }} />

      {/* Animated ripple rings */}
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 3.5, opacity: 0 }}
          transition={{
            duration: 2.4,
            delay: i * 0.45,
            repeat: Infinity,
            ease: "easeOut"
          }}
          style={{
            position: "absolute",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            border: "2px solid rgba(52, 211, 153, 0.5)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
        />
      ))}

      {/* Floating particles */}
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360;
        const radius = 180 + Math.random() * 120;
        const size = 4 + Math.random() * 8;
        return (
          <motion.div
            key={i}
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
              scale: 0
            }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * radius,
              y: Math.sin((angle * Math.PI) / 180) * radius,
              opacity: [0, 1, 0.7, 0],
              scale: [0, 1.2, 1, 0]
            }}
            transition={{
              duration: 1.8,
              delay: 0.3 + (i % 6) * 0.08,
              ease: "easeOut"
            }}
            style={{
              position: "absolute",
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: "50%",
              background: i % 3 === 0 ? "#6ee7b7" : i % 3 === 1 ? "#a7f3d0" : "#d1fae5",
              top: "50%",
              left: "50%",
              boxShadow: `0 0 ${size * 2}px rgba(110, 231, 183, 0.8)`
            }}
          />
        );
      })}

      {/* Animated decorative orbs */}
      <motion.div
        animate={{ y: [-15, 15, -15], x: [5, -5, 5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52, 211, 153, 0.18) 0%, transparent 70%)",
          top: "8%",
          left: "10%"
        }}
      />
      <motion.div
        animate={{ y: [12, -12, 12], x: [-8, 8, -8] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
          bottom: "5%",
          right: "8%"
        }}
      />

      {/* Main content */}
      <div style={{ position: "relative", textAlign: "center", zIndex: 10 }}>
        {/* Checkmark icon */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.15 }}
          style={{
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            border: "4px solid rgba(167, 243, 208, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2rem",
            boxShadow: "0 0 0 12px rgba(16, 185, 129, 0.2), 0 0 0 24px rgba(16, 185, 129, 0.1), 0 20px 40px rgba(4, 120, 87, 0.5)"
          }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 350 }}
          >
            <CheckCircle size={58} color="#ffffff" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        {/* Welcome text */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6, ease: "easeOut" }}
        >
          <p style={{
            fontSize: "0.95rem",
            color: "#a7f3d0",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "0.5rem"
          }}>
            Login Berhasil
          </p>
          <h1 style={{
            fontSize: "2.2rem",
            fontWeight: 900,
            color: "#ffffff",
            marginBottom: "0.5rem",
            textShadow: "0 2px 20px rgba(0,0,0,0.25)",
            lineHeight: 1.1
          }}>
            Selamat Datang,
          </h1>
          <h2 style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "#6ee7b7",
            marginBottom: "0.5rem",
            textShadow: "0 0 30px rgba(110, 231, 183, 0.5)"
          }}>
            {user.nama || user.username}
          </h2>
          <p style={{
            fontSize: "0.88rem",
            color: "rgba(167, 243, 208, 0.8)",
            fontWeight: 600
          }}>
            {user.role === "admin" ? "Administrator Tata Usaha" : `Guru ${user.mapel || "Mata Pelajaran"}`}
          </p>
        </motion.div>

        {/* School name badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "1.75rem",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(167, 243, 208, 0.3)",
            borderRadius: "var(--radius-full)",
            padding: "0.55rem 1.25rem"
          }}
        >
          <GraduationCap size={16} color="#6ee7b7" />
          <span style={{ fontSize: "0.82rem", color: "#d1fae5", fontWeight: 700, letterSpacing: "0.04em" }}>
            SMA NEGERI 1 TELADAN
          </span>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{ marginTop: "2rem" }}
        >
          <p style={{ fontSize: "0.75rem", color: "rgba(167, 243, 208, 0.6)", marginBottom: "0.5rem" }}>
            Memuat dashboard...
          </p>
          <div style={{
            width: "200px",
            height: "4px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "4px",
            margin: "0 auto",
            overflow: "hidden"
          }}>
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 1.3, duration: 1.8, ease: "easeInOut" }}
              style={{
                height: "100%",
                borderRadius: "4px",
                background: "linear-gradient(90deg, #6ee7b7 0%, #34d399 50%, #10b981 100%)"
              }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// --- Main Login Page ---
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [welcomeUser, setWelcomeUser] = useState(null);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Harap masukkan NIP / Username dan Password!");
      return;
    }

    setLoading(true);
    try {
      const res = await Api.request("POST", "login", {}, { username, password });
      if (res && res.success && res.user) {
        Auth.setCurrentUser(res.user, rememberMe);
        setWelcomeUser(res.user);
      } else {
        setErrorMsg(res?.message || "NIP / Username atau Password tidak sesuai");
      }
    } catch (err) {
      setErrorMsg("Terjadi gangguan server. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {welcomeUser && (
          <WelcomeScreen user={welcomeUser} onDone={() => {}} />
        )}
      </AnimatePresence>

      {/* Full-page green background override (covers ThemeBackground) */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 40%, #d1fae5 100%)"
      }} />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          position: "relative",
          zIndex: 1
        }}
      >
        {/* Subtle background decorations */}
        <div style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0
        }}>
          <div style={{
            position: "absolute",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
            top: "-120px",
            right: "-120px"
          }} />
          <div style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(5, 150, 105, 0.1) 0%, transparent 70%)",
            bottom: "-80px",
            left: "-80px"
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            width: "100%",
            maxWidth: "460px",
            background: "#ffffff",
            padding: "2.5rem 2rem",
            borderRadius: "var(--radius-xl)",
            border: "1.5px solid #a7f3d0",
            boxShadow: "0 10px 40px -8px rgba(5, 150, 105, 0.18), 0 0 0 1px rgba(16, 185, 129, 0.06)",
            position: "relative",
            overflow: "hidden",
            zIndex: 1
          }}
        >
          {/* Green Accent Top Ribbon */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "5px",
              background: "linear-gradient(90deg, #064e3b 0%, #059669 40%, #34d399 70%, #6ee7b7 100%)"
            }}
          />

          {/* Header School Logo */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <motion.div
              whileHover={{ scale: 1.06, rotate: 3 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "22px",
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                border: "2px solid #6ee7b7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                boxShadow: "0 6px 22px rgba(5, 150, 105, 0.35)"
              }}
            >
              <School size={36} color="#ffffff" />
            </motion.div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.65rem",
                fontWeight: 800,
                color: "#064e3b",
                letterSpacing: "-0.01em",
                marginBottom: "0.25rem"
              }}
            >
              SISTEM ABSENSI GURU
            </h1>
            <p style={{ color: "#059669", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              SMA NEGERI 1 TELADAN
            </p>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  color: "#be123c",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1.25rem"
                }}
              >
                <AlertCircle size={18} color="#e11d48" style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#065f46",
                  marginBottom: "0.4rem"
                }}
              >
                NIP atau Nama Pengguna
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan NIP atau username..."
                  className="neon-input"
                  style={{
                    paddingLeft: "2.75rem",
                    borderColor: "#a7f3d0",
                    outlineColor: "#059669"
                  }}
                />
                <User
                  size={18}
                  color="#059669"
                  style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#065f46",
                  marginBottom: "0.4rem"
                }}
              >
                Kata Sandi
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="neon-input"
                  style={{
                    paddingLeft: "2.75rem",
                    paddingRight: "2.75rem",
                    borderColor: "#a7f3d0",
                    outlineColor: "#059669"
                  }}
                />
                <Lock
                  size={18}
                  color="#059669"
                  style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#059669",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.82rem",
                color: "#6b7280"
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: "#059669", cursor: "pointer" }}
                />
                <span>Ingat saya</span>
              </label>
              <span style={{ color: "#059669", cursor: "pointer", fontWeight: 600 }}>Lupa sandi?</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(5, 150, 105, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                padding: "0.85rem 1.5rem",
                background: loading
                  ? "#d1d5db"
                  : "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(5, 150, 105, 0.3)",
                letterSpacing: "0.02em",
                transition: "all 0.2s"
              }}
            >
              {loading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </>
  );
}
