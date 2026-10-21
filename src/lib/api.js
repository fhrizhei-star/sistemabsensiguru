import { MockDB, getTodayDateStr, getTodayDayName } from "./mockData";
import { formatDriveUrl, getAvatarUrl } from "./drive";

export const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby0DdiBERSda-XSxlvdtQrr9h9JILecQhDWsrctfZu514jP-NRo3v6T6LrSKL39PrY35Q/exec";

function formatTimeString(val) {
  if (!val) return "";
  const s = String(val).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (s.includes("GMT") || s.includes("1899")) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
  }
  const match = s.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  return s;
}

function getDayNameFromDateStr(dateStr) {
  if (!dateStr) return "-";
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "-" : days[d.getDay()];
}

function normalizeAttendanceRecord(item) {
  if (!item) return item;

  // Deteksi anomali kolom tergeser dari sheet legacy (tanpa kolom jadwal_id)
  const isShifted =
    item.tanggal === "Hadir" ||
    item.tanggal === "Terlambat" ||
    item.tanggal === "Izin" ||
    item.tanggal === "Sakit" ||
    (typeof item.mapel === "string" && (item.mapel.includes("GMT") || item.mapel.includes("1899") || item.mapel.includes("2026"))) ||
    (typeof item.status === "string" && item.status.includes("masuk pukul"));

  if (isShifted) {
    let rawDate = item.mapel;
    let tanggalClean = "";
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        tanggalClean = d.toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" });
      } else {
        const m = String(rawDate).match(/(\d{4}-\d{2}-\d{2})/);
        tanggalClean = m ? m[1] : String(rawDate).slice(0, 10);
      }
    }
    const jamClean = String(item.kelas || "").replace(/\./g, ":");

    return {
      id: String(item.id || ""),
      jadwal_id: "",
      user_id: String(item.jadwal_id || ""),
      nama: String(item.user_id || ""),
      nip: String(item.nama || "").replace(/^'/, ""),
      mapel: String(item.nip || "-"),
      kelas: "-",
      hari: getDayNameFromDateStr(tanggalClean),
      tanggal: tanggalClean,
      jam_jadwal: "-",
      jam_absen: jamClean,
      status: String(item.tanggal || "Hadir"),
      koordinat: String(item.jam_jadwal || "Area Sekolah"),
      keterangan: String(item.status || "Tepat Waktu"),
      created_at: item.koordinat || ""
    };
  }

  // Record normal: bersihkan NIP & format jam
  let tgl = item.tanggal;
  if (tgl && typeof tgl === "string" && tgl.includes("GMT")) {
    const d = new Date(tgl);
    if (!isNaN(d.getTime())) {
      tgl = d.toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" });
    }
  }

  return {
    ...item,
    nip: String(item.nip || "").replace(/^'/, ""),
    tanggal: tgl,
    jam_absen: String(item.jam_absen || "").replace(/\./g, ":")
  };
}

