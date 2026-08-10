# SMART E-Journal SMANDA (SMAN 2 Brebes)

Sistem Jurnal Mengajar Elektronik dan Pemantauan Kinerja Akademik Terpadu untuk SMAN 2 Brebes.

## 📝 Changelog (Pembaruan Terkini)

### v1.1.0 - Responsive UI, PDF F4 & Bug Fixes
- **UI/UX Responsif (Mobile Friendly):**
  - Perbaikan tata letak (*layout*) pada akun **Guru** dan **Kepala Sekolah (Pimpinan)** agar menyesuaikan layar HP.
  - Kartu Ringkasan (Card Grid), Tabel Riwayat, dan Tabel Jurnal kini rapi di layar kecil (menggunakan *horizontal scroll* pada tabel).
  - *Top Bar* dan *Sidebar Menu* disesuaikan untuk navigasi sentuh.
- **Export PDF Optimal (Format Kertas F4):**
  - Margin pada seluruh fitur unduhan PDF (Laporan Rekapitulasi, Monitoring, Kehadiran, Jurnal, dan Dashboard) telah diperbaiki sehingga tidak terpotong di sebelah kanan.
  - Skala kertas diubah dari A4 menjadi **Kertas F4 / Folio**.
  - Ditambahkan persentase angka pada baris grafik "Tren Kinerja Akademik" di ekspor PDF.
  - Daftar Guru dengan Jam Kosong kini otomatis dipisah ke halaman baru.
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
