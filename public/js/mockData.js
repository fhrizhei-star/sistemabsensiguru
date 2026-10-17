/**
 * ====================================================================
 * MOCK DATABASE LOKAL (SISTEM ABSENSI GURU & TENAGA PENDIDIK)
 * ====================================================================
 */

const STORAGE_KEY = "ABSENSI_GURU_DATABASE";

function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const INITIAL_MOCK_DATA = {
  settings: {
    nama_sekolah: "SMA NEGERI 1 TELADAN",
    alamat_sekolah: "Jl. Pendidikan Nasional No. 45, Jakarta",
    jam_masuk: "06:45",
    jam_masuk_akhir: "07:15",
    jam_pulang: "15:30",
    toleransi_menit: 15,
    lat_sekolah: -6.2088,
    lng_sekolah: 106.8456,
    radius_meter: 250
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
      status: "aktif"
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
      status: "aktif"
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
      status: "aktif"
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
      status: "aktif"
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
      status: "aktif"
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
      status: "aktif"
    }
  ],
  attendance: [
    {
      id: "ATT1001",
      user_id: "U003",
      nama: "Siti Nurhaliza, S.Pd",
      nip: "199003202015022001",
      mapel: "Bahasa Indonesia",
      tanggal: getTodayDateStr(),
      jam_masuk: "06:48:12",
      jam_pulang: "",
      status: "Hadir",
      koordinat: "-6.2088, 106.8456 (25m)",
      foto_selfie: "",
      keterangan: "Tepat Waktu"
    },
    {
      id: "ATT1002",
      user_id: "U004",
      nama: "Ahmad Fauzi, S.Kom",
      nip: "199208142019031005",
      mapel: "Informatika / TIK",
      tanggal: getTodayDateStr(),
      jam_masuk: "07:22:05",
      jam_pulang: "",
      status: "Terlambat",
      koordinat: "-6.2089, 106.8457 (40m)",
      foto_selfie: "",
      keterangan: "Terlambat 7 menit"
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

const MockDB = {
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.save(INITIAL_MOCK_DATA);
      return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      this.save(INITIAL_MOCK_DATA);
      return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    }
  },

  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  reset() {
    this.save(INITIAL_MOCK_DATA);
  }
};

window.MockDB = MockDB;
