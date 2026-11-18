// Definisi data master yang dikelola super admin. Satu sumber untuk:
// validasi (lib/master/skema.ts), API (app/api/admin/master), dan tampilan tabel + form.
// Nama koleksi dan field mengikuti "Model data Firestore" di docs/spesifikasi.md.
import { ROLE_LABEL, type Role } from "@/lib/roles";

export type Pilihan = { nilai: string; label: string };

/** Koleksi master yang dikelola super admin (ditulis eksplisit agar tidak melingkar dengan MASTER). */
export type KoleksiMaster = "wisma" | "kamar" | "ruangan" | "kendaraan" | "lokasi_denah" | "kategori_pengaduan" | "tarif";

export type Field = {
  nama: string;
  label: string;
  jenis: "teks" | "teksPanjang" | "angka" | "pilihan" | "daftar" | "yaTidak" | "posisi" | "relasi";
  wajib?: boolean;
  pilihan?: Pilihan[];
  /** Untuk jenis "relasi": koleksi yang dirujuk (ditampilkan memakai field "nama"/"nomor"). */
  relasi?: KoleksiMaster;
  min?: number;
  max?: number;
  bantuan?: string;
  /** Tampil sebagai kolom di tabel. */
  tabel?: boolean;
  format?: "rupiah";
};

export type DefinisiMaster = {
  judul: string;
  deskripsi: string;
  tunggal: string;
  field: Field[];
  /** Field yang dipakai sebagai nama baris (judul di tabel, catatan audit). */
  fieldNama: string;
  urutkan: string;
};

const UNIT_PENANGAN: Role[] = [
  "admin_asrama",
  "admin_ruang_rapat",
  "admin_ruang_kelas",
  "admin_kendaraan",
  "pranata_komputer",
  "petugas_umum",
  "petugas_keamanan",
];

const posisi: Field = {
  nama: "posisiDenah",
  label: "Posisi di denah (%)",
  jenis: "posisi",
  bantuan: "Persentase dari kiri (x) dan atas (y) gambar denah, 0–100. Boleh dikosongkan.",
};

