"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, RefreshCw, Check, X, ShieldAlert, Upload } from "lucide-react";

export default function CameraSelfie({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraFacing, setCameraFacing] = useState("user");
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, cameraFacing, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Kamera tidak didukung pada perangkat ini");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Camera access failed, fallback enabled:", err);
      setCameraError(
        "Tidak dapat mengakses kamera (" + (err.message || "Izin ditolak") + "). Klik tombol di bawah untuk simulasi foto selfie."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === "user" ? "environment" : "user"));
  };

  const takeSnapshot = () => {
    setIsScanning(true);
    setTimeout(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");

        if (cameraFacing === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(dataUrl);
        stopCamera();
      }
      setIsScanning(false);
    }, 400);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)"
          }}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "460px",
            background: "#ffffff",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.2)",
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border-light)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Camera size={20} color="#059669" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Foto Selfie Kehadiran
                </h3>
                <p style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  Pastikan wajah tampak jelas di dalam bingkai
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px"
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Camera Viewport */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "360px",
              background: "#0f172a",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {!capturedImage && !cameraError && <div className="laser-line" />}

            {/* Viewfinder Target Reticle */}
            <div
              style={{
                position: "absolute",
                width: "240px",
                height: "240px",
                border: "2px dashed rgba(255, 255, 255, 0.5)",
                borderRadius: "28px",
                pointerEvents: "none",
                zIndex: 15
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-4px",
                  left: "-4px",
                  width: "28px",
                  height: "28px",
                  borderTop: "4px solid #10b981",
                  borderLeft: "4px solid #10b981",
                  borderTopLeftRadius: "8px"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "28px",
                  height: "28px",
                  borderTop: "4px solid #10b981",
                  borderRight: "4px solid #10b981",
                  borderTopRightRadius: "8px"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  left: "-4px",
                  width: "28px",
                  height: "28px",
                  borderBottom: "4px solid #10b981",
                  borderLeft: "4px solid #10b981",
                  borderBottomLeftRadius: "8px"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  right: "-4px",
                  width: "28px",
                  height: "28px",
                  borderBottom: "4px solid #10b981",
                  borderRight: "4px solid #10b981",
                  borderBottomRightRadius: "8px"
                }}
              />
            </div>

            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Foto Selfie"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : cameraError ? (
              <div style={{ textAlign: "center", padding: "1.5rem" }}>
                <ShieldAlert size={36} color="#dc2626" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ color: "#ffffff", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                  {cameraError}
                </p>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="btn-neon-secondary"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <RefreshCw size={16} /> Coba Buka Kamera Lagi
                  </button>
                  <label
                    className="btn-neon-primary"
                    style={{ fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px" }}
                  >
                    <Upload size={16} /> Unggah Foto Selfie
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const result = reader.result;
                            setCapturedImage(result);
                            setCameraError(null);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: cameraFacing === "user" ? "scaleX(-1)" : "none"
                }}
              />
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

          {/* Footer Controls */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem"
            }}
          >
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="btn-neon-secondary"
                  style={{ flex: 1 }}
                >
                  <RefreshCw size={16} /> Foto Ulang
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="btn-neon-primary"
                  style={{ flex: 1 }}
                >
                  <Check size={18} /> Pakai Foto Ini
                </button>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleFlipCamera}
                  className="btn-neon-secondary"
                  style={{ padding: "0.75rem 1rem", fontSize: "0.85rem" }}
                  title="Ganti Kamera Depan / Belakang"
                >
                  <RefreshCw size={16} /> Putar
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={takeSnapshot}
                  className="btn-neon-primary"
                  style={{ flex: 1 }}
                  disabled={!!cameraError}
                >
                  <Camera size={18} /> Ambil Foto Sekarang
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
