// Menerjemahkan data master ↔ lembar Excel, berdasarkan lib/master/definisi.ts.
// Excel memakai label yang mudah dibaca ("Ruang rapat", "PNBP umum", "ya"/"tidak");
// saat diimpor, label maupun nilai teknis ("rapat", "umum", true) sama-sama diterima.
import { definisi, KOLEKSI_MASTER, type Field, type KoleksiMaster } from "@/lib/master/definisi";
import { buatSlug } from "@/lib/master/id";
import type { Lembar, NilaiSel } from "@/lib/master/xlsx";

type Baris = { id: string } & Record<string, unknown>;

/** Kolom Excel untuk satu field. Field posisi menjadi dua kolom (X dan Y). */
type KolomExcel = { judul: string; field: Field; bagian?: "x" | "y"; lebar: number; alias: string[] };

function kolomExcel(koleksi: KoleksiMaster): KolomExcel[] {
  const hasil: KolomExcel[] = [];
  for (const f of definisi(koleksi).field) {
    if (f.jenis === "posisi") {
      hasil.push({ judul: "Posisi denah X (%)", field: f, bagian: "x", lebar: 14, alias: ["posisix"] });
      hasil.push({ judul: "Posisi denah Y (%)", field: f, bagian: "y", lebar: 14, alias: ["posisiy"] });
      continue;
    }
    const judul = f.jenis === "relasi" ? `${f.label} (kode)` : f.label;
    const lebar =
      f.jenis === "teksPanjang" || f.jenis === "daftar" ? 44
      : f.jenis === "teks" ? Math.max(16, Math.min(36, f.label.length + 14))
      : f.jenis === "pilihan" ? 22
      : 14;
    hasil.push({ judul, field: f, lebar, alias: [f.nama.toLowerCase(), f.label.toLowerCase()] });
  }
  return hasil;
}

