# Tahap 3: Super admin & data master

**Tanggal:** 18 November 2026 · **Branch:** `tahap-3-master` · **Status:** kode selesai, build Vercel berhasil; dicoba sungguhan setelah kredensial Admin SDK diisi di Vercel

## Tujuan

Super admin bisa mengelola akun petugas, data fasilitas (wisma, kamar, ruangan, kendaraan, titik denah), kategori pengaduan, dan tarif PNBP dari dashboard. Data awal bisa diimpor sekaligus dari CSV, dan setiap perubahan tercatat di log aktivitas.

## Yang dibuat

| Bagian | File |
| --- | --- |
| Super admin pertama tanpa skrip | `app/api/sesi/route.ts` (`SUPER_ADMIN_EMAILS`), `app/login/FormLogin.tsx` (ambil token baru sekali) |
| Definisi data master | `lib/master/definisi.ts`: satu sumber untuk kolom tabel, isian form, dan validasi |
| Validasi | `lib/master/skema.ts` (skema zod dibangun dari definisi), `lib/master/id.ts` (ID dokumen dari kode/nama) |
| API | `app/api/admin/master/[koleksi]/route.ts` (POST), `app/api/admin/master/[koleksi]/[id]/route.ts` (PATCH, DELETE). Khusus super admin, semua dicatat di `audit_log` |
| Tampilan | `components/TabelMaster.tsx` (tabel, pencarian, form tambah/ubah, konfirmasi hapus), `components/HalamanMaster.tsx` |
| Halaman | `/admin/master/[wisma\|kamar\|ruangan\|kendaraan\|lokasi_denah]` (tab), `/admin/kategori`, `/admin/tarif`, `/admin/pengguna`, `/admin/log` |
| Penjaga halaman | `lib/auth/halaman.ts`: role lain yang membuka halaman super admin dikembalikan ke `/admin` |
| Impor CSV | `scripts/impor-master.mjs`, `scripts/lib/csv-master.mjs`, data awal di `data/master/*.csv` |
| Tes | `tests/unit/impor-master.test.ts`: jenis kolom skrip = definisi, semua baris CSV lolos validasi, ID unik, setiap kamar merujuk wisma yang ada |

## Super admin pertama (cara baru, tanpa terminal)

1. Firebase Console → Authentication → Users → *Add user* (sudah Anda lakukan).
2. Di Vercel → Project → Settings → Environment Variables, tambahkan untuk *Production* dan *Preview*:

   | Variabel | Isi |
   | --- | --- |
   | `FIREBASE_ADMIN_CLIENT_EMAIL` | nilai `client_email` dari file JSON kunci |
   | `FIREBASE_ADMIN_PRIVATE_KEY` | nilai `private_key` dari file JSON (mulai `-----BEGIN PRIVATE KEY-----` sampai `-----END PRIVATE KEY-----\n`). Centang **Sensitive** |
   | `SUPER_ADMIN_EMAILS` | email akun yang tadi dibuat |

3. *Redeploy* deployment terbaru agar variabel terbaca.
4. Login di `/login`. Karena akun belum punya role dan emailnya ada di `SUPER_ADMIN_EMAILS`, server memberinya role `super_admin`, mencatatnya di `audit_log`, lalu langsung masuk.

File JSON kunci **tidak diunggah ke mana pun**. Buka di komputer (Notepad), salin dua nilainya ke Vercel, lalu simpan file itu di tempat aman. Jangan kirim lewat chat dan jangan masukkan ke repository.

`SUPER_ADMIN_EMAILS` hanya berlaku untuk akun **tanpa role**. Akun yang sudah punya role lain tidak berubah. Setelah super admin pertama jadi, variabel ini boleh dikosongkan.

## Impor & ekspor Excel (cara utama, tanpa terminal)

Di halaman **Data master**, **Kategori pengaduan**, atau **Tarif PNBP**, buka kotak *Impor & ekspor Excel*:

1. **Unduh** salah satu:
   - *Data saat ini (.xlsx)*: isi dashboard sekarang (`GET /api/admin/master/ekspor`);
   - *Template data awal*: `public/template-data-master.xlsx`, berisi daftar fasilitas dari denah (sama dengan isi `data/master/*.csv`).
