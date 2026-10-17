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

    // Inisial avatar di .auth-user-initial
    document.querySelectorAll(".auth-user-initial").forEach((el) => {
      const initial = (user.nama || user.username || "G").charAt(0).toUpperCase();
      el.textContent = initial;
    });

    // Tombol Logout
    document.querySelectorAll(".btn-logout").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin keluar dari sistem absensi guru?")) {
          Auth.logout();
        }
      });
    });
  }
};

window.Auth = Auth;
