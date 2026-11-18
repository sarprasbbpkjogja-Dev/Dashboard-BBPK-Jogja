// Membangun skema zod dari definisi data master, sehingga validasi selalu sama dengan form.
import { z } from "zod";
import { definisi, type Field, type KoleksiMaster } from "@/lib/master/definisi";

function skemaField(f: Field): z.ZodTypeAny {
  switch (f.jenis) {
    case "teks":
      return z.string().trim().min(f.wajib ? 1 : 0, `${f.label} wajib diisi.`).max(200);
    case "teksPanjang":
      return z.string().trim().min(f.wajib ? 1 : 0, `${f.label} wajib diisi.`).max(2000);
    case "angka":
      return z
        .number({ invalid_type_error: `${f.label} harus berupa angka.` })
        .int(`${f.label} harus bilangan bulat.`)
        .min(f.min ?? 0, `${f.label} minimal ${f.min ?? 0}.`)
        .max(f.max ?? 1_000_000_000, `${f.label} maksimal ${f.max}.`);
    case "pilihan": {
      const nilai = (f.pilihan ?? []).map((p) => p.nilai);
      return z.string().refine((v) => nilai.includes(v), `${f.label} tidak valid.`);
    }
    case "daftar":
      return z.array(z.string().trim().min(1).max(200)).max(50);
    case "yaTidak":
      return z.boolean();
    case "posisi":
      return z
        .object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
        .nullable();
    case "relasi":
      return z.string().trim().min(1, `${f.label} wajib dipilih.`);
  }
}

export function skemaMaster(koleksi: KoleksiMaster) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of definisi(koleksi).field) shape[f.nama] = skemaField(f);
  return z.object(shape).strict();
}

/** Nilai awal form untuk data baru. */
export function nilaiKosong(koleksi: KoleksiMaster): Record<string, unknown> {
  const hasil: Record<string, unknown> = {};
  for (const f of definisi(koleksi).field) {
    hasil[f.nama] =
      f.jenis === "angka" ? (f.min ?? 0)
      : f.jenis === "daftar" ? []
      : f.jenis === "yaTidak" ? true
      : f.jenis === "posisi" ? null
      : f.jenis === "pilihan" ? (f.pilihan?.[0]?.nilai ?? "")
      : "";
  }
  return hasil;
}
