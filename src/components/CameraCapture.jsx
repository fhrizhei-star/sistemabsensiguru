"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Sparkles, FlipHorizontal, ShieldCheck, Smartphone } from "lucide-react";

export default function CameraCapture({
  capturedPhoto,
  onPhotoCaptured,
  onCapture,
  onRetake,
  user,
  userName,
  activityInfo = "Presensi"
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraFacing, setCameraFacing] = useState("user"); // "user" | "environment"
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Fallback native inputs untuk kamera perangkat langsung (hardware camera)
  const fallbackFrontInputRef = useRef(null);
  const fallbackRearInputRef = useRef(null);

  // Ambil nama user untuk watermark
  const displayName = userName || user?.nama || user?.username || "Guru / Pegawai";

  // Dispatcher aman untuk callback parent
  const emitCapturedPhoto = useCallback((dataUrl) => {
    if (typeof onCapture === "function") {
      onCapture(dataUrl);
    }
    if (typeof onPhotoCaptured === "function") {
      onPhotoCaptured(dataUrl);
    }
  }, [onCapture, onPhotoCaptured]);

  const emitRetake = useCallback(() => {
    if (typeof onRetake === "function") {
      onRetake();
    }
    if (typeof onCapture === "function") {
      onCapture(null);
    }
    if (typeof onPhotoCaptured === "function") {
      onPhotoCaptured(null);
    }
  }, [onRetake, onCapture, onPhotoCaptured]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("Gagal menghentikan track kamera:", e);
      }
      streamRef.current = null;
    }
    setStreamActive(false);
  }, []);

  const attachStreamToVideo = useCallback((mediaStream) => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch((err) => {
        console.warn("Kamera video.play() gagal:", err);
      });
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);

    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setCameraError("Akses kamera langsung (WebRTC) tidak didukung browser ini atau memerlukan HTTPS. Silakan gunakan tombol Buka Kamera Perangkat.");
      return;
    }

    // Percobaan 1: Menggunakan facingMode dan resolusi ideal
    try {
      const constraints1 = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints1);
      streamRef.current = stream;
      setStreamActive(true);
      attachStreamToVideo(stream);
      return;
    } catch (err1) {
      console.warn("Percobaan 1 kamera gagal, mencoba constraints dasar...", err1);
    }

    // Percobaan 2: Hanya facingMode
    try {
      const constraints2 = {
        video: { facingMode: cameraFacing },
        audio: false
      };
      const stream2 = await navigator.mediaDevices.getUserMedia(constraints2);
      streamRef.current = stream2;
      setStreamActive(true);
      attachStreamToVideo(stream2);
      return;
    } catch (err2) {
      console.warn("Percobaan 2 kamera gagal, mencoba generic video...", err2);
    }

    // Percobaan 3: Generic video tanpa constraint
    try {
      const stream3 = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream3;
      setStreamActive(true);
      attachStreamToVideo(stream3);
      return;
    } catch (err3) {
      console.error("Semua percobaan getUserMedia gagal:", err3);
      setCameraError("Izin kamera belum diberikan atau kamera sedang digunakan aplikasi lain. Anda dapat menggunakan tombol Buka Kamera Perangkat.");
      setStreamActive(false);
    }
  }, [cameraFacing, stopStream, attachStreamToVideo]);

  // Efek pembukaan dan penutupan stream
  useEffect(() => {
    if (!capturedPhoto) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [capturedPhoto, startCamera, stopStream]);

  // Efek sinkronisasi stream jika video element baru di-mount
  useEffect(() => {
    if (streamActive && streamRef.current && videoRef.current) {
      attachStreamToVideo(streamRef.current);
    }
  }, [streamActive, attachStreamToVideo]);

  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleRetakeClick = () => {
    emitRetake();
    startCamera();
  };

  // Watermark generator helper
  const drawWatermark = (ctx, width, height) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const timeStr = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

  };

  // Jepret foto dari stream live kamera
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;

      // Optimasi ukuran agar ringan dikirim dan disimpan
      const maxDim = 640;
      let targetW = vw;
      let targetH = vh;
      if (targetW > maxDim) {
        targetH = Math.round((targetH * maxDim) / targetW);
        targetW = maxDim;
      }

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");

      // Cerminkan jika kamera depan
      if (cameraFacing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (cameraFacing === "user") {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      drawWatermark(ctx, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      stopStream();
      emitCapturedPhoto(dataUrl);
    } catch (e) {
      console.error("Gagal mengambil foto canvas:", e);
    } finally {
      setIsCapturing(false);
    }
  };

  // Fallback hardware camera trigger langsung dari HP/perangkat
  const handleNativeDeviceCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxDim = 640;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);

          drawWatermark(ctx, w, h);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
          stopStream();
          emitCapturedPhoto(dataUrl);
        } catch (err) {
          console.error("Gagal memproses gambar perangkat:", err);
        } finally {
          setIsCapturing(false);
          if (fallbackFrontInputRef.current) fallbackFrontInputRef.current.value = "";
          if (fallbackRearInputRef.current) fallbackRearInputRef.current.value = "";
        }
      };
      img.onerror = () => {
        setIsCapturing(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1.5px solid #a7f3d0",
        borderRadius: "var(--radius-lg)",
        padding: "1.15rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        boxShadow: "0 4px 20px rgba(5, 150, 105, 0.08)"
      }}
    >
      {/* Header Info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "#ecfdf5", border: "1px solid #a7f3d0",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#059669"
          }}>
            <Camera size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-main)" }}>
              Kamera Presensi Device
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Wajib ambil foto bukti kehadiran langsung dari kamera perangkat
            </div>
          </div>
        </div>

        {capturedPhoto ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.3rem",
            fontSize: "0.72rem", fontWeight: 800,
            background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0",
            padding: "0.22rem 0.65rem", borderRadius: "999px"
          }}>
            <CheckCircle2 size={13} color="#059669" /> Foto Siap Dikirim
          </span>
        ) : streamActive ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            fontSize: "0.72rem", fontWeight: 800,
            background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0",
            padding: "0.22rem 0.65rem", borderRadius: "999px"
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", animation: "pulse 1.5s infinite" }} />
            Kamera Aktif ({cameraFacing === "user" ? "Depan" : "Belakang"})
          </span>
        ) : null}
      </div>

      {/* Main Viewfinder Box */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "270px",
          background: "#0f172a",
          borderRadius: "14px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 2px 10px rgba(0,0,0,0.4)"
        }}
      >
        {capturedPhoto ? (
          // Pratinjau Foto yang Berhasil Diambil
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <img
              src={capturedPhoto}
              alt="Foto Bukti Presensi"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                background: "rgba(5, 150, 105, 0.92)",
                backdropFilter: "blur(4px)",
                color: "#ffffff",
                padding: "0.25rem 0.65rem",
                borderRadius: "8px",
                fontSize: "0.74rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "0.35rem"
              }}
            >
              <CheckCircle2 size={14} /> Terverifikasi
            </div>
          </div>
        ) : (
          <>
            {/* Live Video Feed dari Kamera */}
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el && streamRef.current && el.srcObject !== streamRef.current) {
                  el.srcObject = streamRef.current;
                  el.play().catch(() => { });
                }
              }}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: streamActive ? "block" : "none",
                transform: cameraFacing === "user" ? "scaleX(-1)" : "none"
              }}
            />

            {streamActive && (
              <>
                {/* Viewfinder Target Framing Overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: "18px",
                    border: "2px dashed rgba(255, 255, 255, 0.4)",
                    borderRadius: "12px",
                    pointerEvents: "none"
                  }}
                />

                {/* Guide Text */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(4px)",
                    color: "#ffffff",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "999px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    pointerEvents: "none"
                  }}
                >
                  Arahkan kamera ke wajah atau ruang kelas
                </div>
              </>
            )}

            {!streamActive && (
              // State Error / Fallback UI
              <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8", maxWidth: "90%" }}>
                <Camera size={38} color="#64748b" style={{ margin: "0 auto 0.5rem" }} />
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.4rem" }}>
                  {cameraError || "Menghubungkan ke kamera perangkat..."}
                </div>
                <div style={{ fontSize: "0.76rem", color: "#94a3b8", marginBottom: "0.85rem" }}>
                  Bila izin kamera belum aktif, tekan tombol di bawah untuk langsung membuka kamera HP/perangkat Anda:
                </div>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => fallbackRearInputRef.current?.click()}
                    className="btn-neon-primary"
                    style={{ fontSize: "0.78rem", padding: "0.45rem 0.85rem", background: "#059669", color: "#fff" }}
                  >
                    <Camera size={14} /> Buka Kamera Belakang
                  </button>
                  <button
                    type="button"
                    onClick={() => fallbackFrontInputRef.current?.click()}
                    className="btn-neon-secondary"
                    style={{ fontSize: "0.78rem", padding: "0.45rem 0.85rem", background: "#1e293b", color: "#fff", borderColor: "#334155" }}
                  >
                    <Smartphone size={14} /> Buka Kamera Depan
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="btn-neon-secondary"
                    style={{ fontSize: "0.78rem", padding: "0.45rem 0.85rem", background: "#0f172a", color: "#94a3b8", borderColor: "#334155" }}
                  >
                    <RefreshCw size={13} /> Coba Sambung Ulang
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Buttons */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        {capturedPhoto ? (
          <button
            type="button"
            onClick={handleRetakeClick}
            className="btn-neon-secondary"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              padding: "0.75rem 1rem",
              fontSize: "0.86rem",
              fontWeight: 800,
              color: "#d97706",
              borderColor: "#fde68a",
              background: "#fffbeb"
            }}
          >
            <RefreshCw size={16} /> Foto Ulang
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={takeSnapshot}
              disabled={!streamActive || isCapturing}
              className="btn-neon-primary"
              style={{
                flex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                fontSize: "0.88rem",
                fontWeight: 800,
                opacity: !streamActive ? 0.6 : 1,
                cursor: !streamActive ? "not-allowed" : "pointer"
              }}
            >
              <Camera size={18} />
              <span>{isCapturing ? "Mengambil Foto..." : "Ambil Foto Presensi"}</span>
            </button>

            <button
              type="button"
              onClick={toggleCameraFacing}
              disabled={!streamActive}
              title="Ganti Kamera Depan / Belakang"
              className="btn-neon-secondary"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.75rem 0.85rem",
                fontSize: "0.82rem",
                fontWeight: 700,
                background: "#ffffff"
              }}
            >
              <FlipHorizontal size={16} />
              <span>{cameraFacing === "user" ? "Kamera Belakang" : "Kamera Depan"}</span>
            </button>
          </>
        )}

        {/* Input file bawaan perangkat keras (Direct Hardware Camera Trigger) */}
        <input
          ref={fallbackRearInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeDeviceCapture}
          style={{ display: "none" }}
        />
        <input
          ref={fallbackFrontInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleNativeDeviceCapture}
          style={{ display: "none" }}
        />

        {/* Tombol alternatif langsung buka aplikasi kamera HP */}
        {!capturedPhoto && streamActive && (
          <button
            type="button"
            onClick={() => fallbackRearInputRef.current?.click()}
            className="btn-neon-secondary"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              padding: "0.55rem",
              fontSize: "0.78rem",
              fontWeight: 700,
              background: "#f8fafc",
              color: "#475569",
              borderColor: "#e2e8f0"
            }}
          >
            <Smartphone size={14} /> Atau Gunakan Aplikasi Kamera Bawaan HP
          </button>
        )}
      </div>
    </div>
  );
}
