import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { adminAuth } from "@/lib/firebase/admin";
import { isRole, type Role } from "@/lib/roles";
import { NAMA_COOKIE_SESI } from "@/lib/auth/konstanta";

export type Sesi = { uid: string; email: string; nama: string; role: Role };

/**
 * Membaca dan memverifikasi cookie sesi. Mengembalikan null bila tidak ada, kedaluwarsa,
 * dicabut (akun dinonaktifkan atau role diubah), atau akun tidak punya role yang sah.
 * Dibungkus cache() agar dalam satu request verifikasi hanya berjalan sekali.
 */
export const getSesi = cache(async (): Promise<Sesi | null> => {
  const nilai = (await cookies()).get(NAMA_COOKIE_SESI)?.value;
  if (!nilai) return null;
  try {
    const token = await adminAuth().verifySessionCookie(nilai, true);
    const role: unknown = token.role;
    if (!isRole(role)) return null;
    const email = token.email ?? "";
    const nama = typeof token.name === "string" && token.name ? token.name : email;
    return { uid: token.uid, email, nama, role };
  } catch (e) {
    const kode = (e as { code?: string }).code ?? "";
    if (!kode.startsWith("auth/")) console.error("Gagal memverifikasi sesi:", e);
    return null;
  }
});
