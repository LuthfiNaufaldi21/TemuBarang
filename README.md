# TemuBarang

TemuBarang adalah aplikasi web berbasis React yang dirancang untuk membantu civitas akademika Universitas Sumatera Utara (USU) dalam melaporkan, mencari, dan mengelola barang hilang maupun barang ditemukan secara lebih terpusat, cepat, dan aman.

Aplikasi ini dibuat sebagai prototype sistem Lost & Found digital di lingkungan kampus. Pengguna dapat membuat laporan barang hilang atau ditemukan, melihat daftar laporan terbaru, membuka detail barang, melakukan komunikasi melalui fitur pesan, serta menerima notifikasi kemungkinan kecocokan barang.

## Link Website
https://temubarang.vercel.app

## Fitur Utama

### 1. Landing Page
Halaman awal aplikasi yang menampilkan informasi umum tentang TemuBarang dan ajakan untuk menggunakan sistem.

### 2. Login dan Request Access
Pengguna dapat masuk menggunakan identitas seperti NIM, NIP, atau email institusi USU. Tersedia juga halaman request access untuk pengajuan akun.

### 3. Dashboard
Menampilkan ringkasan informasi utama, laporan terbaru, dan navigasi ke fitur-fitur penting aplikasi.

### 4. Pelaporan Barang Hilang dan Ditemukan
Pengguna dapat membuat laporan barang hilang atau barang ditemukan dengan mengisi data seperti:

- Nama barang
- Kategori barang
- Lokasi kehilangan atau penemuan
- Tanggal kejadian
- Deskripsi barang
- Foto barang

### 5. Daftar Barang Hilang dan Ditemukan
Aplikasi menyediakan halaman khusus untuk melihat daftar barang hilang dan daftar barang ditemukan.

### 6. Detail Barang
Pengguna dapat melihat informasi lengkap dari sebuah laporan barang, termasuk foto, status, lokasi, deskripsi, dan informasi pelapor.

### 7. Smart Matching Prototype
Sistem memiliki fitur pencocokan sederhana untuk membantu menemukan kemungkinan hubungan antara laporan barang hilang dan barang ditemukan.

Pada versi saat ini, fitur matching masih bersifat prototype dan menggunakan pemrosesan lokal/rule-based, belum sepenuhnya terhubung dengan layanan AI eksternal.

### 8. Chat Privat
Pengguna dapat melakukan komunikasi melalui halaman pesan untuk membahas detail barang yang berkaitan dengan laporan tertentu.

### 9. Notifikasi
Aplikasi memiliki halaman notifikasi untuk menampilkan informasi seperti potensi kecocokan barang atau pesan baru.

### 10. Profil dan Pengaturan
Pengguna dapat melihat dan mengubah informasi profil serta mengakses halaman pengaturan aplikasi.

## Tech Stack

Project ini menggunakan teknologi berikut:

- React
- Vite
- React Router DOM
- Tailwind CSS
- LocalStorage untuk penyimpanan data prototype

## Struktur Folder

```text
TemuBarang/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   └── TopBar.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ReportItem.jsx
│   │   ├── LostItems.jsx
│   │   ├── FoundItems.jsx
│   │   ├── ItemDetail.jsx
│   │   ├── Messages.jsx
│   │   ├── ChatRoom.jsx
│   │   ├── Notifications.jsx
│   │   ├── Profile.jsx
│   │   └── Settings.jsx
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── README.md
