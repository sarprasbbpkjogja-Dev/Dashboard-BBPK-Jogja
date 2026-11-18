import { z } from "zod";
import { ROLES } from "@/lib/roles";

export const penggunaBaruSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  nama: z.string().trim().min(2, "Nama minimal 2 huruf.").max(80),
  role: z.enum(ROLES),
});

export const ubahPenggunaSchema = z
  .object({
    role: z.enum(ROLES).optional(),
    aktif: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.aktif !== undefined, { message: "Tidak ada perubahan." });

/** Bentuk dokumen users/{uid} (cermin custom claims untuk tampilan). */
export type PenggunaDoc = {
  nama: string;
  email: string;
  role: (typeof ROLES)[number];
  aktif: boolean;
};
