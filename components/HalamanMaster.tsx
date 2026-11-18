// Bagian server untuk satu koleksi master: ambil data via Admin SDK, lalu serahkan ke TabelMaster.
import { ImporExcel } from "@/components/ImporExcel";
import { TabelMaster } from "@/components/TabelMaster";
import { definisi, type KoleksiMaster } from "@/lib/master/definisi";
import { ambilBaris, opsiRelasi } from "@/lib/master/server";

export async function HalamanMaster({ koleksi, tampilJudul = true }: { koleksi: KoleksiMaster; tampilJudul?: boolean }) {
  const def = definisi(koleksi);
  const [baris, opsi] = await Promise.all([ambilBaris(koleksi), opsiRelasi(koleksi)]);
  return (
    <section className="flex flex-col gap-4">
      {tampilJudul ? (
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{def.judul}</h1>
          <p className="text-sm text-muted">{def.deskripsi}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">{def.deskripsi}</p>
      )}
      <ImporExcel />
      <TabelMaster koleksi={koleksi} baris={baris} opsiRelasi={opsi} />
    </section>
  );
}
