/**
 * ====================================================================
 * SISTEM ABSENSI GURU BERBASIS JADWAL PELAJARAN - GOOGLE APPS SCRIPT
 * ====================================================================
 * Cara Penggunaan:
 * 1. Buka Google Sheets baru di https://sheets.new
 * 2. Beri nama spreadsheet, misal: "Database Absensi Mengajar Guru"
 * 3. Klik menu: Extensions (Ekstensi) -> Apps Script
 * 4. Hapus kode yang ada, lalu Paste seluruh isi file ini ke editor Apps Script.
 * 5. Klik Save (ikon disket).
 * 6. Klik tombol "Deploy" (Terapkan) di kanan atas -> "New deployment" (Penerapan baru).
 * 7. Pilih tipe "Web app" (Aplikasi Web).
 * 8. Atur "Execute as": "Me" dan "Who has access": "Anyone".
 * 9. Klik Deploy, Berikan izin akses (Authorize access), lalu COPY "Web app URL".
 * 10. Paste URL tersebut ke menu Pengaturan di web atau file `public/js/config.js`.
 * ====================================================================
 */

const SHEET_USERS = "GURU_STAF";
const SHEET_SCHEDULES = "JADWAL_PELAJARAN";
const SHEET_ATTENDANCE = "ABSENSI_GURU";
const SHEET_LEAVES = "IZIN_CUTI_GURU";
const SHEET_SETTINGS = "PENGATURAN";

function onOpen() {
  initDatabase();
}

function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet GURU_STAF
  let sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEET_USERS);
    sheetUsers.appendRow([
      "id", "username", "password", "nama", "role", "nip", "jabatan", "mapel", "email", "no_hp", "status", "created_at", "foto_url"
    ]);
    sheetUsers.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#062e24").setFontColor("#ffffff");

    // Sample data Guru & Admin
    sheetUsers.appendRow(["U001", "admin", "admin123", "Bpk. Hendra Gunawan, S.Kom", "admin", "198001012005011001", "Kepala Tata Usaha / Admin", "Manajemen Kepegawaian", "admin@sekolah.sch.id", "081234567890", "aktif", new Date(), "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80"]);
    sheetUsers.appendRow(["U002", "198501152010011002", "guru123", "Drs. Bambang Sudarsono, M.Pd", "guru", "198501152010011002", "Guru Madya", "Matematika", "bambang@sekolah.sch.id", "081234567891", "aktif", new Date(), "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80"]);
    sheetUsers.appendRow(["U003", "199003202015022001", "guru123", "Siti Nurhaliza, S.Pd", "guru", "199003202015022001", "Guru Pertama", "Bahasa Indonesia", "siti@sekolah.sch.id", "081234567892", "aktif", new Date(), "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"]);
    sheetUsers.appendRow(["U004", "199208142019031005", "guru123", "Ahmad Fauzi, S.Kom", "guru", "199208142019031005", "Guru Pertama", "Informatika / TIK", "fauzi@sekolah.sch.id", "081234567893", "aktif", new Date(), "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80"]);
    sheetUsers.appendRow(["U005", "198811052014022003", "guru123", "Dewi Lestari, S.Pd, M.Si", "guru", "198811052014022003", "Guru Muda", "Fisika", "dewi@sekolah.sch.id", "081234567894", "aktif", new Date(), "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80"]);
  }

  // 2. Sheet JADWAL_PELAJARAN
  let sheetSch = ss.getSheetByName(SHEET_SCHEDULES);
  if (!sheetSch) {
    sheetSch = ss.insertSheet(SHEET_SCHEDULES);
    sheetSch.appendRow([
      "id", "guru_id", "nama_guru", "nip", "mapel", "kelas", "hari", "jam_ke", "jam_mulai", "jam_selesai", "ruangan", "created_at"
    ]);
    sheetSch.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#1e3a8a").setFontColor("#ffffff");

    // Sample data Jadwal
    sheetSch.appendRow(["JAD101", "U002", "Drs. Bambang Sudarsono, M.Pd", "198501152010011002", "Matematika", "X MIPA 1", "Senin", "Jam Ke 1 - 2", "07:30", "09:00", "R. Kelas X-1", new Date()]);
    sheetSch.appendRow(["JAD102", "U002", "Drs. Bambang Sudarsono, M.Pd", "198501152010011002", "Matematika", "XI MIPA 2", "Senin", "Jam Ke 3 - 4", "09:15", "10:45", "R. Kelas XI-2", new Date()]);
    sheetSch.appendRow(["JAD201", "U003", "Siti Nurhaliza, S.Pd", "199003202015022001", "Bahasa Indonesia", "X IPS 1", "Senin", "Jam Ke 1 - 2", "07:30", "09:00", "R. Kelas X-IPS", new Date()]);
    sheetSch.appendRow(["JAD301", "U004", "Ahmad Fauzi, S.Kom", "199208142019031005", "Informatika / TIK", "X MIPA 1", "Senin", "Jam Ke 3 - 4", "09:15", "10:45", "Lab Komputer 1", new Date()]);
  }

  // 3. Sheet ABSENSI_GURU
  let sheetAtt = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheetAtt) {
    sheetAtt = ss.insertSheet(SHEET_ATTENDANCE);
    sheetAtt.appendRow([
      "id", "jadwal_id", "user_id", "nama", "nip", "mapel", "kelas", "hari", "tanggal", "jam_jadwal", "jam_absen", "status", "koordinat", "keterangan", "created_at"
    ]);
    sheetAtt.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
  } else {
    // Auto-check jika header masih versi lama (belum ada jadwal_id)
    const attHeaders = sheetAtt.getRange(1, 1, 1, Math.max(1, sheetAtt.getLastColumn())).getValues()[0];
    const headerStrs = attHeaders.map(function(h) { return String(h).trim().toLowerCase(); });
    if (headerStrs.indexOf("jadwal_id") === -1) {
      sheetAtt.getRange(1, 1, 1, 15).setValues([[
        "id", "jadwal_id", "user_id", "nama", "nip", "mapel", "kelas", "hari", "tanggal", "jam_jadwal", "jam_absen", "status", "koordinat", "keterangan", "created_at"
      ]]).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
    }
  }

  // Auto-check sheet GURU_STAF untuk kolom foto_url (kolom 13)
  if (sheetUsers) {
    const userHeaders = sheetUsers.getRange(1, 1, 1, Math.max(1, sheetUsers.getLastColumn())).getValues()[0];
    const userHeaderStrs = userHeaders.map(function(h) { return String(h).trim().toLowerCase(); });
    if (userHeaderStrs.indexOf("foto_url") === -1) {
      sheetUsers.getRange(1, 13).setValue("foto_url").setFontWeight("bold").setBackground("#062e24").setFontColor("#ffffff");
    }
  }

  // 4. Sheet IZIN_CUTI_GURU
  let sheetLeaves = ss.getSheetByName(SHEET_LEAVES);
  if (!sheetLeaves) {
    sheetLeaves = ss.insertSheet(SHEET_LEAVES);
    sheetLeaves.appendRow([
      "id", "user_id", "nama", "nip", "mapel", "tipe", "tgl_mulai", "tgl_selesai", "alasan", "status", "created_at"
    ]);
    sheetLeaves.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff");
  }

  // 5. Sheet PENGATURAN
  let sheetSettings = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheetSettings) {
    sheetSettings = ss.insertSheet(SHEET_SETTINGS);
    sheetSettings.appendRow(["key", "value", "deskripsi"]);
    sheetSettings.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff");

    sheetSettings.appendRow(["nama_sekolah", "MTsN GOWA", "Nama Sekolah / Instansi"]);
    sheetSettings.appendRow(["alamat_sekolah", "Jl. Pendidikan Nasional No. 45, Jakarta", "Alamat Sekolah"]);
    sheetSettings.appendRow(["kepala_sekolah", "Drs. H. Mulyadi, M.Pd", "Nama Kepala Sekolah"]);
    sheetSettings.appendRow(["nip_kepsek", "196805121994031004", "NIP Kepala Sekolah"]);
    sheetSettings.appendRow(["npsn", "20104567", "Nomor Pokok Sekolah Nasional"]);
    sheetSettings.appendRow(["no_telp", "(0411) 861234", "Nomor Telepon Sekolah"]);
    sheetSettings.appendRow(["kota", "Kabupaten Gowa", "Kota / Kabupaten"]);
    sheetSettings.appendRow(["toleransi_menit", "15", "Toleransi keterlambatan dalam menit"]);
    sheetSettings.appendRow(["lat_sekolah", "-6.2088", "Latitude sekolah"]);
    sheetSettings.appendRow(["lng_sekolah", "106.8456", "Longitude sekolah"]);
    sheetSettings.appendRow(["radius_meter", "250", "Radius toleransi presensi dalam meter"]);
    sheetSettings.appendRow(["telegram_bot_token", "", "Token Bot Telegram (@BotFather)"]);
    sheetSettings.appendRow(["telegram_chat_id", "", "Chat ID Grup Telegram Guru / Staf"]);
    sheetSettings.appendRow(["telegram_notif_aktif", "true", "Aktifkan Pengingat Kelas 5 Menit ke Telegram (true/false)"]);
    sheetSettings.appendRow(["telegram_notif_absen", "true", "Notifikasi Realtime saat Guru Absen ke Telegram (true/false)"]);
    sheetSettings.appendRow(["web_url", "https://sistemabsensiguru.vercel.app", "Link Website Absensi Sekolah"]);
  } else {
    const sRows = sheetSettings.getDataRange().getValues();
    const existingKeys = {};
    for (let i = 1; i < sRows.length; i++) {
      existingKeys[sRows[i][0]] = true;
    }
    const defaultSettings = [
      ["no_telp", "(0411) 861234", "Nomor Telepon Sekolah"],
      ["telegram_bot_token", "", "Token Bot Telegram (@BotFather)"],
      ["telegram_chat_id", "", "Chat ID Grup Telegram Guru / Staf"],
      ["telegram_notif_aktif", "true", "Aktifkan Pengingat Kelas 5 Menit ke Telegram (true/false)"],
      ["telegram_notif_absen", "true", "Notifikasi Realtime saat Guru Absen ke Telegram (true/false)"],
      ["web_url", "https://sistemabsensiguru.vercel.app", "Link Website Absensi Sekolah"]
    ];
    for (let k = 0; k < defaultSettings.length; k++) {
      if (!existingKeys[defaultSettings[k][0]]) {
        sheetSettings.appendRow(defaultSettings[k]);
      }
    }
  }

  return { success: true, message: "Database Absensi Mengajar Guru berhasil disiapkan!" };
}

