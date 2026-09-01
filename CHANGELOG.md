# Changelog

## [Unreleased]

### Added
- Limitasi unggahan file untuk *server actions* dinaikkan menjadi 5MB (untuk mengatasi masalah saat upload surat izin atau bukti sakit yang berukuran lebih dari 100KB).
- Fitur Pimpinan dan Koor BK untuk melihat detail kehadiran siswa melalui *modal* popup, meliputi tanggal hadir, izin, sakit, dispensasi, serta keterangan telat dan bukti unggahan.

### Fixed
- Perbaikan query filter untuk daftar kelas pada halaman pimpinan dan BK (hanya menampilkan rombel reguler yang diawali huruf 'X', mengabaikan kelas TKA).
- Perbaikan bug *crash* ketika membuat satu jurnal untuk banyak rombongan belajar (rombel lebih dari 1) secara bersamaan.
- Perbaikan *styling* CSS (tampilan tab navigasi yang sempat hilang/rusak pada *device* tertentu telah dikembalikan dan dirapikan).
