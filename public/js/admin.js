/**
 * ====================================================================
 * LOGIKA PORTAL ADMIN - ABSENSI GURU
 * ====================================================================
 */

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = Auth.requireAuth("admin");
  if (!currentUser) return;
  Auth.initUserUI(currentUser);

  startTopbarClock();

  // Sidebar toggle untuk mobile
  const sidebarToggle = document.querySelector(".sidebar-toggle-btn");
  const sidebar = document.querySelector(".admin-sidebar");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  const path = window.location.pathname;
  if (path.includes("rekap.html")) {
    initRekapPage();
  } else if (path.includes("guru.html") || path.includes("siswa.html")) {
    initGuruPage();
  } else if (path.includes("izin.html")) {
    initIzinPage();
  } else if (path.includes("setting.html")) {
    initSettingPage();
  } else {
    initDashboardPage();
  }
});

function startTopbarClock() {
  const clockEl = document.querySelector(".topbar-clock span");
  if (!clockEl) return;
  const update = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString("id-ID", { hour12: false });
  };
  update();
  setInterval(update, 1000);
}

// ================= 1. DASHBOARD ADMIN ================= //
async function initDashboardPage() {
  const statTotal = document.getElementById("stat-total");
  const statHadir = document.getElementById("stat-hadir");
  const statTerlambat = document.getElementById("stat-terlambat");
  const statIzin = document.getElementById("stat-izin");
  const statBelum = document.getElementById("stat-belum");
  const tableBody = document.getElementById("recent-attendance-tbody");

  try {
    const res = await Api.getDashboardStats();
    if (res.success && res.stats) {
      if (statTotal) statTotal.textContent = res.stats.totalGuru;
      if (statHadir) statHadir.textContent = res.stats.hadir;
      if (statTerlambat) statTerlambat.textContent = res.stats.terlambat;
      if (statIzin) statIzin.textContent = res.stats.izin;
      if (statBelum) statBelum.textContent = res.stats.belumAbsen;
    }

    if (tableBody && res.recentAttendance) {
      if (res.recentAttendance.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 2rem;">Belum ada presensi guru tercatat hari ini.</td></tr>`;
      } else {
        tableBody.innerHTML = res.recentAttendance
          .map((item, idx) => {
            const badgeClass = item.status === "Hadir" ? "badge-hadir" : "badge-terlambat";
            return `
              <tr>
                <td>${idx + 1}</td>
                <td><strong class="text-xs text-muted font-semibold">${item.nip || "-"}</strong></td>
                <td class="font-semibold">${item.nama}</td>
                <td><span class="badge" style="background: #f1f5f9; color: #475569;">${item.mapel || "-"}</span></td>
                <td><strong>${item.jam_masuk || "-"}</strong></td>
                <td><span class="badge ${badgeClass}">${item.status}</span></td>
                <td>
                  <span class="text-xs" style="color: var(--success); font-weight: 600;">
                    📍 ${item.koordinat || "Dalam Radius Sekolah"}
                  </span>
                </td>
              </tr>
            `;
          })
          .join("");
      }
    }
  } catch (err) {
    console.error(err);
    Utils.showToast("Gagal memuat data dashboard", "error");
  }
}