2. **Edit di Excel.** Satu lembar per jenis data (Wisma, Kamar, Ruangan, Kendaraan, Titik denah, Kategori pengaduan, Tarif PNBP) plus lembar *Petunjuk*. Kolom pilihan punya dropdown; kolom Wisma di lembar Kamar memilih dari kode di lembar Wisma; kolom bertanda `*` wajib.
3. **Unggah**, pilih *Lewati* (hanya menambah) atau *Perbarui dengan isi Excel*, tekan **Periksa file**. Server membaca dan memvalidasi semua baris tanpa menyimpan apa pun, lalu menampilkan jumlah baru/diperbarui/dilewati dan daftar masalah per baris.
4. Bila tidak ada masalah, tekan **Impor**. Bila ada satu masalah saja, tidak ada yang disimpan.

Aturan: wisma dan kendaraan dikenali dari kode, kamar dari nomor, lainnya dari nama. Menghapus baris di Excel tidak menghapus data di dashboard. Excel boleh memakai label ("Ruang rapat", "PNBP umum") maupun nilai teknis ("rapat", "umum"); angka boleh ditulis `150000`, `150.000`, atau `Rp 150000`. Setiap impor dicatat di log aktivitas.

File Excel dibuat dan dibaca tanpa pustaka tambahan (`lib/master/xlsx.ts`, hanya `node:zlib`); pemetaan kolom ada di `lib/master/excel.ts`, berdasarkan `lib/master/definisi.ts`, jadi kolom baru otomatis ikut muncul di Excel.

## Data awal (CSV)

Isi `data/master/` disusun dari denah dan rancangan UI. **Perlu dicek oleh Subbag Sarpras sebelum dipakai:**

| File | Isi | Yang perlu dicek |
| --- | --- | --- |
| `wisma.csv` | 28 wisma dengan kode dan posisi di denah | Nama, kode, dan jumlah kamar tiap wisma |
| `kamar.csv` | 156 kamar (MP 20, NS 16, BT 16, NA 8, SR 4, wisma lain 4), kapasitas 2 | **Jumlah dan nomor kamar masih perkiraan** |
| `ruangan.csv` | Aula Soekarno Hatta, R. Swasembada, Pendopo, Kebangkitan Nasional 1–3, Ruang kelas Garuda | Kapasitas dan fasilitas |
| `kendaraan.csv` | KD-01 s.d. KD-07 | Ganti kode dengan nomor polisi bila perlu |
| `lokasi_denah.csv` | 12 titik gedung, ibadah, olahraga | |
| `kategori_pengaduan.csv` | 10 kategori, unit tujuan, batas hari | Batas hari penyelesaian |
| `tarif.csv` | 6 layanan, **nilai 0 = belum diisi** | Isi tarif dan dasar hukum dari PP/PMK tarif PNBP yang berlaku |

Data yang sama tersedia sebagai template Excel (lihat bagian di atas). Format CSV: baris pertama nama kolom; daftar (fasilitas, pertanyaan tambahan) dipisah `|`; ya/tidak ditulis `ya` atau `tidak`; posisi denah di kolom `posisiX` dan `posisiY` (persen dari kiri dan atas gambar denah). File bisa dibuka dan disimpan dari Excel sebagai *CSV UTF-8*.

Cara lain untuk developer, lewat terminal (`.env.local` berisi kredensial Admin SDK):

```bash
npm install
npm run impor                 # data yang sudah ada dilewati
npm run impor -- --timpa      # perbarui data yang sudah ada dengan isi CSV
npm run impor -- --hanya tarif,kategori_pengaduan
npm run seed                  # ke emulator (jalankan npm run emulators dulu)
```

ID dokumen dibuat dari kode atau nama (`MP 104` → `mp-104`), sama dengan saat menambah lewat dashboard, jadi impor ulang tidak menggandakan data. Data juga bisa ditambah satu per satu dari dashboard tanpa CSV.

## Cara mencoba

