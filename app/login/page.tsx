import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getSesi } from "@/lib/auth/sesi";
import { FormLogin } from "./FormLogin";

export const metadata: Metadata = { title: "Masuk admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Petugas yang sudah masuk langsung ke dashboard.
  if (await getSesi()) redirect("/admin");

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
        <div className="lg:hidden">
          <Logo />
        </div>
        <h2 className="text-2xl font-bold">Masuk</h2>
        <FormLogin />
        <p className="text-sm text-muted">Akun dibuat oleh super admin. Belum punya akun? Hubungi pengelola sistem balai.</p>
      </section>
    </div>
  );
}
