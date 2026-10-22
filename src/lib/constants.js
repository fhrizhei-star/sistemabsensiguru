/**
 * Master Data Konstanta Kelas, Mata Pelajaran, Ruangan, dan Sesi Jam
 * Berdasarkan Dokumen Resmi Jadwal Pelajaran MTs. Negeri Gowa TA 2026/2027
 */

// 1. Daftar Rombongan Belajar / Kelas (VII.1 - VII.6, VIII.1 - VIII.6, IX.1 - IX.5)
export const DAFTAR_KELAS = [
  // Tingkat VII (7)
  "VII.1",
  "VII.2",
  "VII.3",
  "VII.4",
  "VII.5",
  "VII.6",

  // Tingkat VIII (8)
  "VIII.1",
  "VIII.2",
  "VIII.3",
  "VIII.4",
  "VIII.5",
  "VIII.6",

  // Tingkat IX (9)
  "IX.1",
  "IX.2",
  "IX.3",
  "IX.4",
  "IX.5"
];

// 2. Daftar Mata Pelajaran Resmi MTs Negeri Gowa
export const DAFTAR_MAPEL = [
  "Al-Qur'an Hadits",
  "Akidah Akhlak",
  "Fikih",
  "Sejarah Kebudayaan Islam (SKI)",
  "Bahasa Arab",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Matematika",
  "Ilmu Pengetahuan Alam (IPA)",
  "Ilmu Pengetahuan Sosial (IPS)",
  "Pendidikan Pancasila & Kewarganegaraan (PKn)",
  "Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)",
  "Informatika",
  "Koding",
  "Seni Budaya",
  "Tahfidz",
  "Bimbingan & Konseling (BK)",
  "Kokurikuler"
];

// 3. Daftar Ruangan Belajar & Fasilitas
export const DAFTAR_RUANGAN = [
  // Ruang Kelas Tingkat VII
  "R. Kelas VII.1",
  "R. Kelas VII.2",
  "R. Kelas VII.3",
  "R. Kelas VII.4",
  "R. Kelas VII.5",
  "R. Kelas VII.6",

  // Ruang Kelas Tingkat VIII
  "R. Kelas VIII.1",
  "R. Kelas VIII.2",
  "R. Kelas VIII.3",
  "R. Kelas VIII.4",
  "R. Kelas VIII.5",
  "R. Kelas VIII.6",

  // Ruang Kelas Tingkat IX
  "R. Kelas IX.1",
  "R. Kelas IX.2",
  "R. Kelas IX.3",
  "R. Kelas IX.4",
  "R. Kelas IX.5",

  // Laboratorium & Fasilitas Khusus
  "Lab Komputer 1",
  "Lab Komputer 2",
  "Lab IPA",
  "Perpustakaan",
  "Musholla / Masjid",
  "Lapangan Olahraga",
  "Aula Madrasah"
];

// 4. Daftar Sesi Jam Pelajaran (Jam Ke I - VIII & Blok Sesi)
export const DAFTAR_SESI_JAM = [
  // --- Blok 2 Jam Pelajaran (Paling Umum di Jadwal) ---
  {
    kategori: "Blok 2 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke I - II (07:30 - 08:50)",
    jam_ke: "Jam Ke I - II",
    jam_mulai: "07:30",
    jam_selesai: "08:50"
  },
  {
    kategori: "Blok 2 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke III - IV (08:50 - 10:10)",
    jam_ke: "Jam Ke III - IV",
    jam_mulai: "08:50",
    jam_selesai: "10:10"
  },
  {
    kategori: "Blok 2 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke V - VI (10:40 - 12:00)",
    jam_ke: "Jam Ke V - VI",
    jam_mulai: "10:40",
    jam_selesai: "12:00"
  },
  {
    kategori: "Blok 2 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke VII - VIII (12:40 - 14:00)",
    jam_ke: "Jam Ke VII - VIII",
    jam_mulai: "12:40",
    jam_selesai: "14:00"
  },

  // --- Sesi Khusus Hari Jumat (I - VI) ---
  {
    kategori: "Jumat (Khusus)",
    label: "Jumat: Jam Ke I - II (07:00 - 08:20)",
    jam_ke: "Jam Ke I - II",
    jam_mulai: "07:00",
    jam_selesai: "08:20"
  },
  {
    kategori: "Jumat (Khusus)",
    label: "Jumat: Jam Ke III - IV (08:20 - 09:40)",
    jam_ke: "Jam Ke III - IV",
    jam_mulai: "08:20",
    jam_selesai: "09:40"
  },
  {
    kategori: "Jumat (Khusus)",
    label: "Jumat: Jam Ke V - VI (10:00 - 11:20)",
    jam_ke: "Jam Ke V - VI",
    jam_mulai: "10:00",
    jam_selesai: "11:20"
  },

  // --- Sesi Tunggal / Per 1 Jam Pelajaran (I s/d VIII) ---
  {
    kategori: "Sesi 1 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke I (07:30 - 08:10)",
    jam_ke: "Jam Ke I",
    jam_mulai: "07:30",
    jam_selesai: "08:10"
  },
  {
    kategori: "Sesi 1 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke II (08:10 - 08:50)",
    jam_ke: "Jam Ke II",
    jam_mulai: "08:10",
    jam_selesai: "08:50"
  },
  {
    kategori: "Sesi 1 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke III (08:50 - 09:30)",
    jam_ke: "Jam Ke III",
    jam_mulai: "08:50",
    jam_selesai: "09:30"
  },
  {
    kategori: "Sesi 1 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke IV (09:30 - 10:10)",
    jam_ke: "Jam Ke IV",
    jam_mulai: "09:30",
    jam_selesai: "10:10"
  },
  {
    kategori: "Sesi 1 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke V (10:40 - 11:20)",
    jam_ke: "Jam Ke V",
    jam_mulai: "10:40",
    jam_selesai: "11:20"
  },
  {
    kategori: "Sesi 1 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke VI (11:20 - 12:00)",
    jam_ke: "Jam Ke VI",
    jam_mulai: "11:20",
    jam_selesai: "12:00"
  },
  {
    kategori: "Sesi 1 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke VII (12:40 - 13:20)",
    jam_ke: "Jam Ke VII",
    jam_mulai: "12:40",
    jam_selesai: "13:20"
  },
  {
    kategori: "Sesi 1 Jam (Senin - Kamis & Sabtu)",
    label: "Jam Ke VIII (13:20 - 14:00)",
    jam_ke: "Jam Ke VIII",
    jam_mulai: "13:20",
    jam_selesai: "14:00"
  }
];
