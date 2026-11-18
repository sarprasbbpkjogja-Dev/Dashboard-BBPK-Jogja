import Link from "next/link";
import { notFound } from "next/navigation";
import { HalamanMaster } from "@/components/HalamanMaster";
import { wajibPeranHalaman } from "@/lib/auth/halaman";
import { definisi, isKoleksiMaster, TAB_DATA_MASTER } from "@/lib/master/definisi";

export const dynamic = "force-dynamic";

export default async function HalamanDataMaster({ params }: { params: Promise<{ koleksi: string }> }) {
  await wajibPeranHalaman(["super_admin"]);
  const { koleksi } = await params;
  if (!isKoleksiMaster(koleksi) || !TAB_DATA_MASTER.includes(koleksi)) notFound();

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Data master</h1>
        <p className="text-sm text-muted">Daftar fasilitas yang dipakai semua modul, katalog publik, dan denah.</p>
      </div>
      <nav aria-label="Jenis data master" className="flex flex-wrap gap-2 border-b border-line pb-3">
        {TAB_DATA_MASTER.map((k) => {
          const aktif = k === koleksi;
          return (
            <Link
              key={k}
              href={`/admin/master/${k}`}
              aria-current={aktif ? "page" : undefined}
              className={`flex min-h-tap items-center rounded-lg px-4 text-sm font-semibold ${
                aktif ? "bg-primary text-surface" : "bg-surface text-ink hover:bg-primary-soft"
              }`}
            >
              {definisi(k).judul}
            </Link>
          );
        })}
      </nav>
      <HalamanMaster koleksi={koleksi} tampilJudul={false} />
    </>
  );
}
