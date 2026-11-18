"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { TombolKeluar } from "@/components/TombolKeluar";
import { MENU, ROLE_LABEL, type Role } from "@/lib/roles";

type Props = { role: Role; namaPetugas: string };

export function Sidebar({ role, namaPetugas }: Props) {
  const pathname = usePathname();
  const items = MENU[role];

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 bg-sidebar px-4 py-6 text-sidebar-ink">
      <div className="px-2">
        <Logo href="/admin" tone="dark" subtitle="Dashboard fasilitas" />
      </div>
      <span className="ml-2 self-start rounded-full bg-sidebar-active px-2.5 py-1 text-xs font-semibold text-primary-soft">
        Role: {ROLE_LABEL[role]}
      </span>
      <nav aria-label="Menu admin" className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-tap items-center rounded-lg px-3 text-sm ${
                active ? "bg-sidebar-active font-bold text-surface" : "font-medium hover:bg-sidebar-active/60"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 border-t border-sidebar-rule px-2 pt-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-active text-xs font-bold text-surface"
          aria-hidden="true"
        >
          {namaPetugas.slice(0, 2).toUpperCase()}
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-surface">{namaPetugas}</span>
          <TombolKeluar />
        </span>
      </div>
    </aside>
  );
}
