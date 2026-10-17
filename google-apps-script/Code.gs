/**
 * ====================================================================
 * SISTEM ABSENSI GURU & TENAGA PENDIDIK - BACKEND GOOGLE APPS SCRIPT
 * ====================================================================
 * Cara Penggunaan:
 * 1. Buka Google Sheets baru di https://sheets.new
 * 2. Beri nama spreadsheet, misal: "Database Absensi Guru"
 * 3. Klik menu: Extensions (Ekstensi) -> Apps Script
 * 4. Hapus kode yang ada, lalu Paste seluruh isi file ini ke editor Apps Script.
 * 5. Klik Save (ikon disket).
 * 6. Klik tombol "Deploy" (Terapkan) di kanan atas -> "New deployment" (Penerapan baru).
 * 7. Pilih tipe "Web app" (Aplikasi Web).
 * 8. Isi deskripsi: "v1.0 Absensi Guru"
 * 9. Atur "Execute as" (Jalankan sebagai): "Me" (Saya / akun Google Anda).
 * 10. Atur "Who has access" (Siapa yang memiliki akses): "Anyone" (Siapa saja).
 * 11. Klik Deploy, Berikan izin akses (Authorize access), lalu COPY "Web app URL".
 * 12. Paste URL tersebut ke menu Pengaturan di web atau file `public/js/config.js`.
 * ====================================================================
 */

const SHEET_USERS = "GURU_STAF";
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
      "id", "username", "password", "nama", "role", "nip", "jabatan", "mapel", "email", "no_hp", "status", "created_at"
    ]);
    sheetUsers.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#1e3a8a").setFontColor("#ffffff");

    // Sample data Guru & Admin
    sheetUsers.appendRow(["U001", "admin", "admin123", "Bpk. Hendra Gunawan, S.Kom", "admin", "198001012005011001", "Kepala Tata Usaha / Admin", "Manajemen Kepegawaian", "admin@sekolah.sch.id", "081234567890", "aktif", new Date()]);
    sheetUsers.appendRow(["U002", "198501152010011002", "guru123", "Drs. Bambang Sudarsono, M.Pd", "guru", "198501152010011002", "Guru Madya", "Matematika", "bambang@sekolah.sch.id", "081234567891", "aktif", new Date()]);
    sheetUsers.appendRow(["U003", "199003202015022001", "guru123", "Siti Nurhaliza, S.Pd", "guru", "199003202015022001", "Guru Pertama", "Bahasa Indonesia", "siti@sekolah.sch.id", "081234567892", "aktif", new Date()]);
    sheetUsers.appendRow(["U004", "199208142019031005", "guru123", "Ahmad Fauzi, S.Kom", "guru", "199208142019031005", "Guru Pertama", "Informatika / TIK", "fauzi@sekolah.sch.id", "081234567893", "aktif", new Date()]);
    sheetUsers.appendRow(["U005", "198811052014022003", "guru123", "Dewi Lestari, S.Pd, M.Si", "guru", "198811052014022003", "Guru Muda", "Fisika", "dewi@sekolah.sch.id", "081234567894", "aktif", new Date()]);
  }

  // 2. Sheet ABSENSI_GURU
  let sheetAtt = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheetAtt) {
    sheetAtt = ss.insertSheet(SHEET_ATTENDANCE);
    sheetAtt.appendRow([
      "id", "user_id", "nama", "nip", "mapel", "tanggal", "jam_masuk", "jam_pulang", "status", "koordinat", "foto_selfie", "keterangan", "created_at"
    ]);
    sheetAtt.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
  }

  // 3. Sheet IZIN_CUTI_GURU
  let sheetLeaves = ss.getSheetByName(SHEET_LEAVES);
  if (!sheetLeaves) {
    sheetLeaves = ss.insertSheet(SHEET_LEAVES);
    sheetLeaves.appendRow([
      "id", "user_id", "nama", "nip", "mapel", "tipe", "tgl_mulai", "tgl_selesai", "alasan", "status", "created_at"
    ]);
    sheetLeaves.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff");
  }

  // 4. Sheet PENGATURAN
  let sheetSettings = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheetSettings) {
    sheetSettings = ss.insertSheet(SHEET_SETTINGS);
    sheetSettings.appendRow(["key", "value", "deskripsi"]);
    sheetSettings.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff");

    sheetSettings.appendRow(["nama_sekolah", "SMA NEGERI 1 TELADAN", "Nama Sekolah / Instansi"]);
    sheetSettings.appendRow(["jam_masuk", "06:45", "Batas awal presensi pagi"]);
    sheetSettings.appendRow(["jam_masuk_akhir", "07:15", "Batas maksimal jam masuk tepat waktu guru"]);
    sheetSettings.appendRow(["jam_pulang", "15:30", "Batas jam boleh presensi pulang"]);
    sheetSettings.appendRow(["toleransi_menit", "15", "Toleransi keterlambatan dalam menit"]);
    sheetSettings.appendRow(["lat_sekolah", "-6.2088", "Latitude sekolah"]);
    sheetSettings.appendRow(["lng_sekolah", "106.8456", "Longitude sekolah"]);
    sheetSettings.appendRow(["radius_meter", "250", "Radius toleransi presensi dalam meter"]);
  }

  return { success: true, message: "Database Absensi Guru Google Sheets berhasil disiapkan!" };
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
        result = { success: true, message: "Google Apps Script Absensi Guru aktif!", timestamp: new Date() };
        break;
      case "getSettings":
        result = getSettingsHandler();
        break;
      case "getTodayAttendance":
        result = getTodayAttendanceHandler(e.parameter.user_id, e.parameter.tanggal);
        break;
      case "getUserAttendance":
        result = getUserAttendanceHandler(e.parameter.user_id, e.parameter.bulan, e.parameter.tahun);
        break;
      case "getAllAttendance":
        result = getAllAttendanceHandler(e.parameter.tanggal, e.parameter.mapel);
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
        result = recordAttendanceHandler(data);
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
      default:
        result = { success: false, message: "Aksi POST tidak dikenali: " + action };
    }

    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
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
    const uName = String(row[1]).trim(); // username atau NIP
    const uPass = String(row[2]).trim();

    if (uName.toLowerCase() === String(username).toLowerCase().trim() && uPass === String(password).trim()) {
      return {
        success: true,
        user: {
          id: row[0],
          username: row[1],
          nama: row[3],
          role: row[4],
          nip: row[5],
          jabatan: row[6],
          mapel: row[7],
          email: row[8],
          no_hp: row[9],
          status: row[10]
        }
      };
    }
  }

  return { success: false, message: "NIP / Username atau Password salah!" };
}

