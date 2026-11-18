// Penulis dan pembaca .xlsx minimal tanpa pustaka tambahan (hanya node:zlib).
// Cukup untuk template data master: teks, angka, header tebal, lebar kolom, baris beku, dan dropdown.
import { inflateRawSync } from "node:zlib";

/** Galat karena isi file (bukan karena server); pesannya aman ditampilkan ke pengguna. */
export class GalatBerkas extends Error {}

export type NilaiSel = string | number | boolean | null | undefined;

export type Validasi = {
  /** Indeks kolom (0 = A). */
  kolom: number;
  /** Daftar pilihan langsung (maks. 255 karakter total) atau rumus rentang, mis. "Wisma!$B$2:$B$500". */
  daftar?: string[];
  rentang?: string;
  pesan?: string;
};

export type Lembar = {
  nama: string;
  kolom: { judul: string; lebar?: number; catatan?: string }[];
  baris: NilaiSel[][];
  validasi?: Validasi[];
  /** Baris pertama tebal dan dibekukan (default true). */
  header?: boolean;
};

// ---------- utilitas ----------

const enc = new TextEncoder();
const dec = new TextDecoder();

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // karakter kontrol tidak sah di XML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function unesc(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

export function hurufKolom(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function indeksKolom(ref: string): number {
  let n = 0;
  for (const c of ref.replace(/[0-9]/g, "")) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

const CRC_TABEL = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = (CRC_TABEL[(c ^ data[i]!) & 0xff]! ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}

// ---------- zip (tanpa kompresi saat menulis) ----------

function buatZip(berkas: { nama: string; isi: Uint8Array }[]): Uint8Array {
  const bagian: Uint8Array[] = [];
  const pusat: Uint8Array[] = [];
  let offset = 0;
  for (const b of berkas) {
    const nama = enc.encode(b.nama);
    const crc = crc32(b.isi);
    const lokal = new DataView(new ArrayBuffer(30));
    lokal.setUint32(0, 0x04034b50, true);
    lokal.setUint16(4, 20, true);
    lokal.setUint16(6, 0x0800, true); // nama UTF-8
    lokal.setUint16(8, 0, true); // store
    lokal.setUint16(10, 0, true);
    lokal.setUint16(12, 0x21, true);
    lokal.setUint32(14, crc, true);
    lokal.setUint32(18, b.isi.length, true);
    lokal.setUint32(22, b.isi.length, true);
    lokal.setUint16(26, nama.length, true);
    lokal.setUint16(28, 0, true);
    bagian.push(new Uint8Array(lokal.buffer), nama, b.isi);

    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true);
    c.setUint16(12, 0, true);
    c.setUint16(14, 0x21, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, b.isi.length, true);
    c.setUint32(24, b.isi.length, true);
    c.setUint16(28, nama.length, true);
    c.setUint32(42, offset, true);
    pusat.push(new Uint8Array(c.buffer), nama);
    offset += 30 + nama.length + b.isi.length;
  }
  const ukuranPusat = pusat.reduce((n, p) => n + p.length, 0);
  const akhir = new DataView(new ArrayBuffer(22));
  akhir.setUint32(0, 0x06054b50, true);
  akhir.setUint16(8, berkas.length, true);
  akhir.setUint16(10, berkas.length, true);
  akhir.setUint32(12, ukuranPusat, true);
  akhir.setUint32(16, offset, true);
  const semua = [...bagian, ...pusat, new Uint8Array(akhir.buffer)];
  const hasil = new Uint8Array(semua.reduce((n, p) => n + p.length, 0));
  let pos = 0;
  for (const p of semua) {
    hasil.set(p, pos);
    pos += p.length;
  }
  return hasil;
}

function bacaZip(data: Uint8Array): Map<string, Uint8Array> {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let eocd = -1;
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new GalatBerkas("Berkas bukan file Excel (.xlsx) yang valid.");
  const jumlah = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const hasil = new Map<string, Uint8Array>();
  for (let i = 0; i < jumlah; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new GalatBerkas("Struktur file Excel rusak.");
    const metode = dv.getUint16(p + 10, true);
    const ukuranKompres = dv.getUint32(p + 20, true);
    const panjangNama = dv.getUint16(p + 28, true);
    const panjangEkstra = dv.getUint16(p + 30, true);
    const panjangKomentar = dv.getUint16(p + 32, true);
    const offsetLokal = dv.getUint32(p + 42, true);
    const nama = dec.decode(data.subarray(p + 46, p + 46 + panjangNama));
    const mulai = offsetLokal + 30 + dv.getUint16(offsetLokal + 26, true) + dv.getUint16(offsetLokal + 28, true);
    const mentah = data.subarray(mulai, mulai + ukuranKompres);
    if (metode === 0) hasil.set(nama, mentah);
    else if (metode === 8) hasil.set(nama, new Uint8Array(inflateRawSync(mentah)));
    p += 46 + panjangNama + panjangEkstra + panjangKomentar;
  }
  return hasil;
}

// ---------- menulis ----------

function xmlSel(ref: string, v: NilaiSel, gaya: number): string {
  const s = gaya ? ` s="${gaya}"` : "";
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number" && Number.isFinite(v)) return `<c r="${ref}"${s}><v>${v}</v></c>`;
  if (typeof v === "boolean") return `<c r="${ref}"${s} t="inlineStr"><is><t>${v ? "ya" : "tidak"}</t></is></c>`;
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`;
}

function xmlLembar(l: Lembar): string {
  const header = l.header !== false;
  const kolom = l.kolom
    .map((k, i) => `<col min="${i + 1}" max="${i + 1}" width="${k.lebar ?? 16}" customWidth="1"/>`)
    .join("");
  const semua: NilaiSel[][] = header ? [l.kolom.map((k) => k.judul), ...l.baris] : l.baris;
  const baris = semua
    .map((r, ri) => {
      const sel = r.map((v, ci) => xmlSel(`${hurufKolom(ci)}${ri + 1}`, v, header && ri === 0 ? 1 : 2)).join("");
      return `<row r="${ri + 1}">${sel}</row>`;
    })
    .join("");
  const beku = header
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;
  const val = (l.validasi ?? [])
    .map((v) => {
      const kol = hurufKolom(v.kolom);
      const rumus = v.rentang ?? `"${(v.daftar ?? []).join(",")}"`;
      const pesan = v.pesan
        ? ` showErrorMessage="1" errorTitle="Pilihan tidak valid" error="${esc(v.pesan)}" showInputMessage="1" prompt="${esc(v.pesan)}"`
        : ` showErrorMessage="1"`;
      return `<dataValidation type="list" allowBlank="1"${pesan} sqref="${kol}2:${kol}2000"><formula1>${esc(rumus)}</formula1></dataValidation>`;
    })
    .join("");
  const blokVal = val ? `<dataValidations count="${l.validasi!.length}">${val}</dataValidations>` : "";
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `${beku}<sheetFormatPr defaultRowHeight="15"/><cols>${kolom}</cols><sheetData>${baris}</sheetData>${blokVal}</worksheet>`
  );
}

const STYLES =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts>` +
  `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FF0B5550"/><bgColor indexed="64"/></patternFill></fill></fills>` +
  `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

/** Membuat file .xlsx dari beberapa lembar. */
export function tulisXlsx(lembar: Lembar[]): Uint8Array {
  const sheets = lembar
    .map((l, i) => `<sheet name="${esc(l.nama)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("");
  const relsWb =
    lembar
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join("") +
    `<Relationship Id="rId${lembar.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;
  const overrides = lembar
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  const berkas = [
    {
      nama: "[Content_Types].xml",
      isi:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides}</Types>`,
    },
    {
      nama: "_rels/.rels",
      isi:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      nama: "xl/workbook.xml",
      isi:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets>${sheets}</sheets></workbook>`,
    },
    {
      nama: "xl/_rels/workbook.xml.rels",
      isi: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relsWb}</Relationships>`,
    },
    { nama: "xl/styles.xml", isi: STYLES },
    ...lembar.map((l, i) => ({ nama: `xl/worksheets/sheet${i + 1}.xml`, isi: xmlLembar(l) })),
  ];
  return buatZip(berkas.map((b) => ({ nama: b.nama, isi: enc.encode(b.isi) })));
}