// Router untuk GET Request
function doGet(e) {
  try {
    const action = e.parameter.action || "test";
    let result = {};

    switch (action) {
      case "init":
        result = initDatabase();
        break;
      case "test":
        result = { success: true, message: "Server Database Absensi Guru aktif!", timestamp: new Date() };
        break;
      case "getSettings":
        result = getSettingsHandler();
        break;
      case "getTeacherTodaySchedules":
        result = getTeacherTodaySchedulesHandler(e.parameter.user_id, e.parameter.tanggal, e.parameter.hari);
        break;
      case "getSchedules":
        result = getSchedulesHandler(e.parameter.hari, e.parameter.guru_id, e.parameter.kelas, e.parameter.mapel);
        break;
      case "getUserAttendance":
        result = getUserAttendanceHandler(e.parameter.user_id);
        break;
      case "getAllAttendance":
        result = getAllAttendanceHandler(e.parameter.tanggal, e.parameter.mapel, e.parameter.kelas, e.parameter.guru_id);
        break;
      case "getAttendance":
        if (e.parameter.user_id) {
          result = getUserAttendanceHandler(e.parameter.user_id);
        } else {
          result = getAllAttendanceHandler(e.parameter.tanggal, e.parameter.mapel, e.parameter.kelas, e.parameter.guru_id);
        }
        if (result && result.list) {
          result.attendance = result.list;
        }
        break;
      case "getUsers":
        result = getUsersHandler(e.parameter.role);
        break;
      case "getLeaves":
        result = getLeavesHandler(e.parameter.user_id);
        break;
      case "getDashboardStats":
        result = getDashboardStatsHandler(e.parameter.tanggal);
        break;
      case "testTelegram":
        result = testTelegramHandler(e.parameter.customMessage);
        break;
      case "checkReminders":
        result = checkUpcomingClassesAndRemind();
        break;
      case "setupTelegramTrigger":
        result = setupTelegramTrigger();
        break;
      case "removeTelegramTrigger":
        result = removeTelegramTrigger();
        break;
      default:
        result = { success: false, message: "Aksi GET tidak dikenali: " + action };
    }

    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// Router untuk POST Request
function doPost(e) {
  try {
    let data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    const action = data.action;
    let result = {};

    switch (action) {
      case "login":
        result = loginHandler(data.username, data.password);
        break;
      case "recordAttendance":
      case "recordClassAttendance":
        result = recordClassAttendanceHandler(data);
        break;
      case "saveSchedule":
        result = saveScheduleHandler(data);
        break;
      case "deleteSchedule":
        result = deleteScheduleHandler(data.id);
        break;
      case "submitLeave":
        result = submitLeaveHandler(data);
        break;
      case "updateLeaveStatus":
        result = updateLeaveStatusHandler(data.id, data.status);
        break;
      case "saveUser":
        result = saveUserHandler(data);
        break;
      case "deleteUser":
        result = deleteUserHandler(data.id);
        break;
      case "updateSettings":
        result = updateSettingsHandler(data.settings);
        break;
      case "testTelegram":
        result = testTelegramHandler(data.customMessage);
        break;
      case "checkReminders":
        result = checkUpcomingClassesAndRemind();
        break;
      case "setupTelegramTrigger":
        result = setupTelegramTrigger();
        break;
      case "removeTelegramTrigger":
        result = removeTelegramTrigger();
        break;
      default:
        result = { success: false, message: "Aksi POST tidak dikenali: " + action };
    }

    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// ================= HELPER FORMAT ================= //

function formatGasTime(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "GMT+8", "HH:mm");
  }
  const s = String(val).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  const match = s.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    return (match[1].length === 1 ? "0" + match[1] : match[1]) + ":" + match[2];
  }
  return s;
}

function parseGasMinutes(tStr) {
  if (!tStr) return null;
  const cleaned = String(tStr).trim().replace(".", ":");
  const parts = cleaned.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }
  return null;
}

