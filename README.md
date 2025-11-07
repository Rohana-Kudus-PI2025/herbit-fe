# Herbit

**Herbit** adalah aplikasi pelacak kebiasaan hijau untuk perempuan, ramah lingkungan, fermentasi eco-enzim, main game memilah sampah, kumpulkan poin & tukarkan hadiah

---

## Daftar Isi

1. [Gambaran Proyek](#gambaran-proyek)
2. [Fitur](#fitur)
3. [Teknologi yang Digunakan](#teknologi-yang-digunakan)
4. [Memulai Proyek](#memulai-proyek)

   * Prasyarat
   * Instalasi
   * Menjalankan Secara Lokal
   * Variabel Lingkungan
5. [Struktur Proyek](#struktur-proyek)
6. [Deployment](#deployment)

---

## Gambaran Proyek

**Herbit** membantu perempuan untuk hidup lebih berkelanjutan melalui kebiasaan hijau harian, pelacakan fermentasi eco-enzim, dan permainan edukatif interaktif.
Aplikasi ini dibangun menggunakan **Next.js**, berfungsi sebagai antarmuka utama yang terhubung langsung ke **Herbit Backend API (http://herbit-backend.vercel.app/)**.

Pengguna dapat:

* Melacak kebiasaan hijau harian.
* Melakukan fermentasi eco-enzim dengan pelacakan visual.
* Bermain **Game Sorting** untuk belajar memilah sampah dengan benar.
* Mengumpulkan poin, menukarkannya dengan voucher, dan mendapatkan berbagai hadiah menarik.

**Tujuan Herbit:** membuat gaya hidup hijau terasa menyenangkan, mudah, dan bisa dilakukan setiap hari.

---

## Fitur

* **Dashboard Pelacak Kebiasaan**.
* **Pelacak Eco-Enzim** dengan tampilan progres fermentasi.
* **Sistem Poin & Katalog Hadiah.**
* **Desain Responsif** — mendukung tampilan desktop dan mobile.
* **Styling dengan Tailwind CSS** agar tampilan tetap bersih dan efisien.
* **Konfigurasi variabel lingkungan** untuk koneksi API backend.

---

## Teknologi yang Digunakan

* **Framework:** Next.js (React + SSR/SSG)
* **Styling:** Tailwind CSS
* **Bahasa:** JavaScript (ES6+)
* **Library Pendukung:** React Hooks, Context API, State Management.

---

## Memulai Proyek

### Prasyarat

* Node.js (versi disarankan: v20)
* npm

---

### Instalasi

```bash
# Clone repository  
git clone https://github.com/Rohana-Kudus-PI2025/herbit-fe.git  
cd herbit-fe  

# Instal dependensi  
npm install    
```

---

### Menjalankan Secara Lokal

```bash
npm run dev  
```

Kemudian buka browser dan akses:
 `http://localhost:3000`

---

### Variabel Lingkungan

Buat file .env.local di root proyek Herbit, lalu tambahkan baris berikut:

```
NEXT_PUBLIC_API_BASE_URL=http://herbit-backend.vercel.app/api
```
---
