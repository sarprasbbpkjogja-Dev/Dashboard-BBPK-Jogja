"use client";

// Tabel + form tambah/ubah untuk satu koleksi data master. Bentuk form dibaca dari lib/master/definisi.ts.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill, type PillTone } from "@/components/StatusPill";
import { definisi, type Field, type KoleksiMaster, type Pilihan } from "@/lib/master/definisi";
import { nilaiKosong } from "@/lib/master/skema";

type Baris = { id: string } & Record<string, unknown>;
type Props = { koleksi: KoleksiMaster; baris: Baris[]; opsiRelasi: Record<string, Pilihan[]> };

const TONE_STATUS: Record<string, PillTone> = {
  kosong: "soft",
  tersedia: "soft",
  terisi: "primary",
  dipakai: "primary",
  dipesan: "warn",
  perbaikan: "danger",
  servis: "danger",
};

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

function labelPilihan(f: Field, nilai: unknown, opsiRelasi: Record<string, Pilihan[]>): string {
  const daftar = f.jenis === "relasi" ? (opsiRelasi[f.nama] ?? []) : (f.pilihan ?? []);
  return daftar.find((p) => p.nilai === nilai)?.label ?? String(nilai ?? "—");
}

function Sel({ f, nilai, opsiRelasi }: { f: Field; nilai: unknown; opsiRelasi: Record<string, Pilihan[]> }) {
  if (f.jenis === "yaTidak") {
    return <StatusPill tone={nilai ? "soft" : "neutral"}>{nilai ? "Ya" : "Tidak"}</StatusPill>;
  }
  if (f.jenis === "pilihan" && f.nama === "status") {
    return <StatusPill tone={TONE_STATUS[String(nilai)] ?? "neutral"}>{labelPilihan(f, nilai, opsiRelasi)}</StatusPill>;
  }
  if (f.jenis === "pilihan" || f.jenis === "relasi") return <>{labelPilihan(f, nilai, opsiRelasi)}</>;
  if (f.jenis === "angka" && f.format === "rupiah") {
    return typeof nilai === "number" && nilai > 0 ? <>{rupiah.format(nilai)}</> : <StatusPill tone="warn">Belum diisi</StatusPill>;
  }
  if (nilai === undefined || nilai === null || nilai === "") return <span className="text-muted">—</span>;
  return <>{String(nilai)}</>;
}

