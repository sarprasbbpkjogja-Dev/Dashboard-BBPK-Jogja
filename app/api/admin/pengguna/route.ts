// Kelola akun petugas. Khusus super_admin.
// GET  → daftar pengguna (dari koleksi users)
// POST → buat akun baru + role, lalu kembalikan tautan untuk mengatur kata sandi pertama kali
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { wajibPeran } from "@/lib/auth/guard";
import { catatAudit } from "@/lib/audit";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { penggunaBaruSchema } from "@/lib/schema/pengguna";

export async function GET() {
  const sesi = await wajibPeran(["super_admin"]);
  if (sesi instanceof NextResponse) return sesi;

  const snap = await adminDb().collection("users").orderBy("nama").get();
  const pengguna = snap.docs.map((d) => {
    const v = d.data();
    return { uid: d.id, nama: v.nama, email: v.email, role: v.role, aktif: v.aktif };
  });
  return NextResponse.json({ pengguna });
}

export async function POST(req: Request) {
  const sesi = await wajibPeran(["super_admin"]);
  if (sesi instanceof NextResponse) return sesi;

  const hasil = penggunaBaruSchema.safeParse(await req.json().catch(() => null));
  if (!hasil.success) {
    return NextResponse.json({ pesan: "Data tidak valid.", detail: hasil.error.flatten().fieldErrors }, { status: 400 });
  }
  const { email, nama, role } = hasil.data;

  try {
    const auth = adminAuth();
    const user = await auth.createUser({ email, displayName: nama, disabled: false });
    await auth.setCustomUserClaims(user.uid, { role });
    await adminDb()
      .collection("users")
      .doc(user.uid)
      .set({
        nama,
        email,
        role,
        aktif: true,
        dibuatPada: FieldValue.serverTimestamp(),
        diubahPada: FieldValue.serverTimestamp(),
        diubahOleh: sesi.uid,
      });
    await catatAudit(sesi.uid, `Membuat akun ${email} dengan role ${role}`, `users/${user.uid}`);

    // Tautan sekali pakai untuk petugas mengatur kata sandinya sendiri.
    // Pengiriman email otomatis dibuat di Tahap 10; sementara tautan diberikan oleh super admin.
    const tautanAturSandi = await auth.generatePasswordResetLink(email);
    return NextResponse.json({ uid: user.uid, tautanAturSandi }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string }).code === "auth/email-already-exists") {
      return NextResponse.json({ pesan: "Email sudah terdaftar." }, { status: 409 });
    }
    console.error("Gagal membuat akun:", e);
    return NextResponse.json({ pesan: "Gagal membuat akun." }, { status: 500 });
  }
}
