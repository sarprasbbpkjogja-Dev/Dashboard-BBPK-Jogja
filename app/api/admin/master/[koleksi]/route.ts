// Tambah data master. Khusus super_admin. Setiap perubahan dicatat di audit_log.
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { wajibPeran } from "@/lib/auth/guard";
import { catatAudit } from "@/lib/audit";
import { adminDb } from "@/lib/firebase/admin";
import { definisi, isKoleksiMaster } from "@/lib/master/definisi";
import { buatSlug } from "@/lib/master/id";
import { skemaMaster } from "@/lib/master/skema";

export async function POST(req: Request, { params }: { params: Promise<{ koleksi: string }> }) {
  const sesi = await wajibPeran(["super_admin"]);
  if (sesi instanceof NextResponse) return sesi;

  const { koleksi } = await params;
  if (!isKoleksiMaster(koleksi)) return NextResponse.json({ pesan: "Koleksi tidak dikenal." }, { status: 404 });

  const hasil = skemaMaster(koleksi).safeParse(await req.json().catch(() => null));
  if (!hasil.success) {
    return NextResponse.json({ pesan: "Data tidak valid.", detail: hasil.error.flatten().fieldErrors }, { status: 400 });
  }
  const data = hasil.data as Record<string, unknown>;
  const def = definisi(koleksi);
  const namaBaris = String(data[def.fieldNama] ?? "");

  const db = adminDb();
  if (koleksi === "kamar") {
    const wisma = await db.collection("wisma").doc(String(data.wismaId)).get();
    if (!wisma.exists) return NextResponse.json({ pesan: "Wisma tidak ditemukan." }, { status: 400 });
  }

  // ID dari nama (atau kode bila ada) agar mudah dibaca dan impor ulang tidak menggandakan data.
  const sumberId = typeof data.kode === "string" && data.kode ? data.kode : namaBaris;
  const slug = buatSlug(sumberId);
  const ref = slug ? db.collection(koleksi).doc(slug) : db.collection(koleksi).doc();

  try {
    await ref.create({ ...data, dibuatPada: FieldValue.serverTimestamp(), diubahPada: FieldValue.serverTimestamp(), diubahOleh: sesi.uid });
  } catch (e) {
    if ((e as { code?: number }).code === 6) {
      return NextResponse.json({ pesan: `${def.judul} dengan nama/kode itu sudah ada.` }, { status: 409 });
    }
    console.error("Gagal menambah data master:", e);
    return NextResponse.json({ pesan: "Gagal menyimpan." }, { status: 500 });
  }
  await catatAudit(sesi.uid, `Menambah ${def.tunggal} ${namaBaris}`, `${koleksi}/${ref.id}`);
  return NextResponse.json({ id: ref.id }, { status: 201 });
}
