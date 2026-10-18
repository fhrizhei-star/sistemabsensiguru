/**
 * ====================================================================
 * UTILITY HELPERS (Date, Time, Distance, Export, Camera, Toast)
 * ====================================================================
 */

const Utils = {
  // ---- TOAST NOTIFICATION (MODERN FLOATING PILLS) ----
  showToast(message, type = "info", duration = 3500) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icons = {
      success: "✓",
      error: "✕",
      warning: "!",
      info: "ℹ"
    };

    toast.innerHTML = `
      <div class="toast-icon-circle">${icons[type] || "•"}</div>
      <div style="flex: 1; line-height: 1.4;">${message}</div>
    `;

    container.appendChild(toast);

    // Trigger smooth entrance
    requestAnimationFrame(() => {
      setTimeout(() => toast.classList.add("show"), 20);
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },

  // ---- MODERN CONFIRM DIALOG POPUP ----
  showConfirm({
    title = "Konfirmasi Aksi",
    message = "Apakah Anda yakin ingin melanjutkan?",
    icon = "warning", // 'warning', 'danger', 'success'
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    confirmBtnClass = "btn-primary"
  }) {
    return new Promise((resolve) => {
      // Remove any existing confirm modal
      const existing = document.getElementById("custom-confirm-modal");
      if (existing) existing.remove();

      const iconsMap = {
        warning: "⚠️",
        danger: "🗑️",
        success: "✨"
      };

      const backdrop = document.createElement("div");
      backdrop.id = "custom-confirm-modal";
      backdrop.className = "modal-backdrop";

      backdrop.innerHTML = `
        <div class="modal-dialog" style="max-width: 440px;">
          <div class="modal-body confirm-box">
            <div class="confirm-icon-badge ${icon}">
              ${iconsMap[icon] || "⚠️"}
            </div>
            <h3 class="confirm-title">${title}</h3>
            <p class="confirm-message">${message}</p>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
              <button type="button" class="btn btn-secondary" id="confirm-cancel-btn" style="flex: 1;">
                ${cancelText}
              </button>
              <button type="button" class="btn ${confirmBtnClass}" id="confirm-ok-btn" style="flex: 1.2;">
                ${confirmText}
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      // Trigger entrance
      requestAnimationFrame(() => {
        setTimeout(() => backdrop.classList.add("active"), 20);
      });

      const cleanup = (result) => {
        backdrop.classList.remove("active");
        setTimeout(() => {
          backdrop.remove();
          resolve(result);
        }, 300);
      };

      backdrop.querySelector("#confirm-ok-btn").addEventListener("click", () => cleanup(true));
      backdrop.querySelector("#confirm-cancel-btn").addEventListener("click", () => cleanup(false));
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) cleanup(false);
      });
    });
  },

  // ---- DATE & TIME FORMATTERS ----
  formatDateIndo(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const dayName = days[d.getDay()];
    const day = d.getDate();
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();

    return `${dayName}, ${day} ${monthName} ${year}`;
  },

  formatTimeOnly(timeStr) {
    if (!timeStr) return "-";
    return String(timeStr).substring(0, 5);
  },

  // ---- HAVERSINE DISTANCE FORMULA (in meters) ----
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  },

  // ---- GEOLOCATION PROMISE ----
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Perangkat atau browser Anda tidak mendukung Geolocation GPS"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  },

  // ---- WEBCAM / CAMERA HELPERS ----
  activeStream: null,

  async startCamera(videoElement, facingMode = "user") {
    try {
      if (this.activeStream) {
        this.stopCamera(videoElement);
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      this.activeStream = stream;
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
      }
      return true;
    } catch (err) {
      console.warn("Gagal mengakses kamera:", err);
      return false;
    }
  },

  capturePhoto(videoElement) {
    if (!videoElement) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext("2d");

    // Mirror image for selfie mode
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.7);
  },

  stopCamera(videoElement) {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach((track) => track.stop());
      this.activeStream = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
  },

  // ---- CSV & EXCEL EXPORT ----
  exportToCsv(filename, headers, rows) {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += headers.map((h) => `"${h}"`).join(",") + "\r\n";

    rows.forEach((row) => {
      csvContent += row.map((val) => `"${String(val || "").replace(/"/g, '""')}"`).join(",") + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

window.Utils = Utils;
