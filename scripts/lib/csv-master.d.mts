export type JenisImpor = "teks" | "teksPanjang" | "angka" | "pilihan" | "daftar" | "yaTidak" | "posisi" | "relasi";
export const JENIS: Record<string, Record<string, JenisImpor>>;
export const URUTAN: string[];
export function parseCsv(teks: string): Record<string, string>[];
export function ubahBaris(koleksi: string, mentah: Record<string, string>): Record<string, unknown>;
export function buatSlug(teks: string): string;
export function idDokumen(koleksi: string, data: Record<string, unknown>): string;
