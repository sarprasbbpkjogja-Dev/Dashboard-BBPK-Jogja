import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Masuk admin" };

// Tahap 1: tampilan saja. Login Firebase Auth dan pengalihan per role dibuat di Tahap 2.
export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-sidebar p-16 text-surface lg:flex">
        <Logo tone="dark" />
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold leading-tight">Dashboard pengelolaan fasilitas balai</h1>
          <p className="max-w-md text-lg text-sidebar-quiet">
            Setiap petugas masuk dengan akunnya sendiri. Menu yang tampil menyesuaikan role.
          </p>
        </div>
        <Link href="/" className="font-semibold text-primary-soft">
          ← Kembali ke portal publik
        </Link>
      </section>
      <section className="flex flex-col justify-center gap-5 px-6 py-12 sm:px-20">
        <h2 className="text-2xl font-bold">Masuk</h2>
        <form className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <input id="email" type="email" autoComplete="username" className="min-h-[48px] rounded-lg border border-line bg-surface px-3.5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sandi" className="text-sm font-semibold">
              Kata sandi
            </label>
            <input id="sandi" type="password" autoComplete="current-password" className="min-h-[48px] rounded-lg border border-line bg-surface px-3.5" />
          </div>
          <button type="submit" className="btn-primary" disabled>
            Masuk
          </button>
          <p className="text-sm text-muted">Login diaktifkan pada Tahap 2.</p>
        </form>
      </section>
    </div>
  );
}
