// Penjaga pertama untuk /admin: tanpa cookie sesi langsung diarahkan ke /login.
// Verifikasi penuh (tanda tangan, kedaluwarsa, role) dilakukan di app/admin/layout.tsx,
// karena Admin SDK tidak berjalan di edge runtime.
import { NextResponse, type NextRequest } from "next/server";
import { NAMA_COOKIE_SESI } from "@/lib/auth/konstanta";

export function middleware(req: NextRequest) {
  if (!req.cookies.has(NAMA_COOKIE_SESI)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
