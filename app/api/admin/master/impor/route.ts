// Impor data master dari Excel. Khusus super_admin.
// Form: berkas (.xlsx), mode ("lewati" | "timpa"), jalankan ("0" = periksa saja, "1" = tulis).
import { NextResponse } from "next/server";
import { wajibPeran } from "@/lib/auth/guard";
import { imporExcel } from "@/lib/master/impor";
import { GalatBerkas } from "@/lib/master/xlsx";

const BATAS_UKURAN = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const sesi = await wajibPeran(["super_admin"]);
  if (sesi instanceof NextResponse) return sesi;

  const form = await req.formData().catch(() => null);
  const berkas = form?.get("berkas");
  if (!(berkas instanceof Blob) || berkas.size === 0) {
    return NextResponse.json({ pesan: "Pilih file Excel (.xlsx) terlebih dahulu." }, { status: 400 });
  }
  if (berkas.size > BATAS_UKURAN) return NextResponse.json({ pesan: "Ukuran file maksimal 5 MB." }, { status: 400 });
  const mode = form?.get("mode") === "timpa" ? "timpa" : "lewati";
  const jalankan = form?.get("jalankan") === "1";

  try {
    const hasil = await imporExcel(new Uint8Array(await berkas.arrayBuffer()), mode, jalankan, sesi.uid);
    return NextResponse.json(hasil);
  } catch (e) {
    if (e instanceof GalatBerkas) return NextResponse.json({ pesan: e.message }, { status: 400 });
    console.error("Gagal impor Excel:", e);
    return NextResponse.json({ pesan: "Gagal membaca atau menyimpan data." }, { status: 500 });
  }
}
