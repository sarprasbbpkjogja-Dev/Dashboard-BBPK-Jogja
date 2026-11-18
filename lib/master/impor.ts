import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { catatAudit } from "@/lib/audit";
import { adminDb } from "@/lib/firebase/admin";
import { definisi, KOLEKSI_MASTER, type KoleksiMaster } from "@/lib/master/definisi";
import { bacaLembarMaster, idDariData, koleksiDariLembar, namaLembar } from "@/lib/master/excel";
import { skemaMaster } from "@/lib/master/skema";
import { bacaXlsx, GalatBerkas } from "@/lib/master/xlsx";

export type ModeImpor = "lewati" | "timpa";

export type RingkasanKoleksi = {
  koleksi: KoleksiMaster;
  lembar: string;
  baru: number;
  diperbarui: number;
  dilewati: number;
  galat: { baris: number; pesan: string }[];
};

export type HasilImpor = { ringkasan: RingkasanKoleksi[]; totalGalat: number; dijalankan: boolean; lembarDiabaikan: string[] };

const BATAS_BARIS = 5000;

/**
 * Memeriksa (dan bila diminta, menulis) isi file Excel data master.
 * Bila ada satu galat saja, tidak ada yang ditulis: perbaiki file lalu unggah lagi.
 */
export async function imporExcel(berkas: Uint8Array, mode: ModeImpor, jalankan: boolean, uid: string): Promise<HasilImpor> {
  let lembar: Map<string, string[][]>;
  try {
    lembar = bacaXlsx(berkas);
  } catch (e) {
    if (e instanceof GalatBerkas) throw e;
    throw new GalatBerkas("File tidak bisa dibaca. Pastikan disimpan dari Excel sebagai .xlsx (bukan .xls atau .csv).");
  }
  const db = adminDb();
  const perKoleksi = new Map<KoleksiMaster, string[][]>();
  const lembarDiabaikan: string[] = [];
  for (const [nama, tabel] of lembar) {
    const k = koleksiDariLembar(nama);
    if (k) perKoleksi.set(k, tabel);
    else if (nama.toLowerCase() !== "petunjuk") lembarDiabaikan.push(nama);
  }
  if (perKoleksi.size === 0) {
    throw new GalatBerkas(`Tidak ada lembar data master. Nama lembar harus: ${KOLEKSI_MASTER.map(namaLembar).join(", ")}.`);
  }

  const ringkasan: RingkasanKoleksi[] = [];
  const tulisan: { koleksi: KoleksiMaster; id: string; data: Record<string, unknown>; ada: boolean }[] = [];
  let totalBaris = 0;
  // ID wisma yang sah setelah impor (yang sudah ada + yang ada di file), untuk cek kamar.
  let idWisma = new Set<string>();

  for (const koleksi of KOLEKSI_MASTER) {
    const tabel = perKoleksi.get(koleksi);
    const ada = new Set((await db.collection(koleksi).select().get()).docs.map((d) => d.id));
    if (koleksi === "wisma") idWisma = new Set(ada);
    if (!tabel) continue;

    const r: RingkasanKoleksi = { koleksi, lembar: namaLembar(koleksi), baru: 0, diperbarui: 0, dilewati: 0, galat: [] };
    const { baris, galatKolom } = bacaLembarMaster(koleksi, tabel);
    for (const g of galatKolom) r.galat.push({ baris: 1, pesan: g });
    totalBaris += baris.length;
    const skema = skemaMaster(koleksi);
    const dipakai = new Map<string, number>();

    for (const b of baris) {
      const pesan = [...b.galat];
      if (pesan.length === 0) {
        const hasil = skema.safeParse(b.data);
        if (!hasil.success) {
          for (const [field, daftar] of Object.entries(hasil.error.flatten().fieldErrors)) {
            const label = definisi(koleksi).field.find((f) => f.nama === field)?.label ?? field;
            for (const m of daftar ?? []) pesan.push(m.startsWith(label) ? m : `${label}: ${m}`);
          }
        }
      }
      const id = idDariData(koleksi, b.data);
      if (!id) pesan.push(`${definisi(koleksi).fieldNama === "nomor" ? "Nomor kamar" : "Nama/kode"} kosong.`);
      else if (dipakai.has(id)) pesan.push(`Sama dengan baris ${dipakai.get(id)} (kode/nama ganda).`);
      if (koleksi === "kamar" && typeof b.data.wismaId === "string" && b.data.wismaId && !idWisma.has(b.data.wismaId)) {
        pesan.push(`Kode wisma "${b.data.wismaId.toUpperCase()}" tidak ada di lembar Wisma maupun di data.`);
      }
      if (pesan.length) {
        r.galat.push(...pesan.map((p) => ({ baris: b.nomorBaris, pesan: p })));
        continue;
      }
      dipakai.set(id, b.nomorBaris);
      if (koleksi === "wisma") idWisma.add(id);
      if (ada.has(id)) {
        if (mode === "lewati") {
          r.dilewati++;
          continue;
        }
        r.diperbarui++;
      } else r.baru++;
      tulisan.push({ koleksi, id, data: b.data, ada: ada.has(id) });
    }
    ringkasan.push(r);
  }

  const totalGalat = ringkasan.reduce((n, r) => n + r.galat.length, 0);
  if (totalBaris > BATAS_BARIS) throw new GalatBerkas(`File berisi ${totalBaris} baris; maksimal ${BATAS_BARIS} sekali impor.`);
  if (!jalankan || totalGalat > 0 || tulisan.length === 0) return { ringkasan, totalGalat, dijalankan: false, lembarDiabaikan };

  let batch = db.batch();
  let isi = 0;
  for (const t of tulisan) {
    const cap = { diubahPada: FieldValue.serverTimestamp(), diubahOleh: uid };
    batch.set(db.collection(t.koleksi).doc(t.id), t.ada ? { ...t.data, ...cap } : { ...t.data, ...cap, dibuatPada: FieldValue.serverTimestamp() }, {
      merge: true,
    });
    if (++isi === 450) {
      await batch.commit();
      batch = db.batch();
      isi = 0;
    }
  }
  if (isi) await batch.commit();
  for (const r of ringkasan) {
    if (r.baru + r.diperbarui === 0) continue;
    await catatAudit(uid, `Impor Excel ${r.lembar}: ${r.baru} baru, ${r.diperbarui} diperbarui`, r.koleksi);
  }
  return { ringkasan, totalGalat, dijalankan: true, lembarDiabaikan };
}
