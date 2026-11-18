import { Timestamp } from "firebase-admin/firestore";
import { wajibPeranHalaman } from "@/lib/auth/halaman";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

const BATAS = 200;
const formatWaktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

// Riwayat aksi sensitif (audit_log). Hanya bisa dibaca super admin; hanya server yang menulis.
export default async function HalamanLog() {
  await wajibPeranHalaman(["super_admin"]);
  const db = adminDb();
  const [logSnap, userSnap] = await Promise.all([
    db.collection("audit_log").orderBy("waktu", "desc").limit(BATAS).get(),
    db.collection("users").get(),
  ]);
  const emailUid = new Map(userSnap.docs.map((d) => [d.id, String(d.get("email") ?? d.id)]));
  const baris = logSnap.docs.map((d) => {
    const v = d.data();
    const waktu = v.waktu instanceof Timestamp ? formatWaktu.format(v.waktu.toDate()) : "—";
    return { id: d.id, waktu, oleh: emailUid.get(String(v.uid)) ?? String(v.uid ?? "—"), aksi: String(v.aksi ?? ""), target: String(v.target ?? "") };
  });

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Log aktivitas</h1>
        <p className="text-sm text-muted">{BATAS} aksi terakhir: perubahan akun, role, dan data master. Log tidak bisa diubah atau dihapus dari dashboard.</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-line-soft text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Waktu (WIB)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Oleh</th>
              <th scope="col" className="px-4 py-3 font-semibold">Aksi</th>
              <th scope="col" className="px-4 py-3 font-semibold">Data</th>
            </tr>
          </thead>
          <tbody>
            {baris.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Belum ada aktivitas tercatat.</td></tr>
            ) : (
              baris.map((b) => (
                <tr key={b.id} className="border-b border-line-soft last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5">{b.waktu}</td>
                  <td className="px-4 py-2.5">{b.oleh}</td>
                  <td className="px-4 py-2.5">{b.aksi}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{b.target}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