// ================= HANDLERS ================= //

function getSettingsHandler() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(SHEET_SETTINGS);
  }

  const rows = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < rows.length; i++) {
    const key = rows[i][0];
    const val = rows[i][1];
    if (key) settings[key] = val;
  }

  // Format jam agar selalu HH:mm
  if (settings.jam_masuk) settings.jam_masuk = formatGasTime(settings.jam_masuk);
  if (settings.jam_masuk_akhir) settings.jam_masuk_akhir = formatGasTime(settings.jam_masuk_akhir);
  if (settings.jam_pulang) settings.jam_pulang = formatGasTime(settings.jam_pulang);
  if (!settings.no_telp) settings.no_telp = "(0411) 861234";
  if (!settings.web_url || settings.web_url.indexOf("absensi-sekolah.vercel.app") !== -1) {
    settings.web_url = "https://sistemabsensiguru.vercel.app";
  }

  return { success: true, settings: settings };
}

function updateSettingsHandler(newSettings) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SETTINGS);
  const rows = sheet.getDataRange().getValues();

  for (let key in newSettings) {
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == key) {
        sheet.getRange(i + 1, 2).setValue(newSettings[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, newSettings[key], ""]);
    }
  }

  return { success: true, message: "Pengaturan berhasil disimpan" };
}