function recordAttendanceHandler(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  }

  const todayStr = data.tanggal || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  const timeNowStr = data.jam || Utilities.formatDate(new Date(), "GMT+7", "HH:mm:ss");
  const type = data.type || "masuk";

  const rows = sheet.getDataRange().getValues();
  let existingRowIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    const rowDate = rows[i][5] instanceof Date 
      ? Utilities.formatDate(rows[i][5], "GMT+7", "yyyy-MM-dd")
      : String(rows[i][5]);
    if (rows[i][1] == data.user_id && rowDate == todayStr) {
      existingRowIndex = i + 1;
      break;
    }
  }

  if (type === "masuk") {
    if (existingRowIndex !== -1) {
      return { success: false, message: "Bapak/Ibu Guru sudah melakukan presensi masuk hari ini!" };
    }

    const newId = "ATT" + new Date().getTime();
    sheet.appendRow([
      newId,
      data.user_id,
      data.nama,
      data.nip || "-",
      data.mapel || "-",
      todayStr,
      timeNowStr,
      "",
      data.status || "Hadir",
      data.koordinat || "-",
      data.foto_selfie || "",
      data.keterangan || "Presensi Masuk Guru",
      new Date()
    ]);

    return { 
      success: true, 
      message: "Presensi masuk berhasil dicatat pada " + timeNowStr,
      jam_masuk: timeNowStr
    };
  } else if (type === "pulang") {
    if (existingRowIndex === -1) {
      return { success: false, message: "Bapak/Ibu Guru belum melakukan presensi masuk hari ini!" };
    }

    const currentJamPulang = sheet.getRange(existingRowIndex, 8).getValue();
    if (currentJamPulang) {
      return { success: false, message: "Bapak/Ibu Guru sudah melakukan presensi pulang hari ini!" };
    }

    sheet.getRange(existingRowIndex, 8).setValue(timeNowStr);
    return { 
      success: true, 
      message: "Presensi pulang berhasil dicatat pada " + timeNowStr,
      jam_pulang: timeNowStr
    };
  }

  return { success: false, message: "Tipe presensi tidak valid!" };
}

