import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { definisi, KOLEKSI_MASTER } from "@/lib/master/definisi";
import { bacaLembarMaster, buatLembarMaster, idDariData, koleksiDariLembar, lembarPetunjuk, namaLembar } from "@/lib/master/excel";
import { skemaMaster } from "@/lib/master/skema";
import { bacaXlsx, hurufKolom, tulisXlsx } from "@/lib/master/xlsx";

describe("xlsx", () => {
  it("huruf kolom", () => {
    expect([0, 25, 26, 27, 701, 702].map(hurufKolom)).toEqual(["A", "Z", "AA", "AB", "ZZ", "AAA"]);
  });

  it("tulis lalu baca menghasilkan isi yang sama", () => {
    const buf = tulisXlsx([
      {
        nama: "Uji & coba",
        kolom: [{ judul: "Teks" }, { judul: "Angka" }, { judul: "Ya/tidak" }],
        baris: [
          ['A <b> & "c"', 12.5, true],
          ["", 0, false],
          ["Ünïcödé · ✓", null, null],
        ],
        validasi: [{ kolom: 2, daftar: ["ya", "tidak"] }],
      },
    ]);
    const isi = bacaXlsx(buf).get("Uji & coba");
    expect(isi).toEqual([
      ["Teks", "Angka", "Ya/tidak"],
      ['A <b> & "c"', "12.5", "ya"],
      ["", "0", "tidak"],
      ["Ünïcödé · ✓"],
    ]);
  });

  it("menolak file yang bukan xlsx", () => {
    expect(() => bacaXlsx(new TextEncoder().encode("nama,kode\nA,B"))).toThrow(/bukan file Excel/);
  });
});

describe("excel data master", () => {
  it("label pilihan tidak mengandung koma (dropdown Excel dipisah koma)", () => {
    for (const k of KOLEKSI_MASTER) {
      for (const f of definisi(k).field) for (const p of f.pilihan ?? []) expect(p.label, `${k}.${f.nama}`).not.toContain(",");
    }
  });

  it("nama lembar dikenali kembali", () => {
    for (const k of KOLEKSI_MASTER) expect(koleksiDariLembar(namaLembar(k))).toBe(k);
    expect(koleksiDariLembar("Petunjuk")).toBeNull();
  });

  it("menerima label maupun nilai teknis, angka gaya Indonesia, dan mencatat galat", () => {
    const { baris, galatKolom } = bacaLembarMaster("tarif", [
      ["Layanan *", "Jenis PNBP *", "Satuan *", "Tarif (Rp)", "Dasar hukum"],
      ["Sewa aula", "PNBP umum", "per hari", "1.500.000", ""],
      ["Sewa kamar", "bangkom", "per malam", "Rp 150000", "PP 1/2025"],
      ["", "", "", "", ""],
      ["Salah", "PNBP khusus", "per hari", "seratus", ""],
    ]);
    expect(galatKolom).toEqual([]);
    expect(baris).toHaveLength(3);
    expect(baris[0]?.data).toMatchObject({ jenisPnbp: "umum", nilai: 1_500_000 });
    expect(baris[1]?.data).toMatchObject({ jenisPnbp: "bangkom", nilai: 150_000, dasarHukum: "PP 1/2025" });
    expect(baris[2]?.nomorBaris).toBe(5);
    expect(baris[2]?.galat).toHaveLength(2);
  });

  it("kolom wajib yang hilang dilaporkan", () => {
    const { galatKolom } = bacaLembarMaster("kendaraan", [["Nama / jenis", "Kursi"]]);
    expect(galatKolom.join(" ")).toMatch(/Kode unit/);
  });

  it("kamar: kode wisma menjadi ID wisma, posisi kosong jadi null", () => {
    const { baris } = bacaLembarMaster("kamar", [
      ["Wisma (kode) *", "Nomor kamar *", "Kapasitas (orang)", "Status *"],
      ["MP", "MP 101", "2", "Kosong"],
    ]);
    expect(baris[0]?.data).toEqual({ wismaId: "mp", nomor: "MP 101", kapasitas: 2, status: "kosong" });
    expect(idDariData("kamar", baris[0]!.data)).toBe("mp-101");
  });

  it("template di public/ terbaca, semua baris lolos validasi, dan ekspor-impor bolak-balik sama", () => {
    const lembar = bacaXlsx(new Uint8Array(readFileSync("public/template-data-master.xlsx")));
    expect([...lembar.keys()]).toEqual(["Petunjuk", ...KOLEKSI_MASTER.map(namaLembar)]);
    const data = {} as Parameters<typeof buatLembarMaster>[0];
    for (const k of KOLEKSI_MASTER) {
      const { baris, galatKolom } = bacaLembarMaster(k, lembar.get(namaLembar(k)) ?? []);
      expect(galatKolom, k).toEqual([]);
      expect(baris.length, k).toBeGreaterThan(0);
      for (const b of baris) {
        expect(b.galat, `${k} baris ${b.nomorBaris}`).toEqual([]);
        expect(skemaMaster(k).safeParse(b.data).success, `${k} baris ${b.nomorBaris}`).toBe(true);
      }
      data[k] = baris.map((b) => ({ id: idDariData(k, b.data), ...b.data }));
    }
    const ulang = bacaXlsx(tulisXlsx([lembarPetunjuk(), ...buatLembarMaster(data)]));
    for (const k of KOLEKSI_MASTER) {
      const a = bacaLembarMaster(k, ulang.get(namaLembar(k)) ?? []).baris.map((b) => b.data);
      expect(a, k).toEqual(data[k].map((d) => Object.fromEntries(Object.entries(d).filter(([kunci]) => kunci !== "id"))));
    }
  });
});
