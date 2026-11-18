import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buatSlug as slugApp } from "@/lib/master/id";
import { definisi, KOLEKSI_MASTER, isKoleksiMaster } from "@/lib/master/definisi";
import { skemaMaster } from "@/lib/master/skema";
import { buatSlug, idDokumen, JENIS, parseCsv, ubahBaris, URUTAN } from "../../scripts/lib/csv-master.mjs";

describe("impor data master", () => {
  it("jenis kolom di skrip sama dengan lib/master/definisi.ts", () => {
    for (const k of KOLEKSI_MASTER) {
      const dariDefinisi = Object.fromEntries(definisi(k).field.map((f) => [f.nama, f.jenis]));
      expect(JENIS[k], k).toEqual(dariDefinisi);
    }
    expect([...URUTAN].sort()).toEqual([...KOLEKSI_MASTER].sort());
  });

  it("slug skrip sama dengan slug API", () => {
    for (const t of ["MP 104", "Internet / Wi-Fi", "KD-01", "Wisma Bhineka Tunggal Ika", "Café"]) {
      expect(buatSlug(t)).toBe(slugApp(t));
    }
  });

  it("parser CSV menangani kutip, koma, dan baris kosong", () => {
    const hasil = parseCsv('a,b\r\n"x, y","say ""hi"""\n\n1,\n');
    expect(hasil).toEqual([
      { a: "x, y", b: 'say "hi"' },
      { a: "1", b: "" },
    ]);
  });

  it.each(URUTAN)("setiap baris data/master/%s.csv lolos validasi dan ID-nya unik", (koleksi) => {
    if (!isKoleksiMaster(koleksi)) throw new Error(koleksi);
    const skema = skemaMaster(koleksi);
    const baris = parseCsv(readFileSync(`data/master/${koleksi}.csv`, "utf8")).map((m) => ubahBaris(koleksi, m));
    expect(baris.length).toBeGreaterThan(0);
    for (const b of baris) {
      const r = skema.safeParse(b);
      expect(r.success, `${koleksi}: ${JSON.stringify(b)} → ${r.success ? "" : r.error.message}`).toBe(true);
    }
    const id = baris.map((b) => idDokumen(koleksi, b));
    expect(new Set(id).size).toBe(id.length);
  });

  it("setiap kamar merujuk wisma yang ada, dan jumlahnya cocok", () => {
    const wisma = parseCsv(readFileSync("data/master/wisma.csv", "utf8")).map((m) => ubahBaris("wisma", m));
    const kamar = parseCsv(readFileSync("data/master/kamar.csv", "utf8")).map((m) => ubahBaris("kamar", m));
    const idWisma = new Set(wisma.map((w) => idDokumen("wisma", w)));
    for (const k of kamar) expect(idWisma.has(String(k.wismaId)), String(k.nomor)).toBe(true);
    for (const w of wisma) {
      const n = kamar.filter((k) => k.wismaId === idDokumen("wisma", w)).length;
      expect(n, String(w.nama)).toBe(w.jumlahKamar);
    }
  });
});
