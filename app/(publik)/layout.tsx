import Link from "next/link";
import { Logo } from "@/components/Logo";

const NAV = [
  { label: "Katalog fasilitas", href: "/katalog" },
  { label: "Denah", href: "/denah" },
  { label: "Pengaduan", href: "/pengaduan" },
];

export default function PublikLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <Logo />
          <nav aria-label="Menu utama" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] font-medium">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="flex min-h-tap items-center hover:text-primary">
                {n.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="inline-flex min-h-tap items-center rounded-lg border border-primary px-4 font-semibold text-primary hover:bg-primary-soft"
            >
              Masuk admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-muted sm:px-8">
          <span>BBPKA PDN III · Kementerian Dalam Negeri</span>
          <span>Data ketersediaan diperbarui otomatis dari sistem</span>
        </div>
      </footer>
    </div>
  );
}
