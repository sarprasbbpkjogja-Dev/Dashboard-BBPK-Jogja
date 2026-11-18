# Dashboard Fasilitas BBPKA PDN III

Website monitoring dan pengelolaan fasilitas balai: asrama (dengan pembayaran PNBP), ruang rapat & aula, ruang kelas, kendaraan dinas, dan pengaduan. Ada tampilan publik, layar TV/iPad, dan dashboard admin per role.

**Sumber kebenaran:** `docs/spesifikasi.md`. Baca dulu bagian yang relevan sebelum menulis kode. Jika permintaan bertentangan dengan spesifikasi, tanyakan dulu; jangan menebak. Setelah mengubah perilaku, perbarui bagian spesifikasi yang terkait.

## Stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- Firebase Authentication (email/password, custom claim `role`)
- Cloud Firestore, region `asia-southeast2`
- Firebase Admin SDK hanya di server (route handler / server action), tidak pernah di client
- Foto: Cloudinary (signed upload lewat API route). Video: embed YouTube
- Hosting: Vercel (preview per branch, produksi dari `main`)

## Struktur folder

```
app/
  (publik)/            beranda, katalog, denah, pengaduan, lacak/[kode]
  layar/[perangkat]/   tampilan TV/iPad, tanpa login, real-time
  login/
  admin/               layout sidebar; submenu per modul
  api/                 route handler server (Admin SDK)
components/            komponen UI bersama (Sidebar, StatCard, StatusPill, Modal, Toast, ...)
lib/
  firebase/client.ts   inisialisasi SDK client
  firebase/admin.ts    inisialisasi Admin SDK (server only)
  roles.ts             daftar role + menu per role (satu-satunya sumber)
  schema/              tipe TypeScript + validasi (zod) per koleksi
firestore.rules
tests/rules/           tes security rules (@firebase/rules-unit-testing)
scripts/               impor data master, seed emulator
docs/spesifikasi.md
```

## Aturan kode

- Nama koleksi, field, status, dan role persis seperti di `docs/spesifikasi.md` (bahasa Indonesia, camelCase untuk field).
- Semua tulisan ke Firestore divalidasi dengan skema zod di `lib/schema/`.
- Aksi sensitif berjalan di server: mengatur role, cek bentrok jadwal, memilih kamar otomatis, sinkronisasi koleksi publik (`jadwal_publik`, `ringkasan`, `pengaduan_publik`), dan menulis `audit_log`. Gunakan transaction untuk cek bentrok dan perubahan status kamar.
- Data pribadi (nama pemohon, kontak pelapor, NTPN) tidak boleh masuk ke koleksi publik.
- Setiap perubahan status tiket ditambahkan ke `riwayat` dan `audit_log`.
- UI berbahasa Indonesia. Status selalu ditampilkan sebagai teks dalam pill, bukan warna saja. Target sentuh minimal 44 px, setiap input punya label.
- Token warna dan font ada di `tailwind.config.ts` (lihat bagian "Aturan desain UI" di spesifikasi). Jangan memakai warna hex langsung di komponen.
- Foto dikompres di browser sebelum diunggah (maks. 1600 px).
- Jangan commit rahasia. Semua kunci lewat environment variables; perbarui `.env.example` bila menambah variabel.

## Perintah

```
npm run dev          # Next.js lokal
npm run emulators    # Firebase Emulator (Auth + Firestore)
npm run seed         # isi emulator dengan data contoh
npm run test         # unit test
npm run test:rules   # tes security rules di emulator
npm run lint
npm run build
```

Sebelum menyatakan pekerjaan selesai: jalankan `lint`, `test`, `test:rules`, dan `build`, lalu laporkan hasilnya.

## Cara bekerja

- Kerjakan satu tahap dari bagian "Urutan pengerjaan" di spesifikasi per sesi, di branch tersendiri.
- Mulai dengan rencana singkat (file yang akan dibuat atau diubah), lalu kerjakan.
- Jika menemukan keputusan yang belum ada di spesifikasi (lihat "Asumsi & keputusan yang masih terbuka"), berhenti dan tanyakan.
