# Tahap 2 — Login, role, dan security rules

**Tanggal:** 18 November 2026 · **Branch:** `tahap-2-login` · **Status:** build Vercel berhasil; login sungguhan menunggu kredensial Admin SDK di Vercel

## Tujuan

Petugas masuk dengan akun masing-masing, `/admin` tertutup untuk yang belum login, menu mengikuti role, super admin bisa membuat dan mengatur akun, dan Firestore dijaga security rules untuk semua koleksi.

## Cara kerja login

1. Petugas mengisi email dan kata sandi di `/login`. Browser login ke Firebase Auth.
2. Browser mengirim ID token ke `POST /api/sesi`. Server memeriksa token, memastikan login baru terjadi (maks. 5 menit) dan akun punya role.
3. Server memasang cookie `sesi` (httpOnly, tidak bisa dibaca JavaScript) yang berlaku **8 jam**.
4. Setiap membuka `/admin`:
   - `middleware.ts` menolak bila cookie tidak ada (langsung ke `/login`);
   - `app/admin/layout.tsx` memverifikasi cookie dengan Admin SDK, termasuk apakah sudah dicabut.
5. **Keluar** menghapus cookie dan mencabut semua sesi akun tersebut.

Akun dinonaktifkan atau role-nya diubah → sesinya dicabut, sehingga langsung keluar dari dashboard dan role baru berlaku saat login berikutnya.

## Yang dibuat

| Bagian | File |
| --- | --- |
| Sesi | `app/api/sesi/route.ts`, `lib/auth/sesi.ts`, `lib/auth/konstanta.ts`, `middleware.ts` |
| Halaman login | `app/login/page.tsx`, `app/login/FormLogin.tsx` (pesan galat berbahasa Indonesia, lupa kata sandi) |
| Dashboard | `app/admin/layout.tsx` (sidebar dari role), `app/admin/page.tsx` (sapaan + pintasan menu), `components/TombolKeluar.tsx` |
| API super admin | `app/api/admin/pengguna/route.ts` (GET daftar, POST buat akun), `app/api/admin/pengguna/[uid]/route.ts` (PATCH role / aktif) |
| Pendukung | `lib/auth/guard.ts` (cek role di API), `lib/audit.ts` (tulis `audit_log`), `lib/schema/pengguna.ts` (validasi zod) |
| Skrip | `scripts/set-role.mjs` → `npm run set-role -- <email> <role>` |
| Security rules | `firestore.rules` (semua koleksi di spesifikasi) |
| Tes | `tests/rules/firestore.rules.test.ts` (24 kasus lintas role), `tests/unit/skrip-role.test.ts` |
| Firebase | `lib/firebase/client.ts` dan `admin.ts` kini diinisialisasi saat dipakai, agar build tidak gagal bila env belum diisi |

## Langkah yang perlu dilakukan sekali (oleh Anda)

1. **Buat kunci Admin SDK.** Firebase Console → Project settings → Service accounts → *Generate new private key*. Simpan file JSON-nya di tempat aman. Jangan dikirim lewat chat atau di-commit.
2. **Isi di Vercel.** Project → Settings → Environment Variables, untuk *Production* dan *Preview*:
   - `FIREBASE_ADMIN_CLIENT_EMAIL` = nilai `client_email` dari file JSON;
   - `FIREBASE_ADMIN_PRIVATE_KEY` = nilai `private_key` (tempel apa adanya), tandai **Sensitive**.

   Variabel `NEXT_PUBLIC_FIREBASE_*` dan `FIREBASE_ADMIN_PROJECT_ID` sudah diisi.
3. **Isi juga di `.env.local`** di komputer Anda (untuk skrip).
4. **Buat super admin pertama:**
   - Firebase Console → Authentication → Users → *Add user* (email dinas + kata sandi sementara);
   - di folder proyek: `npm install` lalu `npm run set-role -- email@anda super_admin`.
5. **Pasang security rules:** `npx firebase deploy --only firestore:rules` (login dulu dengan `npx firebase login`). Saat ini rules di Firebase masih bawaan saat database dibuat.
6. Setelah itu, *Redeploy* preview terbaru di Vercel agar variabel baru terbaca.

## Cara mencoba

| Langkah | Hasil yang diharapkan |
| --- | --- |
| Buka `/admin` tanpa login | Diarahkan ke `/login` |
| Login dengan email/sandi salah | "Email atau kata sandi salah." |
| Login dengan akun tanpa role | "Akun Anda belum diberi role. Hubungi super admin." |
| Login sebagai super admin | Masuk dashboard, sidebar menu super admin, sapaan nama |
| Buka `/login` saat sudah masuk | Langsung ke `/admin` |
| Tekan **Keluar** | Kembali ke `/login`; `/admin` tertutup lagi |
| Isi email lalu **Lupa kata sandi?** | Pesan tautan terkirim (email dari Firebase) |

API pengguna dicoba lewat dashboard di Tahap 3 (halaman *Pengguna & role*). Sampai saat itu, role akun lain bisa diatur dengan `npm run set-role`.

## Keputusan dan perbedaan dari spesifikasi

Dicatat juga di dokumen spesifikasi.

- **Sesi 8 jam** dengan cookie httpOnly (spesifikasi belum menyebut lama sesi).
- **Akun nonaktif** memakai fitur *disabled* Firebase Auth + pencabutan token, bukan dicek di rules.
- **Dibuat lebih ketat dari spesifikasi:**
  - `pengaduan`: unit penangan hanya bisa membaca tiket miliknya (spesifikasi: semua petugas yang login);
  - `pengaduan_publik`: hanya bisa dibaca per kode tiket, tidak bisa didaftar semua;
  - `users`: petugas hanya bisa membaca dokumen akunnya sendiri.
- **Akun baru** mendapat tautan atur kata sandi yang diberikan super admin; pengiriman email otomatis menunggu Tahap 10.
- **Peminjaman ruang** boleh ditulis admin sesuai tipe ruangan (sesuai tabel rules di spesifikasi). Cek bentrok tetap dijalankan di server pada Tahap 7.

## Hasil pengecekan

- Sintaks semua file TypeScript diperiksa; skrip `set-role.mjs` lolos `node --check`; tanda kurung `firestore.rules` seimbang.
- Tes `skrip-role` (daftar role di skrip = `lib/roles.ts`) lulus.
- Build Vercel branch `tahap-2-login` berhasil (READY): kompilasi, lint, dan pengecekan tipe lolos.
- Di preview: membuka `/admin` tanpa login diarahkan ke `/login`, dan halaman login tampil dengan form, tombol lupa kata sandi, dan tombol masuk.
- Login sungguhan belum bisa dicoba sampai `FIREBASE_ADMIN_CLIENT_EMAIL` dan `FIREBASE_ADMIN_PRIVATE_KEY` diisi di Vercel.
- **Belum dijalankan:** tes rules di emulator (butuh Java dan `npm install`, tidak tersedia di lingkungan pengembangan ini). Jalankan `npm run test:rules` di komputer Anda.

## Belum dikerjakan

- Halaman *Pengguna & role* (UI) → Tahap 3.
- Verifikasi dua langkah untuk super admin dan bendahara → sebelum go-live.
- App Check untuk form publik → Tahap 5.