| Langkah | Hasil yang diharapkan |
| --- | --- |
| Login pertama dengan email di `SUPER_ADMIN_EMAILS` | Langsung masuk sebagai super admin; `/admin/log` mencatat "Role super_admin ditetapkan otomatis …" |
| Data master → Wisma → Tambah wisma | Baris baru muncul; log mencatat "Menambah wisma …" |
| Tambah wisma dengan kode yang sudah ada | "Wisma dengan nama/kode itu sudah ada." |
| Kosongkan nama lalu Simpan | Pesan galat di bawah isian Nama |
| Hapus wisma yang masih punya kamar | Ditolak: "Wisma ini masih punya kamar…" |
| Tab Kamar → Tambah kamar | Pilihan wisma diambil dari data wisma |
| Tarif PNBP dengan nilai 0 | Tampil pill "Belum diisi" |
| Pengguna & role → Tambah petugas | Muncul tautan atur kata sandi + tombol Salin |
| Ubah role petugas lain | Tersimpan; petugas itu keluar dan perlu login ulang |
| Baris akun sendiri | Role dan tombol nonaktif terkunci |
| Login sebagai role lain, buka `/admin/tarif` | Dikembalikan ke `/admin` |
| Impor & ekspor Excel → Unduh template → unggah → Periksa | Ringkasan per lembar, tanpa masalah; tombol "Impor N data" muncul |
| Impor | Tabel terisi; log mencatat "Impor Excel Wisma: … baru" |
| Ubah satu status jadi "Rusak" di Excel, unggah, Periksa | Masalah "Status: "Rusak" tidak ada di pilihan…" dengan nomor barisnya; tidak ada yang disimpan |
| Unduh data saat ini | File berisi data dashboard, siap diedit dan diunggah lagi dengan mode Perbarui |

## Keputusan

- **Satu definisi untuk semua data master.** Tabel, form, validasi zod, dan skrip impor membaca daftar field yang sama, sehingga menambah kolom cukup di satu tempat (`lib/master/definisi.ts`, lalu `scripts/lib/csv-master.mjs`; tes unit memastikan keduanya sama).
- **Penulisan data master lewat server**, bukan langsung dari browser, agar setiap perubahan pasti tercatat di `audit_log` dengan nama petugasnya.
- **Hapus = hapus permanen**, dengan konfirmasi. Untuk fasilitas yang sementara tidak dipakai, gunakan isian *Aktif / Bisa dipinjam*. Wisma yang masih punya kamar tidak bisa dihapus.
- **Status kamar dan kendaraan** bisa diatur super admin di sini sebagai data awal; perubahan harian dikerjakan admin modul di Tahap 6 dan 8.
- **Foto fasilitas** belum ada di form; menyusul di Tahap 4 bersama katalog publik (unggah ke Cloudinary).
- **Excel sebagai jalur edit massal.** Dipilih karena Sarpras terbiasa dengan Excel. Impor bersifat semua-atau-tidak-sama-sekali agar data tidak setengah masuk.
- **Kategori dan tarif** punya menu sendiri (sesuai menu super admin di spesifikasi); wisma, kamar, ruangan, kendaraan, dan titik denah digabung di halaman Data master dengan tab.

## Hasil pengecekan

| Cek | Hasil |
| --- | --- |
| Sintaks TypeScript semua file | Lolos (pemeriksaan lokal) |
| Skrip CSV dijalankan pada `data/master/` | 28 wisma, 156 kamar, 7 ruangan, 7 kendaraan, 12 titik, 10 kategori, 6 tarif; semua ID unik |
| Template Excel dibuka openpyxl dan LibreOffice | 8 lembar, header beku, dropdown terbaca |
| Template disimpan ulang oleh LibreOffice (format Excel standar: sharedStrings + kompresi) lalu dibaca kembali | 226 baris, 0 perbedaan dengan data CSV |
| Build Vercel (lint + type check) | Berhasil (commit `05ac382`, termasuk fitur Excel; galat tipe dan lint di build sebelumnya sudah diperbaiki) |
| `npm run test`, `npm run test:rules` | Belum dijalankan (lingkungan pengembangan ini tidak punya akses npm). Jalankan di komputer Anda |

## Belum selesai / tahap berikutnya

- Isi `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `SUPER_ADMIN_EMAILS` di Vercel, lalu login.
- Pasang security rules: `npx firebase deploy --only firestore:rules`.
- Verifikasi data awal dengan Sarpras (edit template Excel), lalu impor dari dashboard.
- Menu *Pengaturan layar* (`/admin/layar`) dibuat di Tahap 9.
- Tahap 4: tampilan publik (katalog dengan foto, denah interaktif, jadwal).
