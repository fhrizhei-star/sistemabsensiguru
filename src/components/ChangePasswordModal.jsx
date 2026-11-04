"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertTriangle, X, ShieldCheck } from "lucide-react";
import { Api } from "@/lib/api";
import { Auth } from "@/lib/auth";

export default function ChangePasswordModal({ isOpen, onClose, currentUser, onPasswordChanged }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    const trimmedPass = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPass) {
      setNotice({ type: "error", msg: "Password baru tidak boleh kosong!" });
      return;
    }

    if (trimmedPass.length < 4) {
      setNotice({ type: "error", msg: "Password baru minimal terdiri dari 4 karakter!" });
      return;
    }

    if (trimmedPass !== trimmedConfirm) {
      setNotice({ type: "error", msg: "Konfirmasi password tidak cocok dengan password baru!" });
      return;
    }

    if (!currentUser?.id) {
      setNotice({ type: "error", msg: "Sesi pengguna tidak valid. Silakan muat ulang halaman." });
      return;
    }

    setSubmitting(true);
    try {
      // Panggil endpoint update password (kompatibel dengan saveUser dan changePassword)
      const res = await Api.request("POST", "saveUser", {}, {
        id: currentUser.id,
        password: trimmedPass
      });

      if (res && res.success) {
        // Perbarui sesi Auth lokal
        const updatedUser = { ...currentUser, password: trimmedPass };
        Auth.setCurrentUser(updatedUser);
        if (onPasswordChanged) onPasswordChanged(updatedUser);

        setNotice({
          type: "success",
          msg: "Password berhasil diperbarui! Silakan gunakan password baru ini untuk login berikutnya."
        });

        // Reset form input
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          onClose();
          setNotice(null);
        }, 1800);
      } else {
        setNotice({
          type: "error",
          msg: res?.message || "Gagal mengubah password. Silakan hubungi admin sekolah jika kendala berlanjut."
        });
      }
    } catch (err) {
      console.error("Gagal ganti password:", err);
      setNotice({
        type: "error",
        msg: "Terjadi kesalahan koneksi server saat mengubah password."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setNewPassword("");
    setConfirmPassword("");
    setNotice(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          style={{
            background: "#ffffff",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: "440px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid var(--border-light)",
            overflow: "hidden"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Modal */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "#e0e7ff",
                  border: "1px solid #c7d2fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4f46e5"
                }}
              >
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                  Ganti Password Akun
                </h3>
                <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: 0 }}>
                  {currentUser?.nama || currentUser?.username} ({currentUser?.nip ? `NIP ${currentUser.nip}` : currentUser?.role})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "0.3rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
            {notice && (
              <div
                style={{
                  marginBottom: "1.1rem",
                  padding: "0.75rem 0.95rem",
                  borderRadius: "var(--radius-md)",
                  background: notice.type === "success" ? "#ecfdf5" : "#fff1f2",
                  border: `1px solid ${notice.type === "success" ? "#a7f3d0" : "#fecdd3"}`,
                  color: notice.type === "success" ? "#065f46" : "#be123c",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                {notice.type === "success" ? (
                  <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={16} color="#e11d48" style={{ flexShrink: 0 }} />
                )}
                <span>{notice.msg}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Input Password Baru */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    marginBottom: "0.35rem"
                  }}
                >
                  Password Baru <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru minimal 4 karakter"
                    className="neon-input"
                    style={{
                      background: "#ffffff",
                      paddingLeft: "2.4rem",
                      paddingRight: "2.4rem"
                    }}
                    required
                  />
                  <Lock
                    size={16}
                    color="#94a3b8"
                    style={{
                      position: "absolute",
                      left: "0.8rem",
                      top: "50%",
                      transform: "translateY(-50%)"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: "absolute",
                      right: "0.8rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex"
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Input Konfirmasi Password Baru */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    marginBottom: "0.35rem"
                  }}
                >
                  Konfirmasi Password Baru <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru Anda"
                    className="neon-input"
                    style={{
                      background: "#ffffff",
                      paddingLeft: "2.4rem",
                      paddingRight: "2.4rem"
                    }}
                    required
                  />
                  <ShieldCheck
                    size={16}
                    color="#94a3b8"
                    style={{
                      position: "absolute",
                      left: "0.8rem",
                      top: "50%",
                      transform: "translateY(-50%)"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "0.8rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex"
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "1.5rem"
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                style={{
                  padding: "0.55rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  background: "#f8fafc",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "0.55rem 1.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "var(--primary-gradient)",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)"
                }}
              >
                {submitting ? (
                  <>Menyimpan...</>
                ) : (
                  <>
                    <KeyRound size={16} /> Simpan Password
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

