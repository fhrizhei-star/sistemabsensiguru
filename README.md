# 👨‍🏫 Sistem Absensi Guru & Tenaga Pendidik (Google Sheets & Vercel Ready)

Sistem Informasi Presensi Online Khusus Guru dan Tenaga Kependidikan berbasis Web modern dengan pemisahan file yang rapi, responsive (Desktop & Mobile-Friendly), menggunakan **Google Sheets** sebagai database gratis tanpa kuota server, dan siap di-deploy langsung ke **Vercel**.

---

## ✨ Fitur Utama

### 🛡️ Portal Administrator Kepegawaian (Tata Usaha / Kepala Sekolah)
- **Dashboard Statistik Real-time**: Total guru & staf, guru hadir tepat waktu, terlambat, izin/cuti/dinas luar, dan guru yang belum presensi hari ini.
- **Live Feed Presensi Guru**: Pemantauan langsung presensi harian guru lengkap dengan foto selfie, NIP, mata pelajaran, dan jam masuk.
- **Rekapitulasi Kehadiran Guru**: Filter berdasarkan tanggal dan bidang studi/mata pelajaran, cetak laporan resmi, dan ekspor data ke file **Excel / CSV**.
- **Manajemen Guru & Pegawai**: Tambah, edit, dan hapus data guru pengajar (NIP, Nama Lengkap & Gelar, Mata Pelajaran, Jabatan/Golongan, Nomor WhatsApp).
- **Persetujuan Izin, Cuti & Dinas Luar**: Menu verifikasi untuk menyetujui (*Approve*) atau menolak (*Reject*) permohonan cuti tahunan, sakit, atau tugas dinas luar (MGMP / Pelatihan).
- **Pengaturan Jam Kerja & Database**:
  - Konfigurasi URL Google Apps Script Web App langsung dari antarmuka web.
  - Pengaturan batas awal jam presensi, toleransi terlambat, dan jam selesai bertugas.
  - Pengaturan koordinat GPS sekolah (Latitude, Longitude) dan batas radius toleransi geofencing.

### 👨‍🏫 Portal Guru (Mobile First & Modern)
- **Presensi Selfie Wajah**: Menggunakan kamera depan/webcam perangkat untuk swafoto saat presensi.
- **Deteksi Lokasi GPS (Geofencing)**: Menghitung jarak presisi antara guru dan sekolah secara otomatis menggunakan rumus Haversine.
- **Presensi Masuk & Pulang**: Jam kehadiran tercatat otomatis dengan deteksi status *Tepat Waktu* vs *Terlambat*.
- **Riwayat Presensi**: Menampilkan riwayat kehadiran guru bulanan lengkap dengan status hadir/terlambat/cuti.
- **Formulir Pengajuan Izin / Cuti / Tugas Dinas**: Guru dapat mengajukan izin tugas dinas luar (MGMP/Diklat), cuti tahunan, sakit, atau dispensasi kegiatan sekolah.
- **Kartu Identitas Guru Elektronik (E-Teacher ID)**: ID card resmi guru dengan QR Code yang siap dicetak/diunduh.

---

## 📁 Struktur File & Folder yang Rapi

Seluruh kode dan aset dipisahkan secara modular:

