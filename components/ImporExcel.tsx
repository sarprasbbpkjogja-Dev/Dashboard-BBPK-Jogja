"use client";

// Unduh template / data saat ini sebagai Excel, lalu unggah kembali setelah diedit.
// Alur: pilih file → Periksa (tanpa menulis) → bila tidak ada galat → Impor.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/StatusPill";

type Ringkasan = {
  koleksi: string;
  lembar: string;
  baru: number;
  diperbarui: number;
  dilewati: number;
  galat: { baris: number; pesan: string }[];
};
type Hasil = { ringkasan: Ringkasan[]; totalGalat: number; dijalankan: boolean; lembarDiabaikan: string[] };

export function ImporExcel() {
  const router = useRouter();
  const [berkas, setBerkas] = useState<File | null>(null);
  const [mode, setMode] = useState<"lewati" | "timpa">("lewati");
  const [proses, setProses] = useState(false);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [galat, setGalat] = useState("");

  async function kirim(jalankan: boolean) {
    if (!berkas) {
      setGalat("Pilih file Excel (.xlsx) terlebih dahulu.");
      return;
    }
    setProses(true);
    setGalat("");
    try {
      const form = new FormData();
      form.set("berkas", berkas);
      form.set("mode", mode);
      form.set("jalankan", jalankan ? "1" : "0");
      const res = await fetch("/api/admin/master/impor", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as Partial<Hasil> & { pesan?: string };
      if (!res.ok || !data.ringkasan) {
        setHasil(null);
        setGalat(data.pesan ?? "Gagal memproses file.");
        return;
      }
      setHasil(data as Hasil);
      if (data.dijalankan) router.refresh();
    } catch {
      setGalat("Tidak ada koneksi internet.");
    } finally {
      setProses(false);
    }
  }

  const akanDitulis = hasil ? hasil.ringkasan.reduce((n, r) => n + r.baru + r.diperbarui, 0) : 0;

  return (
    <details className="card group p-5">
      <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-base font-bold">Impor & ekspor Excel</span>
          <span className="text-sm text-muted">Edit banyak data sekaligus di Excel: wisma, kamar, ruangan, kendaraan, titik denah, kategori, tarif.</span>
        </span>
        <span aria-hidden className="text-sm font-semibold text-primary group-open:hidden">Buka</span>
        <span aria-hidden className="hidden text-sm font-semibold text-primary group-open:inline">Tutup</span>
      </summary>

      <div className="mt-4 flex flex-col gap-5 border-t border-line pt-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">1. Unduh file</h3>
          <div className="flex flex-wrap gap-3">
            {/* Unduhan file dari route handler, bukan navigasi halaman, jadi <a> biasa. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/admin/master/ekspor" download className="btn-primary">Unduh data saat ini (.xlsx)</a>
            <a href="/template-data-master.xlsx" download className="btn-secondary">Unduh template data awal</a>
          </div>
          <p className="text-xs text-muted">
            Data saat ini = isi dashboard sekarang. Template data awal = daftar fasilitas dari denah (perlu dicek Sarpras). Petunjuk
            pengisian ada di lembar pertama.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">2. Unggah file yang sudah diedit</h3>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="berkas-excel" className="text-sm font-semibold">File Excel (.xlsx)</label>
            <input
              id="berkas-excel"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                setBerkas(e.target.files?.[0] ?? null);
                setHasil(null);
                setGalat("");
              }}
              className="min-h-tap text-sm file:mr-3 file:min-h-tap file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:font-semibold file:text-primary"
            />
          </div>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-semibold">Data yang sudah ada di dashboard</legend>
            <label className="flex min-h-tap items-center gap-3 text-sm">
              <input type="radio" name="mode-impor" checked={mode === "lewati"} onChange={() => { setMode("lewati"); setHasil(null); }} className="h-5 w-5 accent-primary" />
              Lewati (hanya menambah data baru)
            </label>
            <label className="flex min-h-tap items-center gap-3 text-sm">
              <input type="radio" name="mode-impor" checked={mode === "timpa"} onChange={() => { setMode("timpa"); setHasil(null); }} className="h-5 w-5 accent-primary" />
              Perbarui dengan isi Excel
            </label>
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-secondary disabled:opacity-60" disabled={proses || !berkas} onClick={() => kirim(false)}>
              {proses && !hasil ? "Memeriksa…" : "Periksa file"}
            </button>
            {hasil && !hasil.dijalankan && hasil.totalGalat === 0 && akanDitulis > 0 ? (
              <button type="button" className="btn-primary disabled:opacity-60" disabled={proses} onClick={() => kirim(true)}>
                {proses ? "Mengimpor…" : `Impor ${akanDitulis} data`}
              </button>
            ) : null}
          </div>
        </div>

        {galat ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-3 text-sm font-semibold text-danger-ink">{galat}</p>
        ) : null}

        {hasil ? (
          <div className="flex flex-col gap-3" role="status">
            {hasil.dijalankan ? (
              <p className="rounded-lg bg-primary-soft px-3.5 py-3 text-sm font-semibold text-primary">
                Impor selesai: {akanDitulis} data disimpan. Tabel di bawah sudah diperbarui.
              </p>
            ) : hasil.totalGalat > 0 ? (
              <p className="rounded-lg bg-danger-soft px-3.5 py-3 text-sm font-semibold text-danger-ink">
                Ada {hasil.totalGalat} masalah. Perbaiki di Excel lalu unggah lagi; belum ada data yang disimpan.
              </p>
            ) : akanDitulis === 0 ? (
              <p className="rounded-lg bg-neutral-soft px-3.5 py-3 text-sm text-neutral-ink">
                Tidak ada data baru. Pilih &quot;Perbarui dengan isi Excel&quot; bila ingin menimpa data yang sudah ada.
              </p>
            ) : (
              <p className="rounded-lg bg-primary-soft px-3.5 py-3 text-sm text-primary">File siap diimpor. Periksa ringkasan, lalu tekan Impor.</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="py-2 pr-4 font-semibold">Lembar</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Baru</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Diperbarui</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Dilewati</th>
                    <th scope="col" className="py-2 font-semibold">Masalah</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.ringkasan.map((r) => (
                    <tr key={r.koleksi} className="border-b border-line-soft last:border-0">
                      <td className="py-2 pr-4 font-semibold">{r.lembar}</td>
                      <td className="py-2 pr-4">{r.baru}</td>
                      <td className="py-2 pr-4">{r.diperbarui}</td>
                      <td className="py-2 pr-4">{r.dilewati}</td>
                      <td className="py-2">
                        {r.galat.length ? <StatusPill tone="danger">{r.galat.length} masalah</StatusPill> : <StatusPill tone="soft">Aman</StatusPill>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasil.totalGalat > 0 ? (
              <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border border-danger-line p-3 text-sm">
                {hasil.ringkasan.flatMap((r) =>
                  r.galat.slice(0, 50).map((g, i) => (
                    <li key={`${r.koleksi}-${i}`}>
                      <span className="font-semibold">{r.lembar}, baris {g.baris}:</span> {g.pesan}
                    </li>
                  )),
                )}
              </ul>
            ) : null}
            {hasil.lembarDiabaikan.length ? (
              <p className="text-xs text-muted">Lembar diabaikan karena namanya tidak dikenal: {hasil.lembarDiabaikan.join(", ")}.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </details>
  );
}
