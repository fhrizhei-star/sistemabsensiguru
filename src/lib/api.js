import { MockDB, getTodayDateStr, getTodayDayName } from "./mockData";
import { formatDriveUrl, getAvatarUrl } from "./drive";

export const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby0DdiBERSda-XSxlvdtQrr9h9JILecQhDWsrctfZu514jP-NRo3v6T6LrSKL39PrY35Q/exec";

export function formatTimeString(val) {
  if (!val) return "";
  const s = String(val).trim();
  if (!s || s === "-") return "-";
  if (/^\d{2}:\d{2}$/.test(s)) return s;

  // 1. Ekstrak langsung HH:mm dari representasi string jam atau Date string
  // Menangani format seperti "07:30", "07:30:15", "07.30", "Sat Dec 30 1899 07:30:00 GMT+0800 (Singapore Standard Time)",
  // "Fri Nov 13 2026 07:30:00 GMT+0800 (Waktu Standar Singapura)", atau ISO string "2026-11-13T07:30:00.000Z"
  const timeRegexMatch = s.match(/(?:^|\s|T)(\d{1,2})[:.](\d{2})(?::\d{2})?/);
  if (timeRegexMatch) {
    const h = timeRegexMatch[1].padStart(2, "0");
    const m = timeRegexMatch[2];
    const hNum = parseInt(h, 10);
    const mNum = parseInt(m, 10);
    if (hNum >= 0 && hNum < 24 && mNum >= 0 && mNum < 60) {
      return `${h}:${m}`;
    }
  }

  // 2. Fallback untuk objek Date atau format tanggal lengkap lainnya menggunakan zona waktu WITA (Asia/Makassar)
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    try {
      return d.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Makassar",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(".", ":");
    } catch {
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

export function formatDisplayDate(dateStr) {
  if (!dateStr || dateStr === "-") return "-";
  const s = String(dateStr).trim();
  if (s.includes("GMT") || s.includes("T")) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }
  const parts = s.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return s;
}

function getDayNameFromDateStr(dateStr) {
  if (!dateStr) return "-";
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "-" : days[d.getDay()];
}

// Helper pembersih & deduplikasi teks rapat/kegiatan kedinasan agar tidak double
export function cleanRapatText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";
  let text = rawText.trim();
  if (!text) return "";

  // 1. Bersihkan prefix berulang seperti "Mengikuti kegiatan kedinasan:"
  text = text.replace(/^(Mengikuti kegiatan kedinasan:\s*)+/gi, "").trim();

  // 2. Pisahkan berdasarkan bullet "•"
  if (text.includes("•")) {
    const parts = text.split("•").map((p) => p.trim()).filter(Boolean);
    const uniqueParts = [];
    for (const p of parts) {
      const pClean = p.replace(/^(Mengikuti kegiatan kedinasan:\s*)+/gi, "").trim();
      if (!pClean) continue;
      if (!uniqueParts.some((u) => u.toLowerCase() === pClean.toLowerCase())) {
        uniqueParts.push(pClean);
      }
    }
    text = uniqueParts.join(" • ");
  }

  // 3. Tangani jika ada pemisah " - " yang menduplikasi teks yang sama
  if (text.includes(" - ")) {
    const parts = text.split(" - ").map((p) => p.trim()).filter(Boolean);
    const uniqueParts = [];
    for (const p of parts) {
      const pClean = p.replace(/^(Mengikuti kegiatan kedinasan:\s*)+/gi, "").trim();
      if (!pClean) continue;
      if (!uniqueParts.some((u) => u.toLowerCase() === pClean.toLowerCase())) {
        uniqueParts.push(pClean);
      }
    }
    text = uniqueParts.join(" - ");
  }

  // 4. Tangani jika ada pemisah "," yang menduplikasi teks yang sama
  if (text.includes(",")) {
    const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
    const uniqueParts = [];
    for (const p of parts) {
      const pClean = p.replace(/^(Mengikuti kegiatan kedinasan:\s*)+/gi, "").trim();
      if (!pClean) continue;
      if (!uniqueParts.some((u) => u.toLowerCase() === pClean.toLowerCase())) {
        uniqueParts.push(pClean);
      }
    }
    if (uniqueParts.length < parts.length) {
      text = uniqueParts.join(", ");
    }
  }

  // 5. Deteksi duplikasi langsung kata/klausa identik berturut-turut tanpa pemisah
  const words = text.split(/\s+/);
  if (words.length >= 4 && words.length % 2 === 0) {
    const half = words.length / 2;
    const firstHalf = words.slice(0, half).join(" ");
    const secondHalf = words.slice(half).join(" ");
    if (firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
      text = firstHalf;
    }
  }

  return text.trim();
}

