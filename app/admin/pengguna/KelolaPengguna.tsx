"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/StatusPill";
import { ROLE_LABEL, ROLES, type Role } from "@/lib/roles";

export type Pengguna = { uid: string; nama: string; email: string; role: Role | null; aktif: boolean };

const kelasInput = "min-h-tap w-full rounded-lg border border-line bg-surface px-3.5";

export function KelolaPengguna({ pengguna, uidSaya }: { pengguna: Pengguna[]; uidSaya: string }) {
  const router = useRouter();
  const [tambah, setTambah] = useState(false);
  const [email, setEmail] = useState("");
  const [nama, setNama] = useState("");
  const [role, setRole] = useState<Role>("ula");
  const [proses, setProses] = useState<string | null>(null);
  const [galat, setGalat] = useState("");
  const [info, setInfo] = useState("");
  const [tautan, setTautan] = useState<{ email: string; url: string } | null>(null);
  const [tersalin, setTersalin] = useState(false);

  async function panggil(url: string, method: string, body: unknown) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as { pesan?: string; tautanAturSandi?: string };
    return { ok: res.ok, data };
  }

  async function buatAkun(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");
    setInfo("");
    if (!email.trim() || !nama.trim()) {
      setGalat("Nama dan email wajib diisi.");
      return;
    }
    setProses("baru");
    try {
      const { ok, data } = await panggil("/api/admin/pengguna", "POST", { email: email.trim(), nama: nama.trim(), role });
      if (!ok) {
        setGalat(data.pesan ?? "Gagal membuat akun.");
        return;
      }
      if (data.tautanAturSandi) setTautan({ email: email.trim(), url: data.tautanAturSandi });
      setTersalin(false);
      setEmail("");
      setNama("");
      setTambah(false);
      router.refresh();
    } catch {
      setGalat("Tidak ada koneksi internet.");
    } finally {
      setProses(null);
    }
  }

  async function ubah(p: Pengguna, perubahan: { role?: Role; aktif?: boolean }) {
    setGalat("");
    setInfo("");
    setProses(p.uid);
    try {
      const { ok, data } = await panggil(`/api/admin/pengguna/${p.uid}`, "PATCH", perubahan);
      if (!ok) {
        setGalat(data.pesan ?? "Gagal menyimpan perubahan.");
        return;
      }
      setInfo(`Akun ${p.email} diperbarui. Petugas perlu masuk ulang.`);
      router.refresh();
    } catch {
      setGalat("Tidak ada koneksi internet.");
    } finally {
      setProses(null);
    }
  }

  async function salin() {
    if (!tautan) return;
    try {
      await navigator.clipboard.writeText(tautan.url);
      setTersalin(true);
    } catch {
      setTersalin(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {!tambah ? (
          <button type="button" className="btn-primary" onClick={() => setTambah(true)}>
            Tambah petugas
          </button>
        ) : null}
      </div>

      {tautan ? (
        <div role="status" className="card flex flex-col gap-3 border-primary p-5">
          <p className="text-sm">
            Akun <strong>{tautan.email}</strong> dibuat. Kirim tautan ini ke petugas (lewat WhatsApp atau email dinas) agar ia
            mengatur kata sandinya sendiri. Tautan hanya bisa dipakai sekali.
          </p>
          <label htmlFor="tautan-sandi" className="text-sm font-semibold">
            Tautan atur kata sandi
          </label>
          <input id="tautan-sandi" readOnly value={tautan.url} className={`${kelasInput} font-mono text-xs`} onFocus={(e) => e.target.select()} />
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={salin}>
              {tersalin ? "Tersalin" : "Salin tautan"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setTautan(null)}>
              Tutup
            </button>
          </div>
        </div>
      ) : null}

      {tambah ? (
        <form onSubmit={buatAkun} className="card flex flex-col gap-4 p-5" noValidate>
          <h2 className="text-lg font-bold">Tambah petugas</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="baru-nama" className="text-sm font-semibold">Nama lengkap</label>
              <input id="baru-nama" value={nama} onChange={(e) => setNama(e.target.value)} className={kelasInput} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="baru-email" className="text-sm font-semibold">Email</label>
              <input id="baru-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={kelasInput} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="baru-role" className="text-sm font-semibold">Role</label>
              <select id="baru-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={kelasInput}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
          </div>
          {galat ? (
            <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-3 text-sm font-semibold text-danger-ink">{galat}</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary disabled:opacity-60" disabled={proses === "baru"}>
              {proses === "baru" ? "Membuat…" : "Buat akun"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setTambah(false)}>Batal</button>
          </div>
        </form>
      ) : null}

      {info ? <p role="status" className="rounded-lg bg-primary-soft px-3.5 py-3 text-sm text-primary">{info}</p> : null}
      {galat && !tambah ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-3 text-sm font-semibold text-danger-ink">{galat}</p>
      ) : null}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-line-soft text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Nama</th>
              <th scope="col" className="px-4 py-3 font-semibold">Email</th>
              <th scope="col" className="px-4 py-3 font-semibold">Role</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pengguna.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Belum ada akun petugas.</td></tr>
            ) : (
              pengguna.map((p) => {
                const saya = p.uid === uidSaya;
                return (
                  <tr key={p.uid} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-2.5 font-semibold">{p.nama || "—"}{saya ? <span className="ml-2 text-xs font-normal text-muted">(Anda)</span> : null}</td>
                    <td className="px-4 py-2.5">{p.email}</td>
                    <td className="px-4 py-1.5">
                      <label htmlFor={`role-${p.uid}`} className="sr-only">Role {p.email}</label>
                      <select
                        id={`role-${p.uid}`}
                        value={p.role ?? ""}
                        disabled={saya || proses === p.uid}
                        onChange={(e) => ubah(p, { role: e.target.value as Role })}
                        className="min-h-tap rounded-lg border border-line bg-surface px-2.5 disabled:opacity-60"
                      >
                        {p.role ? null : <option value="">Belum ada role</option>}
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill tone={p.aktif ? "soft" : "neutral"}>{p.aktif ? "Aktif" : "Nonaktif"}</StatusPill>
                    </td>
                    <td className="px-4 py-1.5 text-right">
                      {saya ? (
                        <span className="text-xs text-muted">Tidak bisa diubah sendiri</span>
                      ) : (
                        <button
                          type="button"
                          disabled={proses === p.uid}
                          onClick={() => ubah(p, { aktif: !p.aktif })}
                          className={`min-h-tap px-3 text-sm font-semibold ${p.aktif ? "text-danger-ink" : "text-primary"}`}
                        >
                          {p.aktif ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
