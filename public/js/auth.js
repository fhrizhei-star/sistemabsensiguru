/**
 * ====================================================================
 * AUTHENTICATION & SESSION MANAGEMENT - SISTEM ABSENSI GURU
 * ====================================================================
 */

const AUTH_STORAGE_KEY = "ABSENSI_GURU_AUTH_USER";

const Auth = {
  getCurrentUser() {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user, remember = true) {
    const dataStr = JSON.stringify(user);
    if (remember) {
      localStorage.setItem(AUTH_STORAGE_KEY, dataStr);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, dataStr);
    }
  },

  logout() {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = "/index.html";
  },

  requireAuth(allowedRole = null) {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = "/index.html";
      return null;
    }

    if (allowedRole && user.role !== allowedRole) {
      if (user.role === "admin") {
        window.location.href = "/admin/index.html";
      } else {
        window.location.href = "/user/index.html";
      }
      return null;
    }

    return user;
  },

  initUserUI(user) {
    if (!user) return;

    // Tampilkan nama di elemen dengan class .auth-user-name
    document.querySelectorAll(".auth-user-name").forEach((el) => {
      el.textContent = user.nama || user.username;
    });

    // Tampilkan role / mata pelajaran di .auth-user-role
    document.querySelectorAll(".auth-user-role").forEach((el) => {
      if (user.role === "admin") {
        el.textContent = "Admin Kepegawaian";
      } else {
        el.textContent = user.mapel ? `Guru ${user.mapel}` : (user.jabatan || "Tenaga Pendidik");
      }
    });

    // Avatar profil di .auth-user-initial, .sidebar-avatar, & .profile-avatar
    document.querySelectorAll(".auth-user-initial, .sidebar-avatar, .profile-avatar").forEach((el) => {
      let photoUrl = (user.foto_url || "").trim();
      const initial = (user.nama || user.username || "G").charAt(0).toUpperCase();

      if (photoUrl) {
        // Ekstrak ID file Google Drive
        let driveId = null;
        const m1 = photoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        const m2 = photoUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        const m3 = photoUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
        if (m1) driveId = m1[1];
        else if (m2) driveId = m2[1];
        else if (m3) driveId = m3[1];

        // Pakai URL lh3 langsung karena sudah terbukti HTTP 200 OK
        const primarySrc = driveId ? `https://lh3.googleusercontent.com/d/${driveId}` : photoUrl;
        const altSrc = driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w400` : "";

        el.innerHTML = `<img src="${primarySrc}" referrerpolicy="no-referrer" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" onerror="if(this.dataset.tried!=='1' && '${altSrc}'){ this.dataset.tried='1'; this.src='${altSrc}'; } else { this.onerror=null; this.parentElement.textContent='${initial}'; }">`;
        el.style.padding = "0";
        el.style.overflow = "hidden";
      } else {
        el.textContent = initial;
      }
    });

    // Tombol Logout
    document.querySelectorAll(".btn-logout").forEach((el) => {
      el.addEventListener("click", async (e) => {
        e.preventDefault();
        const confirmed = await Utils.showConfirm({
          title: "Konfirmasi Keluar",
          message: "Apakah Anda yakin ingin keluar dari sistem absensi guru?",
          icon: "warning",
          confirmText: "Ya, Keluar",
          cancelText: "Batal",
          confirmBtnClass: "btn-danger"
        });
        if (confirmed) {
          Auth.logout();
        }
      });
    });
  }
};

window.Auth = Auth;
