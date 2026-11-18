/** Membuat ID dokumen yang mudah dibaca dari teks: "MP 104" → "mp-104". Sama dengan scripts/lib/csv-master.mjs. */
export function buatSlug(teks: string): string {
  return teks
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
