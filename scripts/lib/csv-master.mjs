// Fungsi murni untuk impor data master dari CSV. Dipakai scripts/impor-master.mjs dan tes unit.
// Jenis kolom HARUS sama dengan lib/master/definisi.ts (dicek oleh tests/unit/impor-master.test.ts).

/** Jenis field per koleksi. "posisi" dibaca dari dua kolom CSV: posisiX dan posisiY. */
export const JENIS = {
  wisma: { nama: "teks", kode: "teks", jumlahKamar: "angka", fasilitas: "daftar", aktif: "yaTidak", posisiDenah: "posisi" },
  kamar: { wismaId: "relasi", nomor: "teks", kapasitas: "angka", status: "pilihan" },
  ruangan: { nama: "teks", tipe: "pilihan", gedung: "teks", kapasitas: "angka", fasilitas: "daftar", aktif: "yaTidak", posisiDenah: "posisi" },
  kendaraan: { nama: "teks", kode: "teks", kursi: "angka", status: "pilihan" },
  lokasi_denah: { nama: "teks", kategori: "pilihan", keterangan: "teksPanjang", posisiDenah: "posisi" },
  kategori_pengaduan: { nama: "teks", kelompok: "pilihan", unitTujuan: "pilihan", batasHari: "angka", pertanyaanTambahan: "daftar" },
  tarif: { layanan: "teks", jenisPnbp: "pilihan", satuan: "teks", nilai: "angka", dasarHukum: "teks" },
};

/** Urutan impor: wisma sebelum kamar karena kamar merujuk wisma. */
export const URUTAN = ["wisma", "kamar", "ruangan", "kendaraan", "lokasi_denah", "kategori_pengaduan", "tarif"];

/** Parser CSV sederhana (RFC 4180): koma, tanda kutip ganda, baris baru di dalam kutip. */
export function parseCsv(teks) {
  const baris = [];
  let sel = "";
  let row = [];
  let kutip = false;
  const s = teks.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (kutip) {
      if (c === '"' && s[i + 1] === '"') { sel += '"'; i++; }
      else if (c === '"') kutip = false;
      else sel += c;
    } else if (c === '"') kutip = true;
    else if (c === ",") { row.push(sel); sel = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(sel); sel = "";
      if (row.some((v) => v !== "")) baris.push(row);
      row = [];
    } else sel += c;
  }
  row.push(sel);
  if (row.some((v) => v !== "")) baris.push(row);
  const [kepala = [], ...isi] = baris;
  return isi.map((r) => Object.fromEntries(kepala.map((k, i) => [k.trim(), (r[i] ?? "").trim()])));
}

/** Ubah satu baris CSV (semua teks) menjadi dokumen dengan tipe yang benar. */
export function ubahBaris(koleksi, mentah) {
  const jenis = JENIS[koleksi];
  if (!jenis) throw new Error(`Koleksi tidak dikenal: ${koleksi}`);
  const hasil = {};
  for (const [nama, j] of Object.entries(jenis)) {
    if (j === "posisi") {
      const x = mentah.posisiX, y = mentah.posisiY;
      hasil[nama] = x && y ? { x: Number(x), y: Number(y) } : null;
      continue;
    }
    const v = mentah[nama] ?? "";
    if (j === "angka") hasil[nama] = v === "" ? 0 : Number(v);
    else if (j === "daftar") hasil[nama] = v ? v.split("|").map((s) => s.trim()).filter(Boolean) : [];
    else if (j === "relasi") hasil[nama] = buatSlug(v);
    else if (j === "yaTidak") hasil[nama] = ["ya", "y", "true", "1", "aktif"].includes(v.toLowerCase());
    else hasil[nama] = v;
  }
  return hasil;
}

/** Sama dengan lib/master/id.ts: "MP 104" → "mp-104". */
export function buatSlug(teks) {
  return String(teks)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const FIELD_NAMA = { kamar: "nomor", tarif: "layanan" };

/** ID dokumen sama dengan yang dibuat API saat menambah lewat dashboard: dari kode bila ada, selain itu dari nama. */
export function idDokumen(koleksi, data) {
  if (typeof data.kode === "string" && data.kode) return buatSlug(data.kode);
  return buatSlug(data[FIELD_NAMA[koleksi] ?? "nama"]);
}
