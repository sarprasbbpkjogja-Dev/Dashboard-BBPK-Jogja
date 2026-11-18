import "server-only";
import { redirect } from "next/navigation";
import { getSesi, type Sesi } from "@/lib/auth/sesi";
import type { Role } from "@/lib/roles";

/** Penjaga halaman admin: tanpa sesi ke /login, role tidak diizinkan kembali ke /admin. */
export async function wajibPeranHalaman(diizinkan: readonly Role[]): Promise<Sesi> {
  const sesi = await getSesi();
  if (!sesi) redirect("/login");
  if (!diizinkan.includes(sesi.role)) redirect("/admin");
  return sesi;
}
