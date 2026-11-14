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

export const SAMPLE_EVIDENT_PHOTO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAACMCAIAAAAhotZpAAACMUlEQVR4nO3cMW7UQBiA0RRQh46OnrQ0SFQcAnGG3ICWS3AXCg5FgQQdPUFrrz1r+4uf9NXrkZ+msD3/3r348lkH7273FWgySIEgBYIU6F+kl98etXuQAkEKBCkQpECQAkEKBCkQpECQAkEKBCkQpECQAkEKBCkQpECQAkEKBCkQpECQAkEKNIH089cf7R6kQJACQQoEKRCkQJACQQoEKRCkQJACQQoEKRCkQPsgvfv4abNeff+65eUgzSKZE6QdkGbabKAFaSTPjaggjecZTgVpWujN2w9zup0TpEtCM3kmqSANQBrCc5kK0iqk4ULDnc6OdAueC1SQDic0yum8SNsIDXGCBOmoSFsKrXeCtIXQUydIh9tGKzfT2ZE2E1qzmSBdcYvf//j9NEjjkZYJ/ZdnGdUCJ0gDhK5yggTplEgzheY7QYIECdIGSAseY2+KNNPpXEh2EiRIkCCtd5r5a5AgnRXJu7utkbwFf+ZI64O0BMmX2YMiOePQQ3Ja6KBIzt1BgjQIyVnwBpKpigaS+aQGkkm/BpKZ2QaS6fMGkv9xaCANpBq4HkjjqYavBNIwrdstANJCti0v93yQdFWQAkEKBCkQpECQAkEKBCkQpECQAkEKBCkQpECQAkEKBCkQpECQAkEKNIF0//pBuwcpEKRAkAJBCgQpEKRAkAJBCgQpEKRAkAJBCgQpEKRAkAJBCgQpEKRAkAJBCgQpEKRAkAJBCjSBpAMGKRCkQJACQQr0F3crwXQIhvuZAAAAAElFTkSuQmCC";

