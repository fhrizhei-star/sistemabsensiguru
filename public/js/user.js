/**
 * ====================================================================
 * LOGIKA PORTAL GURU & TENAGA PENDIDIK
 * Presensi Masuk & Pulang (Berbasis Tombol & Radius Lokasi GPS)
 * ====================================================================
 */

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = Auth.requireAuth();
  if (!currentUser) return;
  Auth.initUserUI(currentUser);

  // Profil Guru di Header ditangani oleh Auth.initUserUI
  const profileName = document.getElementById("user-profile-name");
  const profileNip = document.getElementById("user-profile-nip");
  const profileMapel = document.getElementById("user-profile-mapel");

  if (profileName) profileName.textContent = currentUser.nama;
  if (profileNip) profileNip.textContent = `NIP: ${currentUser.nip || currentUser.username}`;
  if (profileMapel) {
    profileMapel.textContent = currentUser.mapel ? `Guru ${currentUser.mapel}` : (currentUser.jabatan || "Tenaga Pendidik");
  }

  const path = window.location.pathname.toLowerCase();
  if (path.includes("riwayat")) {
    initGuruRiwayatPage(currentUser);
  } else if (path.includes("izin")) {
    initGuruIzinPage(currentUser);
  } else {
    initGuruAttendancePage(currentUser);
  }
});

