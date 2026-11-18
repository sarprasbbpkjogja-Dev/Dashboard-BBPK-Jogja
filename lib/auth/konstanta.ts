// Dipakai oleh middleware (edge) dan kode server, jadi file ini tidak boleh mengimpor Admin SDK.

/** Nama cookie sesi (httpOnly, dibuat oleh /api/sesi). */
export const NAMA_COOKIE_SESI = "sesi";

/** Lama sesi petugas: 8 jam, satu hari kerja. */
export const MASA_SESI_MS = 8 * 60 * 60 * 1000;

/** Login harus baru terjadi (maks. 5 menit) saat sesi dibuat, sesuai anjuran Firebase. */
export const BATAS_LOGIN_BARU_MS = 5 * 60 * 1000;