export const INITIAL_MOCK_DATA = {
  settings: {
    nama_sekolah: "MTsN GOWA",
    alamat_sekolah: "Jl. Pendidikan Nasional No. 45, Jakarta",
    kota: "Kabupaten Gowa",
    npsn: "20123456",
    no_telp: "(0411) 861234",
    satuan_kerja: "PENDIS",
    kepala_sekolah: "Dr. H. Suharto, M.Pd",
    nip_kepsek: "196805121993031002",
    operator_nama: "Bpk. Hendra Gunawan, S.Kom",
    operator_nip: "198001012005011001",
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
    web_url: "https://sistemabsensiguru.vercel.app"
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
      satker: "PENDIS",
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
      satker: "PENDIS",
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
      satker: "PENDIS",
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
      satker: "PENDIS",
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
      satker: "PENDIS",
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
      satker: "PENDIS",
      email: "ratna@sekolah.sch.id",
      no_hp: "081234567895",
      status: "aktif",
      foto_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
    },
    {
      id: "U007",
      username: "199406182022032004",
      password: "pegawai123",
      nama: "Rahmawati, S.E.",
      role: "pegawai",
      nip: "199406182022032004",
      jabatan: "Staf Tata Usaha / Keuangan",
      mapel: "Administrasi & Kepegawaian",
      satker: "PENDIS",
      email: "rahmawati@sekolah.sch.id",
      no_hp: "081234567896",
      status: "aktif",
      foto_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80"
    },
    {
      id: "U008",
      username: "196905122022212007",
      password: "guru123",
      nama: "Zulhana S.Ag",
      role: "guru",
      nip: "196905122022212007",
      jabatan: "Guru",
      mapel: "Akidah Akhlak",
      satker: "PENDIS",
      email: "zulhana@kemenag.go.id",
      no_hp: "081234567897",
      status: "aktif",
      foto_url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80"
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
    },
    {
      id: "JAD601",
      guru_id: "U004",
      nama_guru: "Ahmad Fauzi, S.Kom",
      nip: "199208142019031005",
      mapel: "Koding",
      kelas: "VIII.1",
      hari: getTodayDayName(),
      jam_ke: "Jam Ke IX - X",
      jam_mulai: "14:00",
      jam_selesai: "15:20",
      ruangan: "Lab Komputer 1"
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
    },
    // Data Presensi Guru Oktober 2026 (Zulhana S.Ag - Format Dokumen LKB Kemenag Gowa)
    {
      id: "ATT_ZUL_01",
      jadwal_id: "JAD_ZUL_1",
      user_id: "U008",
      nama: "Zulhana S.Ag",
      nip: "196905122022212007",
      mapel: "Akidah Akhlak",
      kelas: "7",
      hari: "Kamis",
      tanggal: "2026-10-01",
      jam_jadwal: "07:30 - 08:50",
      jam_absen: "07:28:00",
      status: "Hadir",
      catatan: "Mengajar di kelas 7 akidah",
      koordinat: "Kamera Device Presensi",
      keterangan: "Tepat Waktu",
      foto: SAMPLE_EVIDENT_PHOTO
    },
    {
      id: "ATT_ZUL_02",
      jadwal_id: "JAD_ZUL_2",
      user_id: "U008",
      nama: "Zulhana S.Ag",
      nip: "196905122022212007",
      mapel: "Akidah Akhlak",
      kelas: "8",
      hari: "Jumat",
      tanggal: "2026-10-02",
      jam_jadwal: "08:50 - 10:10",
      jam_absen: "08:45:00",
      status: "Hadir",
      catatan: "Mengajar di kelas 8 akidah materi Asmaul Husna",
      koordinat: "Kamera Device Presensi",
      keterangan: "Tepat Waktu",
      foto: SAMPLE_EVIDENT_PHOTO
    },
    {
      id: "ATT_ZUL_03",
      jadwal_id: "JAD_ZUL_1",
      user_id: "U008",
      nama: "Zulhana S.Ag",
      nip: "196905122022212007",
      mapel: "Akidah Akhlak",
      kelas: "7",
      hari: "Senin",
      tanggal: "2026-10-05",
      jam_jadwal: "07:30 - 08:50",
      jam_absen: "07:29:15",
      status: "Hadir",
      catatan: "Mengajar di kelas 7 akidah pembinaan adab",
      koordinat: "Kamera Device Presensi",
      keterangan: "Tepat Waktu",
      foto: SAMPLE_EVIDENT_PHOTO
    },
    {
      id: "ATT_ZUL_04",
      jadwal_id: "JAD_ZUL_3",
      user_id: "U008",
      nama: "Zulhana S.Ag",
      nip: "196905122022212007",
      mapel: "Akidah Akhlak",
      kelas: "9",
      hari: "Selasa",
      tanggal: "2026-10-06",
      jam_jadwal: "10:30 - 11:50",
      jam_absen: "10:25:30",
      status: "Hadir",
      catatan: "Mengajar di kelas 9 akidah persiapan ujian tengah semester",
      koordinat: "Kamera Device Presensi",
      keterangan: "Tepat Waktu",
      foto: SAMPLE_EVIDENT_PHOTO
    },
    // Data Presensi Pegawai Oktober 2026 (Rahmawati, S.E. - Tata Usaha)
    {
      id: "ATT_RAH_01",
      jadwal_id: "MASUK",
      tipe_absen: "masuk",
      user_id: "U007",
      nama: "Rahmawati, S.E.",
      nip: "199406182022032004",
      mapel: "Staf Tata Usaha",
      kelas: "-",
      hari: "Kamis",
      tanggal: "2026-10-01",
      jam_jadwal: "06:30 - 07:15",
      jam_absen: "07:05:20",
      status: "Hadir",
      catatan: "Pelayanan administrasi persuratan dan pengarsipan berkas kepegawaian",
      koordinat: "Kamera Device Presensi",
      keterangan: "Tepat Waktu",
      foto: SAMPLE_EVIDENT_PHOTO
    },
    {
      id: "ATT_RAH_02",
      jadwal_id: "MASUK",
      tipe_absen: "masuk",
      user_id: "U007",
      nama: "Rahmawati, S.E.",
      nip: "199406182022032004",
      mapel: "Staf Tata Usaha",
      kelas: "-",
      hari: "Jumat",
      tanggal: "2026-10-02",
      jam_jadwal: "06:30 - 07:15",
      jam_absen: "07:00:10",
      status: "Hadir",
      catatan: "Penyusunan rekapitulasi data kehadiran dan laporan kinerja madrasah",
      koordinat: "Kamera Device Presensi",
      keterangan: "Tepat Waktu",
      foto: SAMPLE_EVIDENT_PHOTO
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
    },
    {
      id: "LV2002",
      user_id: "U002",
      nama: "Drs. Bambang Sudarsono, M.Pd",
      nip: "198501152010011002",
      mapel: "Matematika",
      tipe: "Sakit",
      tgl_mulai: getTodayDateStr(),
      tgl_selesai: getTodayDateStr(),
      alasan: "Istirahat pemulihan kesehatan sesuai anjuran dokter",
      status: "Disetujui",
      created_at: new Date().toISOString()
    }
  ],
  lkb: [
    {
      id: "LKB1001",
      user_id: "U002",
      nama: "Drs. Bambang Sudarsono, M.Pd",
      nip: "198501152010011002",
      mapel_jabatan: "Guru Madya / Matematika",
      bulan: "Oktober",
      tahun: "2026",
      judul: "LKB Bulan Oktober 2026 - Matematika",
      file_name: "LKB_Bambang_Oktober_2026.pdf",
      file_url: "https://drive.google.com",
      file_drive_id: "",
      file_size: "1.4 MB",
      catatan: "Laporan kegiatan belajar mengajar bulan Oktober beserta rekap nilai tugas",
      status: "Disetujui",
      alasan_penolakan: "",
      diverifikasi_oleh: "Bpk. Hendra Gunawan, S.Kom",
      diverifikasi_pada: "2026-10-31 14:20",
      created_at: "2026-10-30 09:15"
    },
    {
      id: "LKB1002",
      user_id: "U003",
      nama: "Siti Nurhaliza, S.Pd",
      nip: "199003202015022001",
      mapel_jabatan: "Guru Pertama / Bahasa Indonesia",
      bulan: "November",
      tahun: "2026",
      judul: "LKB Bulan November 2026 - Bahasa Indonesia",
      file_name: "LKB_Siti_November_2026.pdf",
      file_url: "SISTEM_PRESENSI_OTOMATIS",
      file_drive_id: "",
      file_size: "18 Kegiatan Terdata",
      catatan: "Laporan capaian kinerja mengajar bulan November",
      status: "Menunggu Verifikasi",
      alasan_penolakan: "",
      diverifikasi_oleh: "",
      diverifikasi_pada: "",
      created_at: "2026-11-01 10:30"
    },
    {
      id: "LKB_ZUL_OKT",
      user_id: "U008",
      nama: "Zulhana S.Ag",
      nip: "196905122022212007",
      mapel_jabatan: "Guru / Akidah Akhlak",
      role: "guru",
      bulan: "Oktober",
      tahun: "2026",
      judul: "Laporan Capaian Kinerja Bulanan ASN - Oktober 2026",
      file_name: "LKB_Zulhana_Oktober_2026.pdf",
      file_url: "SISTEM_PRESENSI_OTOMATIS",
      file_drive_id: "",
      file_size: "1 Kegiatan Terdata",
      catatan: "Laporan capaian kinerja mengajar kelas 7 akidah akhlak",
      status: "Disetujui",
      alasan_penolakan: "",
      diverifikasi_oleh: "H. Muhammad As'ad, S.Ag., M.Pd.I",
      diverifikasi_pada: "2026-10-31 15:00",
      tanggal_verifikasi: "2026-10-31",
      created_at: "2026-10-30 11:20"
    },
    {
      id: "LKB_RAHMA_OKT",
      user_id: "U007",
      nama: "Rahmawati, S.E.",
      nip: "199406182022032004",
      mapel_jabatan: "Staf Tata Usaha / Kepegawaian",
      role: "pegawai",
      bulan: "Oktober",
      tahun: "2026",
      judul: "Laporan Capaian Kinerja Bulanan ASN - Oktober 2026",
      file_name: "LKB_Rahmawati_Oktober_2026.pdf",
      file_url: "SISTEM_PRESENSI_OTOMATIS",
      file_drive_id: "",
      file_size: "Kegiatan Kedinasan",
      catatan: "Laporan pelaksanaan tugas administrasi dan layanan kepegawaian",
      status: "Disetujui",
      alasan_penolakan: "",
      diverifikasi_oleh: "H. Muhammad As'ad, S.Ag., M.Pd.I",
      diverifikasi_pada: "2026-10-31 16:30",
      tanggal_verifikasi: "2026-10-31",
      created_at: "2026-10-30 14:00"
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
      // Pastikan user Zulhana S.Ag dan presensi Oktober ter-merge bila belum ada di cache browser
      if (!data.users.some(u => u.id === "U008")) {
        const u008 = INITIAL_MOCK_DATA.users.find(u => u.id === "U008");
        if (u008) data.users.push(u008);
        const octAtt = INITIAL_MOCK_DATA.attendance.filter(a => a.id && a.id.startsWith("ATT_ZUL_"));
        if (!data.attendance) data.attendance = [];
        data.attendance.push(...octAtt);
      }
      if (!data.lkb) data.lkb = [];
      INITIAL_MOCK_DATA.lkb.forEach(initLkb => {
        if (!data.lkb.some(l => l.id === initLkb.id)) {
          data.lkb.push(initLkb);
        }
      });
      if (!data.leaves) data.leaves = [];
      INITIAL_MOCK_DATA.leaves.forEach(initLeave => {
        if (!data.leaves.some(l => l.id === initLeave.id)) {
          data.leaves.push(initLeave);
        }
      });
      // Lengkapi field satker pada data users jika belum ada
      if (Array.isArray(data.users)) {
        data.users.forEach(u => {
          if (!u.satker && !u.satuan_kerja) {
            u.satker = "PENDIS";
          }
        });
      }
      // Upgrade foto evident presensi jika masih tersimpan format SVG lama atau kosong di cache
      if (Array.isArray(data.attendance)) {
        data.attendance.forEach(att => {
          const f = att.foto;
          const isValidPhoto = f && typeof f === "string" && f.trim() !== "" && !f.startsWith("data:image/svg+xml") && f.length > 50 && (f.startsWith("data:image/jpeg") || f.startsWith("data:image/png") || f.startsWith("http"));
          if (!isValidPhoto) {
            att.foto = SAMPLE_EVIDENT_PHOTO;
          }
        });
      }
      if (data.settings && !data.settings.satuan_kerja) {
        data.settings.satuan_kerja = "PENDIS";
      }
      // Sinkronkan session auth user yang aktif di browser jika belum memiliki satker
      if (typeof window !== "undefined") {
        try {
          const authKey = "ABSENSI_GURU_AUTH_USER_V2";
          const authRaw = localStorage.getItem(authKey) || sessionStorage.getItem(authKey);
          if (authRaw) {
            const authUser = JSON.parse(authRaw);
            if (authUser && (!authUser.satker || !authUser.satuan_kerja)) {
              const matched = data.users.find(u => String(u.id) === String(authUser.id) || String(u.nip) === String(authUser.nip));
              authUser.satker = matched?.satker || "PENDIS";
              localStorage.setItem(authKey, JSON.stringify(authUser));
            }
          }
        } catch (errAuth) {}
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
