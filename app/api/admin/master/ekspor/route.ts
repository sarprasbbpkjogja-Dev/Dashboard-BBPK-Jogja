// Unduh semua data master sebagai Excel (dengan dropdown), untuk diedit lalu diimpor kembali. Khusus super_admin.
import { NextResponse } from "next/server";
import { wajibPeran } from "@/lib/auth/guard";
import { KOLEKSI_MASTER, type KoleksiMaster } from "@/lib/master/definisi";
import { buatLembarMaster, lembarPetunjuk } from "@/lib/master/excel";
import { ambilBaris, type Baris } from "@/lib/master/server";
import { tulisXlsx } from "@/lib/master/xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  const sesi = await wajibPeran(["super_admin"]);
  if (sesi instanceof NextResponse) return sesi;

  const isi = await Promise.all(KOLEKSI_MASTER.map((k) => ambilBaris(k)));
  const data = Object.fromEntries(KOLEKSI_MASTER.map((k, i) => [k, isi[i] ?? []])) as Record<KoleksiMaster, Baris[]>;
  const berkas = tulisXlsx([lembarPetunjuk(), ...buatLembarMaster(data)]);
  const tanggal = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  return new Response(berkas.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="data-master-${tanggal}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
