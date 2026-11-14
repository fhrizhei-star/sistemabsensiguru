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
const SHEET_LKB = "LKB_GURU";

function onOpen() {
  initDatabase();
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu("📊 Menu Madrasah")
      .addItem("🗂️ Arsipkan & Buat Rekap Semester", "menuArsipkanDanRekapSemester")
      .addSeparator()
      .addItem("🛡️ Enkripsi Semua Password (SHA-256)", "menuEnkripsiPassword")
      .addItem("🔒 Kunci & Proteksi Sheet Database", "menuProteksiSheet")
      .addToUi();
  } catch (e) {
    Logger.log("onOpen UI skipped: " + e.toString());
  }
}

/**
 * Helper Enkripsi Keamanan Password Menggunakan SHA-256
 */
function hashPassword(passStr) {
  if (!passStr) return "";
  const s = String(passStr).trim();
  if (/^[a-f0-9]{64}$/i.test(s)) {
    return s.toLowerCase();
  }
  const rawBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  let hash = "";
  for (let i = 0; i < rawBytes.length; i++) {
    let byteVal = rawBytes[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = "0" + byteHex;
    hash += byteHex;
  }
  return hash.toLowerCase();
}

/**
 * Sanitasi Input untuk Mencegah Formula Injection di Google Sheets (=, +, -, @)
 */
function sanitizeSheetCell(val) {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  if (/^[=\+\-@]/.test(s)) {
    return "'" + s;
  }
  return s;
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
    if (headerStrs.indexOf("foto") === -1) {
      sheetAtt.getRange(1, 16).setValue("foto").setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
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
    sheetSettings.appendRow(["operator_nama", "Bpk. Hendra Gunawan, S.Kom", "Nama Operator / Tata Usaha"]);
    sheetSettings.appendRow(["operator_nip", "198001012005011001", "NIP Operator / Tata Usaha"]);
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

  // 6. Sheet LKB_GURU (Laporan Kinerja Bulanan Guru & Tenaga Kependidikan)
  let sheetLkb = ss.getSheetByName(SHEET_LKB);
  if (!sheetLkb) {
    sheetLkb = ss.insertSheet(SHEET_LKB);
    sheetLkb.appendRow([
      "id", "user_id", "nama", "nip", "mapel_jabatan", "bulan", "tahun", "judul",
      "file_name", "file_url", "file_drive_id", "file_size", "catatan", "status",
      "alasan_penolakan", "diverifikasi_oleh", "diverifikasi_pada", "created_at"
    ]);
    sheetLkb.getRange(1, 1, 1, 18).setFontWeight("bold").setBackground("#6366f1").setFontColor("#ffffff");
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
      case "getLkb":
        result = getLkbHandler(e.parameter.user_id, e.parameter.bulan, e.parameter.tahun, e.parameter.status);
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
      case "submitLkb":
        result = submitLkbHandler(data);
        break;
      case "updateLkbStatus":
        result = updateLkbStatusHandler(data.id, data.status, data.alasan_penolakan, data.diverifikasi_oleh);
        break;
      case "deleteLkb":
        result = deleteLkbHandler(data.id);
        break;
      case "saveUser":
        result = saveUserHandler(data);
        break;
      case "changePassword":
        result = changePasswordHandler(data);
        break;
      case "resetPassword":
        result = resetPasswordHandler(data);
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
  const match = s.match(/(?:^|\s|T)(\d{1,2})[:.](\d{2})(?::\d{2})?/);
  if (match) {
    const h = match[1].length === 1 ? "0" + match[1] : match[1];
    const m = match[2];
    return h + ":" + m;
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

  const range = sheet.getDataRange();
  const rows = range.getValues();
  const displayRows = range.getDisplayValues();
  const settings = {};
  for (let i = 1; i < rows.length; i++) {
    const key = rows[i][0];
    let val = rows[i][1];
    if (val instanceof Date && displayRows[i] && displayRows[i][1]) {
      val = displayRows[i][1];
    }
    if (key) settings[key] = val;
  }

  // Format jam agar selalu HH:mm
  if (settings.jam_masuk) settings.jam_masuk = formatGasTime(settings.jam_masuk);
  if (settings.jam_masuk_akhir) settings.jam_masuk_akhir = formatGasTime(settings.jam_masuk_akhir);
  if (settings.jam_pulang) settings.jam_pulang = formatGasTime(settings.jam_pulang);
  if (settings.jam_masuk_mulai) settings.jam_masuk_mulai = formatGasTime(settings.jam_masuk_mulai);
  if (settings.jam_masuk_batas) settings.jam_masuk_batas = formatGasTime(settings.jam_masuk_batas);
  if (settings.jam_pulang_mulai) settings.jam_pulang_mulai = formatGasTime(settings.jam_pulang_mulai);
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
  const inputUser = String(username).replace(/^'/, "").trim().toLowerCase();
  const inputPass = String(password).trim();
  const hashedInput = hashPassword(inputPass);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const uName = String(row[1]).replace(/^'/, "").trim();
    const uNip = String(row[5]).replace(/^'/, "").trim();
    const uPass = String(row[2]).trim();

    const isPassMatch = (uPass.toLowerCase() === hashedInput) || (uPass === inputPass);

    if ((uName.toLowerCase() === inputUser || uNip.toLowerCase() === inputUser) && isPassMatch) {
      // Auto-migrasi ke hash SHA-256 jika password di sheet masih plaintext
      if (uPass === inputPass && uPass.toLowerCase() !== hashedInput) {
        try {
          sheet.getRange(i + 1, 3).setValue(hashedInput);
        } catch (eAutoHash) {}
      }

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
        const isPegawai = data.tipe_absen === "masuk" || data.tipe_absen === "pulang" || data.jadwal_id === "MASUK" || data.jadwal_id === "PULANG";
        return {
          success: false,
          message: isPegawai
            ? "Bapak/Ibu sudah melakukan presensi " + (data.tipe_absen || data.jadwal_id).toLowerCase() + " hari ini!"
            : "Bapak/Ibu Guru sudah melakukan presensi untuk kelas ini hari ini!"
        };
      }
    }

    // Cek pembatasan jam jadwal (jika data.jam_jadwal ada dan bukan absensi pegawai)
    let finalStatus = data.status || "Hadir";
    let finalKeterangan = data.keterangan || "Tepat Waktu";

    if (data.jam_jadwal && String(data.jam_jadwal).includes("-") && data.jadwal_id !== "MASUK" && data.jadwal_id !== "PULANG") {
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

    let fotoUrl = "";
    if (data.foto) {
      if (String(data.foto).indexOf("http") === 0) {
        fotoUrl = String(data.foto);
      } else {
        fotoUrl = uploadBase64ToDrive(data.foto, "evident_" + (data.nip || data.user_id || "asn") + "_" + todayStr, "EVIDENT_PRESENSI_GURU");
      }
    }

    const newId = "ATT" + new Date().getTime();
    sheet.appendRow([
      newId,
      data.jadwal_id,
      data.user_id,
      sanitizeSheetCell(data.nama),
      data.nip ? "'" + String(data.nip).replace(/^'/, "") : "-",
      sanitizeSheetCell(data.mapel || "-"),
      sanitizeSheetCell(data.kelas || "-"),
      sanitizeSheetCell(data.hari || "-"),
      "'" + todayStr,
      sanitizeSheetCell(data.jam_jadwal || "-"),
      "'" + formatGasTime(timeNowStr),
      finalStatus,
      sanitizeSheetCell(data.koordinat || "Area Sekolah"),
      sanitizeSheetCell(finalKeterangan),
      new Date(),
      fotoUrl || data.foto || ""
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
        jam_absen: formatGasTime(rows[i][10]),
        status: String(rows[i][11]),
        koordinat: String(rows[i][12]),
        keterangan: String(rows[i][13]),
        foto: rows[i].length > 15 ? String(rows[i][15] || "") : ""
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
      jam_absen: formatGasTime(rows[i][10]),
      status: String(rows[i][11]),
      koordinat: String(rows[i][12]),
      keterangan: String(rows[i][13]),
      foto: rows[i].length > 15 ? String(rows[i][15] || "") : ""
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
      if ((userRows[i][4] === "guru" || userRows[i][4] === "pegawai") && userRows[i][10] === "aktif") {
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
      sanitizeSheetCell(data.nama),
      data.nip ? "'" + String(data.nip).replace(/^'/, "") : "-",
      sanitizeSheetCell(data.mapel || "-"),
      sanitizeSheetCell(data.tipe || "Izin"),
      sanitizeSheetCell(data.tgl_mulai),
      sanitizeSheetCell(data.tgl_selesai),
      sanitizeSheetCell(data.alasan || "-"),
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

// ================= MODUL LKB (LEMBAR / LAPORAN KINERJA BULANAN) ================= //

/**
 * Helper untuk mengunggah dokumen LKB ke Google Drive
 * Menyimpan file ke folder "DOKUMEN_LKB_GURU"
 */
function uploadLkbDocumentToDrive(base64Data, originalFileName, teacherName) {
  try {
    if (!base64Data || typeof base64Data !== "string") return null;

    if (base64Data.indexOf("http://") === 0 || base64Data.indexOf("https://") === 0) {
      return { fileUrl: base64Data, fileId: "", fileName: originalFileName || "Dokumen_LKB", fileSize: "-" };
    }

    let contentType = "application/pdf";
    let pureBase64 = base64Data;

    if (base64Data.indexOf(";base64,") !== -1) {
      const parts = base64Data.split(";base64,");
      contentType = parts[0].replace("data:", "") || "application/pdf";
      pureBase64 = parts[1];
    }

    const bytes = Utilities.base64Decode(pureBase64);
    
    // Tentukan ekstensi
    let ext = "pdf";
    if (contentType.indexOf("word") !== -1 || contentType.indexOf("officedocument.wordprocessingml") !== -1) {
      ext = "docx";
    } else if (contentType.indexOf("excel") !== -1 || contentType.indexOf("spreadsheetml") !== -1) {
      ext = "xlsx";
    } else if (contentType.indexOf("zip") !== -1) {
      ext = "zip";
    } else if (originalFileName && originalFileName.lastIndexOf(".") !== -1) {
      ext = originalFileName.split(".").pop().toLowerCase();
    }

    const cleanTeacher = (teacherName || "Guru").replace(/[^a-zA-Z0-9_-]/g, "_");
    const timestamp = Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd_HHmmss");
    const cleanOrigName = (originalFileName || ("LKB." + ext)).replace(/[^a-zA-Z0-9._-]/g, "_");
    const finalFileName = "LKB_" + cleanTeacher + "_" + timestamp + "_" + cleanOrigName;

    const blob = Utilities.newBlob(bytes, contentType, finalFileName);

    const FOLDER_NAME = "DOKUMEN_LKB_GURU";
    let folder;
    const folderIter = DriveApp.getFoldersByName(FOLDER_NAME);
    if (folderIter.hasNext()) {
      folder = folderIter.next();
    } else {
      folder = DriveApp.createFolder(FOLDER_NAME);
    }

    try {
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    const file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    const fileId = file.getId();
    const fileUrl = "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";
    
    let fileSizeStr = "-";
    if (bytes.length < 1024 * 1024) {
      fileSizeStr = (bytes.length / 1024).toFixed(1) + " KB";
    } else {
      fileSizeStr = (bytes.length / (1024 * 1024)).toFixed(2) + " MB";
    }

    return {
      fileUrl: fileUrl,
      fileId: fileId,
      fileName: finalFileName,
      fileSize: fileSizeStr
    };
  } catch (err) {
    Logger.log("Gagal upload dokumen LKB ke Google Drive: " + err.toString());
    return null;
  }
}

function submitLkbHandler(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_LKB);
    if (!sheet) {
      initDatabase();
      sheet = ss.getSheetByName(SHEET_LKB);
    }

    let fileUrl = data.file_url || "";
    let fileId = data.file_drive_id || "";
    let fileName = data.file_name || "Dokumen_LKB.pdf";
    let fileSize = data.file_size || "-";

    if (data.file_base64) {
      const uploadRes = uploadLkbDocumentToDrive(data.file_base64, data.file_name, data.nama);
      if (uploadRes) {
        fileUrl = uploadRes.fileUrl;
        fileId = uploadRes.fileId;
        fileName = uploadRes.fileName;
        fileSize = uploadRes.fileSize;
      }
    }

    // Jika mode revisi atau update LKB yang sudah ada (data.lkb_id atau data.id)
    const targetLkbId = data.lkb_id || data.id;
    if (targetLkbId) {
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(targetLkbId)) {
          if (fileUrl) {
            sheet.getRange(i + 1, 9).setValue(fileName);
            sheet.getRange(i + 1, 10).setValue(fileUrl);
            sheet.getRange(i + 1, 11).setValue(fileId);
            sheet.getRange(i + 1, 12).setValue(fileSize);
          }
          if (data.judul) sheet.getRange(i + 1, 8).setValue(data.judul);
          if (data.bulan) sheet.getRange(i + 1, 6).setValue(data.bulan);
          if (data.tahun) sheet.getRange(i + 1, 7).setValue(data.tahun);
          if (data.catatan !== undefined) sheet.getRange(i + 1, 13).setValue(data.catatan);
          
          const newStatus = data.status || "Menunggu Verifikasi";
          sheet.getRange(i + 1, 14).setValue(newStatus);
          sheet.getRange(i + 1, 15).setValue(data.alasan_penolakan || "");
          sheet.getRange(i + 1, 16).setValue(data.diverifikasi_oleh || (newStatus === "Disetujui" ? "Admin" : ""));
          sheet.getRange(i + 1, 17).setValue(newStatus === "Disetujui" ? new Date() : "");
          sheet.getRange(i + 1, 18).setValue(new Date());

          return {
            success: true,
            message: newStatus === "Disetujui" ? "Dokumen LKB berhasil disahkan admin" : "Revisi dokumen LKB berhasil diperbarui",
            id: targetLkbId,
            file_url: fileUrl
          };
        }
      }
    }

    const initialStatus = data.status || "Menunggu Verifikasi";
    const initialVerifikator = data.diverifikasi_oleh || (initialStatus === "Disetujui" ? "Admin" : "");
    const initialTglVerif = initialStatus === "Disetujui" ? new Date() : "";

    const newId = "LKB" + new Date().getTime();
    sheet.appendRow([
      newId,
      data.user_id,
      sanitizeSheetCell(data.nama),
      data.nip ? "'" + String(data.nip).replace(/^'/, "") : "-",
      sanitizeSheetCell(data.mapel_jabatan || data.mapel || "-"),
      data.bulan,
      data.tahun,
      sanitizeSheetCell(data.judul || ("LKB " + data.bulan + " " + data.tahun)),
      fileName,
      fileUrl,
      fileId,
      fileSize,
      sanitizeSheetCell(data.catatan || ""),
      initialStatus,
      sanitizeSheetCell(data.alasan_penolakan || ""), // alasan penolakan
      initialVerifikator, // diverifikasi oleh
      initialTglVerif, // diverifikasi pada
      new Date()
    ]);

    // Kirim notifikasi Telegram ke grup jika aktif
    try {
      const msg = "📑 <b>DOKUMEN LKB BARU DIUNGGAH</b>\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "👤 <b>Guru:</b> " + (data.nama || "-") + "\n" +
        "🏷️ <b>NIP:</b> " + (data.nip || "-") + "\n" +
        "📅 <b>Periode:</b> " + data.bulan + " " + data.tahun + "\n" +
        "📄 <b>Judul:</b> " + (data.judul || fileName) + "\n" +
        "⏳ <b>Status:</b> Menunggu Verifikasi Admin\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "Silakan buka portal admin untuk memeriksa dokumen.";
      sendTelegramMessage(msg);
    } catch (eTel) {}

    return {
      success: true,
      message: "Dokumen LKB berhasil diunggah dan disimpan ke server",
      id: newId,
      file_url: fileUrl
    };
  } catch (err) {
    return { success: false, message: "Gagal memproses unggah LKB: " + err.toString() };
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function getLkbHandler(userId, bulan, tahun, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_LKB);
  if (!sheet) return { success: true, list: [], lkb: [] };

  const rows = sheet.getDataRange().getValues();
  const list = [];

  for (let i = 1; i < rows.length; i++) {
    const rowUserId = String(rows[i][1]);
    const rowBulan = String(rows[i][5]);
    const rowTahun = String(rows[i][6]);
    const rowStatus = String(rows[i][13]);

    if (userId && rowUserId !== String(userId)) continue;
    if (bulan && bulan !== "Semua" && rowBulan.toLowerCase() !== String(bulan).toLowerCase()) continue;
    if (tahun && tahun !== "Semua" && rowTahun !== String(tahun)) continue;
    if (status && status !== "Semua" && rowStatus !== String(status)) continue;

    const rowTglVerif = rows[i][16];
    const rowTglUpload = rows[i][17];

    list.push({
      id: String(rows[i][0]),
      user_id: rowUserId,
      nama: String(rows[i][2]),
      nip: String(rows[i][3]).replace(/^'/, ""),
      mapel_jabatan: String(rows[i][4]),
      bulan: rowBulan,
      tahun: rowTahun,
      judul: String(rows[i][7]),
      file_name: String(rows[i][8]),
      file_url: String(rows[i][9]),
      file_drive_id: String(rows[i][10]),
      file_size: String(rows[i][11]),
      catatan: String(rows[i][12]),
      status: rowStatus || "Menunggu Verifikasi",
      alasan_penolakan: String(rows[i][14] || ""),
      diverifikasi_oleh: String(rows[i][15] || ""),
      diverifikasi_pada: rowTglVerif ? (rowTglVerif instanceof Date ? Utilities.formatDate(rowTglVerif, "GMT+8", "yyyy-MM-dd HH:mm") : String(rowTglVerif)) : "",
      created_at: rowTglUpload ? (rowTglUpload instanceof Date ? Utilities.formatDate(rowTglUpload, "GMT+8", "yyyy-MM-dd HH:mm") : String(rowTglUpload)) : ""
    });
  }

  list.sort(function(a, b) {
    return b.id > a.id ? 1 : -1;
  });

  return { success: true, list: list, lkb: list };
}

function updateLkbStatusHandler(id, status, alasanPenolakan, diverifikasiOleh) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_LKB);
  if (!sheet) return { success: false, message: "Sheet LKB tidak ditemukan" };

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i + 1, 14).setValue(status);
      sheet.getRange(i + 1, 15).setValue(alasanPenolakan || "");
      sheet.getRange(i + 1, 16).setValue(diverifikasiOleh || "Admin");
      sheet.getRange(i + 1, 17).setValue(new Date());

      const namaGuru = String(rows[i][2]);
      const bulanLkb = String(rows[i][5]);
      const tahunLkb = String(rows[i][6]);

      // Kirim notifikasi status Telegram
      try {
        const statusIcon = status === "Disetujui" ? "✅" : "❌";
        let msg = statusIcon + " <b>HASIL VERIFIKASI DOKUMEN LKB</b>\n" +
          "━━━━━━━━━━━━━━━━━━━━━━\n" +
          "👤 <b>Guru:</b> " + namaGuru + "\n" +
          "📅 <b>Periode:</b> " + bulanLkb + " " + tahunLkb + "\n" +
          "📌 <b>Status:</b> " + status + "\n";
        if (status === "Ditolak" && alasanPenolakan) {
          msg += "⚠️ <b>Catatan Perbaikan:</b> " + alasanPenolakan + "\n";
        }
        msg += "━━━━━━━━━━━━━━━━━━━━━━";
        sendTelegramMessage(msg);
      } catch (eTel) {}

      return {
        success: true,
        message: "Status LKB berhasil diperbarui menjadi: " + status
      };
    }
  }

  return { success: false, message: "Data pengajuan LKB tidak ditemukan" };
}

function deleteLkbHandler(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_LKB);
  if (!sheet) return { success: false, message: "Sheet LKB tidak ditemukan" };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      const fileId = String(rows[i][10]);
      if (fileId) {
        try {
          DriveApp.getFileById(fileId).setTrashed(true);
        } catch (e) {}
      }
      sheet.deleteRow(i + 1);
      return { success: true, message: "Dokumen LKB berhasil dihapus" };
    }
  }
  return { success: false, message: "Data LKB tidak ditemukan" };
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
      foto_url: String(rows[i][12] || ""),
      satker: String(rows[i][13] || "PENDIS"),
      satuan_kerja: String(rows[i][13] || "PENDIS")
    });
  }

  return { success: true, users: list, list: list };
}

/**
 * Helper untuk mengunggah Base64 Image ke Google Drive
 * Menyimpan file ke folder "FOTO_GURU_ABSENSI" dan mengembalikan direct URL Google CDN
 */
function uploadBase64ToDrive(base64Data, fileNamePrefix, customFolderName) {
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
    const FOLDER_NAME = customFolderName || "FOTO_GURU_ABSENSI";
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
        if (data.password) sheet.getRange(i + 1, 3).setValue(hashPassword(data.password));
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
        if (data.satker || data.satuan_kerja) {
          sheet.getRange(i + 1, 14).setValue(data.satker || data.satuan_kerja);
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
      hashPassword(data.password || "guru123"),
      sanitizeSheetCell(data.nama),
      data.role || "guru",
      "'" + nipVal,
      sanitizeSheetCell(data.jabatan || "Guru Pengajar"),
      sanitizeSheetCell(data.mapel || "-"),
      sanitizeSheetCell(data.email || "-"),
      "'" + String(data.no_hp || "-").replace(/^'/, ""),
      data.status || "aktif",
      new Date(),
      finalFotoUrl || "",
      sanitizeSheetCell(data.satker || data.satuan_kerja || "PENDIS")
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

function changePasswordHandler(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return { success: false, message: "Database pengguna tidak ditemukan" };

  const userId = data.id || data.user_id;
  const newPass = String(data.password || data.new_password || "").trim();

  if (!userId || !newPass) {
    return { success: false, message: "ID pengguna dan password baru wajib diisi" };
  }

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(userId)) {
      sheet.getRange(i + 1, 3).setValue(hashPassword(newPass));
      return { success: true, message: "Password berhasil diperbarui" };
    }
  }

  return { success: false, message: "Pengguna tidak ditemukan" };
}

function resetPasswordHandler(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(SHEET_USERS);
  }

  const inputIdentifier = String(data.identifier || data.username || data.nip || "").replace(/^'/, "").trim().toLowerCase();
  let inputHp = String(data.no_hp || data.phone || "").replace(/[^0-9]/g, "");
  if (inputHp.indexOf("62") === 0) inputHp = "0" + inputHp.slice(2);

  if (!inputIdentifier || !inputHp) {
    return { success: false, message: "Harap masukkan NIP/Username dan Nomor HP yang terdaftar!" };
  }

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const uName = String(row[1]).replace(/^'/, "").trim().toLowerCase();
    const uNip = String(row[5]).replace(/^'/, "").trim().toLowerCase();
    
    let rawDbHp = String(row[9]).replace(/^'/, "").replace(/[^0-9]/g, "");
    if (rawDbHp.indexOf("62") === 0) rawDbHp = "0" + rawDbHp.slice(2);

    if ((uName === inputIdentifier || uNip === inputIdentifier) && rawDbHp && rawDbHp === inputHp) {
      if (data.verify_only) {
        return {
          success: true,
          message: "Identitas terverifikasi",
          user: {
            id: String(row[0]),
            nama: String(row[3]),
            nip: String(row[5]).replace(/^'/, ""),
            username: String(row[1]).replace(/^'/, "")
          }
        };
      }

      const newPass = String(data.new_password || data.password || "").trim();
      if (!newPass || newPass.length < 4) {
        return { success: false, message: "Kata sandi baru minimal terdiri dari 4 karakter!" };
      }

      sheet.getRange(i + 1, 3).setValue(hashPassword(newPass));
      return {
        success: true,
        message: "Kata sandi berhasil diperbarui! Silakan login dengan kata sandi baru Anda."
      };
    }
  }

  return {
    success: false,
    message: "Data tidak ditemukan! Pastikan NIP dan Nomor HP sesuai dengan yang terdaftar di sekolah."
  };
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

// ====================================================================
// MODUL MENU MADRASAH: ARSIP SEMESTER, PROTEKSI SHEET & ENKRIPSI
// ====================================================================

/**
 * 🗂️ Arsipkan Data Presensi Semester & Buat Lembar Rekapitulasi Otomatis
 * Memindahkan data dari sheet ABSENSI_GURU ke sheet baru ARSIP_...
 * dan membuat tabel statistik ringkas di sheet REKAP_..., kemudian
 * mengosongkan ABSENSI_GURU sehingga database tetap cepat (<300ms).
 */
function menuArsipkanDanRekapSemester() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    Logger.log("UI context tidak tersedia");
    return;
  }

  const sheetAtt = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheetAtt) {
    ui.alert("Peringatan", "Sheet '" + SHEET_ATTENDANCE + "' tidak ditemukan di spreadsheet ini!", ui.ButtonSet.OK);
    return;
  }

  const lastRow = sheetAtt.getLastRow();
  if (lastRow <= 1) {
    ui.alert(
      "Data Presensi Kosong",
      "Tidak ada rekaman presensi aktif di sheet '" + SHEET_ATTENDANCE + "' untuk diarsipkan.",
      ui.ButtonSet.OK
    );
    return;
  }

  const promptRes = ui.prompt(
    "Arsip & Rekapitulasi Semester",
    "Masukkan nama/label semester yang ingin diarsipkan:\n(Contoh: Semester Ganjil 2026/2027 atau Semester 1 2026)",
    ui.ButtonSet.OK_CANCEL
  );

  if (promptRes.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const rawSemLabel = promptRes.getResponseText().trim();
  const semLabel = rawSemLabel || ("Semester_" + Utilities.formatDate(new Date(), "GMT+8", "yyyy_MM"));
  const cleanSemName = semLabel.replace(/[\/\\?*:[\]]/g, "_").trim();

  const totalRecords = lastRow - 1;
  const confirm = ui.alert(
    "Konfirmasi Pengarsipan Semester",
    "Ditemukan " + totalRecords + " baris data presensi di sheet '" + SHEET_ATTENDANCE + "'.\n\n" +
    "Sistem akan melakukan 3 tindakan otomatis:\n" +
    "1. Membuat sheet arsip: 'ARSIP_" + cleanSemName + "' (menyimpan seluruh rekaman detail).\n" +
    "2. Membuat sheet rekap: 'REKAP_" + cleanSemName + "' (menghitung total sesi, tepat waktu, terlambat, izin & persentase tiap guru).\n" +
    "3. Mengosongkan data aktif di sheet '" + SHEET_ATTENDANCE + "' agar sistem tetap enteng dan cepat.\n\n" +
    "Lanjutkan pengarsipan?",
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  // 1. Salin seluruh data ke Sheet Arsip Baru
  let arsipSheetName = "ARSIP_" + cleanSemName;
  if (ss.getSheetByName(arsipSheetName)) {
    arsipSheetName += "_" + Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd_HHmmss");
  }

  const sheetArsip = ss.insertSheet(arsipSheetName);
  const sourceRange = sheetAtt.getDataRange();
  sourceRange.copyTo(sheetArsip.getRange(1, 1));

  // Format header sheet arsip
  if (sheetArsip.getLastColumn() > 0) {
    sheetArsip.getRange(1, 1, 1, sheetArsip.getLastColumn())
      .setBackground("#1e293b")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheetArsip.setFrozenRows(1);
  }

  // 2. Olah Data Rekapitulasi Per Guru
  const attData = sourceRange.getValues();
  const teacherMap = {};
  const teacherList = [];

  // Ambil daftar guru dari sheet GURU_STAF
  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (sheetUsers) {
    const uRows = sheetUsers.getDataRange().getValues();
    for (let u = 1; u < uRows.length; u++) {
      const uId = String(uRows[u][0]);
      const uNama = String(uRows[u][3] || "-");
      const uNip = String(uRows[u][5] || "-").replace(/^'/, "");
      const uJabatan = String(uRows[u][6] || "-");
      const uMapel = String(uRows[u][7] || "-");
      const uRole = String(uRows[u][4] || "guru");

      if (uRole !== "admin") {
        const item = {
          id: uId,
          nama: uNama,
          nip: uNip,
          jabatan: uJabatan,
          mapel: uMapel,
          totalSesi: 0,
          tepatWaktu: 0,
          terlambat: 0,
          izin: 0,
          sakit: 0,
          totalHadir: 0
        };
        teacherMap[uId] = item;
        if (uNip && uNip !== "-") teacherMap[uNip] = item;
        teacherList.push(item);
      }
    }
  }

  // Iterasi data presensi
  for (let r = 1; r < attData.length; r++) {
    const row = attData[r];
    const uId = String(row[2]);
    const uNip = String(row[4] || "").replace(/^'/, "");
    const uNama = String(row[3] || "Guru");
    const uMapel = String(row[5] || "-");

    let teacher = teacherMap[uId] || (uNip ? teacherMap[uNip] : null);
    if (!teacher) {
      teacher = {
        id: uId,
        nama: uNama,
        nip: uNip || "-",
        jabatan: "Guru Pengajar",
        mapel: uMapel,
        totalSesi: 0,
        tepatWaktu: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        totalHadir: 0
      };
      teacherMap[uId] = teacher;
      teacherList.push(teacher);
    }

    teacher.totalSesi++;
    const st = String(row[11] || "").toLowerCase();
    const ket = String(row[13] || "").toLowerCase();

    if (st.includes("terlambat") || ket.includes("terlambat")) {
      teacher.terlambat++;
      teacher.totalHadir++;
    } else if (st.includes("izin") || ket.includes("izin")) {
      teacher.izin++;
    } else if (st.includes("sakit") || ket.includes("sakit")) {
      teacher.sakit++;
    } else {
      teacher.tepatWaktu++;
      teacher.totalHadir++;
    }
  }

  // Urutkan guru berdasarkan nama
  teacherList.sort(function(a, b) {
    return a.nama.localeCompare(b.nama);
  });

  // 3. Buat Sheet Rekapitulasi
  let rekapSheetName = "REKAP_" + cleanSemName;
  if (ss.getSheetByName(rekapSheetName)) {
    rekapSheetName += "_" + Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd_HHmmss");
  }

  const sheetRekap = ss.insertSheet(rekapSheetName);

  // Judul & Header Laporan
  sheetRekap.getRange("A1:J1").merge()
    .setValue("LAPORAN REKAPITULASI PRESENSI GURU & PEGAWAI")
    .setFontWeight("bold")
    .setFontSize(14)
    .setHorizontalAlignment("center")
    .setBackground("#064e3b")
    .setFontColor("#ffffff");

  sheetRekap.getRange("A2:J2").merge()
    .setValue("PERIODE / SEMESTER: " + semLabel.toUpperCase())
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center")
    .setBackground("#065f46")
    .setFontColor("#ffffff");

  sheetRekap.getRange("A3:J3").merge()
    .setValue("Dibuat otomatis pada: " + Utilities.formatDate(new Date(), "GMT+8", "dd MMMM yyyy HH:mm") + " WITA")
    .setFontStyle("italic")
    .setFontSize(9)
    .setHorizontalAlignment("center")
    .setBackground("#ecfdf5")
    .setFontColor("#047857");

  // Baris Header Tabel
  const headers = [
    "No", "NIP", "Nama Guru / Pegawai", "Jabatan / Tugas", "Mata Pelajaran",
    "Total Sesi", "Tepat Waktu", "Terlambat", "Izin / Sakit", "Persentase Kehadiran"
  ];
  const headerRow = 5;
  sheetRekap.getRange(headerRow, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight("bold")
    .setBackground("#047857")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  // Isi Data Rekap
  const rekapRows = [];
  let sumSesi = 0;
  let sumTepat = 0;
  let sumTerlambat = 0;
  let sumIzin = 0;

  for (let k = 0; k < teacherList.length; k++) {
    const t = teacherList[k];
    const pct = t.totalSesi > 0 ? Math.round((t.totalHadir / t.totalSesi) * 100) : 0;
    sumSesi += t.totalSesi;
    sumTepat += t.tepatWaktu;
    sumTerlambat += t.terlambat;
    sumIzin += (t.izin + t.sakit);

    rekapRows.push([
      k + 1,
      "'" + t.nip,
      t.nama,
      t.jabatan,
      t.mapel,
      t.totalSesi,
      t.tepatWaktu,
      t.terlambat,
      t.izin + t.sakit,
      pct + "%"
    ]);
  }

  if (rekapRows.length > 0) {
    sheetRekap.getRange(headerRow + 1, 1, rekapRows.length, headers.length).setValues(rekapRows);

    // Styling baris data bergantian (zebra striping)
    for (let r = 0; r < rekapRows.length; r++) {
      const bg = r % 2 === 0 ? "#ffffff" : "#f8fafc";
      sheetRekap.getRange(headerRow + 1 + r, 1, 1, headers.length).setBackground(bg);
      sheetRekap.getRange(headerRow + 1 + r, 1).setHorizontalAlignment("center"); // No
      sheetRekap.getRange(headerRow + 1 + r, 6, 1, 5).setHorizontalAlignment("center"); // Angka-angka
    }
  }

  // Baris Total di paling bawah
  const totalRowIdx = headerRow + 1 + rekapRows.length;
  const avgPct = sumSesi > 0 ? Math.round(((sumTepat + sumTerlambat) / sumSesi) * 100) : 0;
  sheetRekap.getRange(totalRowIdx, 1, 1, 5).merge()
    .setValue("TOTAL KESELURUHAN")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setBackground("#d1fae5")
    .setFontColor("#064e3b");

  sheetRekap.getRange(totalRowIdx, 6, 1, 5)
    .setValues([[sumSesi, sumTepat, sumTerlambat, sumIzin, avgPct + "%"]])
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setBackground("#d1fae5")
    .setFontColor("#064e3b");

  // Border & Freeze
  sheetRekap.getRange(headerRow, 1, rekapRows.length + 2, headers.length)
    .setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  sheetRekap.setFrozenRows(headerRow);

  // Auto resize kolom
  for (let c = 1; c <= headers.length; c++) {
    sheetRekap.autoResizeColumn(c);
  }

  // 4. Kosongkan Data Aktif di Sheet ABSENSI_GURU (Menyisakan Header Baris 1)
  if (sheetAtt.getLastRow() > 1) {
    sheetAtt.deleteRows(2, sheetAtt.getLastRow() - 1);
  }

  // 5. Notifikasi Selesai
  ui.alert(
    "Pengarsipan Semester Sukses! 🎉",
    "Rekapan semester dan pembersihan database berhasil dilakukan:\n\n" +
    "📁 1. Sheet Arsip: '" + arsipSheetName + "' (" + totalRecords + " baris data tersimpan rapi)\n" +
    "📊 2. Sheet Rekap: '" + rekapSheetName + "' (Tabel persentase kehadiran " + teacherList.length + " guru)\n" +
    "⚡ 3. Sheet 'ABSENSI_GURU' telah bersih dan siap untuk semester baru.\n\n" +
    "Kinerja sistem absensi kini kembali optimal dan sangat cepat!",
    ui.ButtonSet.OK
  );
}

/**
 * 🔒 Kunci & Pasang Proteksi Peringatan pada Sheet Penting
 * Mencegah admin/operator tanpa sengaja mengubah judul kolom atau merusak pengaturan.
 */
function menuProteksiSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    return;
  }

  const confirm = ui.alert(
    "Pasang Proteksi Database",
    "Fitur ini akan mengaktifkan 'Warning Protection' (Peringatan saat diedit) pada:\n" +
    "1. Sheet PENGATURAN (mencegah rusaknya konfigurasi token/sistem)\n" +
    "2. Baris Judul Kolom (Header) di seluruh sheet utama database\n\n" +
    "Lanjutkan proteksi database?",
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  let count = 0;

  // 1. Proteksi Sheet PENGATURAN
  const sheetSet = ss.getSheetByName(SHEET_SETTINGS);
  if (sheetSet) {
    const p = sheetSet.protect().setDescription("Proteksi Pengaturan Sistem Absensi");
    p.setWarningOnly(true);
    count++;
  }

  // 2. Proteksi Baris Header (Baris 1)
  const sheetsToProtect = [SHEET_USERS, SHEET_SCHEDULES, SHEET_ATTENDANCE, SHEET_LEAVES, SHEET_LKB];
  for (let s = 0; s < sheetsToProtect.length; s++) {
    const sh = ss.getSheetByName(sheetsToProtect[s]);
    if (sh && sh.getLastColumn() > 0) {
      const headerRange = sh.getRange(1, 1, 1, sh.getLastColumn());
      const p = headerRange.protect().setDescription("Proteksi Header " + sheetsToProtect[s]);
      p.setWarningOnly(true);
      count++;
    }
  }

  ui.alert(
    "Proteksi Berhasil Diterapkan! 🛡️",
    "Sebanyak " + count + " area database telah dilindungi peringatan.\n" +
    "Jika ada yang tidak sengaja mengubah judul kolom atau konfigurasi, Google Sheets akan menampilkan peringatan konfirmasi terlebih dahulu.",
    ui.ButtonSet.OK
  );
}

/**
 * 🛡️ Enkripsi Semua Password Akun Guru & Staf dengan SHA-256
 * Mengubah password teks biasa di sheet GURU_STAF menjadi hash SHA-256 (64 karakter hex)
 * sehingga aman dari intipan siapapun yang membuka sheet.
 */
function menuEnkripsiPassword() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    return;
  }

  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) {
    ui.alert("Sheet '" + SHEET_USERS + "' tidak ditemukan!");
    return;
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    ui.alert("Tidak ada data akun guru/staf di sheet '" + SHEET_USERS + "'.");
    return;
  }

  const confirm = ui.alert(
    "Enkripsi Password Guru (SHA-256)",
    "Fitur ini akan memeriksa seluruh akun di sheet '" + SHEET_USERS + "' dan mengenkripsi semua password yang masih berupa teks biasa (plaintext) menjadi kode acak SHA-256 (64 karakter).\n\n" +
    "Keuntungan:\n" +
    "• Password guru tidak bisa dibaca langsung oleh siapapun yang melihat spreadsheet.\n" +
    "• Login guru dan admin di web absensi tetap berjalan normal tanpa gangguan.\n\n" +
    "Jalankan proses enkripsi sekarang?",
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  let encryptedCount = 0;
  for (let i = 1; i < rows.length; i++) {
    const rawPass = String(rows[i][2] || "").trim();
    if (rawPass && !/^[a-f0-9]{64}$/i.test(rawPass)) {
      const hashed = hashPassword(rawPass);
      sheet.getRange(i + 1, 3).setValue(hashed);
      encryptedCount++;
    }
  }

  ui.alert(
    "Enkripsi Selesai! 🛡️",
    "Sebanyak " + encryptedCount + " password akun telah berhasil dienkripsi ke standar SHA-256.\n" +
    (encryptedCount === 0
      ? "Semua akun sebelumnya sudah terenkripsi dengan aman."
      : "Kini database akun di Google Sheets jauh lebih aman dan terjaga kerahasiaannya!"),
    ui.ButtonSet.OK
  );
}