export const Api = {
  getScriptUrl() {
    if (typeof window === "undefined") return DEFAULT_SCRIPT_URL;
    const db = MockDB.load();
    const saved = db.settings && db.settings.google_script_url;
    return (saved && saved.trim() !== "" && !saved.includes("GANTI_DENGAN_URL"))
      ? saved.trim()
      : DEFAULT_SCRIPT_URL;
  },

  async request(method, action, params = {}, body = null) {
    const scriptUrl = this.getScriptUrl();
    const isMock = !scriptUrl || scriptUrl.trim() === "" || scriptUrl.includes("GANTI_DENGAN_URL");

    if (isMock) {
      return this.handleMock(action, params, body);
    }

    try {
      const url = new URL("/api/proxy", window.location.origin);
      url.searchParams.set("action", action);
      if (scriptUrl) url.searchParams.set("script_url", scriptUrl);

      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
      }

      const options = {
        method,
        headers: { "Content-Type": "application/json" }
      };

      if (method === "POST" && body) {
        options.body = JSON.stringify({ action, ...body });
      }

      const res = await fetch(url.toString(), options);
      const data = await res.json();

      if (!data || (data.success === false && data.message && data.message.toLowerCase().includes("tidak dikenali"))) {
        return this.handleMock(action, params, body);
      }

      // === NORMALISASI DATA RESPONS GOOGLE APPS SCRIPT ===
      if (data) {
        if (action === "getUsers") {
          data.users = (data.users || data.list || []).map((u) => ({
            ...u,
            nip: String(u.nip || "").replace(/^'/, ""),
            username: String(u.username || "").replace(/^'/, ""),
            foto_url: getAvatarUrl(u.foto_url, u.nama)
          }));
          data.list = data.users;
        } else if (action === "getSchedules" || action === "getTeacherTodaySchedules") {
          data.schedules = (data.schedules || data.list || []).map((s) => ({
            ...s,
            nip: String(s.nip || "").replace(/^'/, ""),
            jam_mulai: formatTimeString(s.jam_mulai),
            jam_selesai: formatTimeString(s.jam_selesai)
          }));
          data.list = data.schedules;
        } else if (action === "getAttendance" || action === "getAllAttendance" || action === "getUserAttendance") {
          const rawList = data.attendance || data.list || [];
          data.attendance = rawList.map(normalizeAttendanceRecord);
          data.list = data.attendance;
        } else if (action === "getLeaves") {
          data.leaves = (data.leaves || data.list || []).map((l) => ({
            ...l,
            status: l.status === "Menunggu" ? "Menunggu Verifikasi" : l.status
          }));
          data.list = data.leaves;
        } else if (action === "getDashboardStats") {
          if (data.stats) {
            data.stats = {
              ...data.stats,
              total_sesi: data.stats.total_sesi ?? data.stats.totalSesi ?? 0,
              total_guru: data.stats.total_guru ?? data.total_guru ?? 0,
              alpha: data.stats.alpha ?? data.stats.belumAbsen ?? 0
            };
          }
          if (data.recent_activity || data.recentAttendance) {
            data.recent_activity = (data.recent_activity || data.recentAttendance || []).map(normalizeAttendanceRecord);
          }
        } else if (action === "login" && data.user) {
          data.user = {
            ...data.user,
            nip: String(data.user.nip || "").replace(/^'/, ""),
            username: String(data.user.username || "").replace(/^'/, ""),
            foto_url: getAvatarUrl(data.user.foto_url, data.user.nama)
          };
        } else if (action === "getSettings" && data.settings) {
          if (!data.settings.google_script_url && scriptUrl) {
            data.settings.google_script_url = scriptUrl;
          }
        }
      }

      return data;
    } catch (err) {
      console.warn("Proxy request error, falling back to local database:", err);
      return this.handleMock(action, params, body);
    }
  },

  handleMock(action, params, body) {
    const db = MockDB.load();
    const today = getTodayDateStr();

    switch (action) {
      case "login": {
        const username = (body?.username || params.username || "").trim().toLowerCase();
        const password = (body?.password || params.password || "").trim();
        const user = db.users.find(
          (u) =>
            (u.username.toLowerCase() === username || (u.nip && u.nip.toLowerCase() === username)) &&
            u.password === password
        );
        if (user) {
          return { success: true, user: { ...user } };
        }
        return { success: false, message: "NIP / Username atau Password tidak sesuai!" };
      }

      case "getSettings": {
        return { success: true, settings: db.settings };
      }

      case "updateSettings": {
        db.settings = { ...db.settings, ...(body?.settings || {}) };
        MockDB.save(db);
        return { success: true, message: "Pengaturan berhasil diperbarui", settings: db.settings };
      }

      case "getDashboardStats": {
        const filterDate = params.tanggal || today;
        const d = new Date(filterDate);
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const dayName = isNaN(d.getTime()) ? getTodayDayName() : days[d.getDay()];

        const todaySchedules = (db.schedules || []).filter((s) => s.hari === dayName);
        const todayAtt = (db.attendance || []).filter((a) => a.tanggal === filterDate);
        const hadir = todayAtt.filter((a) => a.status === "Hadir").length;
        const terlambat = todayAtt.filter((a) => a.status === "Terlambat").length;
        const izin = (db.leaves || []).filter(
          (l) => l.status === "Disetujui" && filterDate >= l.tgl_mulai && filterDate <= l.tgl_selesai
        ).length;

        const totalTeachers = db.users.filter((u) => u.role === "guru").length;
        const pendingLeaves = (db.leaves || []).filter((l) => l.status === "Menunggu Verifikasi").length;

        return {
          success: true,
          stats: {
            total_guru: totalTeachers,
            total_sesi: todaySchedules.length,
            hadir,
            terlambat,
            izin,
            alpha: Math.max(0, todaySchedules.length - (hadir + terlambat + izin)),
            pending_izin: pendingLeaves,
            hari: dayName,
            tanggal: filterDate
          },
          recent_activity: todayAtt.slice(-8).reverse()
        };
      }

      case "getUsers": {
        let users = [...db.users];
        if (params.role) users = users.filter((u) => u.role === params.role);
        return { success: true, users };
      }

      case "saveUser": {
        const userData = body.user || body;
        if (userData.foto || userData.foto_base64) {
          userData.foto_url = userData.foto || userData.foto_base64;
        }
        if (userData.id) {
          const idx = db.users.findIndex((u) => u.id === userData.id);
          if (idx !== -1) {
            db.users[idx] = { ...db.users[idx], ...userData };
          } else {
            db.users.push(userData);
          }
        } else {
          userData.id = "U" + String(Date.now()).slice(-4);
          db.users.push(userData);
        }
        MockDB.save(db);
        return { success: true, message: "Data guru berhasil disimpan", user: userData };
      }

      case "deleteUser": {
        const id = body?.id || params.id;
        db.users = db.users.filter((u) => u.id !== id);
        MockDB.save(db);
        return { success: true, message: "Guru berhasil dihapus" };
      }

      case "getSchedules": {
        let schedules = [...(db.schedules || [])];
        if (params.hari) schedules = schedules.filter((s) => s.hari === params.hari);
        if (params.guru_id) {
          schedules = schedules.filter(
            (s) => s.guru_id === params.guru_id || s.nip === params.guru_id
          );
        }
        return { success: true, schedules };
      }

      case "saveSchedule": {
        const sched = body.schedule || body;
        if (sched.id) {
          const idx = db.schedules.findIndex((s) => s.id === sched.id);
          if (idx !== -1) {
            db.schedules[idx] = { ...db.schedules[idx], ...sched };
          } else {
            db.schedules.push(sched);
          }
        } else {
          sched.id = "JAD" + String(Date.now()).slice(-4);
          db.schedules.push(sched);
        }
        MockDB.save(db);
        return { success: true, message: "Jadwal berhasil disimpan", schedule: sched };
      }

      case "deleteSchedule": {
        const id = body?.id || params.id;
        db.schedules = (db.schedules || []).filter((s) => s.id !== id);
        MockDB.save(db);
        return { success: true, message: "Jadwal berhasil dihapus" };
      }

      case "getAttendance": {
        let att = [...(db.attendance || [])];
        if (params.user_id) att = att.filter((a) => a.user_id === params.user_id);
        if (params.tanggal) att = att.filter((a) => a.tanggal === params.tanggal);
        if (params.status && params.status !== "Semua") att = att.filter((a) => a.status === params.status);
        return { success: true, attendance: att.reverse() };
      }

      case "recordAttendance": {
        if (body.jadwal_id) {
          const duplicate = (db.attendance || []).some(
            (a) => String(a.jadwal_id) === String(body.jadwal_id) && String(a.user_id) === String(body.user_id) && a.tanggal === today
          );
          if (duplicate) {
            return {
              success: false,
              message: "Bapak/Ibu Guru sudah melakukan presensi untuk kelas ini hari ini!"
            };
          }
        }

        const newRecord = {
          id: "ATT" + Date.now(),
          tanggal: today,
          hari: getTodayDayName(),
          jam_absen: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          ...body
        };
        db.attendance.push(newRecord);
        MockDB.save(db);
        return { success: true, message: "Absensi berhasil dicatat!", record: newRecord };
      }

      case "getLeaves": {
        let leaves = [...(db.leaves || [])];
        if (params.user_id) leaves = leaves.filter((l) => l.user_id === params.user_id);
        if (params.status && params.status !== "Semua") leaves = leaves.filter((l) => l.status === params.status);
        return { success: true, leaves: leaves.reverse() };
      }

      case "submitLeave": {
        const newLeave = {
          id: "LV" + Date.now(),
          status: "Menunggu Verifikasi",
          created_at: new Date().toISOString(),
          ...body
        };
        db.leaves.push(newLeave);
        MockDB.save(db);
        return { success: true, message: "Pengajuan izin berhasil dikirim!", leave: newLeave };
      }

      case "updateLeaveStatus": {
        const { id, status, rejection_reason } = body;
        const target = db.leaves.find((l) => l.id === id);
        if (target) {
          target.status = status;
          if (rejection_reason) target.rejection_reason = rejection_reason;
          MockDB.save(db);
          return { success: true, message: `Status izin berhasil diubah menjadi ${status}` };
        }
        return { success: false, message: "Data izin tidak ditemukan" };
      }

      default:
        return { success: true, message: "Aksi berhasil diproses", data: null };
    }
  }
};
