# Tahap 1 — Kerangka proyek

**Tanggal:** 18 November 2026 · **Branch:** `tahap-1-kerangka` · **Status:** selesai, build Vercel berhasil

## Tujuan

Menyiapkan fondasi proyek Next.js yang bisa di-deploy ke Vercel, sesuai bagian *Arsitektur* dan *Aturan desain UI* di spesifikasi. Belum ada fitur bisnis.

## Yang dibuat

| Bagian | File | Keterangan |
| --- | --- | --- |
| Konfigurasi | `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vercel.json` | Next.js 15 (App Router), TypeScript strict, ESLint, preset Next.js di Vercel |
| Desain | `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx` | Token warna dari spesifikasi, font Plus Jakarta Sans dan JetBrains Mono |
| Layout publik | `app/(publik)/layout.tsx`, `app/(publik)/page.tsx` | Header, navigasi, footer, beranda kerangka |
| Layout admin | `app/admin/layout.tsx`, `components/Sidebar.tsx` | Sidebar dengan menu per role |
| Role | `lib/roles.ts` | Satu-satunya sumber daftar role dan menu |
| Komponen | `components/Logo.tsx`, `StatusPill.tsx`, `StatCard.tsx` | Komponen dasar |
| Firebase | `lib/firebase/client.ts`, `lib/firebase/admin.ts`, `firebase.json`, `.firebaserc` | Klien browser, Admin SDK (server only), emulator Auth + Firestore |
| Keamanan | `firestore.rules` | Semua akses ditolak sampai Tahap 2 |
| Tes | `vitest.config.ts`, `tests/unit/roles.test.ts` | Tes daftar role |
| Lain-lain | `.env.example`, `.gitignore`, `README.md`, `CLAUDE.md` | Panduan menjalankan dan aturan kerja |

## Masalah saat deploy dan perbaikannya

| Masalah | Penyebab | Perbaikan |
| --- | --- | --- |
| `npm install` gagal (ERESOLVE) | `@firebase/rules-unit-testing` 5.x hanya menerima `firebase` ^12, sedangkan proyek memakai ^13 | `firebase` diturunkan ke ^12 (API sama) |
| Build gagal mencari folder `public` | Proyek Vercel dibuat saat repo baru berisi README, sehingga preset terdeteksi "Other" | `vercel.json` menetapkan `"framework": "nextjs"` |
| Peringatan versi Node | `engines.node` bernilai `>=20` | Dikunci ke `22.x` |

## Hasil pengecekan

- Build Vercel: kompilasi, lint, dan pengecekan tipe berhasil; 4 halaman ter-render (`/`, `/login`, `/admin`, `/_not-found`).
- Halaman `/` dan `/admin` dibuka di preview dan tampil dengan isi yang benar.

## Keputusan

- Tailwind 3.4 dipakai (bukan v4) agar token tetap di `tailwind.config.ts` sesuai `CLAUDE.md`.
- Alamat produksi: `dashboard-bbpk-jogja.vercel.app` (dipakai selama uji coba).

## Belum dikerjakan

- `/admin` masih terbuka tanpa login (ditutup di Tahap 2).
