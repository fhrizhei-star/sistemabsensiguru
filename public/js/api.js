/**
 * ====================================================================
 * API CLIENT SERVICE - SISTEM ABSENSI GURU
 * ====================================================================
 */

const Api = {
  async request(method, action, params = {}, body = null) {
    const scriptUrl = CONFIG.getScriptUrl();

    if (CONFIG.USE_DEMO_MODE) {
      return this.handleMockRequest(action, params, body);
    }

    try {
      const isVercel = window.location.hostname !== "localhost" && !window.location.hostname.includes("127.0.0.1");
      const endpoint = isVercel ? "/api/proxy" : scriptUrl;

      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set("action", action);
      if (isVercel) {
        url.searchParams.set("script_url", scriptUrl);
      }

      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, val);
        }
      }

      const options = {
        method: method,
        redirect: "follow"
      };

      if (isVercel) {
        options.headers = {
          "x-script-url": scriptUrl
        };
      }

      if (method === "POST" && body) {
        options.headers = {
          ...options.headers,
          "Content-Type": "text/plain;charset=utf-8"
        };
        options.body = JSON.stringify({ action, ...body });
      }

      const res = await fetch(url.toString(), options);
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn("Gagal terhubung ke Google Sheets, menggunakan MockDB cadangan:", err);
      return this.handleMockRequest(action, params, body);
    }
  },

  // ---- MOCK DATABASE HANDLER (Guru & Staf) ----
  handleMockRequest(action, params, body) {
    const db = MockDB.load();
    const today = getTodayDateStr();

    switch (action) {
      case "login": {
        const username = body?.username || params.username;
        const password = body?.password || params.password;
        const user = db.users.find(
          (u) =>
            (u.username.toLowerCase() === String(username).toLowerCase().trim() ||
             (u.nip && u.nip === String(username).trim())) &&
            u.password === String(password).trim()
        );
        if (user) {
          return { success: true, user: { ...user } };
        }
        return { success: false, message: "NIP / Username atau Password salah!" };
      }

      case "getSettings": {
        return { success: true, settings: db.settings };
      }

      case "updateSettings": {
        db.settings = { ...db.settings, ...(body?.settings || {}) };
        MockDB.save(db);
        return { success: true, message: "Pengaturan berhasil diperbarui" };
      }

      case "getDashboardStats": {
        const filterDate = params.tanggal || today;
        const totalGuru = db.users.filter((u) => u.role === "guru").length;
        const todayAtt = db.attendance.filter((a) => a.tanggal === filterDate);
        const hadir = todayAtt.filter((a) => a.status === "Hadir").length;
        const terlambat = todayAtt.filter((a) => a.status === "Terlambat").length;
        const izin = db.leaves.filter((l) => l.status === "Disetujui").length;
        const belumAbsen = Math.max(0, totalGuru - (hadir + terlambat + izin));

        return {
          success: true,
          stats: {
            totalGuru,
            hadir,
            terlambat,
            izin,
            belumAbsen,
            tanggal: filterDate
          },
          recentAttendance: [...todayAtt].reverse().slice(0, 10)
        };
      }

      case "getTodayAttendance": {
        const userId = params.user_id;
        const filterDate = params.tanggal || today;
        const record = db.attendance.find((a) => a.user_id === userId && a.tanggal === filterDate);
        return { success: true, data: record || null };
      }

      case "getUserAttendance": {
        const userId = params.user_id;
        const list = db.attendance.filter((a) => a.user_id === userId);
        list.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
        return { success: true, list };
      }

      case "getAllAttendance": {
        let list = [...db.attendance];
        if (params.tanggal) {
          list = list.filter((a) => a.tanggal === params.tanggal);
        }
        if (params.mapel && params.mapel !== "Semua") {
          list = list.filter((a) => a.mapel === params.mapel);
        }
        list.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
        return { success: true, list };
      }

      case "recordAttendance": {
        const data = body;
        const attDate = data.tanggal || today;
        const nowTime = data.jam || new Date().toLocaleTimeString("id-ID", { hour12: false });
        const existingIdx = db.attendance.findIndex((a) => a.user_id === data.user_id && a.tanggal === attDate);

        if (data.type === "masuk") {
          if (existingIdx !== -1) {
            return { success: false, message: "Bapak/Ibu Guru sudah melakukan presensi masuk hari ini!" };
          }
          const newAtt = {
            id: "ATT" + Date.now(),
            user_id: data.user_id,
            nama: data.nama,
            nip: data.nip || "-",
            mapel: data.mapel || "-",
            tanggal: attDate,
            jam_masuk: nowTime,
            jam_pulang: "",
            status: data.status || "Hadir",
            koordinat: data.koordinat || "-",
            foto_selfie: data.foto_selfie || "",
            keterangan: data.keterangan || "Presensi Masuk Guru"
          };
          db.attendance.push(newAtt);
          MockDB.save(db);
          return { success: true, message: `Presensi masuk berhasil dicatat pada ${nowTime}`, jam_masuk: nowTime };
        } else if (data.type === "pulang") {
          if (existingIdx === -1) {
            return { success: false, message: "Bapak/Ibu Guru belum melakukan presensi masuk hari ini!" };
          }
          if (db.attendance[existingIdx].jam_pulang) {
            return { success: false, message: "Bapak/Ibu Guru sudah melakukan presensi pulang hari ini!" };
          }
          db.attendance[existingIdx].jam_pulang = nowTime;
          if (data.keterangan) {
            db.attendance[existingIdx].keterangan += ` | Pulang: ${data.keterangan}`;
          }
          MockDB.save(db);
          return { success: true, message: `Presensi pulang berhasil dicatat pada ${nowTime}`, jam_pulang: nowTime };
        }
        return { success: false, message: "Tipe presensi tidak valid!" };
      }

      case "submitLeave": {
        const newLeave = {
          id: "LV" + Date.now(),
          user_id: body.user_id,
          nama: body.nama,
          nip: body.nip || "-",
          mapel: body.mapel || "-",
          tipe: body.tipe || "Izin",
          tgl_mulai: body.tgl_mulai,
          tgl_selesai: body.tgl_selesai,
          alasan: body.alasan,
          status: "Menunggu",
          created_at: new Date().toISOString()
        };
        db.leaves.push(newLeave);
        MockDB.save(db);
        return { success: true, message: "Permohonan izin/cuti berhasil diajukan!", leave: newLeave };
      }

      case "getLeaves": {
        let list = [...db.leaves];
        if (params.user_id) {
          list = list.filter((l) => l.user_id === params.user_id);
        }
        list.sort((a, b) => (b.id > a.id ? 1 : -1));
        return { success: true, list };
      }

      case "updateLeaveStatus": {
        const idx = db.leaves.findIndex((l) => l.id === body.id);
        if (idx !== -1) {
          db.leaves[idx].status = body.status;
          MockDB.save(db);
          return { success: true, message: `Status pengajuan berhasil diubah menjadi ${body.status}` };
        }
        return { success: false, message: "Data pengajuan tidak ditemukan" };
      }

      case "getUsers": {
        let list = [...db.users];
        if (params.role) {
          list = list.filter((u) => u.role === params.role);
        }
        return { success: true, list };
      }

      case "saveUser": {
        const uData = body;
        if (uData.id) {
          const idx = db.users.findIndex((u) => u.id === uData.id);
          if (idx !== -1) {
            db.users[idx] = { ...db.users[idx], ...uData };
            MockDB.save(db);
            return { success: true, message: "Data guru berhasil diperbarui" };
          }
          return { success: false, message: "Guru tidak ditemukan" };
        } else {
          const newId = "U" + Math.floor(1000 + Math.random() * 9000);
          const newUser = {
            id: newId,
            username: uData.username || uData.nip,
            password: uData.password || "guru123",
            nama: uData.nama,
            role: uData.role || "guru",
            nip: uData.nip || "-",
            jabatan: uData.jabatan || "Guru Pengajar",
            mapel: uData.mapel || "-",
            email: uData.email || "-",
            no_hp: uData.no_hp || "-",
            status: "aktif"
          };
          db.users.push(newUser);
          MockDB.save(db);
          return { success: true, message: "Guru berhasil didaftarkan", user: newUser };
        }
      }

      case "deleteUser": {
        const id = body?.id || params.id;
        db.users = db.users.filter((u) => u.id !== id);
        MockDB.save(db);
        return { success: true, message: "Data guru berhasil dihapus" };
      }

      default:
        return { success: false, message: "Aksi tidak dikenali: " + action };
    }
  },

  login(username, password) {
    return this.request("POST", "login", {}, { username, password });
  },
  getSettings() {
    return this.request("GET", "getSettings");
  },
  updateSettings(settings) {
    return this.request("POST", "updateSettings", {}, { settings });
  },
  getDashboardStats(tanggal) {
    return this.request("GET", "getDashboardStats", { tanggal });
  },
  getTodayAttendance(userId, tanggal) {
    return this.request("GET", "getTodayAttendance", { user_id: userId, tanggal });
  },
  getUserAttendance(userId, bulan, tahun) {
    return this.request("GET", "getUserAttendance", { user_id: userId, bulan, tahun });
  },
  getAllAttendance(tanggal, mapel) {
    return this.request("GET", "getAllAttendance", { tanggal, mapel });
  },
  recordAttendance(data) {
    return this.request("POST", "recordAttendance", {}, data);
  },
  submitLeave(data) {
    return this.request("POST", "submitLeave", {}, data);
  },
  getLeaves(userId = null) {
    return this.request("GET", "getLeaves", { user_id: userId });
  },
  updateLeaveStatus(id, status) {
    return this.request("POST", "updateLeaveStatus", {}, { id, status });
  },
  getUsers(role = null) {
    return this.request("GET", "getUsers", { role });
  },
  saveUser(userData) {
    return this.request("POST", "saveUser", {}, userData);
  },
  deleteUser(id) {
    return this.request("POST", "deleteUser", {}, { id });
  }
};

window.Api = Api;