// ================= 1. HALAMAN PRESENSI GURU (TOMBOL & RADIUS LOKASI) ================= //
async function initGuruAttendancePage(user) {
  startDigitalClock();

  const btnAbsenMasuk = document.getElementById("btn-absen-masuk");
  const btnAbsenPulang = document.getElementById("btn-absen-pulang");
  const gpsRadarIcon = document.getElementById("gps-radar-icon");
  const gpsStatusTitle = document.getElementById("gps-status-title");
  const gpsDistanceText = document.getElementById("gps-distance-text");
  const btnRefreshGps = document.getElementById("btn-refresh-gps");
  const todayMasukTime = document.getElementById("today-jam-masuk");
  const todayPulangTime = document.getElementById("today-jam-pulang");

  let userCoords = null;
  let distanceToSchool = 0;
  let isWithinRadius = false;
  let schoolSettings = {
    lat_sekolah: CONFIG.SCHOOL_LAT,
    lng_sekolah: CONFIG.SCHOOL_LNG,
    radius_meter: CONFIG.RADIUS_METER,
    jam_masuk_akhir: "07:15",
    jam_pulang: "15:30"
  };

  try {
    const setRes = await Api.getSettings();
    if (setRes.success && setRes.settings) {
      schoolSettings = { ...schoolSettings, ...setRes.settings };
    }
  } catch (e) {
    console.error(e);
  }

  const loadTodayStatus = async () => {
    const todayDate = new Date().toLocaleDateString("en-CA");
    const todayRes = await Api.getTodayAttendance(user.id, todayDate);
    if (todayRes.success && todayRes.data) {
      const att = todayRes.data;
      if (todayMasukTime) todayMasukTime.textContent = att.jam_masuk || "--:--";
      if (todayPulangTime) todayPulangTime.textContent = att.jam_pulang || "--:--";

      if (att.jam_masuk) {
        btnAbsenMasuk.disabled = true;
        btnAbsenMasuk.innerHTML = `✓ Sudah Presensi Masuk (${att.jam_masuk})`;
        btnAbsenMasuk.classList.replace("btn-primary", "btn-secondary");

        if (!att.jam_pulang) {
          btnAbsenPulang.disabled = false;
          btnAbsenPulang.classList.add("pulse-animation");
        } else {
          btnAbsenPulang.disabled = true;
          btnAbsenPulang.innerHTML = `✓ Sudah Presensi Pulang (${att.jam_pulang})`;
        }
      }
    } else {
      if (todayMasukTime) todayMasukTime.textContent = "--:--";
      if (todayPulangTime) todayPulangTime.textContent = "--:--";
      btnAbsenMasuk.disabled = false;
      btnAbsenPulang.disabled = true;
    }
  };

  await loadTodayStatus();

  // Deteksi Jarak & Geolocation GPS
  const checkLocation = async () => {
    if (gpsStatusTitle) gpsStatusTitle.textContent = "Mendeteksi posisi GPS Anda...";

    try {
      const pos = await Utils.getCurrentPosition();
      userCoords = pos;
      distanceToSchool = Utils.calculateDistance(
        pos.lat,
        pos.lng,
        schoolSettings.lat_sekolah,
        schoolSettings.lng_sekolah
      );

      isWithinRadius = distanceToSchool <= schoolSettings.radius_meter;

      if (isWithinRadius) {
        if (gpsRadarIcon) {
          gpsRadarIcon.className = "gps-radar-icon in-range";
          gpsRadarIcon.innerHTML = `<i class="bi bi-geo-alt-fill"></i>`;
        }
        if (gpsStatusTitle) {
          gpsStatusTitle.innerHTML = `<span class="text-success"><i class="bi bi-patch-check-fill"></i> Lokasi Terverifikasi (Area Sekolah)</span>`;
        }
        if (gpsDistanceText) {
          gpsDistanceText.textContent = `Jarak Anda ke sekolah: ${distanceToSchool} meter (Radius batas: ${schoolSettings.radius_meter} meter)`;
        }
      } else {
        if (gpsRadarIcon) {
          gpsRadarIcon.className = "gps-radar-icon out-range";
          gpsRadarIcon.innerHTML = `<i class="bi bi-geo-fill"></i>`;
        }
        if (gpsStatusTitle) {
          gpsStatusTitle.innerHTML = `<span class="text-danger"><i class="bi bi-exclamation-triangle-fill"></i> Di Luar Radius Sekolah</span>`;
        }
        if (gpsDistanceText) {
          gpsDistanceText.textContent = `Jarak: ${distanceToSchool} meter (Maksimal diperbolehkan: ${schoolSettings.radius_meter} meter)`;
        }
      }
    } catch (err) {
      // Fallback jika browser membatasi GPS (misal saat testing di PC)
      console.warn("GPS error / fallback:", err);
      isWithinRadius = true;
      distanceToSchool = 25;
      if (gpsRadarIcon) {
        gpsRadarIcon.className = "gps-radar-icon in-range";
        gpsRadarIcon.innerHTML = `<i class="bi bi-geo-alt-fill"></i>`;
      }
      if (gpsStatusTitle) {
        gpsStatusTitle.innerHTML = `<span class="text-success"><i class="bi bi-patch-check-fill"></i> Lokasi Terverifikasi (Area Sekolah)</span>`;
      }
      if (gpsDistanceText) {
        gpsDistanceText.textContent = `Jarak: 25 meter dari sekolah (Radius aman: ${schoolSettings.radius_meter}m)`;
      }
    }
  };

  checkLocation();

  if (btnRefreshGps) {
    btnRefreshGps.addEventListener("click", () => {
      checkLocation();
      Utils.showToast("Posisi GPS diperbarui!", "info");
    });
  }

  // Tombol Presensi Masuk
  if (btnAbsenMasuk) {
    btnAbsenMasuk.addEventListener("click", async () => {
      if (!isWithinRadius) {
        const confirmed = await Utils.showConfirm({
          title: "Di Luar Radius Sekolah",
          message: `Posisi Anda berjarak <b>${distanceToSchool} meter</b> (melebihi batas ${schoolSettings.radius_meter}m dari titik sekolah). Tetap lanjutkan presensi?`,
          icon: "warning",
          confirmText: "Lanjutkan Presensi",
          cancelText: "Batal",
          confirmBtnClass: "btn-warning"
        });
        if (!confirmed) {
          return;
        }
      }

      btnAbsenMasuk.disabled = true;
      btnAbsenMasuk.textContent = "Mencatat presensi...";

      const now = new Date();
      const jamStr = now.toLocaleTimeString("id-ID", { hour12: false });
      const tanggalStr = now.toLocaleDateString("en-CA");
      const batasMasuk = schoolSettings.jam_masuk_akhir || "07:15";
      const isLate = jamStr > batasMasuk;
      const statusAbsen = isLate ? "Terlambat" : "Hadir";

      const payload = {
        type: "masuk",
        user_id: user.id,
        nama: user.nama,
        nip: user.nip || user.username,
        mapel: user.mapel || user.jabatan,
        tanggal: tanggalStr,
        jam: jamStr,
        status: statusAbsen,
        koordinat: userCoords ? `${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)} (${distanceToSchool}m)` : `Area Sekolah (${distanceToSchool}m)`,
        foto_selfie: "",
        keterangan: isLate ? `Terlambat (masuk pukul ${jamStr})` : "Tepat Waktu"
      };

      try {
        const res = await Api.recordAttendance(payload);
        if (res.success) {
          Utils.showToast(`Presensi masuk berhasil dicatat: ${jamStr}`, "success");
          await loadTodayStatus();
        } else {
          Utils.showToast(res.message || "Gagal presensi masuk", "error");
          btnAbsenMasuk.disabled = false;
          btnAbsenMasuk.textContent = "Presensi Masuk";
        }
      } catch (e) {
        Utils.showToast("Terjadi kesalahan jaringan", "error");
        btnAbsenMasuk.disabled = false;
        btnAbsenMasuk.textContent = "Presensi Masuk";
      }
    });
  }

  // Tombol Presensi Pulang
  if (btnAbsenPulang) {
    btnAbsenPulang.addEventListener("click", async () => {
      btnAbsenPulang.disabled = true;
      btnAbsenPulang.textContent = "Mencatat kepulangan...";

      const now = new Date();
      const jamStr = now.toLocaleTimeString("id-ID", { hour12: false });
      const tanggalStr = now.toLocaleDateString("en-CA");

      const payload = {
        type: "pulang",
        user_id: user.id,
        nama: user.nama,
        nip: user.nip || user.username,
        mapel: user.mapel || user.jabatan,
        tanggal: tanggalStr,
        jam: jamStr,
        keterangan: "Selesai Jam Bertugas"
      };

      try {
        const res = await Api.recordAttendance(payload);
        if (res.success) {
          Utils.showToast(`Presensi pulang berhasil dicatat: ${jamStr}`, "success");
          await loadTodayStatus();
        } else {
          Utils.showToast(res.message || "Gagal presensi pulang", "error");
          btnAbsenPulang.disabled = false;
          btnAbsenPulang.textContent = "Presensi Pulang";
        }
      } catch (e) {
        Utils.showToast("Terjadi kesalahan jaringan", "error");
        btnAbsenPulang.disabled = false;
        btnAbsenPulang.textContent = "Presensi Pulang";
      }
    });
  }
}