export function TabelMaster({ koleksi, baris, opsiRelasi }: Props) {
  const def = definisi(koleksi);
  const router = useRouter();
  const [cari, setCari] = useState("");
  const [form, setForm] = useState<{ id: string | null; nilai: Record<string, unknown> } | null>(null);
  const [galat, setGalat] = useState("");
  const [galatField, setGalatField] = useState<Record<string, string[]>>({});
  const [proses, setProses] = useState(false);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [info, setInfo] = useState("");

  const kolom = useMemo(() => def.field.filter((f) => f.tabel), [def]);
  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return baris;
    return baris.filter((b) =>
      kolom.some((f) => {
        const v = f.jenis === "pilihan" || f.jenis === "relasi" ? labelPilihan(f, b[f.nama], opsiRelasi) : b[f.nama];
        return String(v ?? "").toLowerCase().includes(q);
      }),
    );
  }, [baris, cari, kolom, opsiRelasi]);

  function bukaTambah() {
    setGalat("");
    setGalatField({});
    setForm({ id: null, nilai: nilaiKosong(koleksi) });
  }

  function bukaUbah(b: Baris) {
    setGalat("");
    setGalatField({});
    const nilai = nilaiKosong(koleksi);
    for (const f of def.field) if (b[f.nama] !== undefined) nilai[f.nama] = b[f.nama];
    setForm({ id: b.id, nilai });
  }

  function ubahNilai(nama: string, v: unknown) {
    setForm((lama) => (lama ? { ...lama, nilai: { ...lama.nilai, [nama]: v } } : lama));
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setProses(true);
    setGalat("");
    setGalatField({});
    try {
      const url = form.id ? `/api/admin/master/${koleksi}/${form.id}` : `/api/admin/master/${koleksi}`;
      const res = await fetch(url, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.nilai),
      });
      const data = (await res.json().catch(() => ({}))) as { pesan?: string; detail?: Record<string, string[]> };
      if (!res.ok) {
        setGalat(data.pesan ?? "Gagal menyimpan.");
        setGalatField(data.detail ?? {});
        return;
      }
      setInfo(form.id ? "Perubahan disimpan." : `${def.judul} ditambahkan.`);
      setForm(null);
      router.refresh();
    } catch {
      setGalat("Tidak ada koneksi internet.");
    } finally {
      setProses(false);
    }
  }

  async function hapus(id: string) {
    setProses(true);
    setInfo("");
    setGalat("");
    try {
      const res = await fetch(`/api/admin/master/${koleksi}/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { pesan?: string };
      if (!res.ok) {
        setGalat(data.pesan ?? "Gagal menghapus.");
        return;
      }
      setInfo(`${def.judul} dihapus.`);
      setHapusId(null);
      router.refresh();
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`cari-${koleksi}`} className="text-sm font-semibold">
            Cari {def.tunggal}
          </label>
          <input
            id={`cari-${koleksi}`}
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            className="min-h-tap w-72 max-w-full rounded-lg border border-line bg-surface px-3.5"
          />
        </div>
        <button type="button" onClick={bukaTambah} className="btn-primary">
          Tambah {def.tunggal}
        </button>
      </div>

      {info && !form ? (
        <p role="status" className="rounded-lg bg-primary-soft px-3.5 py-3 text-sm text-primary">
          {info}
        </p>
      ) : null}
      {galat && !form ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-3 text-sm font-semibold text-danger-ink">
          {galat}
        </p>
      ) : null}

      {form ? (
        <form onSubmit={simpan} className="card flex flex-col gap-4 p-5" noValidate>
          <h2 className="text-lg font-bold">{form.id ? `Ubah ${def.tunggal}` : `Tambah ${def.tunggal}`}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {def.field.map((f) => (
              <InputField
                key={f.nama}
                f={f}
                id={`${koleksi}-${f.nama}`}
                nilai={form.nilai[f.nama]}
                opsi={f.jenis === "relasi" ? (opsiRelasi[f.nama] ?? []) : (f.pilihan ?? [])}
                galat={galatField[f.nama]?.[0]}
                onChange={(v) => ubahNilai(f.nama, v)}
              />
            ))}
          </div>
          {galat ? (
            <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-3 text-sm font-semibold text-danger-ink">
              {galat}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary disabled:opacity-60" disabled={proses}>
              {proses ? "Menyimpan…" : "Simpan"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setForm(null)}>
              Batal
            </button>
          </div>
        </form>
      ) : null}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-line-soft text-xs uppercase tracking-wide text-muted">
            <tr>
              {kolom.map((f) => (
                <th key={f.nama} scope="col" className="px-4 py-3 font-semibold">
                  {f.label}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {tersaring.length === 0 ? (
              <tr>
                <td colSpan={kolom.length + 1} className="px-4 py-8 text-center text-muted">
                  {baris.length === 0
                    ? `Belum ada data ${def.tunggal}. Tambahkan manual atau impor dari CSV (lihat docs/tahap/tahap-3.md).`
                    : "Tidak ada yang cocok dengan pencarian."}
                </td>
              </tr>
            ) : (
              tersaring.map((b) => (
                <tr key={b.id} className="border-b border-line-soft last:border-0">
                  {kolom.map((f) => (
                    <td key={f.nama} className={`px-4 py-2.5 ${f.nama === def.fieldNama ? "font-semibold" : ""}`}>
                      <Sel f={f} nilai={b[f.nama]} opsiRelasi={opsiRelasi} />
                    </td>
                  ))}
                  <td className="px-4 py-1.5 text-right">
                    {hapusId === b.id ? (
                      <span className="inline-flex flex-wrap items-center justify-end gap-2">
                        <span className="text-xs font-semibold text-danger-ink">Hapus {String(b[def.fieldNama] ?? "")}?</span>
                        <button
                          type="button"
                          disabled={proses}
                          onClick={() => hapus(b.id)}
                          className="min-h-tap rounded-lg bg-danger-ink px-3 text-xs font-semibold text-surface"
                        >
                          Ya, hapus
                        </button>
                        <button type="button" onClick={() => setHapusId(null)} className="min-h-tap px-2 text-xs font-semibold">
                          Batal
                        </button>
                      </span>
                    ) : (
                      <span className="inline-flex gap-1">
                        <button type="button" onClick={() => bukaUbah(b)} className="min-h-tap px-3 text-sm font-semibold text-primary">
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => setHapusId(b.id)}
                          className="min-h-tap px-3 text-sm font-semibold text-danger-ink"
                        >
                          Hapus
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        {tersaring.length} dari {baris.length} {def.tunggal}
      </p>
    </div>
  );
}

const kelasInput = "min-h-tap w-full rounded-lg border border-line bg-surface px-3.5";

function InputField({
  f,
  id,
  nilai,
  opsi,
  galat,
  onChange,
}: {
  f: Field;
  id: string;
  nilai: unknown;
  opsi: Pilihan[];
  galat?: string;
  onChange: (v: unknown) => void;
}) {
  const lebar = f.jenis === "teksPanjang" || f.jenis === "daftar" ? "md:col-span-2" : "";
  const idBantuan = f.bantuan || galat ? `${id}-bantuan` : undefined;

  let input: React.ReactNode;
  switch (f.jenis) {
    case "teks":
      input = <input id={id} type="text" value={String(nilai ?? "")} onChange={(e) => onChange(e.target.value)} className={kelasInput} aria-describedby={idBantuan} />;
      break;
    case "teksPanjang":
      input = <textarea id={id} rows={3} value={String(nilai ?? "")} onChange={(e) => onChange(e.target.value)} className={`${kelasInput} py-2.5`} aria-describedby={idBantuan} />;
      break;
    case "angka":
      input = (
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={f.min}
          max={f.max}
          value={typeof nilai === "number" ? nilai : ""}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className={kelasInput}
          aria-describedby={idBantuan}
        />
      );
      break;
    case "pilihan":
    case "relasi":
      input = (
        <select id={id} value={String(nilai ?? "")} onChange={(e) => onChange(e.target.value)} className={kelasInput} aria-describedby={idBantuan}>
          {f.jenis === "relasi" ? <option value="">Pilih {f.label.toLowerCase()}</option> : null}
          {opsi.map((p) => (
            <option key={p.nilai} value={p.nilai}>
              {p.label}
            </option>
          ))}
        </select>
      );
      break;
    case "daftar":
      input = (
        <textarea
          id={id}
          rows={3}
          value={Array.isArray(nilai) ? nilai.join("\n") : ""}
          onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
          className={`${kelasInput} py-2.5`}
          aria-describedby={idBantuan}
        />
      );
      break;
    case "yaTidak":
      return (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id} className="flex min-h-tap cursor-pointer items-center gap-3 text-sm font-semibold">
            <input id={id} type="checkbox" checked={Boolean(nilai)} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-primary" />
            {f.label}
          </label>
        </div>
      );
    case "posisi": {
      const p = (nilai as { x: number; y: number } | null) ?? null;
      const ubah = (k: "x" | "y", v: string) => {
        if (v === "" && (k === "x" ? p?.y : p?.x) === undefined) return onChange(null);
        const dasar = p ?? { x: 0, y: 0 };
        onChange({ ...dasar, [k]: v === "" ? 0 : Number(v) });
      };
      return (
        <fieldset className="flex flex-col gap-1.5" aria-describedby={idBantuan}>
          <legend className="mb-1.5 text-sm font-semibold">{f.label}</legend>
          <div className="flex gap-3">
            {(["x", "y"] as const).map((k) => (
              <label key={k} className="flex flex-1 items-center gap-2 text-sm">
                <span className="w-4 font-semibold uppercase">{k}</span>
                <input type="number" min={0} max={100} step="0.1" value={p ? p[k] : ""} onChange={(e) => ubah(k, e.target.value)} className={kelasInput} />
              </label>
            ))}
            {p ? (
              <button type="button" onClick={() => onChange(null)} className="min-h-tap px-2 text-xs font-semibold text-muted">
                Kosongkan
              </button>
            ) : null}
          </div>
          {f.bantuan ? <p id={idBantuan} className="text-xs text-muted">{f.bantuan}</p> : null}
        </fieldset>
      );
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${lebar}`}>
      <label htmlFor={id} className="text-sm font-semibold">
        {f.label}
        {f.wajib ? <span className="text-danger-ink"> *</span> : null}
      </label>
      {input}
      {galat ? (
        <p id={idBantuan} className="text-xs font-semibold text-danger-ink">
          {galat}
        </p>
      ) : f.bantuan ? (
        <p id={idBantuan} className="text-xs text-muted">
          {f.bantuan}
        </p>
      ) : null}
    </div>
  );
}
