import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getSesi } from "@/lib/auth/sesi";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Verifikasi penuh sesi: cookie sah, belum dicabut, akun aktif, dan punya role.
// Menu sidebar dibangun dari role tersebut (lib/roles.ts).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sesi = await getSesi();
  if (!sesi) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar role={sesi.role} namaPetugas={sesi.nama} />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-7 lg:px-9">{children}</main>
    </div>
  );
}
