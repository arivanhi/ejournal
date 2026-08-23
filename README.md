# SMART E-Journal SMANDA (SMAN 2 Brebes)

Sistem Jurnal Mengajar Elektronik dan Pemantauan Kinerja Akademik Terpadu untuk SMAN 2 Brebes.

## 📝 Changelog (Pembaruan Terkini)

### v1.3.0 - Manajemen Jurnal Guru & Navigasi Kelas
- **Fitur Hapus Jurnal Mengajar:**
  - Menambahkan tombol "Hapus Jurnal" (ikon tong sampah) pada riwayat/daftar jurnal di akun Guru.
  - Dilengkapi dengan *Modal Konfirmasi* untuk mencegah penghapusan secara tidak sengaja.
  - Penghapusan jurnal akan secara otomatis dan aman (cascade delete) menghapus seluruh data presensi siswa yang terikat pada jam tersebut.
- **Navigasi Tab Kelas:**
  - Menambahkan *Tab Navigasi Kelas* (yang *scrollable* di perangkat *mobile*) pada antarmuka utama (View 1) akun Guru.
  - Berguna untuk memfilter daftar kartu mata pelajaran berdasarkan kelas yang diajar agar tampilan lebih rapi dan fokus.
- **Pembaruan Format Cetak PDF:**
  - Mengubah label `NPP:` atau `NIP/NPP:` menjadi `NIP:` secara menyeluruh pada semua format cetakan PDF.
  - Memperbaiki penulisan email instansi pada kop surat PDF menjadi `smadabes@gmail.com`.

### v1.2.0 - Laporan Dinamis & Optimasi Pagination
- **Penyaringan Data Fleksibel:**
  - Menambahkan *Dropdown Filter* **Nama Guru** dan **Tingkat Kelas** (X, XI, XII) pada antarmuka Jurnal Mengajar dan Kehadiran Siswa di akun Pimpinan.
- **Ekspor PDF Dinamis (Custom Date Range):**
  - Kini Modal Ekspor PDF mendukung *Date Picker* (rentang tanggal) untuk mencetak Riwayat Jurnal dan Monitoring KBM secara parsial.
  - Tabel "Rekapitulasi Kehadiran Siswa" di dalam dokumen PDF kini **otomatis dihitung ulang secara dinamis** (nilai Hadir, Sakit, Izin, Alpa) berdasarkan rentang waktu spesifik yang dicetak saja.
- **Optimasi Pagination & UI:**
  - Menerapkan batasan item per halaman (*pagination*) menjadi 15 item pada tabel untuk memudahkan navigasi.
  - Memperbaiki *bug* pada penomoran baris tabel (kolom NO) agar bersifat kontinu saat berganti halaman, diterapkan merata di sisi akun Guru maupun Pimpinan.


### v1.1.0 - Responsive UI, PDF F4 & Bug Fixes
- **UI/UX Responsif (Mobile Friendly):**
  - Perbaikan tata letak (*layout*) pada akun **Guru** dan **Kepala Sekolah (Pimpinan)** agar menyesuaikan layar HP.
  - Kartu Ringkasan (Card Grid), Tabel Riwayat, dan Tabel Jurnal kini rapi di layar kecil (menggunakan *horizontal scroll* pada tabel).
  - *Top Bar* dan *Sidebar Menu* disesuaikan untuk navigasi sentuh.
  - Mengembalikan struktur tabel antarmuka Web UI pada halaman Guru dan Pimpinan agar tidak berbenturan dengan format tabel PDF. Fitur sorting kolom (klik untuk mengurutkan) berfungsi kembali dengan normal.
  - Penyesuaian whitespace pada view detail presensi agar tabel lebih proporsional (rata tengah dan tidak memakan terlalu banyak ruang kosong di layar lebar).
