/**
 * Authentication and Session Management
 */

const AUTH_STORAGE_KEY = "ABSENSI_GURU_AUTH_USER_V2";

export const Auth = {
  getCurrentUser() {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      if (user && typeof user === "object") {
        if (!user.id && user.user_id) user.id = user.user_id;
        if (!user.user_id && user.id) user.user_id = user.id;
      }
      return user;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user, remember = true) {
    if (typeof window === "undefined") return;
    if (user && typeof user === "object") {
      if (!user.id && user.user_id) user.id = user.user_id;
      if (!user.user_id && user.id) user.user_id = user.id;
    }
    const dataStr = JSON.stringify(user);
    if (remember) {
      localStorage.setItem(AUTH_STORAGE_KEY, dataStr);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, dataStr);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    // Reset state badge PLP setiap kali user login baru
    try {
      sessionStorage.removeItem("plp_card_hidden_session");
      sessionStorage.removeItem("plp_card_start_time");
    } catch (e) {}
  },

  logout() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    try {
      sessionStorage.removeItem("plp_card_hidden_session");
      sessionStorage.removeItem("plp_card_start_time");
    } catch (e) {}
  }
};
