# Sistem Kokurikuler (Full Stack)

Project ini adalah aplikasi web Full Stack untuk manajemen penilaian kokurikuler sekolah, dibangun menggunakan teknologi modern dan di-containerisasi dengan Docker.

## Teknologi Stack

- **Frontend**: React JS (Vite) - *Cepat & Modern*
- **Backend**: Express JS (Node.js) - *REST API*
- **Database**: MySQL 8.0 - *Relational Database*
- **Infrastructure**: Docker & Docker Compose

## Struktur Folder

```
project/
├── docker-compose.yml   # Konfigurasi Orchestrator Utama
├── server/              # Backend (API & Logic)
│   ├── index.js         # Entry Point Server
│   └── package.json     # Dependencies Backend
└── client/              # Frontend (UI/UX)
    ├── src/             # Source Code React
    └── package.json     # Dependencies Frontend
```

## Prasyarat (Wajib)

Karena project ini menggunakan Docker, Anda **TIDAK PERLU** menginstall Node.js atau MySQL secara manual di laptop Anda.

Hanya satu yang wajib diinstall:
1.  **Docker Desktop** (untuk Windows)
    - Download: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
    - **PENTING**: Pastikan Docker Desktop sudah **berjalan (Running)** sebelum memulai.

## Cara Menjalankan Aplikasi

1.  **Buka Terminal** (PowerShell atau CMD) di folder project ini.
2.  **Jalankan Perintah**:
    ```bash
    docker-compose up --build
    ```
    *Catatan: Proses ini akan memakan waktu cukup lama di awal karena harus mendownload image MySQL dan Node.js, serta menginstall dependencies.*

3.  **Tunggu sampai muncul log**:
    - `Database connected successfully`
    - `Server is running on port 5000`

4.  **Buka Browser**:
    - Frontend: [http://localhost:3000](http://localhost:3000) (atau port 5173 tergantung mapping)
    - Backend API: [http://localhost:5000](http://localhost:5000)

## Troubleshooting

- **Error: "The system cannot find the file specified"**:
  Docker Desktop belum nyala. Buka aplikasinya dulu.

- **Port Conflict**:
  Jika port 3306 (MySQL) atau 5000 sudah terpakai di laptop Anda, edit `docker-compose.yml` di bagian `ports` (misal: `"3307:3306"`).

- **Database Error**:
  Tunggu sebentar. MySQL butuh waktu booting lebih lama daripada Node.js. Server akan otomatis mencoba connect ulang (retry) setiap 5 detik.

## Akun Default (Super Admin)

Saat pertama kali menjalankan aplikasi, gunakan akun berikut untuk Login:
- **Username**: `admin`
- **Password**: `password123`

> **PENTING**: Segera ganti password Anda melalui menu **Profil** setelah berhasil login untuk keamanan.

## Pengembangan (Development)

- File kode di folder `client/` dan `server/` **tersinkronisasi** dengan Docker.
- Anda bisa mengedit file `App.jsx` atau `index.js`, dan perubahan akan langsung terlihat (tergantung konfigurasi Hot Reload).

## Akses Publik (Menjadikan Laptop sebagai Server)

Jika Anda ingin website ini bisa diakses orang lain dari internet (misalnya untuk demo ke guru atau teman) langsung dari laptop Anda:

### Metode 1: Menggunakan Ngrok (Paling Mudah & Aman)
Ini tidak memerlukan pengaturan router atau IP Publik.
1.  Download & Install [ngrok](https://ngrok.com/).
2.  Buka terminal baru jalankan:
    ```bash
    ngrok http 3000
    ```
3.  Ngrok akan memberikan URL publik (contoh: `https://random-id.ngrok-free.app`).
4.  Bagikan link tersebut. Orang lain bisa membuka website Anda selama laptop Anda menyala dan `docker-compose` berjalan.

### Metode 2: Akses LAN (Satu Jaringan Wi-Fi)
Jika hanya ingin diakses teman yang terhubung di Wi-Fi yang sama:
1.  Cari IP Address laptop Anda (Buka CMD -> ketik `ipconfig` -> Lihat `IPv4 Address`, misal `192.168.1.10`).
2.  Teman Anda bisa membuka: `http://192.168.1.10:3000`.

### Catatan Production
Untuk penggunaan jangka panjang (sekolah sungguhan), **tidak disarankan** menggunakan laptop pribadi. Sebaiknya sewa **VPS (Virtual Private Server)** dan jalankan Docker project ini di sana agar bisa online 24 jam.
