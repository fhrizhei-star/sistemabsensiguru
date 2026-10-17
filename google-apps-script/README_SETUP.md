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
