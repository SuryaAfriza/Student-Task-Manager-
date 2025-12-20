# 🎓 Student Task Management System + AI & Pomodoro

![Status Proyek](https://img.shields.io/badge/Status-Active-success)
![Versi](https://img.shields.io/badge/Version-1.0.0-blue)
![Deployed](https://img.shields.io/badge/Deployed-Firebase-orange)

Aplikasi manajemen tugas kuliah berbasis web yang dirancang khusus untuk mahasiswa. Tidak hanya sekadar to-do list, aplikasi ini dilengkapi dengan **Asisten AI (Gemini)** untuk membantu strategi belajar dan **Pomodoro Timer** untuk meningkatkan produktivitas.

🔗 **Link Demo Aplikasi:** [https://student-task-manager-de5e5.web.app/](https://student-task-manager-de5e5.web.app/)

---

## ✨ Fitur Utama

### 1. 🔐 Autentikasi Mahasiswa

* **Login & Register:** Sistem akun yang aman menggunakan Firebase Authentication.

* **Reset Password:** Fitur pemulihan akun jika lupa kata sandi via email.

* **UI Ramah:** Antarmuka login yang modern dengan sapaan khas mahasiswa ("Daftar Dulu Yuk!", "Masuk Akun").

### 2. 📝 Manajemen Tugas (CRUD)

* **Tambah Tugas:** Catat tugas lengkap dengan judul, deskripsi, tenggat waktu (deadline), dan prioritas.

* **Edit & Hapus:** Fleksibilitas untuk mengubah detail atau menghapus tugas yang batal.

* **Status Selesai:** Tandai tugas yang sudah beres untuk melihat progress.

### 3. 🤖 AI Study Assistant (Powered by Gemini)

* **Smart Planner:** Bingung mulai dari mana? AI akan membuatkan rencana langkah-demi-langkah otomatis berdasarkan judul tugasmu.

* **AI Tutor:** Dapatkan tips belajar, strategi pengerjaan, dan referensi materi yang dipersonalisasi untuk setiap tugas.

### 4. 🍅 Produktivitas & Gamifikasi

* **Pomodoro Timer:** Widget timer fokus (25 menit kerja, 5 menit istirahat) yang terintegrasi langsung di dashboard.

* **Prioritas Warna:** Penanda visual (Merah/Kuning/Biru) untuk membedakan tingkat urgensi tugas.

* **Statistik:** Ringkasan jumlah tugas total, pending, dan selesai.

## 🛠️ Teknologi yang Digunakan

| Komponen | Teknologi | Keterangan | 
 | ----- | ----- | ----- | 
| **Frontend** | HTML5, CSS3 | Struktur dan desain halaman. | 
| **Styling** | Tailwind CSS | Framework CSS untuk desain responsif dan modern. | 
| **Logic** | JavaScript (ES6+) | Logika interaktif dan manipulasi DOM. | 
| **Backend** | Google Firebase | Authentication (Login), Firestore (Database Realtime), & Hosting. | 
| **AI** | Google Gemini API | Model `gemini-2.5-flash` untuk fitur kecerdasan buatan. | 
| **Icons** | FontAwesome | Ikon antarmuka yang menarik. | 

## 🚀 Cara Menjalankan (Instalasi Lokal)

Jika ingin menjalankan kode sumber di laptop sendiri:

### Prasyarat

* Browser modern (Chrome, Edge, Firefox, Safari).

* Koneksi Internet (Wajib, untuk akses Firebase & AI).

### Langkah-langkah

1. **Clone Repository ini:**

   ```bash
   git clone [https://github.com/USERNAME_KAMU/student-task-manager.git](https://github.com/USERNAME_KAMU/student-task-manager.git)

2. **Masuk ke Folder Proyek:** Buka folder hasil download di text editor (VS Code disarankan).

3. **Konfigurasi API Key (PENTING!):**

*   Buka file `app.js.`

* Cari variabel `firebaseConfig` dan sesuaikan dengan config Firebase proyekmu sendiri.

* Cari variabel `geminiApiKey` dan masukkan API Key Google AI Studio milikmu.

4. **Jalankan:**

   * Buka file `index.html` langsung di browser.

   * Atau gunakan ekstensi "Live Server" di VS Code untuk pengalaman yang lebih baik.