// ---------- membaca ----------

function teksDari(xml: string): string {
  // Gabungkan semua <t> (termasuk rich text <r><t>..</t></r>), abaikan teks fonetik <rPh>.
  const tanpaFonetik = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
  return [...tanpaFonetik.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => unesc(m[1] ?? "")).join("");
}

function normalisasiPath(target: string): string {
  const t = target.replace(/^\//, "");
  return t.startsWith("xl/") ? t : `xl/${t}`;
}

/** Membaca semua lembar menjadi tabel teks: { namaLembar: string[][] }. */
export function bacaXlsx(data: Uint8Array): Map<string, string[][]> {
  const zip = bacaZip(data);
  const baca = (n: string) => {
    const b = zip.get(n);
    return b ? dec.decode(b) : "";
  };
  const wb = baca("xl/workbook.xml");
  if (!wb) throw new GalatBerkas("Berkas bukan file Excel (.xlsx) yang valid.");
  const rels = new Map<string, string>();
  for (const m of baca("xl/_rels/workbook.xml.rels").matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const a = m[1] ?? "";
    const id = /\bId="([^"]+)"/.exec(a)?.[1];
    const target = /\bTarget="([^"]+)"/.exec(a)?.[1];
    if (id && target) rels.set(id, normalisasiPath(target));
  }
  const shared = [...baca("xl/sharedStrings.xml").matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => teksDari(m[1] ?? ""));

  const hasil = new Map<string, string[][]>();
  for (const m of wb.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const a = m[1] ?? "";
    const nama = unesc(/\bname="([^"]*)"/.exec(a)?.[1] ?? "");
    const rid = /\br:id="([^"]+)"/.exec(a)?.[1] ?? /\bid="([^"]+)"/.exec(a)?.[1];
    const path = rid ? rels.get(rid) : undefined;
    if (!path) continue;
    const xml = baca(path);
    const tabel: string[][] = [];
    for (const r of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const nomor = Number(/\br="(\d+)"/.exec(r[1] ?? "")?.[1] ?? tabel.length + 1);
      const baris: string[] = [];
      for (const c of (r[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attr = c[1] ?? "";
        const isi = c[2] ?? "";
        const ref = /\br="([A-Z]+)\d+"/.exec(attr)?.[1];
        const idx = ref ? indeksKolom(ref) : baris.length;
        const t = /\bt="([^"]+)"/.exec(attr)?.[1];
        const v = /<v>([\s\S]*?)<\/v>/.exec(isi)?.[1];
        let nilai = "";
        if (t === "s") nilai = shared[Number(v)] ?? "";
        else if (t === "inlineStr") nilai = teksDari(isi);
        else if (t === "b") nilai = v === "1" ? "ya" : "tidak";
        else if (v !== undefined) {
          nilai = unesc(v);
          // Rapikan angka desimal hasil pembulatan biner Excel, mis. 65.799999999999997 → 65.8
          if (t !== "str" && /^-?\d+\.\d{10,}$/.test(nilai)) nilai = String(Number(Number(nilai).toPrecision(12)));
        }
        baris[idx] = nilai;
      }
      tabel[nomor - 1] = Array.from(baris, (x) => x ?? "");
    }
    hasil.set(nama, Array.from(tabel, (x) => x ?? []));
  }
  return hasil;
}
