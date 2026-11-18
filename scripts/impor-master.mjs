// Mengimpor data master dari data/master/*.csv ke Firestore.
//
// Pemakaian (dari folder proyek):
//   npm run impor                     → ke Firestore asli, kredensial dari .env.local
//   npm run impor -- --timpa          → menimpa dokumen yang sudah ada (default: dilewati)
//   npm run impor -- --hanya wisma,kamar
//   npm run seed                      → ke Firebase Emulator (jalankan `npm run emulators` dulu)
//
// ID dokumen dibuat dari kode/nama, jadi impor ulang tidak menggandakan data.
import { readFileSync, existsSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { idDokumen, parseCsv, ubahBaris, URUTAN } from "./lib/csv-master.mjs";

const argv = process.argv.slice(2);
const emulator = argv.includes("--emulator");
const timpa = argv.includes("--timpa");
const iHanya = argv.indexOf("--hanya");
const hanya = iHanya >= 0 ? (argv[iHanya + 1] ?? "").split(",").filter(Boolean) : URUTAN;

let app;
if (emulator) {
  // Diatur di sini (bukan di package.json) agar perintah yang sama berjalan di Windows.
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  app = initializeApp({ projectId: "demo-bbpka" });
  console.log(`Target: emulator ${process.env.FIRESTORE_EMULATOR_HOST}`);
} else {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error("Isi FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, dan FIREBASE_ADMIN_PRIVATE_KEY di .env.local.");
    process.exit(1);
  }
  app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  console.log(`Target: Firestore proyek ${projectId}`);
}

const db = getFirestore(app);

for (const koleksi of URUTAN.filter((k) => hanya.includes(k))) {
  const berkas = `data/master/${koleksi}.csv`;
  if (!existsSync(berkas)) {
    console.log(`- ${koleksi}: ${berkas} tidak ada, dilewati`);
    continue;
  }
  const baris = parseCsv(readFileSync(berkas, "utf8")).map((m) => ubahBaris(koleksi, m));
  const ref = db.collection(koleksi);
  const ada = new Set((await ref.select().get()).docs.map((d) => d.id));

  let tulis = 0, lewat = 0;
  let batch = db.batch(), isiBatch = 0;
  for (const data of baris) {
    const id = idDokumen(koleksi, data);
    if (!id) { console.warn(`  baris tanpa nama/kode di ${berkas}, dilewati`); continue; }
    if (ada.has(id) && !timpa) { lewat++; continue; }
    const cap = { diubahPada: FieldValue.serverTimestamp(), diubahOleh: "skrip-impor" };
    batch.set(ref.doc(id), ada.has(id) ? { ...data, ...cap } : { ...data, ...cap, dibuatPada: FieldValue.serverTimestamp() }, { merge: true });
    tulis++;
    if (++isiBatch === 450) { await batch.commit(); batch = db.batch(); isiBatch = 0; }
  }
  if (isiBatch) await batch.commit();
  if (tulis) {
    await db.collection("audit_log").add({
      waktu: FieldValue.serverTimestamp(),
      uid: "skrip-impor",
      aksi: `Impor ${tulis} data ${koleksi} dari CSV${timpa ? " (menimpa)" : ""}`,
      target: koleksi,
    });
  }
  console.log(`- ${koleksi}: ${tulis} ditulis, ${lewat} sudah ada (dilewati)`);
}
console.log(timpa ? "Selesai." : "Selesai. Pakai --timpa untuk memperbarui data yang sudah ada.");