// Helper resmi pemformat Judul Aktivitas Dokumen LKB khusus Rapat Kedinasan
export function formatRapatJudulAktivitas(rec) {
  if (!rec) return "Mengikuti kegiatan kedinasan: Rapat Dewan Guru & Tenaga Kependidikan";
  const cCatatan = cleanRapatText(rec.catatan);
  const cKeterangan = cleanRapatText(rec.keterangan);

  let baseAgenda = "";
  if (cCatatan && cKeterangan) {
    if (cCatatan.toLowerCase() === cKeterangan.toLowerCase()) {
      baseAgenda = cCatatan;
    } else if (cCatatan.toLowerCase().includes(cKeterangan.toLowerCase())) {
      baseAgenda = cCatatan;
    } else if (cKeterangan.toLowerCase().includes(cCatatan.toLowerCase())) {
      baseAgenda = cKeterangan;
    } else {
      baseAgenda = `${cKeterangan} - ${cCatatan}`;
    }
  } else {
    baseAgenda = cCatatan || cKeterangan || "Rapat Dewan Guru & Tenaga Kependidikan";
  }

  baseAgenda = cleanRapatText(baseAgenda);
  if (!baseAgenda) {
    baseAgenda = "Rapat Dewan Guru & Tenaga Kependidikan";
  }

  return `Mengikuti kegiatan kedinasan: ${baseAgenda}`;
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

  let cleanKeterangan = item.keterangan;
  let cleanCatatan = item.catatan;
  if (
    item.is_rapat ||
    item.tipe_absen === "rapat" ||
    item.jadwal_id === "RAPAT" ||
    (typeof item.keterangan === "string" && item.keterangan.toLowerCase().includes("rapat")) ||
    (typeof item.catatan === "string" && item.catatan.toLowerCase().includes("rapat"))
  ) {
    if (cleanKeterangan) cleanKeterangan = cleanRapatText(cleanKeterangan);
    if (cleanCatatan) cleanCatatan = cleanRapatText(cleanCatatan);
  }

  return {
    ...item,
    nip: String(item.nip || "").replace(/^'/, ""),
    tanggal: tgl,
    jam_absen: formatTimeString(item.jam_absen || item.jam || "") || String(item.jam_absen || "").replace(/\./g, ":"),
    keterangan: cleanKeterangan,
    catatan: cleanCatatan,
    foto: item.foto || item.evident || ""
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
        } else if (action === "getLkb") {
          data.lkb = (data.lkb || data.list || []).map((item) => ({
            ...item,
            nip: String(item.nip || "").replace(/^'/, ""),
            status: item.status === "Menunggu" ? "Menunggu Verifikasi" : item.status
          }));
          data.list = data.lkb;
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
          if (data.settings.jam_masuk_mulai) data.settings.jam_masuk_mulai = formatTimeString(data.settings.jam_masuk_mulai);
          if (data.settings.jam_masuk_batas) data.settings.jam_masuk_batas = formatTimeString(data.settings.jam_masuk_batas);
          if (data.settings.jam_pulang_mulai) data.settings.jam_pulang_mulai = formatTimeString(data.settings.jam_pulang_mulai);
          if (data.settings.jam_masuk) data.settings.jam_masuk = formatTimeString(data.settings.jam_masuk);
          if (data.settings.jam_masuk_akhir) data.settings.jam_masuk_akhir = formatTimeString(data.settings.jam_masuk_akhir);
          if (data.settings.jam_pulang) data.settings.jam_pulang = formatTimeString(data.settings.jam_pulang);
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
        const username = String(body?.username || params.username || "").replace(/^'/, "").trim().toLowerCase();
        const password = String(body?.password || params.password || "").trim();
        const user = db.users.find(
          (u) =>
            (String(u.username || "").replace(/^'/, "").trim().toLowerCase() === username ||
             String(u.nip || "").replace(/^'/, "").trim().toLowerCase() === username) &&
            String(u.password).trim() === password
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

        const totalTeachers = db.users.filter((u) => u.role === "guru" || u.role === "pegawai").length;
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

      case "changePassword": {
        const userId = body?.id || body?.user_id;
        const newPass = body?.password || body?.new_password;
        if (!userId || !newPass) {
          return { success: false, message: "ID pengguna dan password baru wajib diisi!" };
        }
        const idx = db.users.findIndex((u) => u.id === userId);
        if (idx !== -1) {
          db.users[idx].password = String(newPass).trim();
          MockDB.save(db);
          return { success: true, message: "Password berhasil diperbarui!" };
        }
        return { success: false, message: "Pengguna tidak ditemukan!" };
      }

      case "resetPassword": {
        const inputIdentifier = String(body.identifier || body.username || body.nip || "").replace(/^'/, "").trim().toLowerCase();
        let inputHp = String(body.no_hp || body.phone || "").replace(/[^0-9]/g, "");
        if (inputHp.startsWith("62")) inputHp = "0" + inputHp.slice(2);

        if (!inputIdentifier || !inputHp) {
          return { success: false, message: "Harap masukkan NIP/Username dan Nomor HP yang terdaftar!" };
        }

        const user = db.users.find((u) => {
          const uName = String(u.username || "").replace(/^'/, "").trim().toLowerCase();
          const uNip = String(u.nip || "").replace(/^'/, "").trim().toLowerCase();
          let rawDbHp = String(u.no_hp || "").replace(/^'/, "").replace(/[^0-9]/g, "");
          if (rawDbHp.startsWith("62")) rawDbHp = "0" + rawDbHp.slice(2);
          return (uName === inputIdentifier || uNip === inputIdentifier) && rawDbHp && rawDbHp === inputHp;
        });

        if (!user) {
          return { success: false, message: "Data tidak ditemukan! Pastikan NIP dan Nomor HP sesuai dengan yang terdaftar di sekolah." };
        }

        if (body.verify_only) {
          return {
            success: true,
            message: "Identitas terverifikasi",
            user: { id: user.id, nama: user.nama, nip: user.nip, username: user.username }
          };
        }

        const newPass = String(body.new_password || body.password || "").trim();
        if (!newPass || newPass.length < 4) {
          return { success: false, message: "Password baru minimal 4 karakter!" };
        }

        const idx = db.users.findIndex((u) => u.id === user.id);
        if (idx !== -1) {
          db.users[idx].password = newPass;
          MockDB.save(db);
        }

        return {
          success: true,
          message: "Kata sandi berhasil diperbarui! Silakan login dengan kata sandi baru Anda."
        };
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
        if (body.tipe_absen === "masuk" || body.jadwal_id === "MASUK") {
          const duplicate = (db.attendance || []).some(
            (a) => (a.tipe_absen === "masuk" || a.jadwal_id === "MASUK") && String(a.user_id) === String(body.user_id) && a.tanggal === today
          );
          if (duplicate) {
            return {
              success: false,
              message: "Bapak/Ibu sudah melakukan presensi masuk hari ini!"
            };
          }
        } else if (body.tipe_absen === "pulang" || body.jadwal_id === "PULANG") {
          const duplicate = (db.attendance || []).some(
            (a) => (a.tipe_absen === "pulang" || a.jadwal_id === "PULANG") && String(a.user_id) === String(body.user_id) && a.tanggal === today
          );
          if (duplicate) {
            return {
              success: false,
              message: "Bapak/Ibu sudah melakukan presensi pulang hari ini!"
            };
          }
        } else if (body.jadwal_id) {
          const duplicate = (db.attendance || []).some(
            (a) => String(a.jadwal_id) === String(body.jadwal_id) && String(a.user_id) === String(body.user_id) && a.tanggal === today
          );
          if (duplicate) {
            return {
              success: false,
              message: body.is_pengganti
                ? "Bapak/Ibu sudah melakukan presensi sebagai guru pengganti untuk kelas ini hari ini!"
                : "Bapak/Ibu Guru sudah melakukan presensi untuk kelas ini hari ini!"
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

      case "getLkb": {
        let list = [...(db.lkb || [])];
        if (params.user_id) {
          list = list.filter((l) => String(l.user_id) === String(params.user_id) || (l.nip && String(l.nip) === String(params.user_id)));
        }
        if (params.bulan && params.bulan !== "Semua") {
          list = list.filter((l) => (l.bulan || "").toLowerCase() === params.bulan.toLowerCase());
        }
        if (params.tahun && params.tahun !== "Semua") {
          list = list.filter((l) => String(l.tahun) === String(params.tahun));
        }
        if (params.status && params.status !== "Semua") {
          list = list.filter((l) => l.status === params.status);
        }
        const reversed = [...list].reverse();
        return { success: true, lkb: reversed, list: reversed };
      }

      case "submitLkb": {
        if (!db.lkb) db.lkb = [];
        const payload = body || {};
        const targetId = payload.lkb_id || payload.id;

        // 1. Cek berdasarkan ID dokumen LKB jika ada
        if (targetId) {
          const idx = db.lkb.findIndex((l) => l.id === targetId);
          if (idx !== -1) {
            db.lkb[idx] = {
              ...db.lkb[idx],
              ...payload,
              id: targetId,
              status: payload.status || db.lkb[idx].status || "Menunggu Verifikasi",
              alasan_penolakan: payload.alasan_penolakan !== undefined ? payload.alasan_penolakan : (db.lkb[idx].alasan_penolakan || ""),
              diverifikasi_oleh: payload.diverifikasi_oleh !== undefined ? payload.diverifikasi_oleh : (db.lkb[idx].diverifikasi_oleh || ""),
              diverifikasi_pada: payload.status === "Disetujui" ? (db.lkb[idx].diverifikasi_pada || new Date().toISOString()) : "",
              tanggal_verifikasi: payload.tanggal_verifikasi || (payload.status === "Disetujui" ? getTodayDateStr() : ""),
              updated_at: new Date().toISOString()
            };
            MockDB.save(db);
            return {
              success: true,
              message: payload.status === "Disetujui" ? "LKB berhasil disahkan" : "LKB berhasil diperbarui",
              id: targetId
            };
          }
        }

        // 2. Cek apakah sudah ada LKB milik ASN ini untuk bulan dan tahun yang sama
        const existIdx = db.lkb.findIndex((l) => {
          const uMatch = String(l.user_id) === String(payload.user_id) || (l.nip && payload.nip && String(l.nip) === String(payload.nip));
          const bMatch = (l.bulan || "").toLowerCase() === (payload.bulan || "").toLowerCase();
          const yMatch = String(l.tahun || "") === String(payload.tahun || "");
          return uMatch && bMatch && yMatch;
        });

        if (existIdx !== -1) {
          db.lkb[existIdx] = {
            ...db.lkb[existIdx],
            ...payload,
            status: payload.status || db.lkb[existIdx].status || "Menunggu Verifikasi",
            alasan_penolakan: payload.alasan_penolakan !== undefined ? payload.alasan_penolakan : (db.lkb[existIdx].alasan_penolakan || ""),
            diverifikasi_oleh: payload.diverifikasi_oleh !== undefined ? payload.diverifikasi_oleh : (db.lkb[existIdx].diverifikasi_oleh || ""),
            diverifikasi_pada: payload.status === "Disetujui" ? (db.lkb[existIdx].diverifikasi_pada || new Date().toISOString()) : "",
            tanggal_verifikasi: payload.tanggal_verifikasi || (payload.status === "Disetujui" ? getTodayDateStr() : ""),
            updated_at: new Date().toISOString()
          };
          MockDB.save(db);
          return {
            success: true,
            message: payload.status === "Disetujui" ? "LKB berhasil disahkan" : "LKB berhasil diperbarui",
            id: db.lkb[existIdx].id
          };
        }

        // 3. Jika belum pernah ada pengajuan sama sekali, buat record baru
        const newLkb = {
          id: "LKB" + Date.now(),
          status: payload.status || "Menunggu Verifikasi",
          alasan_penolakan: payload.alasan_penolakan || "",
          diverifikasi_oleh: payload.diverifikasi_oleh || (payload.status === "Disetujui" ? "Admin" : ""),
          diverifikasi_pada: payload.status === "Disetujui" ? new Date().toISOString() : "",
          tanggal_verifikasi: payload.tanggal_verifikasi || (payload.status === "Disetujui" ? getTodayDateStr() : ""),
          created_at: new Date().toISOString(),
          file_url: payload.file_url || "SISTEM_PRESENSI_OTOMATIS",
          file_name: payload.file_name || `LKB_${payload.bulan || 'Dokumen'}.pdf`,
          file_size: payload.file_size || "Terdata",
          ...payload
        };
        db.lkb.push(newLkb);
        MockDB.save(db);
        return { success: true, message: payload.status === "Disetujui" ? "LKB berhasil disahkan" : "Pengajuan LKB berhasil", id: newLkb.id };
      }

      case "updateLkbStatus": {
        if (!db.lkb) db.lkb = [];
        const payload = body || {};
        const targetId = payload.id || payload.lkb_id;

        let idx = -1;
        if (targetId) {
          idx = db.lkb.findIndex((l) => l.id === targetId);
        }

        // Fallback jika id tidak ketemu, cari berdasarkan user_id, bulan, dan tahun
        if (idx === -1 && payload.user_id && payload.bulan) {
          idx = db.lkb.findIndex((l) => {
            const uMatch = String(l.user_id) === String(payload.user_id) || (l.nip && payload.nip && String(l.nip) === String(payload.nip));
            const bMatch = (l.bulan || "").toLowerCase() === (payload.bulan || "").toLowerCase();
            const yMatch = payload.tahun ? String(l.tahun || "") === String(payload.tahun || "") : true;
            return uMatch && bMatch && yMatch;
          });
        }

        if (idx !== -1) {
          db.lkb[idx].status = payload.status || "Disetujui";
          db.lkb[idx].alasan_penolakan = payload.alasan_penolakan || "";
          db.lkb[idx].diverifikasi_oleh = payload.diverifikasi_oleh || "Admin";
          db.lkb[idx].diverifikasi_pada = new Date().toISOString();
          db.lkb[idx].tanggal_verifikasi = payload.tanggal_verifikasi || getTodayDateStr();
          MockDB.save(db);
          return {
            success: true,
            message: `Status LKB berhasil diperbarui menjadi: ${payload.status || "Disetujui"}`,
            lkb: db.lkb[idx]
          };
        }

        // Jika tidak ditemukan sama sekali, buatkan record otomatis langsung dengan status yang diminta
        if (payload.user_id && payload.bulan) {
          const autoLkb = {
            id: "LKB" + Date.now(),
            user_id: payload.user_id,
            nama: payload.nama || "ASN",
            nip: payload.nip || "-",
            role: payload.role || "guru",
            bulan: payload.bulan,
            tahun: payload.tahun || String(new Date().getFullYear()),
            status: payload.status || "Disetujui",
            alasan_penolakan: payload.alasan_penolakan || "",
            diverifikasi_oleh: payload.diverifikasi_oleh || "Admin",
            diverifikasi_pada: new Date().toISOString(),
            tanggal_verifikasi: payload.tanggal_verifikasi || getTodayDateStr(),
            created_at: new Date().toISOString(),
            file_url: "SISTEM_PRESENSI_OTOMATIS",
            file_name: `LKB_${payload.bulan}.pdf`,
            file_size: "Disahkan Admin"
          };
          db.lkb.push(autoLkb);
          MockDB.save(db);
          return {
            success: true,
            message: `LKB berhasil dibuat dan disahkan`,
            lkb: autoLkb
          };
        }

        return { success: false, message: "Data LKB tidak ditemukan" };
      }

      case "deleteLkb": {
        if (!db.lkb) db.lkb = [];
        const id = body?.id || params.id;
        db.lkb = db.lkb.filter((l) => l.id !== id);
        MockDB.save(db);
        return { success: true, message: "Dokumen LKB berhasil dihapus" };
      }

      default:
        return { success: true, message: "Aksi berhasil diproses", data: null };
    }
  }
};
