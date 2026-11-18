// Satu-satunya sumber daftar role dan menu admin.
// Mengikuti tabel "Role & hak akses" di docs/spesifikasi.md.

export const ROLES = [
  "super_admin",
  "ula",
  "admin_asrama",
  "admin_ruang_rapat",
  "admin_ruang_kelas",
  "admin_kendaraan",
  "pranata_komputer",
  "bendahara",
  "petugas_umum",
  "petugas_keamanan",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super admin",
  ula: "ULA · Admin pengaduan",
  admin_asrama: "Admin asrama",
  admin_ruang_rapat: "Admin ruang rapat",
  admin_ruang_kelas: "Admin ruang kelas",
  admin_kendaraan: "Admin kendaraan",
  pranata_komputer: "Pranata komputer",
  bendahara: "Bendahara penerimaan",
  petugas_umum: "Bagian umum",
  petugas_keamanan: "Petugas keamanan",
};

export type MenuItem = { label: string; href: string };

const tiketUnit = (label: string): MenuItem => ({ label, href: "/admin/tiket" });

export const MENU: Record<Role, MenuItem[]> = {
  super_admin: [
    { label: "Pengguna & role", href: "/admin/pengguna" },
    { label: "Kategori pengaduan", href: "/admin/kategori" },
    { label: "Tarif PNBP", href: "/admin/tarif" },
    { label: "Data master", href: "/admin/master" },
    { label: "Pengaturan layar", href: "/admin/layar" },
    { label: "Log aktivitas", href: "/admin/log" },
  ],
  ula: [
    { label: "Semua tiket", href: "/admin/pengaduan" },
    { label: "Pemantauan", href: "/admin/pengaduan/pemantauan" },
  ],
  admin_asrama: [
    { label: "Ringkasan", href: "/admin/asrama" },
    { label: "Peta kamar", href: "/admin/asrama/kamar" },
    { label: "Reservasi", href: "/admin/asrama/reservasi" },
    { label: "Pembayaran", href: "/admin/asrama/pembayaran" },
    tiketUnit("Pengaduan asrama"),
  ],
  admin_ruang_rapat: [
    { label: "Jadwal", href: "/admin/ruang" },
    { label: "Permohonan", href: "/admin/ruang/permohonan" },
    { label: "Data ruangan", href: "/admin/ruang/data" },
    tiketUnit("Pengaduan ruang"),
  ],
  admin_ruang_kelas: [
    { label: "Jadwal", href: "/admin/ruang" },
    { label: "Permohonan", href: "/admin/ruang/permohonan" },
    { label: "Data ruangan", href: "/admin/ruang/data" },
    tiketUnit("Pengaduan ruang"),
  ],
  admin_kendaraan: [
    { label: "Armada", href: "/admin/kendaraan" },
    { label: "Peminjaman", href: "/admin/kendaraan/peminjaman" },
    { label: "Jadwal servis", href: "/admin/kendaraan/servis" },
    tiketUnit("Pengaduan kendaraan"),
  ],
  pranata_komputer: [
    tiketUnit("Tiket internet"),
    { label: "Status jaringan", href: "/admin/jaringan" },
  ],
  bendahara: [
    { label: "Verifikasi pembayaran", href: "/admin/asrama/pembayaran" },
    { label: "Laporan PNBP", href: "/admin/laporan/pnbp" },
  ],
  petugas_umum: [tiketUnit("Tiket bagian umum")],
  petugas_keamanan: [tiketUnit("Tiket keamanan")],
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