function normal(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Nama lembar untuk setiap koleksi. */
export function namaLembar(koleksi: KoleksiMaster): string {
  return definisi(koleksi).judul;
}

export function koleksiDariLembar(nama: string): KoleksiMaster | null {
  const n = normal(nama);
  return KOLEKSI_MASTER.find((k) => normal(namaLembar(k)) === n || k === n) ?? null;
}

// ---------- ekspor ----------

function keSel(f: Field, v: unknown, kodeWisma: Map<string, string>): NilaiSel {
  if (v === undefined || v === null) return null;
  switch (f.jenis) {
    case "pilihan":
      return f.pilihan?.find((p) => p.nilai === v)?.label ?? String(v);
    case "relasi":
      return kodeWisma.get(String(v)) ?? String(v);
    case "daftar":
      return Array.isArray(v) ? v.join("; ") : String(v);
    case "yaTidak":
      return v ? "ya" : "tidak";
    case "angka":
      return typeof v === "number" ? v : Number(v);
    default:
      return String(v);
  }
}

/** Lembar-lembar Excel berisi data saat ini, dengan dropdown untuk kolom pilihan. */
export function buatLembarMaster(data: Record<KoleksiMaster, Baris[]>): Lembar[] {
  const kodeWisma = new Map((data.wisma ?? []).map((w) => [w.id, String(w.kode ?? w.id)]));
  return KOLEKSI_MASTER.map((koleksi) => {
    const kolom = kolomExcel(koleksi);
    const baris = (data[koleksi] ?? []).map((b) =>
      kolom.map((k) => {
        const v = b[k.field.nama];
        if (k.bagian) {
          const p = v as { x?: number; y?: number } | null | undefined;
          return p ? (p[k.bagian] ?? null) : null;
        }
        return keSel(k.field, v, kodeWisma);
      }),
    );
    const validasi = kolom.flatMap((k, i) => {
      const f = k.field;
      if (f.jenis === "pilihan") return [{ kolom: i, daftar: (f.pilihan ?? []).map((p) => p.label), pesan: `Pilih dari daftar ${f.label}.` }];
      if (f.jenis === "yaTidak") return [{ kolom: i, daftar: ["ya", "tidak"], pesan: "Isi ya atau tidak." }];
      if (f.jenis === "relasi" && f.relasi === "wisma") {
        return [{ kolom: i, rentang: `'${namaLembar("wisma")}'!$B$2:$B$1000`, pesan: "Pilih kode wisma dari lembar Wisma." }];
      }
      return [];
    });
    return {
      nama: namaLembar(koleksi),
      kolom: kolom.map((k) => ({ judul: k.judul + (k.field.wajib ? " *" : ""), lebar: k.lebar })),
      baris,
      validasi,
    };
  });
}

/** Lembar petunjuk di depan file Excel. */
export function lembarPetunjuk(): Lembar {
  const baris: NilaiSel[][] = [
    ["Template data master · Dashboard Fasilitas BBPKA PDN III"],
    [""],
    ["Cara memakai"],
    ["1. Edit, tambah, atau hapus baris di lembar Wisma, Kamar, Ruangan, Kendaraan, Titik denah, Kategori pengaduan, dan Tarif PNBP."],
    ["2. Jangan ubah nama lembar dan judul kolom (baris pertama). Kolom bertanda * wajib diisi."],
    ["3. Kolom dengan dropdown: pilih dari daftar. Ya/tidak: isi ya atau tidak."],
    ["4. Daftar (fasilitas, pertanyaan tambahan): pisahkan dengan titik koma, mis. Proyektor; AC; Papan tulis."],
    ["5. Kamar: kolom Wisma diisi KODE wisma (mis. MP) yang ada di lembar Wisma."],
    ["6. Posisi denah: persen dari kiri (X) dan atas (Y) gambar denah, 0–100. Boleh dikosongkan."],
    ["7. Tarif: isi angka tanpa titik/Rp, mis. 150000. Isi 0 bila belum ditetapkan."],
    ["8. Simpan sebagai .xlsx, lalu di dashboard: Data master → Impor dari Excel → pilih file → Periksa → Impor."],
    [""],
    ["Pengenal data"],
    ["Wisma dan kendaraan dikenali dari KODE; kamar dari nomor kamar; lainnya dari nama. Mengganti kode/nama dianggap data baru."],
    ["Saat impor, pilih: lewati data yang sudah ada (hanya menambah) atau perbarui data yang sudah ada dengan isi Excel."],
    ["Menghapus baris di Excel TIDAK menghapus data di dashboard. Hapus lewat tombol Hapus di dashboard."],
    [""],
    ["Contoh baris Kamar:  Wisma (kode) = MP · Nomor kamar = MP 101 · Kapasitas = 2 · Status = Kosong"],
    ["Contoh baris Tarif:  Layanan = Sewa kamar asrama standar · Jenis PNBP = PNBP umum · Satuan = per malam · Tarif = 150000"],
  ];
  return { nama: "Petunjuk", kolom: [{ judul: "", lebar: 120 }], baris, header: false };
}

// ---------- impor ----------

export type HasilBaris = { nomorBaris: number; data: Record<string, unknown>; galat: string[] };

function cocokPilihan(f: Field, teks: string): string | null {
  const n = normal(teks);
  const p = (f.pilihan ?? []).find((x) => normal(x.nilai) === n || normal(x.label) === n);
  return p ? p.nilai : null;
}

function keAngka(teks: string): number | null {
  let t = teks.trim().replace(/^rp\.?\s*/i, "").replace(/\s/g, "");
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, "").replace(",", "."); // 150.000 / 1.250,5
  else t = t.replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * Ubah satu lembar (baris pertama = judul kolom) menjadi dokumen. Nilai yang tidak bisa dibaca
 * dicatat sebagai galat per baris; validasi lengkap (wajib, rentang) dilakukan dengan zod di server.
 */
export function bacaLembarMaster(koleksi: KoleksiMaster, tabel: string[][]): { baris: HasilBaris[]; galatKolom: string[] } {
  const kolom = kolomExcel(koleksi);
  const [judul = [], ...isi] = tabel;
  const posisi = new Map<KolomExcel, number>();
  const galatKolom: string[] = [];
  for (const k of kolom) {
    const kandidat = [normal(k.judul), ...k.alias.map(normal)];
    const i = judul.findIndex((j) => kandidat.includes(normal(j.replace(/\s*\*\s*$/, ""))));
    if (i >= 0) posisi.set(k, i);
    else if (k.field.wajib) galatKolom.push(`Kolom "${k.judul}" tidak ditemukan.`);
  }

  const baris: HasilBaris[] = [];
  isi.forEach((r, ri) => {
    if (!r.some((v) => v.trim() !== "")) return;
    const data: Record<string, unknown> = {};
    const galat: string[] = [];
    const posisiXY: Record<string, { x?: number; y?: number }> = {};
    for (const k of kolom) {
      const i = posisi.get(k);
      if (i === undefined) continue;
      const teks = (r[i] ?? "").trim();
      const f = k.field;
      if (k.bagian) {
        if (teks === "") continue;
        const n = keAngka(teks);
        if (n === null) galat.push(`${k.judul}: "${teks}" bukan angka.`);
        else (posisiXY[f.nama] ??= {})[k.bagian] = n;
        continue;
      }
      switch (f.jenis) {
        case "teks":
        case "teksPanjang":
          data[f.nama] = teks;
          break;
        case "angka": {
          const n = teks === "" ? (f.min ?? 0) : keAngka(teks);
          if (n === null) galat.push(`${f.label}: "${teks}" bukan angka.`);
          else data[f.nama] = n;
          break;
        }
        case "pilihan": {
          if (teks === "") {
            if (f.wajib) galat.push(`${f.label} wajib diisi.`);
            break;
          }
          const v = cocokPilihan(f, teks);
          if (v === null) galat.push(`${f.label}: "${teks}" tidak ada di pilihan (${(f.pilihan ?? []).map((p) => p.label).join(", ")}).`);
          else data[f.nama] = v;
          break;
        }
        case "daftar":
          data[f.nama] = teks ? teks.split(/[;|\n]/).map((s) => s.trim()).filter(Boolean) : [];
          break;
        case "yaTidak": {
          const n = normal(teks);
          if (teks === "" || ["ya", "y", "true", "1", "aktif"].includes(n)) data[f.nama] = true;
          else if (["tidak", "t", "false", "0", "nonaktif"].includes(n)) data[f.nama] = false;
          else galat.push(`${f.label}: isi ya atau tidak (tertulis "${teks}").`);
          break;
        }
        case "relasi":
          data[f.nama] = buatSlug(teks);
          break;
        case "posisi":
          break;
      }
    }
    for (const f of definisi(koleksi).field) {
      if (f.jenis !== "posisi") continue;
      const p = posisiXY[f.nama];
      if (!p) data[f.nama] = null;
      else if (p.x === undefined || p.y === undefined) galat.push("Posisi denah: isi X dan Y, atau kosongkan keduanya.");
      else data[f.nama] = { x: p.x, y: p.y };
    }
    baris.push({ nomorBaris: ri + 2, data, galat });
  });
  return { baris, galatKolom };
}

/** ID dokumen, sama dengan API tambah data dan skrip impor CSV. */
export function idDariData(koleksi: KoleksiMaster, data: Record<string, unknown>): string {
  if (typeof data.kode === "string" && data.kode) return buatSlug(data.kode);
  return buatSlug(String(data[definisi(koleksi).fieldNama] ?? ""));
}
