# Panduan Setup Database Google Sheets (Absensi Guru)

Sistem absensi guru ini menggunakan Google Sheets sebagai database online gratis, real-time, dan tanpa biaya server. 

---

## Langkah 1: Buat Google Sheet Baru
1. Buka browser dan kunjungi: [https://sheets.new](https://sheets.new)
2. Beri nama file di pojok kiri atas, contoh: `Database Absensi Guru`.

---

## Langkah 2: Buka Apps Script
1. Di menu Google Sheets, klik **Extensions** (Ekstensi) > **Apps Script**.
2. Anda akan diarahkan ke editor Google Apps Script.
3. Hapus semua tulisan kode bawaan (`function myFunction() { ... }`).

---

## Langkah 3: Salin Kode Backend
1. Buka file `google-apps-script/Code.gs` di project ini.
2. Salin (**Copy**) seluruh isi kodenya.
3. Tempel (**Paste**) ke editor Google Apps Script tadi.
4. Klik tombol **Save** (ikon disket) atau tekan `Ctrl + S`.

---

## Langkah 4: Terapkan Sebagai Web App (Deploy)
1. Klik tombol biru **Deploy** (Terapkan) di kanan atas > pilih **New deployment** (Penerapan baru).
2. Di jendela yang muncul, klik ikon gear (roda gigi) di sebelah *Select type* > pilih **Web app** (Aplikasi Web).
3. Isi konfigurasi berikut:
   - **Description**: `Versi 1.0 Absensi Guru`
   - **Execute as** (Jalankan sebagai): **Me (email Anda)**
   - **Who has access** (Siapa yang memiliki akses): **Anyone (Siapa saja)** *(PENTING: harus Anyone agar website di Vercel bisa mengakses)*
4. Klik **Deploy**.
5. Berikan izin akses (*Authorize access*), pilih akun Google Anda, klik *Advanced* > *Go to Untitled project (unsafe)* > *Allow*.
6. Salin **Web app URL** yang muncul (berformat: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Langkah 5: Hubungkan ke Aplikasi Web
1. Buka website absensi (baik di localhost maupun setelah deploy di Vercel).
2. Login sebagai admin:
   - Username: `admin`
   - Password: `admin123`
3. Masuk ke menu **Pengaturan**, tempel URL Google Apps Script Anda ke kolom **Google Apps Script Web App URL**, lalu klik **Simpan Pengaturan**.

---

## Akun Demo Bawaan (Default Teacher Accounts)
Setelah database diinisialisasi otomatis oleh script, akun berikut langsung aktif:

| Role | NIP / Username | Password | Nama Guru | Bidang Studi |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Bpk. Hendra Gunawan, S.Kom | Kepala Tata Usaha / Admin |
| **Guru** | `198501152010011002` | `guru123` | Drs. Bambang Sudarsono, M.Pd | Matematika |
| **Guru** | `199003202015022001` | `guru123` | Siti Nurhaliza, S.Pd | Bahasa Indonesia |
| **Guru** | `199208142019031005` | `guru123` | Ahmad Fauzi, S.Kom | Informatika / TIK |
| **Guru** | `198811052014022003` | `guru123` | Dewi Lestari, S.Pd, M.Si | Fisika |

---

## Langkah 6: Mengaktifkan Notifikasi Telegram Pengingat 5 Menit (Opsi A)

Sistem sudah dilengkapi dengan fitur pengingat otomatis **5 menit sebelum jam pelajaran dimulai** yang dikirimkan langsung ke Grup Telegram Guru/Staf Sekolah (100% Gratis Selamanya).

### 1. Buat Bot Telegram
1. Buka aplikasi Telegram di HP atau Laptop.
2. Cari akun resmi **`@BotFather`** lalu klik **Start**.
3. Ketik perintah: `/newbot`
4. Masukkan nama bot, contoh: `Absensi MTsN Gowa`
5. Masukkan username bot berakhiran `bot`, contoh: `mtsn_gowa_absensibot`
6. BotFather akan memberikan **HTTP API Token** (contoh: `7123456789:AAFsK9m0Zq...`). Salin token ini.

### 2. Dapatkan Chat ID Grup Telegram
1. Buat grup Telegram guru sekolah (atau gunakan grup guru yang sudah ada).
2. Masukkan bot yang baru Anda buat ke dalam grup tersebut.
3. Jadikan bot sebagai **Admin grup**.
4. Masukkan bot pembantu **`@RawDataBot`** ke dalam grup.
5. Bot tersebut akan mengirimkan data JSON. Cari tulisan `"chat": { "id": -100xxxxxxxxxx }`.
6. Salin seluruh nomor ID tersebut (pastikan menyertakan tanda minus `-` di depannya).
7. Keluarkan `@RawDataBot` dari grup.

### 3. Simpan di Halaman Pengaturan Web
1. Masuk ke halaman **Admin > Pengaturan**.
2. Masukkan **Token Bot** dan **Chat ID Grup** pada bagian *Notifikasi Pengingat Telegram*.
3. Klik tombol **Uji Coba Kirim Pesan ke Telegram**. Bot akan langsung mengirimkan pesan tes ke grup!
4. Klik tombol **Simpan Pengaturan**.

### 4. Pasang Trigger Otomatis 5 Menit di Apps Script
Agar Apps Script otomatis mengecek jadwal setiap 5 menit:
1. Buka kembali editor **Google Apps Script**.
2. Pada dropdown fungsi di toolbar atas (sebelah tombol *Debug* dan *Run*), pilih fungsi: **`setupTelegramTrigger`**.
3. Klik tombol **Run** (Jalankan).
4. Selesai! Sekarang sistem akan berjalan otomatis setiap 5 menit di latar belakang untuk mengingatkan guru yang memiliki jadwal mengajar 5 menit ke depan.