function loginHandler(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(SHEET_USERS);
  }

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const uName = String(row[1]).trim().replace(/^'/, "");
    const uNip = String(row[5]).trim().replace(/^'/, "");
    const uPass = String(row[2]).trim();
    const inputUser = String(username).toLowerCase().trim().replace(/^'/, "");

    if ((uName.toLowerCase() === inputUser || uNip.toLowerCase() === inputUser) && uPass === String(password).trim()) {
      return {
        success: true,
        user: {
          id: String(row[0]),
          username: uName,
          nama: String(row[3]),
          role: String(row[4]),
          nip: uNip,
          jabatan: String(row[6]),
          mapel: String(row[7]),
          email: String(row[8]),
          no_hp: String(row[9]).replace(/^'/, ""),
          status: String(row[10]),
          foto_url: String(row[12] || "")
        }
      };
    }
  }

  return { success: false, message: "NIP / Username atau Password salah!" };
}

function getDayNameIndo(dateObj) {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[dateObj.getDay()];
}

function getTeacherTodaySchedulesHandler(userId, tanggal, hariParam) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetSch = ss.getSheetByName(SHEET_SCHEDULES);
  let sheetAtt = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheetSch) {
    initDatabase();
    sheetSch = ss.getSheetByName(SHEET_SCHEDULES);
    sheetAtt = ss.getSheetByName(SHEET_ATTENDANCE);
  }

  const targetDateStr = tanggal || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
  const targetDay = hariParam || getDayNameIndo(new Date(targetDateStr));

  // Ambil semua jadwal guru ini (gunakan getDisplayValues agar jam tidak terdistorsi timezone)
  const schRows = sheetSch.getDataRange().getDisplayValues();
  const schedules = [];

  for (let i = 1; i < schRows.length; i++) {
    const row = schRows[i];
    const schGuruId = String(row[1]);
    const schHari = String(row[6]);

    if (schGuruId === String(userId) && (targetDay === "Semua" || schHari === targetDay)) {
      schedules.push({
        id: String(row[0]),
        guru_id: schGuruId,
        nama_guru: String(row[2]),
        nip: String(row[3]),
        mapel: String(row[4]),
        kelas: String(row[5]),
        hari: schHari,
        jam_ke: String(row[7] || "-"),
        jam_mulai: String(row[8]),
        jam_selesai: String(row[9]),
        ruangan: String(row[10] || "-")
      });
    }
  }

  // Cek catatan kehadiran untuk tanggal ini
  const attRows = sheetAtt ? sheetAtt.getDataRange().getValues() : [];
  const list = schedules.map(function(sch) {
    let matchedAtt = null;
    for (let j = 1; j < attRows.length; j++) {
      const aRow = attRows[j];
      const aJadwalId = String(aRow[1]);
      const aUserId = String(aRow[2]);
      const rawDate = aRow[8];
      const aDate = rawDate instanceof Date
        ? Utilities.formatDate(rawDate, "GMT+8", "yyyy-MM-dd")
        : String(rawDate).trim().replace(/^'/, "");

      if (aJadwalId === sch.id && aUserId === String(userId) && aDate === targetDateStr) {
        matchedAtt = {
          id: String(aRow[0]),
          jam_absen: String(aRow[10]),
          status: String(aRow[11]),
          koordinat: String(aRow[12]),
          keterangan: String(aRow[13])
        };
        break;
      }
    }

    return {
      id: sch.id,
      guru_id: sch.guru_id,
      nama_guru: sch.nama_guru,
      nip: sch.nip,
      mapel: sch.mapel,
      kelas: sch.kelas,
      hari: sch.hari,
      jam_ke: sch.jam_ke,
      jam_mulai: sch.jam_mulai,
      jam_selesai: sch.jam_selesai,
      ruangan: sch.ruangan,
      is_attended: !!matchedAtt,
      attendance: matchedAtt
    };
  });

  list.sort(function(a, b) {
    return a.jam_mulai > b.jam_mulai ? 1 : -1;
  });

  return {
    success: true,
    hari: targetDay,
    tanggal: targetDateStr,
    list: list
  };
}

function recordClassAttendanceHandler(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_ATTENDANCE);
    if (!sheet) {
      initDatabase();
      sheet = ss.getSheetByName(SHEET_ATTENDANCE);
    }

    const todayStr = data.tanggal || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
    const timeNowStr = data.jam_absen || Utilities.formatDate(new Date(), "GMT+8", "HH:mm:ss");

    // Cek apakah guru sudah pernah absen untuk jadwal ini pada tanggal yang sama
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const aJadwalId = String(rows[i][1]);
      const aUserId = String(rows[i][2]);
      const rawDate = rows[i][8];
      const aDate = rawDate instanceof Date
        ? Utilities.formatDate(rawDate, "GMT+8", "yyyy-MM-dd")
        : String(rawDate).trim().replace(/^'/, "");

      if (aJadwalId === String(data.jadwal_id) && aUserId === String(data.user_id) && aDate === todayStr) {
        return {
          success: false,
          message: "Bapak/Ibu Guru sudah melakukan presensi untuk kelas ini hari ini!"
        };
      }
    }

    // Cek pembatasan jam jadwal (jika data.jam_jadwal ada)
    let finalStatus = data.status || "Hadir";
    let finalKeterangan = data.keterangan || "Tepat Waktu";

    if (data.jam_jadwal && String(data.jam_jadwal).includes("-")) {
      const parts = String(data.jam_jadwal).split("-");
      const jamMulaiStr = parts[0].trim();
      const jamSelesaiStr = parts[1].trim();

      const parseGasMinutes = function(tStr) {
        if (!tStr) return null;
        const p = tStr.replace(".", ":").split(":");
        if (p.length >= 2) {
          const h = parseInt(p[0], 10);
          const m = parseInt(p[1], 10);
          if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
        }
        return null;
      };

      const startMin = parseGasMinutes(jamMulaiStr);
      const endMin = parseGasMinutes(jamSelesaiStr);
      const nowMin = parseGasMinutes(timeNowStr);

      let toleransiMenit = 15;
      const sheetSet = ss.getSheetByName(SHEET_SETTINGS);
      if (sheetSet) {
        const setRows = sheetSet.getDataRange().getValues();
        for (let s = 1; s < setRows.length; s++) {
          if (setRows[s][0] === "toleransi_menit") {
            toleransiMenit = Number(setRows[s][1]) || 15;
            break;
          }
        }
      }

      if (startMin !== null && endMin !== null && nowMin !== null) {
        if (nowMin < startMin) {
          return {
            success: false,
            message: "Sesi kelas " + (data.kelas || "") + " belum dimulai! Presensi baru dibuka tepat pukul " + jamMulaiStr + " (waktu saat ini: " + timeNowStr + ")."
          };
        }
        if (nowMin > endMin) {
          return {
            success: false,
            message: "Sesi kelas " + (data.kelas || "") + " telah berakhir pada pukul " + jamSelesaiStr + " (waktu saat ini: " + timeNowStr + ")."
          };
        }
        if (nowMin > startMin + toleransiMenit) {
          finalStatus = "Terlambat";
          const late = nowMin - startMin;
          finalKeterangan = (data.keterangan ? data.keterangan + " • " : "") + "Terlambat " + late + " menit";
        }
      }
    }

    const newId = "ATT" + new Date().getTime();
    sheet.appendRow([
      newId,
      data.jadwal_id,
      data.user_id,
      data.nama,
      data.nip || "-",
      data.mapel || "-",
      data.kelas || "-",
      data.hari || "-",
      "'" + todayStr,
      data.jam_jadwal || "-",
      timeNowStr,
      finalStatus,
      data.koordinat || "Area Sekolah",
      finalKeterangan,
      new Date()
    ]);

    // Kirim notifikasi realtime Telegram saat guru absen (jika diaktifkan)
    try {
      const setRes = getSettingsHandler();
      const st = setRes.settings || {};
      const isNotifAbsen = String(st.telegram_notif_absen).toLowerCase() === "true" || st.telegram_notif_absen === true;
      if (isNotifAbsen && st.telegram_bot_token && st.telegram_chat_id) {
        const notifStatusIcon = finalStatus === "Hadir" ? "✅" : "⚠️";
        const notifMsg =
          notifStatusIcon + " <b>PRESENSI KELAS BERHASIL</b>\n" +
          "━━━━━━━━━━━━━━━━━━━━━━\n" +
          "👨‍🏫 <b>" + (data.nama || "-") + "</b>\n" +
          "📚 <b>Mata Pelajaran:</b> " + (data.mapel || "-") + "\n" +
          "🏫 <b>Kelas:</b> " + (data.kelas || "-") + "\n" +
          "⏱️ <b>Jam Presensi:</b> " + timeNowStr + " (" + finalStatus + ")\n" +
          "📌 <b>Keterangan:</b> " + finalKeterangan + "\n" +
          "━━━━━━━━━━━━━━━━━━━━━━";
        sendTelegramMessage(notifMsg);
      }
    } catch (eNotif) {
      Logger.log("Gagal kirim notifikasi presensi ke Telegram: " + eNotif.toString());
    }

    return {
      success: true,
      message: "Presensi kelas " + (data.kelas || "") + " berhasil dicatat pada " + timeNowStr,
      jam_absen: timeNowStr
    };
  } catch (err) {
    return { success: false, message: "Terjadi kesalahan server: " + err.toString() };
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function getSchedulesHandler(hari, guru_id, kelas, mapel) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SCHEDULES);
  if (!sheet) return { success: true, list: [] };

  const rows = sheet.getDataRange().getDisplayValues();
  const list = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const sHari = String(row[6]);
    const sGuruId = String(row[1]);
    const sKelas = String(row[5]);
    const sMapel = String(row[4]);

    if (hari && hari !== "Semua" && sHari !== hari) continue;
    if (guru_id && sGuruId !== String(guru_id)) continue;
    if (kelas && kelas !== "Semua" && sKelas !== kelas) continue;
    if (mapel && mapel !== "Semua" && sMapel !== mapel) continue;

    list.push({
      id: String(row[0]),
      guru_id: sGuruId,
      nama_guru: String(row[2]),
      nip: String(row[3]),
      mapel: sMapel,
      kelas: sKelas,
      hari: sHari,
      jam_ke: String(row[7] || "-"),
      jam_mulai: String(row[8]),
      jam_selesai: String(row[9]),
      ruangan: String(row[10] || "-")
    });
  }

  return { success: true, schedules: list, list: list };
}