// ================= 2. REKAP ABSENSI GURU ================= //
async function initRekapPage() {
  const dateInput = document.getElementById("filter-tanggal");
  const mapelSelect = document.getElementById("filter-mapel");
  const btnFilter = document.getElementById("btn-filter");
  const btnExport = document.getElementById("btn-export");
  const btnPrint = document.getElementById("btn-print");
  const tbody = document.getElementById("rekap-tbody");

  if (dateInput) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  const loadData = async () => {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 2rem;">Memuat data presensi guru...</td></tr>`;

    const tanggal = dateInput ? dateInput.value : "";
    const mapel = mapelSelect ? mapelSelect.value : "Semua";

    const res = await Api.getAllAttendance(tanggal, mapel);
    if (!res.success || !res.list || res.list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 2rem;">Tidak ada riwayat presensi ditemukan untuk filter ini.</td></tr>`;
      window.currentRekapData = [];
      return;
    }

    window.currentRekapData = res.list;

    tbody.innerHTML = res.list
      .map((row, i) => {
        const badgeClass =
          row.status === "Hadir"
            ? "badge-hadir"
            : row.status === "Terlambat"
            ? "badge-terlambat"
            : "badge-izin";
        return `
          <tr>
            <td>${i + 1}</td>
            <td class="text-xs text-muted font-semibold">${row.nip || "-"}</td>
            <td class="font-semibold">${row.nama}</td>
            <td><span class="badge" style="background: #eef2ff; color: #4338ca;">${row.mapel || "-"}</span></td>
            <td>${Utils.formatDateIndo(row.tanggal)}</td>
            <td><strong>${row.jam_masuk || "-"}</strong></td>
            <td>${row.jam_pulang || "-"}</td>
            <td><span class="badge ${badgeClass}">${row.status}</span></td>
          </tr>
        `;
      })
      .join("");
  };

  if (btnFilter) btnFilter.addEventListener("click", loadData);
  if (dateInput) dateInput.addEventListener("change", loadData);
  if (mapelSelect) mapelSelect.addEventListener("change", loadData);

  if (btnExport) {
    btnExport.addEventListener("click", () => {
      if (!window.currentRekapData || window.currentRekapData.length === 0) {
        Utils.showToast("Tidak ada data untuk diekspor!", "warning");
        return;
      }
      const headers = ["No", "NIP", "Nama Guru", "Mata Pelajaran", "Tanggal", "Jam Masuk", "Jam Pulang", "Status", "Keterangan", "Lokasi GPS"];
      const rows = window.currentRekapData.map((d, idx) => [
        idx + 1,
        d.nip || "-",
        d.nama,
        d.mapel || "-",
        d.tanggal,
        d.jam_masuk || "-",
        d.jam_pulang || "-",
        d.status,
        d.keterangan || "-",
        d.koordinat || "Area Sekolah"
      ]);
      Utils.exportToCsv(`Rekap_Presensi_Guru_${dateInput.value || "Semua"}`, headers, rows);
      Utils.showToast("Berhasil mengekspor rekap presensi guru ke CSV!", "success");
    });
  }

  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      window.print();
    });
  }

  loadData();
}

