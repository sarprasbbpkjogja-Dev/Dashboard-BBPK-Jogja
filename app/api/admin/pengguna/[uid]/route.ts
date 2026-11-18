// Ubah role atau status aktif satu akun. Khusus super_admin.
// Setiap perubahan mencabut sesi akun tersebut, sehingga role baru berlaku saat login berikutnya
// dan akun yang dinonaktifkan langsung keluar dari dashboard.
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { wajibPeran } from "@/lib/auth/guard";
import { catatAudit } from "@/lib/audit";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { ubahPenggunaSchema } from "@/lib/schema/pengguna";

export async function PATCH(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  const sesi = await wajibPeran(["super_admin"]);
  if (sesi instanceof NextResponse) return sesi;

  const { uid } = await params;
  if (uid === sesi.uid) {
    return NextResponse.json(
      { pesan: "Anda tidak bisa mengubah role atau menonaktifkan akun sendiri." },
      { status: 400 },
    );
  }

  const hasil = ubahPenggunaSchema.safeParse(await req.json().catch(() => null));
  if (!hasil.success) return NextResponse.json({ pesan: "Data tidak valid." }, { status: 400 });
  const { role, aktif } = hasil.data;

  try {
    const auth = adminAuth();
    const user = await auth.getUser(uid);
    const perubahan: Record<string, unknown> = {
      diubahPada: FieldValue.serverTimestamp(),
      diubahOleh: sesi.uid,
    };
    const catatan: string[] = [];

    if (role !== undefined) {
      await auth.setCustomUserClaims(uid, { role });
      perubahan.role = role;
      catatan.push(`role menjadi ${role}`);
    }
    if (aktif !== undefined) {
      await auth.updateUser(uid, { disabled: !aktif });
      perubahan.aktif = aktif;
      catatan.push(aktif ? "mengaktifkan akun" : "menonaktifkan akun");
    }
    await auth.revokeRefreshTokens(uid);
    await adminDb().collection("users").doc(uid).set(perubahan, { merge: true });
    await catatAudit(sesi.uid, `Mengubah ${user.email ?? uid}: ${catatan.join(", ")}`, `users/${uid}`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if ((e as { code?: string }).code === "auth/user-not-found") {
      return NextResponse.json({ pesan: "Akun tidak ditemukan." }, { status: 404 });
    }
    console.error("Gagal mengubah akun:", e);
    return NextResponse.json({ pesan: "Gagal mengubah akun." }, { status: 500 });
  }
}