function getTodayAttendanceHandler(userId, tanggal) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheet) return { success: true, data: null };

  const todayStr = tanggal || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const rowDate = rows[i][5] instanceof Date 
      ? Utilities.formatDate(rows[i][5], "GMT+7", "yyyy-MM-dd")
      : String(rows[i][5]);
    if (rows[i][1] == userId && rowDate == todayStr) {
      return {
        success: true,
        data: {
          id: rows[i][0],
          user_id: rows[i][1],
          nama: rows[i][2],
          nip: rows[i][3],
          mapel: rows[i][4],
          tanggal: rowDate,
          jam_masuk: rows[i][6],
          jam_pulang: rows[i][7],
          status: rows[i][8],
          koordinat: rows[i][9],
          foto_selfie: rows[i][10],
          keterangan: rows[i][11]
        }
      };
    }
  }

  return { success: true, data: null };
}

function getUserAttendanceHandler(userId, bulan, tahun) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheet) return { success: true, list: [] };

  const rows = sheet.getDataRange().getValues();
  const list = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] == userId) {
      const rowDate = rows[i][5] instanceof Date 
        ? Utilities.formatDate(rows[i][5], "GMT+7", "yyyy-MM-dd")
        : String(rows[i][5]);

      list.push({
        id: rows[i][0],
        user_id: rows[i][1],
        nama: rows[i][2],
        nip: rows[i][3],
        mapel: rows[i][4],
        tanggal: rowDate,
        jam_masuk: rows[i][6],
        jam_pulang: rows[i][7],
        status: rows[i][8],
        koordinat: rows[i][9],
        foto_selfie: rows[i][10],
        keterangan: rows[i][11]
      });
    }
  }

  list.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
  return { success: true, list: list };
}

function getAllAttendanceHandler(tanggal, mapel) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheet) return { success: true, list: [] };

  const rows = sheet.getDataRange().getValues();
  const list = [];

  for (let i = 1; i < rows.length; i++) {
    const rowDate = rows[i][5] instanceof Date 
      ? Utilities.formatDate(rows[i][5], "GMT+7", "yyyy-MM-dd")
      : String(rows[i][5]);

    if (tanggal && rowDate !== tanggal) continue;
    if (mapel && mapel !== "Semua" && rows[i][4] !== mapel) continue;

    list.push({
      id: rows[i][0],
      user_id: rows[i][1],
      nama: rows[i][2],
      nip: rows[i][3],
      mapel: rows[i][4],
      tanggal: rowDate,
      jam_masuk: rows[i][6],
      jam_pulang: rows[i][7],
      status: rows[i][8],
      koordinat: rows[i][9],
      foto_selfie: rows[i][10],
      keterangan: rows[i][11]
    });
  }

  list.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
  return { success: true, list: list };
}

function submitLeaveHandler(data) {
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
}

function getLeavesHandler(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_LEAVES);
  if (!sheet) return { success: true, list: [] };

  const rows = sheet.getDataRange().getValues();
  const list = [];

  for (let i = 1; i < rows.length; i++) {
    if (userId && rows[i][1] != userId) continue;

    list.push({
      id: rows[i][0],
      user_id: rows[i][1],
      nama: rows[i][2],
      nip: rows[i][3],
      mapel: rows[i][4],
      tipe: rows[i][5],
      tgl_mulai: rows[i][6] instanceof Date ? Utilities.formatDate(rows[i][6], "GMT+7", "yyyy-MM-dd") : String(rows[i][6]),
      tgl_selesai: rows[i][7] instanceof Date ? Utilities.formatDate(rows[i][7], "GMT+7", "yyyy-MM-dd") : String(rows[i][7]),
      alasan: rows[i][8],
      status: rows[i][9],
      created_at: rows[i][10]
    });
  }

  list.sort((a, b) => (b.id > a.id ? 1 : -1));
  return { success: true, list: list };
}