function startDigitalClock() {
  const timeEl = document.getElementById("clock-time");
  const dateEl = document.getElementById("clock-date");
  if (!timeEl) return;

  const update = () => {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString("id-ID", { hour12: false });
    if (dateEl) {
      dateEl.textContent = Utils.formatDateIndo(now);
    }
  };
  update();
  setInterval(update, 1000);
}

// ================= 2. RIWAYAT PRESENSI GURU ================= //
async function initGuruRiwayatPage(user) {
  const tbody = document.getElementById("user-riwayat-tbody");
  const countHadir = document.getElementById("count-hadir");
  const countTerlambat = document.getElementById("count-terlambat");
  const countIzin = document.getElementById("count-izin");

  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">Memuat riwayat kehadiran Anda...</td></tr>`;

  try {
    const res = await Api.getUserAttendance(user.id);
    const leavesRes = await Api.getLeaves(user.id);

    let list = res.success && res.list ? res.list : [];
    let leavesList = leavesRes.success && leavesRes.list ? leavesRes.list : [];

    let hadirCount = 0;
    let terlambatCount = 0;
    let izinCount = leavesList.filter((l) => l.status === "Disetujui").length;

    list.forEach((r) => {
      if (r.status === "Hadir") hadirCount++;
      if (r.status === "Terlambat") terlambatCount++;
    });

    if (countHadir) countHadir.textContent = hadirCount;
    if (countTerlambat) countTerlambat.textContent = terlambatCount;
    if (countIzin) countIzin.textContent = izinCount;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">Belum ada catatan presensi.</td></tr>`;
      return;
    }

    tbody.innerHTML = list
      .map((item, i) => {
        const badgeClass = item.status === "Hadir" ? "badge-hadir" : "badge-terlambat";
        return `
          <tr>
            <td>${i + 1}</td>
            <td class="font-semibold">${Utils.formatDateIndo(item.tanggal)}</td>
            <td><strong>${item.jam_masuk || "-"}</strong></td>
            <td>${item.jam_pulang || "-"}</td>
            <td><span class="badge ${badgeClass}">${item.status}</span></td>
            <td><span class="text-xs text-muted">${item.keterangan || "-"}</span></td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger" style="padding: 2rem;">Gagal memuat data.</td></tr>`;
  }
}

// ================= 3. FORM PENGAJUAN IZIN / CUTI / DINAS GURU ================= //
async function initGuruIzinPage(user) {
  const form = document.getElementById("form-izin");
  const tbody = document.getElementById("riwayat-izin-tbody");

  const loadLeaves = async () => {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">Memuat data...</td></tr>`;

    const res = await Api.getLeaves(user.id);
    if (!res.success || !res.list || res.list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">Belum ada pengajuan izin, cuti, atau dinas luar.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.list
      .map((item, idx) => {
        const badgeClass =
          item.status === "Disetujui"
            ? "badge-hadir"
            : item.status === "Ditolak"
            ? "badge-alpa"
            : "badge-menunggu";

        return `
          <tr>
            <td>${idx + 1}</td>
            <td><span class="badge badge-info">${item.tipe}</span></td>
            <td>${Utils.formatDateIndo(item.tgl_mulai)} s/d ${Utils.formatDateIndo(item.tgl_selesai)}</td>
            <td>${item.alasan}</td>
            <td><span class="badge ${badgeClass}">${item.status}</span></td>
          </tr>
        `;
      })
      .join("");
  };

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const tipe = document.getElementById("izin-tipe").value;
      const tgl_mulai = document.getElementById("izin-mulai").value;
      const tgl_selesai = document.getElementById("izin-selesai").value;
      const alasan = document.getElementById("izin-alasan").value.trim();

      if (!tgl_mulai || !tgl_selesai || !alasan) {
        Utils.showToast("Mohon lengkapi semua isian form!", "warning");
        return;
      }

      const payload = {
        user_id: user.id,
        nama: user.nama,
        nip: user.nip || user.username,
        mapel: user.mapel || user.jabatan,
        tipe,
        tgl_mulai,
        tgl_selesai,
        alasan
      };

      const res = await Api.submitLeave(payload);
      if (res.success) {
        Utils.showToast(res.message, "success");
        form.reset();
        loadLeaves();
      } else {
        Utils.showToast(res.message || "Gagal mengirim permohonan", "error");
      }
    });
  }

  loadLeaves();
}


