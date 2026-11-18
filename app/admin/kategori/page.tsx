import { HalamanMaster } from "@/components/HalamanMaster";
import { wajibPeranHalaman } from "@/lib/auth/halaman";

export const dynamic = "force-dynamic";

export default async function HalamanKategori() {
  await wajibPeranHalaman(["super_admin"]);
  return <HalamanMaster koleksi="kategori_pengaduan" />;
}