function updateLeaveStatusHandler(id, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_LEAVES);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
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
    if (role && rows[i][4] != role) continue;

    list.push({
      id: rows[i][0],
      username: rows[i][1],
      nama: rows[i][3],
      role: rows[i][4],
      nip: rows[i][5],
      jabatan: rows[i][6],
      mapel: rows[i][7],
      email: rows[i][8],
      no_hp: rows[i][9],
      status: rows[i][10]
    });
  }

  return { success: true, list: list };
}

function saveUserHandler(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();

  if (data.id) {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == data.id) {
        if (data.username) sheet.getRange(i + 1, 2).setValue(data.username);
        if (data.password) sheet.getRange(i + 1, 3).setValue(data.password);
        if (data.nama) sheet.getRange(i + 1, 4).setValue(data.nama);
        if (data.role) sheet.getRange(i + 1, 5).setValue(data.role);
        if (data.nip) sheet.getRange(i + 1, 6).setValue(data.nip);
        if (data.jabatan) sheet.getRange(i + 1, 7).setValue(data.jabatan);
        if (data.mapel) sheet.getRange(i + 1, 8).setValue(data.mapel);
        if (data.email) sheet.getRange(i + 1, 9).setValue(data.email);
        if (data.no_hp) sheet.getRange(i + 1, 10).setValue(data.no_hp);
        return { success: true, message: "Data guru berhasil diperbarui" };
      }
    }
    return { success: false, message: "Data guru tidak ditemukan" };
  } else {
    const newId = "U" + Math.floor(1000 + Math.random() * 9000);
    sheet.appendRow([
      newId,
      data.username || data.nip,
      data.password || "guru123",
      data.nama,
      data.role || "guru",
      data.nip || "-",
      data.jabatan || "Guru Pengajar",
      data.mapel || "-",
      data.email || "-",
      data.no_hp || "-",
      "aktif",
      new Date()
    ]);
    return { success: true, message: "Guru baru berhasil didaftarkan", id: newId };
  }
}

function deleteUserHandler(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Data guru berhasil dihapus" };
    }
  }

  return { success: false, message: "Guru tidak ditemukan" };
}

function getDashboardStatsHandler(tanggal) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const todayStr = tanggal || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");

  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  const sheetAtt = ss.getSheetByName(SHEET_ATTENDANCE);
  const sheetLeaves = ss.getSheetByName(SHEET_LEAVES);

  let totalGuru = 0;
  if (sheetUsers) {
    const userRows = sheetUsers.getDataRange().getValues();
    for (let i = 1; i < userRows.length; i++) {
      if (userRows[i][4] === "guru") totalGuru++;
    }
  }

  let hadir = 0;
  let terlambat = 0;
  const recentAttendance = [];

  if (sheetAtt) {
    const attRows = sheetAtt.getDataRange().getValues();
    for (let i = 1; i < attRows.length; i++) {
      const rowDate = attRows[i][5] instanceof Date 
        ? Utilities.formatDate(attRows[i][5], "GMT+7", "yyyy-MM-dd")
        : String(attRows[i][5]);

      if (rowDate === todayStr) {
        if (attRows[i][8] === "Hadir") hadir++;
        if (attRows[i][8] === "Terlambat") terlambat++;

        recentAttendance.push({
          id: attRows[i][0],
          nama: attRows[i][2],
          nip: attRows[i][3],
          mapel: attRows[i][4],
          jam_masuk: attRows[i][6],
          status: attRows[i][8],
          foto: attRows[i][10]
        });
      }
    }
  }

  let izin = 0;
  if (sheetLeaves) {
    const leaveRows = sheetLeaves.getDataRange().getValues();
    for (let i = 1; i < leaveRows.length; i++) {
      if (leaveRows[i][9] === "Disetujui") {
        izin++;
      }
    }
  }

  const belumAbsen = Math.max(0, totalGuru - (hadir + terlambat + izin));

  return {
    success: true,
    stats: {
      totalGuru: totalGuru,
      hadir: hadir,
      terlambat: terlambat,
      izin: izin,
      belumAbsen: belumAbsen,
      tanggal: todayStr
    },
    recentAttendance: recentAttendance.slice(-10).reverse()
  };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
