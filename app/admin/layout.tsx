import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import type { Role } from "@/lib/roles";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

// Tahap 1: role sementara untuk melihat tata letak. Tahap 2 menggantinya dengan custom claim
// dari sesi login dan memasang proteksi di middleware, sehingga /admin tidak bisa dibuka tanpa login.
const ROLE_PRATINJAU: Role = "super_admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={ROLE_PRATINJAU} namaPetugas="Pratinjau" />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-7 lg:px-9">{children}</main>
    </div>
  );
}