function saveScheduleHandler(raw) {
  const data = (raw && raw.schedule) ? raw.schedule : (raw || {});
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SCHEDULES);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(SHEET_SCHEDULES);
  }

  const rows = sheet.getDataRange().getValues();

  if (data.id) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(data.id)) {
        if (data.guru_id) sheet.getRange(i + 1, 2).setValue(data.guru_id);
        if (data.nama_guru) sheet.getRange(i + 1, 3).setValue(data.nama_guru);
        if (data.nip) sheet.getRange(i + 1, 4).setValue("'" + String(data.nip).replace(/^'/, ""));
        if (data.mapel) sheet.getRange(i + 1, 5).setValue(data.mapel);
        if (data.kelas) sheet.getRange(i + 1, 6).setValue(data.kelas);
        if (data.hari) sheet.getRange(i + 1, 7).setValue(data.hari);
        if (data.jam_ke) sheet.getRange(i + 1, 8).setValue(data.jam_ke);
        if (data.jam_mulai) sheet.getRange(i + 1, 9).setValue("'" + String(data.jam_mulai).replace(/^'/, ""));
        if (data.jam_selesai) sheet.getRange(i + 1, 10).setValue("'" + String(data.jam_selesai).replace(/^'/, ""));
        if (data.ruangan) sheet.getRange(i + 1, 11).setValue(data.ruangan);

        return { success: true, message: "Jadwal pelajaran berhasil diperbarui!" };
      }
    }
    return { success: false, message: "Jadwal tidak ditemukan!" };
  } else {
    const newId = "JAD" + new Date().getTime();
    sheet.appendRow([
      newId,
      data.guru_id,
      data.nama_guru,
      "'" + String(data.nip || "-").replace(/^'/, ""),
      data.mapel,
      data.kelas,
      data.hari,
      data.jam_ke || "Jam Ke 1 - 2",
      "'" + String(data.jam_mulai || "").replace(/^'/, ""),
      "'" + String(data.jam_selesai || "").replace(/^'/, ""),
      data.ruangan || "-",
      new Date()
    ]);

    return { success: true, message: "Jadwal pelajaran baru berhasil ditambahkan!", id: newId };
  }
}

function deleteScheduleHandler(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SCHEDULES);
  if (!sheet) return { success: false, message: "Sheet jadwal tidak ditemukan" };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Jadwal pelajaran berhasil dihapus" };
    }
  }

  return { success: false, message: "Jadwal tidak ditemukan" };
}

function getUserAttendanceHandler(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheet) return { success: true, list: [] };

  const rows = sheet.getDataRange().getValues();
  const list = [];

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]) === String(userId)) {
      const rawDate = rows[i][8];
      const rowDate = rawDate instanceof Date
        ? Utilities.formatDate(rawDate, "GMT+8", "yyyy-MM-dd")
        : String(rawDate).trim().replace(/^'/, "");

      list.push({
        id: String(rows[i][0]),
        jadwal_id: String(rows[i][1]),
        user_id: String(rows[i][2]),
        nama: String(rows[i][3]),
        nip: String(rows[i][4]),
        mapel: String(rows[i][5]),
        kelas: String(rows[i][6]),
        hari: String(rows[i][7]),
        tanggal: rowDate,
        jam_jadwal: String(rows[i][9]),
        jam_absen: String(rows[i][10]),
        status: String(rows[i][11]),
        koordinat: String(rows[i][12]),
        keterangan: String(rows[i][13])
      });
    }
  }

  list.sort(function(a, b) {
    return b.tanggal > a.tanggal ? 1 : b.jam_absen > a.jam_absen ? 1 : -1;
  });

  return { success: true, attendance: list, list: list };
}

function getAllAttendanceHandler(tanggal, mapel, kelas, guru_id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheet) return { success: true, list: [] };

  const rows = sheet.getDataRange().getValues();
  const list = [];

  for (let i = 1; i < rows.length; i++) {
    const rawDate = rows[i][8];
    const rowDate = rawDate instanceof Date
      ? Utilities.formatDate(rawDate, "GMT+8", "yyyy-MM-dd")
      : String(rawDate).trim().replace(/^'/, "");

    const rowMapel = String(rows[i][5]);
    const rowKelas = String(rows[i][6]);
    const rowGuruId = String(rows[i][2]);

    if (tanggal && rowDate !== tanggal) continue;
    if (mapel && mapel !== "Semua" && rowMapel !== mapel) continue;
    if (kelas && kelas !== "Semua" && rowKelas !== kelas) continue;
    if (guru_id && rowGuruId !== String(guru_id)) continue;

    list.push({
      id: String(rows[i][0]),
      jadwal_id: String(rows[i][1]),
      user_id: rowGuruId,
      nama: String(rows[i][3]),
      nip: String(rows[i][4]),
      mapel: rowMapel,
      kelas: rowKelas,
      hari: String(rows[i][7]),
      tanggal: rowDate,
      jam_jadwal: String(rows[i][9]),
      jam_absen: String(rows[i][10]),
      status: String(rows[i][11]),
      koordinat: String(rows[i][12]),
      keterangan: String(rows[i][13])
    });
  }

  list.sort(function(a, b) {
    return b.tanggal > a.tanggal ? 1 : b.jam_absen > a.jam_absen ? 1 : -1;
  });

  return { success: true, attendance: list, list: list };
}

