import "server-only";
import { NextResponse } from "next/server";
import { getSesi, type Sesi } from "@/lib/auth/sesi";
import type { Role } from "@/lib/roles";

/**
 * Pemeriksa akses untuk route handler. Mengembalikan sesi bila role diizinkan,
 * atau NextResponse 401/403 yang langsung dikembalikan oleh pemanggil.
 */
export async function wajibPeran(diizinkan: readonly Role[]): Promise<Sesi | NextResponse> {
  const sesi = await getSesi();
  if (!sesi) return NextResponse.json({ pesan: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (!diizinkan.includes(sesi.role)) {
    return NextResponse.json({ pesan: "Anda tidak punya akses untuk tindakan ini." }, { status: 403 });
  }
  return sesi;
}
