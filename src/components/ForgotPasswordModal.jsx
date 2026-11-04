"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Check
} from "lucide-react";
import { Api } from "@/lib/api";

export default function ForgotPasswordModal({ isOpen, onClose, onSuccessReset }) {
  const [step, setStep] = useState(1); // 1: Verifikasi, 2: Buat Sandi Baru, 3: Sukses
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setStep(1);
    setIdentifier("");
    setPhone("");
    setVerifiedUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setNotice(null);
    onClose();
  };

  // Langkah 1: Verifikasi NIP/Username dan Nomor HP
  const handleVerify = async (e) => {
    e.preventDefault();
    setNotice(null);

    const cleanIdentifier = identifier.trim();
    const cleanPhone = phone.trim();

    if (!cleanIdentifier) {
      setNotice({ type: "error", msg: "Harap masukkan NIP atau Username terdaftar!" });
      return;
    }

    if (!cleanPhone) {
      setNotice({ type: "error", msg: "Harap masukkan Nomor HP / WhatsApp terdaftar!" });
      return;
    }

    setLoading(true);
    try {
      const res = await Api.request("POST", "resetPassword", {}, {
        identifier: cleanIdentifier,
        no_hp: cleanPhone,
        verify_only: true
      });

      if (res && res.success && res.user) {
        setVerifiedUser(res.user);
        setStep(2);
        setNotice(null);
      } else {
        setNotice({
          type: "error",
          msg: res?.message || "Data tidak ditemukan. Pastikan NIP dan Nomor HP sesuai dengan yang terdaftar di sekolah!"
        });
      }
    } catch (err) {
      console.error("Gagal verifikasi identitas:", err);
      setNotice({
        type: "error",
        msg: "Terjadi gangguan koneksi saat verifikasi identitas."
      });
    } finally {
      setLoading(false);
    }
  };

  // Langkah 2: Simpan Password Baru
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setNotice(null);

    const trimmedPass = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPass) {
      setNotice({ type: "error", msg: "Kata sandi baru tidak boleh kosong!" });
      return;
    }

    if (trimmedPass.length < 4) {
      setNotice({ type: "error", msg: "Kata sandi baru minimal 4 karakter!" });
      return;
    }

    if (trimmedPass !== trimmedConfirm) {
      setNotice({ type: "error", msg: "Konfirmasi kata sandi tidak cocok!" });
      return;
    }

    setLoading(true);
    try {
      const res = await Api.request("POST", "resetPassword", {}, {
        identifier: verifiedUser?.nip || verifiedUser?.username || identifier.trim(),
        no_hp: phone.trim(),
        new_password: trimmedPass
      });

      if (res && res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        setStep(3);
        if (onSuccessReset) {
          onSuccessReset(verifiedUser?.username || verifiedUser?.nip || identifier.trim(), trimmedPass);
        }
      } else {
        setNotice({
          type: "error",
          msg: res?.message || "Gagal memperbarui kata sandi. Silakan coba kembali."
        });
      }
    } catch (err) {
      console.error("Gagal reset kata sandi:", err);
      setNotice({
        type: "error",
        msg: "Terjadi gangguan saat menyimpan kata sandi baru."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
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
            maxWidth: "460px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            border: "1px solid #e2e8f0",
            overflow: "hidden"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Modal */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              borderBottom: "1px solid #d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#d1fae5",
                  border: "1px solid #a7f3d0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#059669"
                }}
              >
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#065f46", margin: 0 }}>
                  Pemulihan Kata Sandi
                </h3>
                <p style={{ fontSize: "0.76rem", color: "#047857", margin: 0, fontWeight: 500 }}>
                  {step === 1 && "Langkah 1: Verifikasi Data Terdaftar"}
                  {step === 2 && "Langkah 2: Buat Kata Sandi Baru"}
                  {step === 3 && "Selesai: Pemulihan Berhasil"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                padding: "0.35rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper Indikator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.75rem 1.5rem",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              gap: "0.5rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: 1 }}>
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: step >= 1 ? "#059669" : "#cbd5e1",
                  color: "#ffffff",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {step > 1 ? <Check size={13} /> : "1"}
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: step === 1 ? 700 : 500, color: step === 1 ? "#065f46" : "#64748b" }}>
                Verifikasi
              </span>
            </div>

            <div style={{ width: "24px", height: "1px", background: "#cbd5e1" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: 1 }}>
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: step >= 2 ? "#059669" : "#cbd5e1",
                  color: "#ffffff",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {step > 2 ? <Check size={13} /> : "2"}
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: step === 2 ? 700 : 500, color: step === 2 ? "#065f46" : "#64748b" }}>
                Sandi Baru
              </span>
            </div>

            <div style={{ width: "24px", height: "1px", background: "#cbd5e1" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: step === 3 ? "#059669" : "#cbd5e1",
                  color: "#ffffff",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Check size={13} />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: step === 3 ? 700 : 500, color: step === 3 ? "#065f46" : "#64748b" }}>
                Selesai
              </span>
            </div>
          </div>

          {/* Modal Body */}
          <div style={{ padding: "1.5rem" }}>
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

            {/* STEP 1: Verifikasi Identitas */}
            {step === 1 && (
              <form onSubmit={handleVerify}>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1.2rem", lineHeight: 1.5 }}>
                  Masukkan <strong>NIP / Username</strong> dan <strong>Nomor WhatsApp / HP</strong> yang terdaftar di database sekolah untuk memverifikasi akun Anda.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
                      NIP atau Username Terdaftar <span style={{ color: "#e11d48" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Contoh: 19850101... atau nama_user"
                        className="neon-input"
                        style={{ background: "#ffffff", paddingLeft: "2.4rem" }}
                        required
                        autoFocus
                      />
                      <User
                        size={16}
                        color="#94a3b8"
                        style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
                      Nomor HP / WhatsApp Terdaftar <span style={{ color: "#e11d48" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="neon-input"
                        style={{ background: "#ffffff", paddingLeft: "2.4rem" }}
                        required
                      />
                      <Phone
                        size={16}
                        color="#94a3b8"
                        style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)" }}
                      />
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.3rem", display: "block" }}>
                      💡 Digunakan untuk validasi bahwa Anda adalah pemilik akun yang sah.
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    style={{
                      padding: "0.6rem 1rem",
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
                    disabled={loading}
                    style={{
                      padding: "0.6rem 1.35rem",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)"
                    }}
                  >
                    {loading ? "Memverifikasi..." : (
                      <>
                        Verifikasi Akun <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Buat Sandi Baru */}
            {step === 2 && (
              <form onSubmit={handleResetPassword}>
                {verifiedUser && (
                  <div
                    style={{
                      marginBottom: "1.2rem",
                      padding: "0.85rem 1rem",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem"
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#dbeafe",
                        border: "1px solid #93c5fd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#2563eb",
                        flexShrink: 0
                      }}
                    >
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.74rem", color: "#1e40af", fontWeight: 700 }}>
                        AKUN TERVERIFIKASI
                      </div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1e3a8a" }}>
                        {verifiedUser.nama}
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#3b82f6" }}>
                        NIP: {verifiedUser.nip || verifiedUser.username}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
                      Kata Sandi Baru <span style={{ color: "#e11d48" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 4 karakter"
                        className="neon-input"
                        style={{ background: "#ffffff", paddingLeft: "2.4rem", paddingRight: "2.4rem" }}
                        required
                        autoFocus
                      />
                      <Lock
                        size={16}
                        color="#94a3b8"
                        style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)" }}
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

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
                      Ulangi Kata Sandi Baru <span style={{ color: "#e11d48" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ketik ulang kata sandi baru"
                        className="neon-input"
                        style={{ background: "#ffffff", paddingLeft: "2.4rem", paddingRight: "2.4rem" }}
                        required
                      />
                      <ShieldCheck
                        size={16}
                        color="#94a3b8"
                        style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)" }}
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

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setNotice(null); }}
                    disabled={loading}
                    style={{
                      padding: "0.6rem 0.95rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-light)",
                      background: "#f8fafc",
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem"
                    }}
                  >
                    <ArrowLeft size={14} /> Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: "0.6rem 1.35rem",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)"
                    }}
                  >
                    {loading ? "Menyimpan..." : (
                      <>
                        <KeyRound size={15} /> Simpan Sandi Baru
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Sukses */}
            {step === 3 && (
              <div style={{ textAlign: "center", padding: "1rem 0 0.5rem" }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "#ecfdf5",
                    border: "2px solid #a7f3d0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#059669",
                    margin: "0 auto 1.25rem"
                  }}
                >
                  <CheckCircle2 size={36} />
                </motion.div>

                <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>
                  Kata Sandi Berhasil Diperbarui!
                </h4>

                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                  Kata sandi baru untuk akun <strong>{verifiedUser?.nama || identifier}</strong> telah aktif di sistem. Silakan gunakan untuk masuk.
                </p>

                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
                  }}
                >
                  Masuk Sekarang
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