// ================= 3. DATA GURU & TENAGA PENDIDIK ================= //
async function initGuruPage() {
  const tbody = document.getElementById("guru-tbody") || document.getElementById("siswa-tbody");
  const searchInput = document.getElementById("search-guru") || document.getElementById("search-siswa");
  const btnAdd = document.getElementById("btn-add-guru") || document.getElementById("btn-add-siswa");
  const modal = document.getElementById("modal-guru") || document.getElementById("modal-siswa");
  const form = document.getElementById("form-guru") || document.getElementById("form-siswa");
  let allUsers = [];

  const renderTable = (users) => {
    if (!tbody) return;
    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 2rem;">Tidak ada data guru ditemukan.</td></tr>`;
      return;
    }

    tbody.innerHTML = users
      .map(
        (u, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 38px; height: 38px; border-radius: 50%; background: #ecfdf5; border: 1.5px solid #d1fae5; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                ${
                  u.foto_url
                    ? `<img src="${u.foto_url}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : `<i class="bi bi-person-fill" style="color: #10b981; font-size: 1.25rem;"></i>`
                }
              </div>
              <div>
                <strong>${u.nip || u.username}</strong>
              </div>
            </div>
          </td>
          <td class="font-semibold">${u.nama}</td>
          <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${u.mapel || "-"}</span></td>
          <td><span class="badge ${u.role === "admin" ? "badge-danger" : "badge-info"}">${u.role === "admin" ? "ADMIN" : (u.jabatan || "GURU")}</span></td>
          <td>${u.no_hp || "-"}</td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-outline" onclick="openEditGuru('${u.id}')">Edit</button>
              ${
                u.role !== "admin"
                  ? `<button class="btn btn-sm btn-danger" onclick="deleteGuru('${u.id}', '${u.nama}')">Hapus</button>`
                  : ""
              }
            </div>
          </td>
        </tr>
      `
      )
      .join("");
  };

  const loadUsers = async () => {
    const res = await Api.getUsers();
    if (res.success && res.list) {
      allUsers = res.list;
      renderTable(allUsers);
    }
  };

  // Handler File Upload Pasfoto
  const fotoFileInput = document.getElementById("modal-foto-file");
  const imgPreview = document.getElementById("img-preview-guru");
  const iconPreview = document.getElementById("icon-preview-guru");
  const base64Input = document.getElementById("modal-foto-base64");

  if (fotoFileInput) {
    fotoFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        Utils.showToast("Ukuran foto maksimal 2MB!", "warning");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        base64Input.value = base64;
        imgPreview.src = base64;
        imgPreview.style.display = "block";
        iconPreview.style.display = "none";
      };
      reader.readAsDataURL(file);
    });
  }

  const mapelSelect = document.getElementById("modal-mapel-select");
  const mapelCustom = document.getElementById("modal-mapel-custom");

  if (mapelSelect && mapelCustom) {
    mapelSelect.addEventListener("change", () => {
      if (mapelSelect.value === "Lainnya") {
        mapelCustom.style.display = "block";
        mapelCustom.focus();
      } else {
        mapelCustom.style.display = "none";
        mapelCustom.value = "";
      }
    });
  }

  if (btnAdd && modal) {
    btnAdd.addEventListener("click", () => {
      form.reset();
      document.getElementById("modal-user-id").value = "";
      base64Input.value = "";
      imgPreview.src = "";
      imgPreview.style.display = "none";
      iconPreview.style.display = "block";
      if (mapelSelect) mapelSelect.value = "-";
      if (mapelCustom) {
        mapelCustom.value = "";
        mapelCustom.style.display = "none";
      }
      document.getElementById("modal-title").textContent = "Tambah Data Guru / Pegawai";
      modal.classList.add("active");
    });
  }

  document.querySelectorAll(".modal-close, .btn-modal-cancel").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (modal) modal.classList.remove("active");
    });
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("modal-user-id").value;
      const nip = document.getElementById("modal-nip").value.trim();
      const nama = document.getElementById("modal-nama").value.trim();
      const role = document.getElementById("modal-role").value;
      const jabatan = document.getElementById("modal-jabatan").value.trim();
      
      let mapel = "-";
      if (mapelSelect) {
        if (mapelSelect.value === "Lainnya") {
          mapel = (mapelCustom && mapelCustom.value.trim()) ? mapelCustom.value.trim() : "Lainnya";
        } else {
          mapel = mapelSelect.value;
        }
      }

      const password = document.getElementById("modal-password").value.trim();
      const no_hp = document.getElementById("modal-nohp").value.trim();
      const foto = base64Input ? base64Input.value : "";

      const payload = {
        username: nip,
        nip,
        nama,
        role,
        jabatan,
        mapel,
        no_hp
      };
      if (id) payload.id = id;
      if (password) payload.password = password;
      if (foto) payload.foto = foto;

      const res = await Api.saveUser(payload);
      if (res.success) {
        Utils.showToast(res.message, "success");
        modal.classList.remove("active");
        loadUsers();
      } else {
        Utils.showToast(res.message || "Gagal menyimpan data", "error");
      }
    });
  }

  window.openEditGuru = (id) => {
    const u = allUsers.find((x) => x.id === id);
    if (!u) return;
    document.getElementById("modal-user-id").value = u.id;
    document.getElementById("modal-nip").value = u.nip || u.username;
    document.getElementById("modal-nama").value = u.nama;
    document.getElementById("modal-role").value = u.role;
    document.getElementById("modal-jabatan").value = u.jabatan || "";
    
    // Set nilai Mata Pelajaran di dropdown atau opsi Lainnya
    if (mapelSelect && mapelCustom) {
      const currentMapel = u.mapel || "-";
      const hasOption = Array.from(mapelSelect.options).some((opt) => opt.value === currentMapel);
      if (hasOption) {
        mapelSelect.value = currentMapel;
        mapelCustom.style.display = "none";
        mapelCustom.value = "";
      } else {
        mapelSelect.value = "Lainnya";
        mapelCustom.style.display = "block";
        mapelCustom.value = currentMapel;
      }
    }

    document.getElementById("modal-password").value = "";
    document.getElementById("modal-password").placeholder = "Kosongkan jika tidak diubah";
    document.getElementById("modal-nohp").value = u.no_hp || "";
    document.getElementById("modal-title").textContent = "Edit Data Guru";

    if (u.foto_url) {
      base64Input.value = u.foto_url;
      imgPreview.src = u.foto_url;
      imgPreview.style.display = "block";
      iconPreview.style.display = "none";
    } else {
      base64Input.value = "";
      imgPreview.src = "";
      imgPreview.style.display = "none";
      iconPreview.style.display = "block";
    }

    modal.classList.add("active");
  };

  window.deleteGuru = async (id, nama) => {
    const confirmed = await Utils.showConfirm({
      title: "Hapus Data Guru",
      message: `Apakah Anda yakin ingin menghapus data guru <b>"${nama}"</b>? Tindakan ini tidak dapat dibatalkan.`,
      icon: "danger",
      confirmText: "Hapus Guru",
      cancelText: "Batal",
      confirmBtnClass: "btn-danger"
    });

    if (confirmed) {
      const res = await Api.deleteUser(id);
      if (res.success) {
        Utils.showToast(res.message, "success");
        loadUsers();
      } else {
        Utils.showToast(res.message || "Gagal menghapus data guru", "error");
      }
    }
  };

  loadUsers();
}

