// Ubah atau hapus satu data master. Khusus super_admin. Setiap perubahan dicatat di audit_log.
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { wajibPeran } from "@/lib/auth/guard";
import { catatAudit } from "@/lib/audit";
import { adminDb } from "@/lib/firebase/admin";
import { definisi, isKoleksiMaster } from "@/lib/master/definisi";
import { skemaMaster } from "@/lib/master/skema";

type Konteks = { params: Promise<{ koleksi: string; id: string }> };

export async function PATCH(req: Request, { params }: Konteks) {
  const sesi = await wajibPeran(["super_admin"]);
  if (sesi instanceof NextResponse) return sesi;

  const { koleksi, id } = await params;
  if (!isKoleksiMaster(koleksi)) return NextResponse.json({ pesan: "Koleksi tidak dikenal." }, { status: 404 });

  const hasil = skemaMaster(koleksi).partial().safeParse(await req.json().catch(() => null));
  if (!hasil.success) {
    return NextResponse.json({ pesan: "Data tidak valid.", detail: hasil.error.flatten().fieldErrors }, { status: 400 });
  }
  const data = hasil.data as Record<string, unknown>;
  if (Object.keys(data).length === 0) return NextResponse.json({ pesan: "Tidak ada perubahan." }, { status: 400 });

  const db = adminDb();
  const ref = db.collection(koleksi).doc(id);
  const lama = await ref.get();
  if (!lama.exists) return NextResponse.json({ pesan: "Data tidak ditemukan." }, { status: 404 });
  if (koleksi === "kamar" && typeof data.wismaId === "string") {
    const wisma = await db.collection("wisma").doc(data.wismaId).get();
    if (!wisma.exists) return NextResponse.json({ pesan: "Wisma tidak ditemukan." }, { status: 400 });
  }

  await ref.update({ ...data, diubahPada: FieldValue.serverTimestamp(), diubahOleh: sesi.uid });
  const def = definisi(koleksi);
  const nama = String(data[def.fieldNama] ?? lama.get(def.fieldNama) ?? id);
  await catatAudit(sesi.uid, `Mengubah ${def.tunggal} ${nama} (${Object.keys(data).join(", ")})`, `${koleksi}/${id}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Konteks) {
  const sesi = await wajibPeran(["super_admin"]);
  if (sesi instanceof NextResponse) return sesi;

  const { koleksi, id } = await params;
  if (!isKoleksiMaster(koleksi)) return NextResponse.json({ pesan: "Koleksi tidak dikenal." }, { status: 404 });

  const db = adminDb();
  const ref = db.collection(koleksi).doc(id);
  const lama = await ref.get();
  if (!lama.exists) return NextResponse.json({ pesan: "Data tidak ditemukan." }, { status: 404 });

  if (koleksi === "wisma") {
    const kamar = await db.collection("kamar").where("wismaId", "==", id).limit(1).get();
    if (!kamar.empty) {
      return NextResponse.json(
        { pesan: "Wisma ini masih punya kamar. Hapus atau pindahkan kamarnya dulu, atau nonaktifkan wisma." },
        { status: 409 },
      );
    }
  }

  await ref.delete();
  const def = definisi(koleksi);
  await catatAudit(sesi.uid, `Menghapus ${def.tunggal} ${String(lama.get(def.fieldNama) ?? id)}`, `${koleksi}/${id}`);
  return NextResponse.json({ ok: true });
}
