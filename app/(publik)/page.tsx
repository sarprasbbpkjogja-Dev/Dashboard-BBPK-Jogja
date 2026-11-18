import Link from "next/link";

// Tahap 1: kerangka beranda. Data ketersediaan, jadwal, dan lacak tiket dibuat di Tahap 4.
export default function Beranda() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-8">
      <section className="flex max-w-3xl flex-col gap-5">
        <span className="text-sm font-semibold uppercase tracking-wider text-warn-ink">Portal publik</span>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Cek ketersediaan fasilitas dan sampaikan pengaduan di satu tempat.
        </h1>
        <p className="text-lg leading-relaxed text-muted">
          Informasi asrama, ruang rapat, ruang kelas, dan kendaraan dinas Balai Besar Pengembangan Kompetensi Aparatur
          Pemerintahan Dalam Negeri III.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/pengaduan" className="btn-primary">
            Buat pengaduan
          </Link>
          <Link href="/katalog" className="btn-secondary">
            Lihat katalog
          </Link>
        </div>
      </section>
      <section className="card p-6" aria-labelledby="jadwal-judul">
        <h2 id="jadwal-judul" className="text-xl font-bold">
          Jadwal ruang hari ini
        </h2>
        <p className="mt-2 text-sm text-muted">Jadwal tampil di sini setelah modul ruang aktif.</p>
      </section>
    </div>
  );
}
