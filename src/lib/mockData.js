/**
 * Mock Database & Initial Seed Data
 * Sistem Absensi Guru & Tenaga Pendidik Modern
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

export const INITIAL_MOCK_DATA = {
  settings: {
    nama_sekolah: "MTsN GOWA",
    alamat_sekolah: "Jl. Pendidikan Nasional No. 45, Jakarta",
    kota: "Kabupaten Gowa",
    npsn: "20123456",
    no_telp: "(0411) 861234",
    kepala_sekolah: "Dr. H. Suharto, M.Pd",
    nip_kepsek: "196805121993031002",
    toleransi_menit: 15,
    jam_masuk_mulai: "06:30",
    jam_masuk_batas: "07:15",
    jam_pulang_mulai: "15:00",
    lat_sekolah: -6.2088,
    lng_sekolah: 106.8456,
    radius_meter: 250,
    google_script_url: "https://script.google.com/macros/s/AKfycby0DdiBERSda-XSxlvdtQrr9h9JILecQhDWsrctfZu514jP-NRo3v6T6LrSKL39PrY35Q/exec",
    telegram_bot_token: "",
    telegram_chat_id: "",
    telegram_notif_aktif: true,
    telegram_notif_absen: true,
    web_url: "https://absensi-sekolah.vercel.app"
  },
  users: [
    {
      id: "U001",
      username: "admin",
      password: "admin123",
      nama: "Bpk. Hendra Gunawan, S.Kom",
      role: "admin",
      nip: "198001012005011001",
      jabatan: "Kepala Tata Usaha / Admin",
      mapel: "Manajemen Kepegawaian",
      email: "admin@sekolah.sch.id",
      no_hp: "081234567890",
      status: "aktif",
      foto_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80"
    },
    {
      id: "U002",
      username: "198501152010011002",
      password: "guru123",
      nama: "Drs. Bambang Sudarsono, M.Pd",
      role: "guru",
      nip: "198501152010011002",
      jabatan: "Guru Madya",
      mapel: "Matematika",
      email: "bambang@sekolah.sch.id",
      no_hp: "081234567891",
      status: "aktif",
      foto_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80"
    },
    {
      id: "U003",
      username: "199003202015022001",
      password: "guru123",
      nama: "Siti Nurhaliza, S.Pd",
      role: "guru",
      nip: "199003202015022001",
      jabatan: "Guru Pertama",
      mapel: "Bahasa Indonesia",
      email: "siti@sekolah.sch.id",
      no_hp: "081234567892",
      status: "aktif",
      foto_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"
    },
    {
      id: "U004",
      username: "199208142019031005",
      password: "guru123",
      nama: "Ahmad Fauzi, S.Kom",
      role: "guru",
      nip: "199208142019031005",
      jabatan: "Guru Pertama",
      mapel: "Informatika / TIK",
      email: "fauzi@sekolah.sch.id",
      no_hp: "081234567893",
      status: "aktif",
      foto_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80"
    },
    {
      id: "U005",
      username: "198811052014022003",
      password: "guru123",
      nama: "Dewi Lestari, S.Pd, M.Si",
      role: "guru",
      nip: "198811052014022003",
      jabatan: "Guru Muda",
      mapel: "Fisika",
      email: "dewi@sekolah.sch.id",
      no_hp: "081234567894",
      status: "aktif",
      foto_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80"
    },
    {
      id: "U006",
      username: "199305122020012008",
      password: "guru123",
      nama: "Ratna Sari, S.Pd",
      role: "guru",
      nip: "199305122020012008",
      jabatan: "Guru Pertama",
      mapel: "Bahasa Inggris",
      email: "ratna@sekolah.sch.id",
      no_hp: "081234567895",
      status: "aktif",
      foto_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
    }
  ],
  schedules: [
    {
      id: "JAD101",
      guru_id: "U002",
      nama_guru: "Drs. Bambang Sudarsono, M.Pd",
      nip: "198501152010011002",
      mapel: "Matematika",
      kelas: "X MIPA 1",
      hari: getTodayDayName(),
      jam_ke: "Jam Ke 1 - 2",
      jam_mulai: "07:30",
      jam_selesai: "09:00",
      ruangan: "R. Kelas X-1"
    },
    {
      id: "JAD102",
      guru_id: "U002",
      nama_guru: "Drs. Bambang Sudarsono, M.Pd",
      nip: "198501152010011002",
      mapel: "Matematika",
      kelas: "XI MIPA 2",
      hari: getTodayDayName(),
      jam_ke: "Jam Ke 3 - 4",
      jam_mulai: "09:15",
      jam_selesai: "10:45",
      ruangan: "R. Kelas XI-2"
    },
    {
      id: "JAD103",
      guru_id: "U002",
      nama_guru: "Drs. Bambang Sudarsono, M.Pd",
      nip: "198501152010011002",
      mapel: "Matematika",
      kelas: "XII MIPA 1",
      hari: getTodayDayName(),
      jam_ke: "Jam Ke 5 - 6",
      jam_mulai: "11:00",
      jam_selesai: "12:30",
      ruangan: "R. Kelas XII-1"
    },
    {
      id: "JAD104",
      guru_id: "U002",
      nama_guru: "Drs. Bambang Sudarsono, M.Pd",
      nip: "198501152010011002",
      mapel: "Matematika",
      kelas: "X MIPA 2",
      hari: "Senin",
      jam_ke: "Jam Ke 1 - 2",
      jam_mulai: "07:30",
      jam_selesai: "09:00",
      ruangan: "R. Kelas X-2"
    },
    {
      id: "JAD201",
      guru_id: "U003",
      nama_guru: "Siti Nurhaliza, S.Pd",
      nip: "199003202015022001",
      mapel: "Bahasa Indonesia",
      kelas: "X IPS 1",
      hari: getTodayDayName(),
      jam_ke: "Jam Ke 1 - 2",
      jam_mulai: "07:30",
      jam_selesai: "09:00",
      ruangan: "R. Kelas X-IPS"
    },
    {
      id: "JAD301",
      guru_id: "U004",
      nama_guru: "Ahmad Fauzi, S.Kom",
      nip: "199208142019031005",
      mapel: "Informatika / TIK",
      kelas: "X MIPA 1",
      hari: getTodayDayName(),
      jam_ke: "Jam Ke 3 - 4",
      jam_mulai: "09:15",
      jam_selesai: "10:45",
      ruangan: "Lab Komputer 1"
    },
    {
      id: "JAD401",
      guru_id: "U005",
      nama_guru: "Dewi Lestari, S.Pd, M.Si",
      nip: "198811052014022003",
      mapel: "Fisika",
      kelas: "XI MIPA 1",
      hari: getTodayDayName(),
      jam_ke: "Jam Ke 5 - 6",
      jam_mulai: "11:00",
      jam_selesai: "12:30",
      ruangan: "Lab Fisika"
    },
    {
      id: "JAD501",
      guru_id: "U006",
      nama_guru: "Ratna Sari, S.Pd",
      nip: "199305122020012008",
      mapel: "Bahasa Inggris",
      kelas: "XII IPS 1",
      hari: getTodayDayName(),
      jam_ke: "Jam Ke 1 - 2",
      jam_mulai: "07:30",
      jam_selesai: "09:00",
      ruangan: "R. Kelas XII-IPS"
    }
  ],
  attendance: [
    {
      id: "ATT1001",
      jadwal_id: "JAD201",
      user_id: "U003",
      nama: "Siti Nurhaliza, S.Pd",
      nip: "199003202015022001",
      mapel: "Bahasa Indonesia",
      kelas: "X IPS 1",
      hari: getTodayDayName(),
      tanggal: getTodayDateStr(),
      jam_jadwal: "07:30 - 09:00",
      jam_absen: "07:28:15",
      status: "Hadir",
      koordinat: "-6.2088, 106.8456 (25m)",
      keterangan: "Tepat Waktu",
      foto: ""
    },
    {
      id: "ATT1002",
      jadwal_id: "JAD301",
      user_id: "U004",
      nama: "Ahmad Fauzi, S.Kom",
      nip: "199208142019031005",
      mapel: "Informatika / TIK",
      kelas: "X MIPA 1",
      hari: getTodayDayName(),
      tanggal: getTodayDateStr(),
      jam_jadwal: "09:15 - 10:45",
      jam_absen: "09:18:40",
      status: "Hadir",
      koordinat: "-6.2087, 106.8455 (32m)",
      keterangan: "Tepat Waktu",
      foto: ""
    }
  ],
  leaves: [
    {
      id: "LV2001",
      user_id: "U005",
      nama: "Dewi Lestari, S.Pd, M.Si",
      nip: "198811052014022003",
      mapel: "Fisika",
      tipe: "Tugas Dinas Luar",
      tgl_mulai: getTodayDateStr(),
      tgl_selesai: getTodayDateStr(),
      alasan: "Menghadiri MGMP Fisika Tingkat Provinsi di Balai Guru Penggerak",
      status: "Disetujui",
      created_at: new Date().toISOString()
    }
  ]
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
      if (
        data.settings &&
        (!data.settings.google_script_url ||
          data.settings.google_script_url.includes("AKfycbwerFB3CM8t3nf2YxmyTq-MWwr539yp7_ojIYDZmO_XAZv4GkJXBrfuNRaj3h3QWHZxWw") ||
          data.settings.google_script_url.includes("GANTI_DENGAN_URL"))
      ) {
        data.settings.google_script_url = INITIAL_MOCK_DATA.settings.google_script_url;
        this.save(data);
      }
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
