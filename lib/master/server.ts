import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { definisi, type KoleksiMaster } from "@/lib/master/definisi";

export type Baris = { id: string } & Record<string, unknown>;

/** Ubah Timestamp Firestore menjadi string ISO agar bisa dikirim ke komponen klien. */
export function polos(nilai: unknown): unknown {
  if (nilai instanceof Timestamp) return nilai.toDate().toISOString();
  if (Array.isArray(nilai)) return nilai.map(polos);
  if (nilai && typeof nilai === "object") {
    return Object.fromEntries(Object.entries(nilai).map(([k, v]) => [k, polos(v)]));
  }
  return nilai;
}

export async function ambilBaris(koleksi: KoleksiMaster): Promise<Baris[]> {
  const urut = definisi(koleksi).urutkan;
  const snap = await adminDb().collection(koleksi).get();
  const baris: Baris[] = snap.docs.map((d) => ({ id: d.id, ...(polos(d.data()) as Record<string, unknown>) }));
  return baris.sort((a, b) =>
    String(a[urut] ?? "").localeCompare(String(b[urut] ?? ""), "id", { numeric: true }),
  );
}

/** Pilihan untuk field relasi: { id → label }. */
export async function opsiRelasi(koleksi: KoleksiMaster): Promise<Record<string, { nilai: string; label: string }[]>> {
  const hasil: Record<string, { nilai: string; label: string }[]> = {};
  for (const f of definisi(koleksi).field) {
    if (f.jenis !== "relasi" || !f.relasi) continue;
    const baris = await ambilBaris(f.relasi);
    const fieldNama = definisi(f.relasi).fieldNama;
    hasil[f.nama] = baris.map((b) => ({ nilai: b.id, label: String(b[fieldNama] ?? b.id) }));
  }
  return hasil;
}