- **Export PDF Optimal (Format Kertas F4):**
  - Margin pada seluruh fitur unduhan PDF (Laporan Rekapitulasi, Monitoring, Kehadiran, Jurnal, dan Dashboard) telah diperbaiki sehingga tidak terpotong di sebelah kanan.
  - Skala kertas diubah dari A4 menjadi **Kertas F4 / Folio**.
  - Ditambahkan persentase angka pada baris grafik "Tren Kinerja Akademik" di ekspor PDF.
  - Daftar Guru dengan Jam Kosong kini otomatis dipisah ke halaman baru.
  - Manual Pagination: Menerapkan algoritma pemotongan data otomatis (maksimal 20-25 baris per halaman) untuk menjamin baris tabel tidak terbelah dua saat melewati batas bawah kertas.
  - Anti-Potong (Avoid Break): Memperbaiki layout Kop Surat menggunakan Flexbox dan instruksi CSS pageBreakInside: "avoid". Kop surat dijamin selalu rata tengah, presisi, dan tidak terpotong margin otomatis.
  - Penomoran Halaman: Ditambahkan fitur penomoran halaman dinamis ("Halaman X dari Y") pada footer di setiap dokumen PDF yang diekspor.
  - Format Kertas Akurat: Kalibrasi ukuran kertas absolut pada Container CSS. A4 Portrait (untuk Jurnal/Kehadiran/Monitoring) dan F4/Folio Landscape (untuk Laporan Rekapitulasi PDCA Pimpinan).
- **Manajemen Jadwal:**
  - Menghapus pembatasan otomatis (hardcode) pada Senin Jam ke-1 yang sebelumnya selalu diisi oleh "Upacara Bendera". Admin kini dapat menempatkan mata pelajaran lain di slot tersebut jika diperlukan.
- **Perbaikan Zona Waktu & Presensi QR:**
  - Penambahan parameter `TZ=Asia/Jakarta` di Docker agar server mencatat waktu WIB secara akurat.
  - Sinkronisasi waktu di aplikasi klien (*frontend*) sehingga jadwal pengisian jurnal tidak meleset ke hari sebelumnya saat diakses pagi hari.
  - Perubahan aturan QR Presensi: QR dapat dibuka kapan saja di tanggal jadwal yang sama (00:00 - 23:59).
  - Fitur penutupan otomatis QR Presensi diundur dari jam 16:00 menjadi **jam 20:00 (8 Malam)**.
---

## 🚀 Panduan Instalasi & Update (Server)

Aplikasi ini berjalan secara penuh menggunakan lingkungan **Docker** (Next.js, MySQL, Prisma, dan phpMyAdmin).

### 1. Instalasi di Server Baru

Jika Anda memindahkan atau menginstal program ini ke server/VPS/Komputer baru, ikuti langkah berikut:

```bash
# 1. Kloning (Clone) atau salin folder project ke server
git clone https://github.com/arivanhi/ejournal.git ejournal-sman2
cd ejournal-sman2

# 2. Salin file environment (pastikan konfigurasi .env sesuai dengan server baru)
cp .env.example .env

# 3. Jalankan Docker Compose (build & jalankan di background)
docker compose up -d --build

# 4. Tunggu beberapa menit hingga database siap, lalu sinkronkan database Prisma
docker exec -it ejournal_nextjs npx prisma db push

# 5. Buat data master awal (Admin, Role, dll) jika database masih kosong
# (Opsional) Sesuaikan script seed atau hubungi pengembang.
```

### 2. Update Program (Server Lama)

Jika server sudah menyala dan Anda baru saja menerima *update* kodingan (seperti *Changelog* di atas), lakukan perintah berikut untuk menerapkan pembaruan tanpa menghapus data:

```bash
# 1. Masuk ke folder project
cd ejournal-sman2

# 2. Tarik update terbaru dari repositori Git
git pull origin main

# 3. Bangun ulang (Rebuild) container aplikasi Next.js dan jalankan
docker compose up -d --build

# 4. (Hanya jika ada perubahan skema Database/Prisma)
# docker exec -it ejournal_nextjs npx prisma db push
```

*Catatan: Perintah `docker compose up -d --build` akan membangun ulang aplikasi (menerapkan perubahan UI/UX, CSS, dan logika baru) secara otomatis. Database MySQL tidak akan terhapus karena menggunakan volume `db_data`.*

---

## 🛠 Konfigurasi Tambahan

- **Port Aplikasi:** `http://localhost:3000`
- **Port phpMyAdmin:** `http://localhost:8099` (Manajemen Database GUI)
- **Timezone Server:** `Asia/Jakarta` (WIB)

Dikelola & Dikembangkan untuk SMAN 2 Brebes.