```text
Sistem Absensi/
├── api/
│   └── proxy.js              # Serverless Function proxy Vercel untuk Google Apps Script (Bebas CORS)
├── google-apps-script/
│   ├── Code.gs               # Backend script khusus Guru untuk dipaste di Google Sheets
│   └── README_SETUP.md       # Panduan langkah demi langkah setup Google Sheets
├── public/
│   ├── admin/
│   │   ├── index.html        # Dashboard utama admin kepegawaian
│   │   ├── rekap.html        # Laporan & ekspor rekapitulasi kehadiran guru (CSV & Print)
│   │   ├── guru.html         # Manajemen data guru & pegawai
│   │   ├── izin.html         # Persetujuan izin, cuti & tugas dinas guru
│   │   └── setting.html      # Pengaturan jam sekolah, GPS, & Google Sheets
│   ├── user/
│   │   ├── index.html        # Halaman utama presensi guru (Kamera & GPS)
│   │   ├── riwayat.html      # Riwayat kehadiran guru
│   │   ├── izin.html         # Form pengajuan cuti, izin & tugas dinas luar
│   │   └── kartu.html        # ID Card Guru digital siap cetak
│   ├── css/
│   │   ├── main.css          # Design system, variabel warna, tipografi Google Fonts
│   │   ├── components.css    # Tombol, badge, tabel, kartu, dialog modal, toast
│   │   ├── admin.css         # Tata letak sidebar & topbar admin
│   │   └── user.css          # Tata letak mobile & widget presensi guru
│   ├── js/
│   │   ├── config.js         # Konfigurasi aplikasi & URL Google Apps Script
│   │   ├── auth.js           # Sistem otentikasi login, sesi, & hak akses role
│   │   ├── api.js            # Service komunikasi HTTP & fallback data lokal
│   │   ├── mockData.js       # Database demo guru lokal (bekerja instan tanpa setup)
│   │   ├── utils.js          # Helper tanggal Indo, kamera webcam, GPS, & CSV
│   │   ├── admin.js          # Logika controller portal admin
│   │   └── user.js           # Logika controller portal guru
│   └── index.html            # Halaman landing & login dengan tombol uji coba 1-klik
├── server.js                 # Local development server (zero external dependencies)
├── vercel.json               # Konfigurasi routing & serverless untuk Vercel
├── package.json              # Script npm & info proyek
└── README.md                 # Dokumentasi panduan lengkap
```

---

## 🚀 Cara Menjalankan di Komputer Lokal

1. Buka terminal di folder project ini.
2. Jalankan:
   ```bash
   npm start
   ```
   *atau langsung:*
   ```bash
   node server.js
   ```
3. Buka browser di: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Akun Demo Guru Bawaan (Siap Pakai)

| Role | Username / NIP | Password | Nama Guru | Bidang Studi / Mapel |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Bpk. Hendra Gunawan, S.Kom | Kepala Tata Usaha / Admin |
| **Guru** | `198501152010011002` | `guru123` | Drs. Bambang Sudarsono, M.Pd | Guru Matematika |
| **Guru** | `199003202015022001` | `guru123` | Siti Nurhaliza, S.Pd | Guru Bahasa Indonesia |
| **Guru** | `199208142019031005` | `guru123` | Ahmad Fauzi, S.Kom | Guru Informatika / TIK |
| **Guru** | `198811052014022003` | `guru123` | Dewi Lestari, S.Pd, M.Si | Guru Fisika |

*(Di halaman login juga disediakan tombol **Uji Coba 1-Klik** untuk langsung masuk otomatis)*

---

## ☁️ Cara Deploy ke Vercel

1. Upload folder project ini ke repository GitHub Anda.
2. Buka [https://vercel.com](https://vercel.com) dan hubungkan akun GitHub Anda.
3. Klik **Add New...** > **Project** > Pilih repository Anda.
4. Klik **Deploy**.
5. Vercel akan otomatis meng-onlinekan aplikasi Anda dalam hitungan detik!

---

## 📊 Cara Menghubungkan ke Google Sheets (Database Asli)

1. Buka [https://sheets.new](https://sheets.new) di browser Anda.
2. Klik menu **Extensions** > **Apps Script**.
3. Buka file `google-apps-script/Code.gs`, salin semua isinya, lalu tempel ke editor Apps Script.
4. Klik **Deploy** > **New deployment** > pilih jenis **Web app**.
5. Set **Execute as**: `Me` dan **Who has access**: `Anyone`.
6. Klik Deploy dan salin **Web app URL** yang muncul.
7. Buka website absensi Anda, login sebagai **Admin**, buka menu **Pengaturan**, lalu tempel URL tersebut di kolom Google Apps Script Web App URL. Selesai!
