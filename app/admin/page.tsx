import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";

// Tahap 1: halaman contoh untuk memeriksa layout, token warna, dan komponen dasar.
export default function AdminBeranda() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted">Kerangka tahap 1. Modul diisi bertahap sesuai spesifikasi.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Contoh statistik" value="—" note="Diisi di tahap modul" />
        <StatCard label="Contoh statistik" value="—" />
        <StatCard label="Contoh statistik" value="—" />
        <StatCard label="Contoh statistik" value="—" />
      </div>
      <div className="card flex flex-wrap items-center gap-2 p-5">
        <span className="mr-2 text-sm font-semibold">Contoh pill status:</span>
        <StatusPill tone="soft">Kosong</StatusPill>
        <StatusPill tone="primary">Terisi</StatusPill>
        <StatusPill tone="warn">Menunggu</StatusPill>
        <StatusPill tone="danger">Ditolak</StatusPill>
        <StatusPill tone="neutral">Selesai</StatusPill>
      </div>
    </>
  );
}
