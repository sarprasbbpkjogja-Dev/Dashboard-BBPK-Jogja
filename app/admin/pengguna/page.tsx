import { wajibPeranHalaman } from "@/lib/auth/halaman";
import { adminDb } from "@/lib/firebase/admin";
import { isRole, type Role } from "@/lib/roles";
import { KelolaPengguna, type Pengguna } from "./KelolaPengguna";

export const dynamic = "force-dynamic";

export default async function HalamanPengguna() {
  const sesi = await wajibPeranHalaman(["super_admin"]);
  const snap = await adminDb().collection("users").get();
  const pengguna: Pengguna[] = snap.docs
    .map((d) => {
      const v = d.data();
      const role: Role | null = isRole(v.role) ? v.role : null;
      return { uid: d.id, nama: String(v.nama ?? ""), email: String(v.email ?? ""), role, aktif: v.aktif !== false };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Pengguna & role</h1>
        <p className="text-sm text-muted">
          Akun petugas dan hak aksesnya. Perubahan role atau status membuat petugas tersebut keluar dan perlu masuk ulang.
        </p>
      </div>
      <KelolaPengguna pengguna={pengguna} uidSaya={sesi.uid} />
    </>
  );
}
