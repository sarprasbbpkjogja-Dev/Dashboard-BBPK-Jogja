# Dashboard Fasilitas BBPKA PDN III

Monitoring dan pengelolaan fasilitas balai: asrama, ruang rapat & aula, ruang kelas, kendaraan dinas, dan pengaduan.
Spesifikasi lengkap ada di [`docs/spesifikasi.md`](docs/spesifikasi.md); aturan kerja untuk Claude Code ada di [`CLAUDE.md`](CLAUDE.md).

Status: **Tahap 3 — super admin dan data master.** Catatan setiap tahap ada di [`docs/tahap/`](docs/tahap/README.md).

## Menjalankan di komputer sendiri

Kebutuhan: Node.js 22, dan Java 11+ untuk Firebase Emulator.

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya (lihat di bawah)
npm run dev                  # buka http://localhost:3000
```

Halaman yang sudah ada: `/` (beranda), `/login`, `/admin` (perlu login; menu sesuai role), dan untuk super admin: `/admin/pengguna`, `/admin/master`, `/admin/kategori`, `/admin/tarif`, `/admin/log`.

Super admin pertama: tambahkan akun di Firebase Console → Authentication, isi emailnya di `SUPER_ADMIN_EMAILS`, lalu login. Cara lain: `npm run set-role -- <email> super_admin`. Langkah lengkap: [`docs/tahap/tahap-3.md`](docs/tahap/tahap-3.md).

### Environment variables

| Variabel | Sumber | Catatan |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project settings → Your apps | Boleh terlihat di browser |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | `true` saat memakai emulator lokal | |
| `SUPER_ADMIN_EMAILS` | Email Anda (pisahkan dengan koma bila lebih dari satu) | Akun ini otomatis jadi super admin saat login pertama |
| `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` | Project settings → Service accounts → Generate new private key | **Rahasia.** Jangan di-commit, jangan diberi awalan `NEXT_PUBLIC_` |
| `CLOUDINARY_*` | Dashboard Cloudinary | Rahasia, dipakai mulai Tahap 5 |

Di Vercel, isi variabel yang sama di Project → Settings → Environment Variables. Untuk `FIREBASE_ADMIN_PRIVATE_KEY`, tempel isi kunci apa adanya (baris baru boleh ditulis sebagai `\n`).

### Emulator

```bash
npm run emulators            # Auth :9099, Firestore :8080, UI :4000
```

Set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` di `.env.local` agar aplikasi memakai emulator, bukan data asli.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | Pemeriksaan TypeScript |
| `npm run test` | Unit test |
| `npm run test:rules` | Tes security rules di emulator (butuh Java 11+) |
| `npm run set-role -- <email> <role>` | Menetapkan role akun (butuh kredensial Admin SDK di `.env.local`) |
| `npm run impor` | Impor data master dari `data/master/*.csv` ke Firestore (tambahkan `-- --timpa` untuk memperbarui). Tanpa terminal: Data master → Impor & ekspor Excel |
| `npm run seed` | Impor data yang sama ke emulator |

## Deploy ke Vercel

1. Push repository ke GitHub.
2. Di Vercel: Add New → Project → pilih repository. Framework terdeteksi otomatis sebagai Next.js.
3. Isi environment variables, lalu Deploy. Setiap branch baru mendapat preview deployment.
4. Tambahkan domain Vercel ke Firebase Console → Authentication → Settings → Authorized domains.