export const MASTER = {
  wisma: {
    judul: "Wisma",
    tunggal: "wisma",
    deskripsi: "Gedung asrama peserta. Kamar di setiap wisma dikelola di tab Kamar.",
    fieldNama: "nama",
    urutkan: "nama",
    field: [
      { nama: "nama", label: "Nama wisma", jenis: "teks", wajib: true, tabel: true },
      { nama: "kode", label: "Kode", jenis: "teks", wajib: true, tabel: true, bantuan: "2–4 huruf, dipakai di nomor kamar (contoh: MP)." },
      { nama: "jumlahKamar", label: "Jumlah kamar", jenis: "angka", min: 0, max: 500, tabel: true },
      { nama: "fasilitas", label: "Fasilitas", jenis: "daftar", bantuan: "Satu fasilitas per baris." },
      { nama: "aktif", label: "Aktif dipakai", jenis: "yaTidak", tabel: true },
      posisi,
    ],
  },
  kamar: {
    judul: "Kamar",
    tunggal: "kamar",
    deskripsi: "Kamar per wisma. Status harian diubah oleh admin asrama.",
    fieldNama: "nomor",
    urutkan: "nomor",
    field: [
      { nama: "wismaId", label: "Wisma", jenis: "relasi", relasi: "wisma", wajib: true, tabel: true },
      { nama: "nomor", label: "Nomor kamar", jenis: "teks", wajib: true, tabel: true, bantuan: "Contoh: MP 104." },
      { nama: "kapasitas", label: "Kapasitas (orang)", jenis: "angka", min: 1, max: 10, tabel: true },
      {
        nama: "status",
        label: "Status",
        jenis: "pilihan",
        wajib: true,
        tabel: true,
        pilihan: [
          { nilai: "kosong", label: "Kosong" },
          { nilai: "terisi", label: "Terisi" },
          { nilai: "dipesan", label: "Dipesan" },
          { nilai: "perbaikan", label: "Perbaikan" },
        ],
      },
    ],
  },
  ruangan: {
    judul: "Ruangan",
    tunggal: "ruangan",
    deskripsi: "Ruang rapat, aula, dan ruang kelas yang bisa dipinjam.",
    fieldNama: "nama",
    urutkan: "nama",
    field: [
      { nama: "nama", label: "Nama ruangan", jenis: "teks", wajib: true, tabel: true },
      {
        nama: "tipe",
        label: "Tipe",
        jenis: "pilihan",
        wajib: true,
        tabel: true,
        pilihan: [
          { nilai: "rapat", label: "Ruang rapat" },
          { nilai: "aula", label: "Aula" },
          { nilai: "kelas", label: "Ruang kelas" },
        ],
        bantuan: "Menentukan admin yang mengelola: rapat/aula → admin ruang rapat, kelas → admin ruang kelas.",
      },
      { nama: "gedung", label: "Gedung", jenis: "teks", tabel: true },
      { nama: "kapasitas", label: "Kapasitas (orang)", jenis: "angka", min: 1, max: 2000, tabel: true },
      { nama: "fasilitas", label: "Fasilitas", jenis: "daftar", bantuan: "Satu fasilitas per baris." },
      { nama: "aktif", label: "Bisa dipinjam", jenis: "yaTidak", tabel: true },
      posisi,
    ],
  },
  kendaraan: {
    judul: "Kendaraan",
    tunggal: "kendaraan",
    deskripsi: "Armada kendaraan dinas.",
    fieldNama: "nama",
    urutkan: "kode",
    field: [
      { nama: "nama", label: "Nama / jenis", jenis: "teks", wajib: true, tabel: true },
      { nama: "kode", label: "Kode unit", jenis: "teks", wajib: true, tabel: true, bantuan: "Contoh: KD-01 atau nomor polisi." },
      { nama: "kursi", label: "Jumlah kursi", jenis: "angka", min: 1, max: 60, tabel: true },
      {
        nama: "status",
        label: "Status",
        jenis: "pilihan",
        wajib: true,
        tabel: true,
        pilihan: [
          { nilai: "tersedia", label: "Tersedia" },
          { nilai: "dipakai", label: "Dipakai" },
          { nilai: "servis", label: "Servis" },
        ],
      },
    ],
  },
  lokasi_denah: {
    judul: "Titik denah",
    tunggal: "titik denah",
    deskripsi: "Titik di denah selain wisma dan ruangan: gedung layanan, ibadah, olahraga.",
    fieldNama: "nama",
    urutkan: "nama",
    field: [
      { nama: "nama", label: "Nama lokasi", jenis: "teks", wajib: true, tabel: true },
      {
        nama: "kategori",
        label: "Kategori",
        jenis: "pilihan",
        wajib: true,
        tabel: true,
        pilihan: [
          { nilai: "gedung", label: "Gedung & layanan" },
          { nilai: "lain", label: "Ibadah & olahraga" },
        ],
      },
      { nama: "keterangan", label: "Keterangan", jenis: "teksPanjang", tabel: true },
      posisi,
    ],
  },
  kategori_pengaduan: {
    judul: "Kategori pengaduan",
    tunggal: "kategori",
    deskripsi: "Pilihan di form pengaduan publik. Unit tujuan dipakai sebagai saran untuk ULA.",
    fieldNama: "nama",
    urutkan: "nama",
    field: [
      { nama: "nama", label: "Nama kategori", jenis: "teks", wajib: true, tabel: true },
      {
        nama: "kelompok",
        label: "Kelompok",
        jenis: "pilihan",
        wajib: true,
        tabel: true,
        pilihan: [
          { nilai: "fasilitas", label: "Fasilitas" },
          { nilai: "layanan umum", label: "Layanan umum" },
        ],
      },
      {
        nama: "unitTujuan",
        label: "Unit tujuan default",
        jenis: "pilihan",
        wajib: true,
        tabel: true,
        pilihan: UNIT_PENANGAN.map((r) => ({ nilai: r, label: ROLE_LABEL[r] })),
      },
      { nama: "batasHari", label: "Batas penyelesaian (hari)", jenis: "angka", min: 1, max: 30, tabel: true },
      { nama: "pertanyaanTambahan", label: "Pertanyaan tambahan", jenis: "daftar", bantuan: "Satu pertanyaan per baris. Tampil di form publik." },
    ],
  },
  tarif: {
    judul: "Tarif PNBP",
    tunggal: "tarif",
    deskripsi: "Dipakai modul asrama dan peminjaman untuk menghitung tagihan. Isi sesuai peraturan tarif PNBP yang berlaku.",
    fieldNama: "layanan",
    urutkan: "layanan",
    field: [
      { nama: "layanan", label: "Layanan", jenis: "teks", wajib: true, tabel: true },
      {
        nama: "jenisPnbp",
        label: "Jenis PNBP",
        jenis: "pilihan",
        wajib: true,
        tabel: true,
        pilihan: [
          { nilai: "umum", label: "PNBP umum" },
          { nilai: "bangkom", label: "PNBP bangkom" },
        ],
      },
      { nama: "satuan", label: "Satuan", jenis: "teks", wajib: true, tabel: true, bantuan: "Contoh: per malam, per hari, per peserta." },
      { nama: "nilai", label: "Tarif (Rp)", jenis: "angka", min: 0, max: 1_000_000_000, tabel: true, format: "rupiah", bantuan: "Isi 0 bila belum ditetapkan." },
      { nama: "dasarHukum", label: "Dasar hukum", jenis: "teks", tabel: true, bantuan: "Nomor PP/PMK tarif PNBP." },
    ],
  },
} satisfies Record<KoleksiMaster, DefinisiMaster>;

export const KOLEKSI_MASTER = Object.keys(MASTER) as KoleksiMaster[];

/** Tab di halaman Data master (kategori dan tarif punya menu sendiri). */
export const TAB_DATA_MASTER: KoleksiMaster[] = ["wisma", "kamar", "ruangan", "kendaraan", "lokasi_denah"];

export function isKoleksiMaster(v: string): v is KoleksiMaster {
  return v in MASTER;
}

export function definisi(koleksi: KoleksiMaster): DefinisiMaster {
  return MASTER[koleksi];
}