function getDashboardStatsHandler(tanggal) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const todayStr = tanggal || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
  const dayName = getDayNameIndo(new Date(todayStr));

  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  const sheetSch = ss.getSheetByName(SHEET_SCHEDULES);
  const sheetAtt = ss.getSheetByName(SHEET_ATTENDANCE);
  const sheetLeaves = ss.getSheetByName(SHEET_LEAVES);

  let totalGuru = 0;
  if (sheetUsers) {
    const userRows = sheetUsers.getDataRange().getValues();
    for (let i = 1; i < userRows.length; i++) {
      if (userRows[i][4] === "guru" && userRows[i][10] === "aktif") {
        totalGuru++;
      }
    }
  }

  let totalSesi = 0;
  if (sheetSch) {
    const schRows = sheetSch.getDataRange().getValues();
    for (let i = 1; i < schRows.length; i++) {
      if (String(schRows[i][6]) === dayName) {
        totalSesi++;
      }
    }
  }

  let hadir = 0;
  let terlambat = 0;
  const recentAttendance = [];

  if (sheetAtt) {
    const attRows = sheetAtt.getDataRange().getValues();
    for (let i = 1; i < attRows.length; i++) {
      const rawDate = attRows[i][8];
      const rowDate = rawDate instanceof Date
        ? Utilities.formatDate(rawDate, "GMT+8", "yyyy-MM-dd")
        : String(rawDate).trim().replace(/^'/, "");

      if (rowDate === todayStr) {
        if (attRows[i][11] === "Hadir") hadir++;
        if (attRows[i][11] === "Terlambat") terlambat++;

        recentAttendance.push({
          id: String(attRows[i][0]),
          nama: String(attRows[i][3]),
          nip: String(attRows[i][4]),
          mapel: String(attRows[i][5]),
          kelas: String(attRows[i][6]),
          jam_jadwal: String(attRows[i][9]),
          jam_absen: String(attRows[i][10]),
          status: String(attRows[i][11]),
          koordinat: String(attRows[i][12])
        });
      }
    }
  }

  let izin = 0;
  if (sheetLeaves) {
    const leaveRows = sheetLeaves.getDataRange().getValues();
    for (let i = 1; i < leaveRows.length; i++) {
      const tglMulai = leaveRows[i][6] instanceof Date ? Utilities.formatDate(leaveRows[i][6], "GMT+8", "yyyy-MM-dd") : String(leaveRows[i][6]).trim().replace(/^'/, "");
      const tglSelesai = leaveRows[i][7] instanceof Date ? Utilities.formatDate(leaveRows[i][7], "GMT+8", "yyyy-MM-dd") : String(leaveRows[i][7]).trim().replace(/^'/, "");
      const status = leaveRows[i][9];
      if (status === "Disetujui" && todayStr >= tglMulai && todayStr <= tglSelesai) {
        izin++;
      }
    }
  }

  const belumAbsen = Math.max(0, totalSesi - (hadir + terlambat));

  return {
    success: true,
    stats: {
      total_guru: totalGuru,
      totalGuru: totalGuru,
      total_sesi: totalSesi,
      totalSesi: totalSesi,
      hadir: hadir,
      terlambat: terlambat,
      izin: izin,
      alpha: belumAbsen,
      belumAbsen: belumAbsen,
      tanggal: todayStr,
      hari: dayName
    },
    recentAttendance: recentAttendance.slice(-15).reverse(),
    recent_activity: recentAttendance.slice(-15).reverse()
  };
}

function submitLeaveHandler(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_LEAVES);
    if (!sheet) {
      initDatabase();
      sheet = ss.getSheetByName(SHEET_LEAVES);
    }

    const newId = "LV" + new Date().getTime();
    sheet.appendRow([
      newId,
      data.user_id,
      data.nama,
      data.nip || "-",
      data.mapel || "-",
      data.tipe,
      data.tgl_mulai,
      data.tgl_selesai,
      data.alasan,
      "Menunggu",
      new Date()
    ]);

    return { success: true, message: "Pengajuan izin / cuti guru berhasil diajukan" };
  } catch (err) {
    return { success: false, message: "Gagal memproses pengajuan izin: " + err.toString() };
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function getLeavesHandler(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_LEAVES);
  if (!sheet) return { success: true, list: [] };

  const rows = sheet.getDataRange().getValues();
  const list = [];

  for (let i = 1; i < rows.length; i++) {
    if (userId && String(rows[i][1]) !== String(userId)) continue;

    list.push({
      id: String(rows[i][0]),
      user_id: String(rows[i][1]),
      nama: String(rows[i][2]),
      nip: String(rows[i][3]),
      mapel: String(rows[i][4]),
      tipe: String(rows[i][5]),
      tgl_mulai: rows[i][6] instanceof Date ? Utilities.formatDate(rows[i][6], "GMT+8", "yyyy-MM-dd") : String(rows[i][6]).trim().replace(/^'/, ""),
      tgl_selesai: rows[i][7] instanceof Date ? Utilities.formatDate(rows[i][7], "GMT+8", "yyyy-MM-dd") : String(rows[i][7]).trim().replace(/^'/, ""),
      alasan: String(rows[i][8]),
      status: String(rows[i][9]),
      created_at: rows[i][10]
    });
  }

  list.sort(function(a, b) {
    return b.id > a.id ? 1 : -1;
  });
  return { success: true, leaves: list, list: list };
}

function updateLeaveStatusHandler(id, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_LEAVES);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i + 1, 10).setValue(status);
      return { success: true, message: "Status izin/cuti berhasil diperbarui menjadi: " + status };
    }
  }

  return { success: false, message: "Data pengajuan tidak ditemukan" };
}

