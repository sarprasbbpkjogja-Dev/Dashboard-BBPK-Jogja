// Membuat dan menghapus cookie sesi petugas.
// Alur: browser login dengan Firebase Auth → kirim ID token ke POST /api/sesi →
// server memverifikasi token dan role, lalu memasang cookie httpOnly.
import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { catatAudit } from "@/lib/audit";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { isRole } from "@/lib/roles";
import { BATAS_LOGIN_BARU_MS, MASA_SESI_MS, NAMA_COOKIE_SESI } from "@/lib/auth/konstanta";

const bodySchema = z.object({ idToken: z.string().min(1) });

/** Daftar email super admin awal dari env (dipisah koma), huruf kecil. */
function emailSuperAdminAwal(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function tetapkanSuperAdminAwal(uid: string, email: string | undefined): Promise<boolean> {
  if (!email || !emailSuperAdminAwal().includes(email.toLowerCase())) return false;
  const auth = adminAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { role: "super_admin" });
  await adminDb()
    .collection("users")
    .doc(uid)
    .set(
      {
        nama: user.displayName || email,
        email: email.toLowerCase(),
        role: "super_admin",
        aktif: true,
        diubahPada: FieldValue.serverTimestamp(),
        diubahOleh: "SUPER_ADMIN_EMAILS",
      },
      { merge: true },
    );
  await catatAudit(uid, `Role super_admin ditetapkan otomatis untuk ${email} (SUPER_ADMIN_EMAILS)`, `users/${uid}`);
  return true;
}

const opsiCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(req: Request) {
  const hasil = bodySchema.safeParse(await req.json().catch(() => null));
  if (!hasil.success) return NextResponse.json({ pesan: "Permintaan tidak valid." }, { status: 400 });

  try {
    const auth = adminAuth();
    const token = await auth.verifyIdToken(hasil.data.idToken, true);

    if (Date.now() - token.auth_time * 1000 > BATAS_LOGIN_BARU_MS) {
      return NextResponse.json({ pesan: "Sesi login sudah lama. Silakan masuk ulang." }, { status: 401 });
    }
    if (!isRole(token.role)) {
      // Super admin pertama: email yang terdaftar di SUPER_ADMIN_EMAILS mendapat role
      // super_admin saat login pertama. Browser lalu memuat ulang token dan mengirim lagi.
      if (await tetapkanSuperAdminAwal(token.uid, token.email)) {
        return NextResponse.json({ ulangToken: true }, { status: 409 });
      }
      return NextResponse.json(
        { pesan: "Akun Anda belum diberi role. Hubungi super admin." },
        { status: 403 },
      );
    }

    const cookie = await auth.createSessionCookie(hasil.data.idToken, { expiresIn: MASA_SESI_MS });
    const res = NextResponse.json({ ok: true, role: token.role });
    res.cookies.set(NAMA_COOKIE_SESI, cookie, { ...opsiCookie, maxAge: MASA_SESI_MS / 1000 });
    return res;
  } catch (e) {
    const kode = (e as { code?: string }).code ?? "";
    if (kode.startsWith("auth/")) {
      return NextResponse.json({ pesan: "Login tidak sah atau akun dinonaktifkan." }, { status: 401 });
    }
    console.error("Gagal membuat sesi:", e);
    return NextResponse.json({ pesan: "Server belum siap. Hubungi pengelola sistem." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(NAMA_COOKIE_SESI, "", { ...opsiCookie, maxAge: 0 });

  // Cabut semua sesi akun ini agar cookie lama tidak bisa dipakai ulang.
  const nilai = req.headers.get("cookie")?.match(new RegExp(`${NAMA_COOKIE_SESI}=([^;]+)`))?.[1];
  if (nilai) {
    try {
      const auth = adminAuth();
      const token = await auth.verifySessionCookie(decodeURIComponent(nilai));
      await auth.revokeRefreshTokens(token.uid);
    } catch {
      // Cookie sudah tidak sah; cukup dihapus.
    }
  }
  return res;
}
