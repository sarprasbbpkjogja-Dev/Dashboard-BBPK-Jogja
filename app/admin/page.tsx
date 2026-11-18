import Link from "next/link";
import { redirect } from "next/navigation";
import { getSesi } from "@/lib/auth/sesi";
import { MENU, ROLE_LABEL } from "@/lib/roles";

// Beranda dashboard: sapaan dan pintasan menu sesuai role. Isi modul dibuat di tahap berikutnya.
export default async function AdminBeranda() {
  const sesi = await getSesi();
  if (!sesi) redirect("/login");

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Selamat datang, {sesi.nama}</h1>
        <p className="text-sm text-muted">Anda masuk sebagai {ROLE_LABEL[sesi.role]}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MENU[sesi.role].map((item) => (
          <Link key={item.label} href={item.href} className="card flex min-h-[88px] flex-col justify-center gap-1 px-5 py-4 hover:border-primary">
            <span className="text-base font-bold">{item.label}</span>
            <span className="text-sm text-muted">Dibuka pada tahap modul terkait</span>
          </Link>
        ))}
      </div>
    </>
  );
}