function getUsersHandler(role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return { success: true, list: [] };

  const rows = sheet.getDataRange().getValues();
  const list = [];

  for (let i = 1; i < rows.length; i++) {
    if (role && String(rows[i][4]) !== String(role)) continue;

    list.push({
      id: String(rows[i][0]),
      username: "'" + String(rows[i][1]).replace(/^'/, ""),
      nama: String(rows[i][3]),
      role: String(rows[i][4]),
      nip: String(rows[i][5]).replace(/^'/, ""),
      jabatan: String(rows[i][6]),
      mapel: String(rows[i][7]),
      email: String(rows[i][8]),
      no_hp: String(rows[i][9]),
      status: String(rows[i][10]),
      foto_url: String(rows[i][12] || "")
    });
  }

  return { success: true, users: list, list: list };
}

/**
 * Helper untuk mengunggah Base64 Image ke Google Drive
 * Menyimpan file ke folder "FOTO_GURU_ABSENSI" dan mengembalikan direct URL Google CDN
 */
function uploadBase64ToDrive(base64Data, fileNamePrefix) {
  try {
    if (!base64Data || typeof base64Data !== "string") return "";

    // Jika sudah berupa link HTTP biasa, kembalikan langsung
    if (base64Data.indexOf("http://") === 0 || base64Data.indexOf("https://") === 0) {
      return base64Data;
    }

    let contentType = "image/jpeg";
    let pureBase64 = base64Data;

    if (base64Data.indexOf(";base64,") !== -1) {
      const parts = base64Data.split(";base64,");
      contentType = parts[0].replace("data:", "") || "image/jpeg";
      pureBase64 = parts[1];
    }

    const bytes = Utilities.base64Decode(pureBase64);
    const ext = contentType.indexOf("png") !== -1 ? "png" : contentType.indexOf("webp") !== -1 ? "webp" : "jpg";
    const cleanName = (fileNamePrefix || "guru_" + new Date().getTime()).replace(/[^a-zA-Z0-9_-]/g, "_") + "_" + new Date().getTime() + "." + ext;
    const blob = Utilities.newBlob(bytes, contentType, cleanName);

    // Dapatkan atau buat folder di Google Drive
    const FOLDER_NAME = "FOTO_GURU_ABSENSI";
    let folder;
    const folderIter = DriveApp.getFoldersByName(FOLDER_NAME);
    if (folderIter.hasNext()) {
      folder = folderIter.next();
    } else {
      folder = DriveApp.createFolder(FOLDER_NAME);
    }

    // Set permission agar foto bisa diakses di web
    try {
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    const file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    const fileId = file.getId();
    // Return direct image link Google CDN
    return "https://lh3.googleusercontent.com/d/" + fileId;
  } catch (err) {
    Logger.log("Gagal upload gambar ke Google Drive: " + err.toString());
    return "";
  }
}

function saveUserHandler(raw) {
  const data = (raw && raw.user) ? raw.user : (raw || {});
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();

  // Olah foto: jika ada input upload Base64, simpan ke Google Drive
  let finalFotoUrl = data.foto_url || "";
  const rawFoto = data.foto || data.foto_base64 || data.foto_url;
  if (rawFoto && typeof rawFoto === "string") {
    if (rawFoto.indexOf("data:image") === 0) {
      const nipTag = data.nip || data.username || "guru";
      const uploadedDriveUrl = uploadBase64ToDrive(rawFoto, "foto_" + nipTag);
      if (uploadedDriveUrl) {
        finalFotoUrl = uploadedDriveUrl;
      }
    } else if (rawFoto.indexOf("http") === 0) {
      finalFotoUrl = rawFoto;
    }
  }

  if (data.id) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(data.id)) {
        if (data.username) sheet.getRange(i + 1, 2).setValue("'" + String(data.username).replace(/^'/, ""));
        if (data.password) sheet.getRange(i + 1, 3).setValue(String(data.password));
        if (data.nama) sheet.getRange(i + 1, 4).setValue(data.nama);
        if (data.role) sheet.getRange(i + 1, 5).setValue(data.role);
        if (data.nip) sheet.getRange(i + 1, 6).setValue("'" + String(data.nip).replace(/^'/, ""));
        if (data.jabatan) sheet.getRange(i + 1, 7).setValue(data.jabatan);
        if (data.mapel) sheet.getRange(i + 1, 8).setValue(data.mapel);
        if (data.email) sheet.getRange(i + 1, 9).setValue(data.email);
        if (data.no_hp) sheet.getRange(i + 1, 10).setValue("'" + String(data.no_hp).replace(/^'/, ""));
        if (data.status) sheet.getRange(i + 1, 11).setValue(data.status);
        if (finalFotoUrl) {
          sheet.getRange(i + 1, 13).setValue(finalFotoUrl);
        }
        return { success: true, message: "Data guru berhasil diperbarui", foto_url: finalFotoUrl };
      }
    }
    return { success: false, message: "Data guru tidak ditemukan" };
  } else {
    const newId = "U" + Math.floor(1000 + Math.random() * 9000);
    const nipVal = String(data.nip || data.username || "").replace(/^'/, "");
    sheet.appendRow([
      newId,
      "'" + nipVal,
      data.password || "guru123",
      data.nama,
      data.role || "guru",
      "'" + nipVal,
      data.jabatan || "Guru Pengajar",
      data.mapel || "-",
      data.email || "-",
      "'" + String(data.no_hp || "-").replace(/^'/, ""),
      data.status || "aktif",
      new Date(),
      finalFotoUrl || ""
    ]);
    return { success: true, message: "Guru baru berhasil didaftarkan", id: newId, foto_url: finalFotoUrl };
  }
}

function deleteUserHandler(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Data guru berhasil dihapus" };
    }
  }

  return { success: false, message: "Guru tidak ditemukan" };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================= MODUL NOTIFIKASI TELEGRAM ================= //

/**
 * Mengirim pesan dengan format HTML ke Telegram Bot
 */
function sendTelegramMessage(text, customChatId) {
  try {
    const settingsRes = getSettingsHandler();
    const settings = settingsRes.settings || {};
    const botToken = settings.telegram_bot_token;
    const chatId = customChatId || settings.telegram_chat_id;

    if (!botToken || !chatId) {
      Logger.log("Telegram Bot Token atau Chat ID belum disetel di Pengaturan.");
      return { success: false, message: "Bot Token atau Chat ID belum disetel di pengaturan." };
    }

    const url = "https://api.telegram.org/bot" + botToken.trim() + "/sendMessage";
    const payload = {
      chat_id: String(chatId).trim(),
      text: text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(url, options);
    const resJson = JSON.parse(res.getContentText());
    if (resJson.ok) {
      return { success: true, message: "Notifikasi Telegram berhasil dikirim!", data: resJson.result };
    } else {
      return { success: false, message: "Gagal dari Telegram: " + (resJson.description || "Unknown error") };
    }
  } catch (err) {
    Logger.log("Error sendTelegramMessage: " + err.toString());
    return { success: false, message: "Error pengiriman Telegram: " + err.toString() };
  }
}

/**
 * Uji coba kirim pesan dari dashboard pengaturan admin
 */
function testTelegramHandler(customMsg) {
  const settingsRes = getSettingsHandler();
  const settings = settingsRes.settings || {};
  if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
    return {
      success: false,
      message: "Bot Token dan Chat ID Grup wajib diisi terlebih dahulu!"
    };
  }

  const schoolName = settings.nama_sekolah || "Sistem Absensi Guru";
  const nowStr = Utilities.formatDate(new Date(), "GMT+8", "dd-MM-yyyy HH:mm:ss");
  const msg = customMsg ||
    "🔔 <b>UJI COBA NOTIFIKASI TELEGRAM BERHASIL!</b>\n" +
    "━━━━━━━━━━━━━━━━━━━━━━\n" +
    "🏫 <b>" + schoolName + "</b>\n" +
    "Sistem Absensi Guru sukses terhubung ke grup Telegram ini.\n" +
    "⏱️ <i>Waktu Server: " + nowStr + " WITA</i>\n\n" +
    "Pengingat jadwal mengajar otomatis <b>5 menit sebelum kelas dimulai</b> siap aktif! 🚀\n" +
    "━━━━━━━━━━━━━━━━━━━━━━";

  return sendTelegramMessage(msg);
}

/**
 * Pengecekan Jadwal Mengajar Otomatis (Dijalankan via Trigger setiap 5 menit)
 * Mencari guru yang akan mengajar 1 - 7 menit ke depan dan mengirim pesan ke grup Telegram.
 */
function checkUpcomingClassesAndRemind() {
  try {
    const settingsRes = getSettingsHandler();
    const settings = settingsRes.settings || {};

    const isAktif = String(settings.telegram_notif_aktif).toLowerCase() === "true" || settings.telegram_notif_aktif === true;
    if (!isAktif) {
      Logger.log("Pengingat jadwal Telegram dinonaktifkan di pengaturan.");
      return { success: false, message: "Pengingat Telegram dinonaktifkan di pengaturan." };
    }

    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      Logger.log("Token Bot atau Chat ID belum disetel.");
      return { success: false, message: "Token Bot atau Chat ID belum disetel." };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tz = ss.getSpreadsheetTimeZone() || "GMT+8";

    const now = new Date();
    const todayStr = Utilities.formatDate(now, tz, "yyyy-MM-dd");
    const currentTimeStr = Utilities.formatDate(now, tz, "HH:mm");
    const currentMinutes = parseGasMinutes(currentTimeStr);

    const dayNum = Number(Utilities.formatDate(now, tz, "u"));
    const indoDays = { 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu", 7: "Minggu" };
    const currentDay = indoDays[dayNum] || getDayNameIndo(now);

    if (currentMinutes === null) {
      return { success: false, message: "Format waktu saat ini tidak valid." };
    }

    const sheetSch = ss.getSheetByName(SHEET_SCHEDULES);
    if (!sheetSch) {
      return { success: false, message: "Sheet JADWAL_PELAJARAN tidak ditemukan." };
    }

    const schRows = sheetSch.getDataRange().getValues();
    const schDisplayRows = sheetSch.getDataRange().getDisplayValues();
    const cache = PropertiesService.getScriptProperties();
    let webUrl = settings.web_url || "https://sistemabsensiguru.vercel.app";
    if (!webUrl || webUrl.indexOf("absensi-sekolah.vercel.app") !== -1) {
      webUrl = "https://sistemabsensiguru.vercel.app";
    }

    let remindedCount = 0;
    const details = [];

    Logger.log("=== PENGECEKAN JADWAL MENGAJAR ===");
    Logger.log("Timezone Spreadsheet: " + tz);
    Logger.log("Hari: " + currentDay + " | Waktu Sekarang: " + currentTimeStr + " | Tanggal: " + todayStr);
    Logger.log("Total jadwal di database: " + (schRows.length - 1));

    for (let i = 1; i < schRows.length; i++) {
      const row = schRows[i];
      const dispRow = schDisplayRows[i];
      const jId = String(row[0] || "");
      const jNamaGuru = String(row[2] || "");
      const jMapel = String(row[4] || "");
      const jKelas = String(row[5] || "");
      const jHari = String(dispRow[6] || row[6] || "").trim();
      const jJamKe = String(row[7] || "");

      // Ambil jam mulai & selesai langsung dari teks tampilan cell agar akurat
      let jJamMulai = String(dispRow[8] || "").trim();
      if (!jJamMulai || !jJamMulai.includes(":")) {
        jJamMulai = formatGasTime(row[8]);
      }
      let jJamSelesai = String(dispRow[9] || "").trim();
      if (!jJamSelesai || !jJamSelesai.includes(":")) {
        jJamSelesai = formatGasTime(row[9]);
      }
      const jRuangan = String(row[10] || "-");

      // Cek apakah hari mengajar sesuai hari ini
      if (jHari.toLowerCase() !== currentDay.toLowerCase()) {
        continue;
      }

      const startMinutes = parseGasMinutes(jJamMulai);
      if (startMinutes === null) {
        Logger.log("Jadwal [" + jId + "] jam mulai '" + jJamMulai + "' gagal diparse.");
        continue;
      }

      // Hitung selisih waktu: berapa menit lagi kelas dimulai
      const diffMinutes = startMinutes - currentMinutes;

      Logger.log("Jadwal [" + jId + "] " + jNamaGuru + " (" + jKelas + " - " + jMapel + ") Mulai: " + jJamMulai + " | Selisih: " + diffMinutes + " menit");

      // Rentang toleransi: -2 s/d 10 menit sebelum jam mulai
      // Toleransi -2 s/d 10 menit mencegah pesan terlewat jika trigger server Google terlambat 1-2 menit
      if (diffMinutes >= -2 && diffMinutes <= 10) {
        const cacheKey = "REMIND_" + jId + "_" + todayStr;
        if (cache.getProperty(cacheKey)) {
          Logger.log("-> Jadwal [" + jId + "] sudah pernah diingatkan hari ini (" + cache.getProperty(cacheKey) + "). Lewati.");
          continue;
        }

        const waktuKeterangan = diffMinutes > 0 ? (diffMinutes + " MENIT LAGI DIMULAI") : "SEGERA / SEDANG DIMULAI";
        const text =
          "⏰ <b>PENGINGAT KELAS (" + waktuKeterangan + ")</b>\n" +
          "━━━━━━━━━━━━━━━━━━━━━━\n" +
          "👨‍🏫 <b>" + jNamaGuru + "</b>\n" +
          "📚 <b>Mata Pelajaran:</b> " + jMapel + "\n" +
          "🏫 <b>Kelas:</b> " + jKelas + " (<i>" + jRuangan + "</i>)\n" +
          "⏱️ <b>Jam:</b> " + jJamMulai + " - " + jJamSelesai + " (" + jJamKe + ")\n" +
          "━━━━━━━━━━━━━━━━━━━━━━\n" +
          "📌 <i>Bapak/Ibu Guru dimohon bersiap memasuki ruang kelas dan melakukan presensi.</i>\n\n" +
          "👉 <a href=\"" + webUrl + "\">Buka Web Presensi Guru</a>";

        const sendRes = sendTelegramMessage(text);
        if (sendRes.success) {
          cache.setProperty(cacheKey, "SENT_" + currentTimeStr);
          remindedCount++;
          details.push(jNamaGuru + " (" + jKelas + " - " + jMapel + ")");
          Logger.log("-> Pengingat Telegram BERHASIL DIKIRIM untuk " + jNamaGuru);
        } else {
          Logger.log("-> GAGAL kirim ke Telegram: " + sendRes.message);
        }
      }
    }

    Logger.log("Hasil akhir: " + remindedCount + " pengingat terkirim.");

    return {
      success: true,
      message: "Pengecekan selesai. Notifikasi terkirim: " + remindedCount,
      count: remindedCount,
      details: details
    };
  } catch (err) {
    Logger.log("Error checkUpcomingClassesAndRemind: " + err.toString());
    return { success: false, message: "Error sistem: " + err.toString() };
  }
}

/**
 * Pasang Trigger Google Apps Script Otomatis Setiap 5 Menit
 * Sekaligus mengirim pesan konfirmasi langsung ke Telegram saat berhasil dipasang.
 */
function setupTelegramTrigger() {
  removeTelegramTrigger(); // Hapus trigger lama agar tidak menumpuk
  ScriptApp.newTrigger("checkUpcomingClassesAndRemind")
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log("Trigger checkUpcomingClassesAndRemind berhasil dipasang setiap 5 menit.");

  // Kirim notifikasi konfirmasi langsung ke Telegram
  const confirmMsg =
    "🤖 <b>TRIGGER OTOMATIS BERHASIL DIAKTIFKAN!</b>\n" +
    "━━━━━━━━━━━━━━━━━━━━━━\n" +
    "Sistem pengingat otomatis telah aktif.\n" +
    "Sistem akan otomatis mengecek jadwal mengajar setiap 5 menit dan mengirimkan pengingat sebelum kelas dimulai.\n" +
    "━━━━━━━━━━━━━━━━━━━━━━";

  const sendRes = sendTelegramMessage(confirmMsg);
  if (sendRes.success) {
    Logger.log("Pesan konfirmasi berhasil terkirim ke Telegram!");
  } else {
    Logger.log("Catatan: Trigger aktif, namun pesan konfirmasi belum masuk ke Telegram. Penyebab: " + sendRes.message);
  }

  return {
    success: true,
    message: "Trigger pengingat 5 menit berhasil aktif dan berjalan otomatis setiap 5 menit!",
    telegramStatus: sendRes
  };
}

/**
 * Matikan Trigger Pengingat Otomatis
 */
function removeTelegramTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let count = 0;
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "checkUpcomingClassesAndRemind") {
      ScriptApp.deleteTrigger(triggers[i]);
      count++;
    }
  }
  return { success: true, message: count + " trigger pengingat berhasil dinonaktifkan." };
}
