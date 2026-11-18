import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-3xl font-bold">Halaman belum tersedia</h1>
      <p className="text-muted">Halaman ini belum ada atau sedang disiapkan.</p>
      <Link href="/" className="btn-primary">
        Kembali ke beranda
      </Link>
    </div>
  );
}
