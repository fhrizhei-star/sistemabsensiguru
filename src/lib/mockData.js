/**
 * Mock Database & Initial Seed Data
 * Sistem Absensi Guru & Tenaga Pendidik Modern
 * MTsN GOWA (Production Ready)
 */

export const STORAGE_KEY = "ABSENSI_GURU_DATABASE_NEXT_V2";

export function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayDayName() {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[new Date().getDay()];
}

export const SAMPLE_EVIDENT_PHOTO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAACMCAIAAAhotZpAAACMUlEQVR4nO3cMW7UQBiA0RRQh46OnrQ0SFQcAnGG3ICWS3AXCg5FgQQdPUFrrz1r+4uf9NXrkZ+msD3/3r348lkH7273FWgySIEgBYIU6F+kl98etXuQAkEKBCkQpECQAkEKBCkQpECQAkEKBCkQpECQAkEKBCkQpECQAkEKBCkQpECQAkEKNIH089cf7R6kQJACQQoEKRCkQJACQQoEKRCkQJACQQoEKRCkQPsgvfv4abNeff+65eUgzSKZE6QdkGbabKAFaSTPjaggjecZTgVpWujN2w9zup0TpEtCM3kmqSANQBrCc5kK0iqk4ULDnc6OdAueC1SQDic0yum8SNsIDXGCBOmoSFsKrXeCtIXQUydIh9tGKzfT2ZE2E1qzmSBdcYvf//j9NEjjkZYJ/ZdnGdUCJ0gDhK5yggTplEgzheY7QYIECdIGSAseY2+KNNPpXEh2EiRIkCCtd5r5a5AgnRXJu7utkbwFf+ZI64O0BMmX2YMiOePQQ3Ja6KBIzt1BgjQIyVnwBpKpigaS+aQGkkm/BpKZ2QaS6fMGkv9xaCANpBq4HkjjqYavBNIwrdstANJCti0v93yQdFWQAkEKBCkQpECQAkEKBCkQpECQAkEKBCkQpECQAkEKBCkQpECQAkEKNIF0//pBuwcpEKRAkAJBCgQpEKRAkAJBCgQpEKRAkAJBCgQpEKRAkAJBCgQpEKRAkAJBCjSBpAMGKRCkQJACQQr0F3crwXQIhvuZAAAAAElFTkSuQmCC";

export const INITIAL_MOCK_DATA = {
  settings: {
    nama_sekolah: "MTsN GOWA",
    alamat_sekolah: "Jl. Pendidikan, Sungguminasa, Kab. Gowa",
    kota: "Kabupaten Gowa",
    npsn: "20123456",
    no_telp: "(0411) 861234",
    satuan_kerja: "PENDIS",
    kepala_sekolah: "Mansur Patiroi, SE., MM.",
    nip_kepsek: "196907031992031001",
    operator_nama: "",
    operator_nip: "",
    toleransi_menit: 15,
    jam_masuk_mulai: "06:30",
    jam_masuk_batas: "07:15",
    jam_pulang_mulai: "15:00",
    lat_sekolah: -5.2012,
    lng_sekolah: 119.4817,
    radius_meter: 250,
    google_script_url: "https://script.google.com/macros/s/AKfycby0DdiBERSda-XSxlvdtQrr9h9JILecQhDWsrctfZu514jP-NRo3v6T6LrSKL39PrY35Q/exec",
    telegram_bot_token: "",
    telegram_chat_id: "",
    telegram_notif_aktif: true,
    telegram_notif_absen: true,
    web_url: "https://sistemabsensiguru.vercel.app"
  },
  users: [],
  schedules: [],
  attendance: [],
  leaves: [],
  lkb: [],
  holidays: []
};

export const MockDB = {
  load() {
    if (typeof window === "undefined") {
      return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.save(INITIAL_MOCK_DATA);
      return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    }
    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data.schedules) || !Array.isArray(data.users)) {
        this.save(INITIAL_MOCK_DATA);
        return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
      }

      // Bersihkan seluruh data demo jika sebelumnya tersimpan di cache localStorage browser
      const dummyUserIds = new Set(["U001", "U002", "U003", "U004", "U005", "U006", "U007", "U008"]);
      if (Array.isArray(data.users)) {
        data.users = data.users.filter(
          (u) => !dummyUserIds.has(u.id) && !u.nama?.includes("Bambang Sudarsono") && !u.nama?.includes("Siti Nurhaliza")
        );
      }
      if (Array.isArray(data.schedules)) {
        data.schedules = data.schedules.filter(
          (s) => !s.id?.startsWith("JAD1") && !s.id?.startsWith("JAD2") && !s.id?.startsWith("JAD3") && !s.id?.startsWith("JAD4") && !s.id?.startsWith("JAD5") && !s.id?.startsWith("JAD6")
        );
      }
      if (Array.isArray(data.attendance)) {
        data.attendance = data.attendance.filter(
          (a) => !a.id?.startsWith("ATT_ZUL_") && a.user_id !== "U002" && a.user_id !== "U003"
        );
      }
      if (Array.isArray(data.leaves)) {
        data.leaves = data.leaves.filter((l) => l.id !== "LV2001" && l.id !== "LV2002");
      }
      if (Array.isArray(data.lkb)) {
        data.lkb = data.lkb.filter(
          (l) => l.id !== "LKB1001" && l.id !== "LKB1002" && l.id !== "LKB_ZUL_OKT" && l.id !== "LKB_RAHMA_OKT"
        );
      }
      if (Array.isArray(data.holidays)) {
        data.holidays = data.holidays.filter(
          (h) => h.id !== "HOL-001" && h.id !== "HOL-002" && h.id !== "HOL-003"
        );
      }

      if (
        data.settings &&
        (!data.settings.google_script_url ||
          data.settings.google_script_url.includes("AKfycbwerFB3CM8t3nf2YxmyTq-MWwr539yp7_ojIYDZmO_XAZv4GkJXBrfuNRaj3h3QWHZxWw") ||
          data.settings.google_script_url.includes("GANTI_DENGAN_URL"))
      ) {
        data.settings.google_script_url = INITIAL_MOCK_DATA.settings.google_script_url;
      }

      this.save(data);
      return data;
    } catch (e) {
      this.save(INITIAL_MOCK_DATA);
      return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    }
  },

  save(data) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  },

  reset() {
    this.save(INITIAL_MOCK_DATA);
    return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
  }
};