// ================= 4. PERSETUJUAN IZIN / CUTI / DINAS LUAR GURU ================= //
async function initIzinPage() {
  const tbody = document.getElementById("izin-tbody");

  const loadLeaves = async () => {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 2rem;">Memuat daftar pengajuan izin guru...</td></tr>`;
    const res = await Api.getLeaves();
    if (!res.success || !res.list || res.list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 2rem;">Belum ada pengajuan izin, cuti, atau dinas luar dari guru.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.list
      .map((item, i) => {
        const badgeClass =
          item.status === "Disetujui"
            ? "badge-hadir"
            : item.status === "Ditolak"
            ? "badge-alpa"
            : "badge-menunggu";

        return `
          <tr>
            <td>${i + 1}</td>
            <td class="font-semibold">${item.nama}</td>
            <td><span class="badge" style="background:#f1f5f9; color:#475569;">${item.mapel || "-"}</span></td>
            <td><span class="badge badge-info">${item.tipe}</span></td>
            <td>${Utils.formatDateIndo(item.tgl_mulai)} s/d ${Utils.formatDateIndo(item.tgl_selesai)}</td>
            <td>${item.alasan}</td>
            <td><span class="badge ${badgeClass}">${item.status}</span></td>
            <td>
              ${
                item.status === "Menunggu"
                  ? `
                <div class="flex gap-2">
                  <button class="btn btn-sm btn-success" onclick="handleLeaveDecision('${item.id}', 'Disetujui')">Setujui</button>
                  <button class="btn btn-sm btn-danger" onclick="handleLeaveDecision('${item.id}', 'Tolak')">Tolak</button>
                </div>
              `
                  : `<span class="text-xs text-muted">Selesai</span>`
              }
            </td>
          </tr>
        `;
      })
      .join("");
  };

  window.handleLeaveDecision = async (id, status) => {
    const res = await Api.updateLeaveStatus(id, status);
    if (res.success) {
      Utils.showToast(res.message, "success");
      loadLeaves();
    } else {
      Utils.showToast(res.message || "Gagal memperbarui status", "error");
    }
  };

  loadLeaves();
}

// ================= 5. PENGATURAN SEKOLAH & GOOGLE APPS SCRIPT ================= //
async function initSettingPage() {
  const form = document.getElementById("form-settings");
  const scriptUrlInput = document.getElementById("setting-script-url");
  const btnResetData = document.getElementById("btn-reset-mock");

  if (scriptUrlInput) {
    scriptUrlInput.value = CONFIG.getScriptUrl();
  }

  try {
    const res = await Api.getSettings();
    if (res.success && res.settings) {
      const s = res.settings;
      if (document.getElementById("setting-nama-sekolah")) {
        document.getElementById("setting-nama-sekolah").value = s.nama_sekolah || "";
      }
      if (document.getElementById("setting-jam-masuk")) {
        document.getElementById("setting-jam-masuk").value = s.jam_masuk || "06:45";
      }
      if (document.getElementById("setting-jam-masuk-akhir")) {
        document.getElementById("setting-jam-masuk-akhir").value = s.jam_masuk_akhir || "07:15";
      }
      if (document.getElementById("setting-jam-pulang")) {
        document.getElementById("setting-jam-pulang").value = s.jam_pulang || "15:30";
      }
      if (document.getElementById("setting-lat")) {
        document.getElementById("setting-lat").value = s.lat_sekolah || -6.2088;
      }
      if (document.getElementById("setting-lng")) {
        document.getElementById("setting-lng").value = s.lng_sekolah || 106.8456;
      }
      if (document.getElementById("setting-radius")) {
        document.getElementById("setting-radius").value = s.radius_meter || 250;
      }
    }
  } catch (err) {
    console.error(err);
  }

  const btnGetCurrentLoc = document.getElementById("btn-get-current-loc");
  if (btnGetCurrentLoc) {
    btnGetCurrentLoc.addEventListener("click", async () => {
      try {
        btnGetCurrentLoc.textContent = "Mendeteksi...";
        const pos = await Utils.getCurrentPosition();
        document.getElementById("setting-lat").value = pos.lat.toFixed(6);
        document.getElementById("setting-lng").value = pos.lng.toFixed(6);
        btnGetCurrentLoc.textContent = "Gunakan Lokasi Saya Saat Ini";
        Utils.showToast("Koordinat GPS berhasil diambil!", "success");
      } catch (e) {
        btnGetCurrentLoc.textContent = "Gunakan Lokasi Saya Saat Ini";
        Utils.showToast(e.message || "Gagal mengambil GPS", "error");
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newUrl = scriptUrlInput ? scriptUrlInput.value.trim() : "";
      CONFIG.setScriptUrl(newUrl);

      const settings = {
        nama_sekolah: document.getElementById("setting-nama-sekolah").value,
        jam_masuk: document.getElementById("setting-jam-masuk").value,
        jam_masuk_akhir: document.getElementById("setting-jam-masuk-akhir").value,
        jam_pulang: document.getElementById("setting-jam-pulang").value,
        lat_sekolah: parseFloat(document.getElementById("setting-lat").value),
        lng_sekolah: parseFloat(document.getElementById("setting-lng").value),
        radius_meter: parseInt(document.getElementById("setting-radius").value)
      };

      const res = await Api.updateSettings(settings);
      if (res.success) {
        Utils.showToast("Pengaturan absensi guru berhasil disimpan!", "success");
      } else {
        Utils.showToast(res.message || "Gagal menyimpan pengaturan", "error");
      }
    });
  }

  if (btnResetData) {
    btnResetData.addEventListener("click", async () => {
      const confirmed = await Utils.showConfirm({
        title: "Reset Database Lokal",
        message: "Apakah Anda yakin ingin mengembalikan data cadangan lokal ke data default awal?",
        icon: "danger",
        confirmText: "Reset Database",
        cancelText: "Batal",
        confirmBtnClass: "btn-danger"
      });

      if (confirmed) {
        MockDB.reset();
        Utils.showToast("Data lokal berhasil direset ke awal!", "success");
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  }
}
