// Tes security rules di Firestore Emulator. Jalankan: npm run test:rules
// (butuh Java 11+ untuk emulator). Setiap kasus memastikan akses lintas role ditolak.
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let env: RulesTestEnvironment;
const sekarang = () => firebase.firestore.FieldValue.serverTimestamp();

const db = (role?: string, uid = `uid-${role ?? "anon"}`) =>
  role ? env.authenticatedContext(uid, { role }).firestore() : env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-bbpka",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const f = ctx.firestore();
    await f.doc("jadwal_publik/2026-10-01").set({ isi: [] });
    await f.doc("ruangan/aula").set({ nama: "Aula Soekarno Hatta", tipe: "aula", aktif: true });
    await f.doc("ruangan/keb1").set({ nama: "Kebangkitan Nasional 1", tipe: "kelas", aktif: true });
    await f.doc("reservasi_asrama/r1").set({ nama: "Tamu", kategoriTamu: "umum", bayar: "menunggu verifikasi" });
    await f.doc("pengaduan/PGD-ABC234").set({ judul: "AC rusak", status: "baru" });
    await f.doc("pengaduan/PGD-XYZ789").set({ judul: "Wi-Fi mati", status: "diproses", unitTujuan: "pranata_komputer" });
    await f.doc("pengaduan/PGD-KLM456").set({ judul: "Keran bocor", status: "ditangani", unitTujuan: "admin_asrama" });
    await f.doc("users/uid-ula").set({ nama: "Petugas ULA", role: "ula", aktif: true });
  });
});

describe("koleksi publik", () => {
  it("publik boleh membaca jadwal dan ruangan", async () => {
    await assertSucceeds(db().doc("jadwal_publik/2026-10-01").get());
    await assertSucceeds(db().doc("ruangan/aula").get());
  });
  it("publik tidak boleh menulis jadwal publik", async () => {
    await assertFails(db().doc("jadwal_publik/2026-10-02").set({ isi: [] }));
  });
  it("petugas pun tidak boleh menulis jadwal publik (hanya server)", async () => {
    await assertFails(db("super_admin").doc("jadwal_publik/2026-10-02").set({ isi: [] }));
  });
  it("hanya pranata komputer yang menulis status jaringan", async () => {
    await assertSucceeds(db("pranata_komputer").doc("status_jaringan/merah-putih").set({ status: "gangguan" }));
    await assertFails(db("ula").doc("status_jaringan/merah-putih").set({ status: "normal" }));
  });
});

describe("asrama dan pembayaran", () => {
  it("publik dan role lain tidak boleh membaca reservasi", async () => {
    await assertFails(db().doc("reservasi_asrama/r1").get());
    await assertFails(db("admin_kendaraan").doc("reservasi_asrama/r1").get());
  });
  it("admin asrama dan bendahara boleh membaca reservasi", async () => {
    await assertSucceeds(db("admin_asrama").doc("reservasi_asrama/r1").get());
    await assertSucceeds(db("bendahara").doc("reservasi_asrama/r1").get());
  });
  it("admin asrama tidak boleh menandai lunas", async () => {
    await assertFails(db("admin_asrama").doc("reservasi_asrama/r1").update({ bayar: "lunas" }));
  });
  it("bendahara boleh menandai lunas atas namanya sendiri", async () => {
    await assertSucceeds(
      db("bendahara", "uid-bend").doc("reservasi_asrama/r1").update({
        bayar: "lunas",
        diverifikasiOleh: "uid-bend",
        diverifikasiPada: sekarang(),
      }),
    );
  });
  it("bendahara tidak boleh mengubah data selain pembayaran", async () => {
    await assertFails(db("bendahara").doc("reservasi_asrama/r1").update({ nama: "Diubah" }));
  });
});

describe("ruangan", () => {
  it("admin ruang rapat boleh menandai aula perbaikan, tidak boleh ruang kelas", async () => {
    await assertSucceeds(db("admin_ruang_rapat").doc("ruangan/aula").update({ aktif: false }));
    await assertFails(db("admin_ruang_rapat").doc("ruangan/keb1").update({ aktif: false }));
  });
  it("admin ruang tidak boleh mengganti nama ruangan", async () => {
    await assertFails(db("admin_ruang_rapat").doc("ruangan/aula").update({ nama: "Aula Baru" }));
  });
  it("peminjaman ruang hanya oleh admin sesuai tipe ruangan", async () => {
    await assertSucceeds(
      db("admin_ruang_kelas").doc("peminjaman_ruang/p1").set({ ruanganId: "keb1", namaKegiatan: "Latsar" }),
    );
    await assertFails(
      db("admin_ruang_rapat").doc("peminjaman_ruang/p2").set({ ruanganId: "keb1", namaKegiatan: "Rapat" }),
    );
  });
});

describe("pengaduan", () => {
  const tiketBaru = () => ({
    kategori: "Asrama",
    judul: "Lampu kamar mati",
    lokasi: "W. Merah Putih",
    sumber: "web",
    status: "baru",
    dibuatPada: sekarang(),
  });

  it("publik boleh membuat tiket yang valid", async () => {
    await assertSucceeds(db().doc("pengaduan/PGD-QWE234").set(tiketBaru()));
  });
  it("publik tidak boleh mengisi unit tujuan atau status lain", async () => {
    await assertFails(db().doc("pengaduan/PGD-QWE235").set({ ...tiketBaru(), unitTujuan: "admin_asrama" }));
    await assertFails(db().doc("pengaduan/PGD-QWE236").set({ ...tiketBaru(), status: "selesai" }));
  });
  it("kode tiket harus berformat PGD-XXXXXX", async () => {
    await assertFails(db().doc("pengaduan/tiket-saya").set(tiketBaru()));
  });
  it("publik tidak boleh membaca tiket", async () => {
    await assertFails(db().doc("pengaduan/PGD-ABC234").get());
  });
  it("ULA boleh meneruskan tiket baru ke unit", async () => {
    await assertSucceeds(
      db("ula").doc("pengaduan/PGD-ABC234").update({ status: "diproses", unitTujuan: "admin_asrama" }),
    );
  });
  it("ULA tidak boleh menandai tiket selesai", async () => {
    await assertFails(db("ula").doc("pengaduan/PGD-KLM456").update({ status: "selesai" }));
  });
  it("unit tidak boleh membaca atau mengubah tiket unit lain", async () => {
    await assertFails(db("admin_asrama").doc("pengaduan/PGD-XYZ789").get());
    await assertFails(db("admin_asrama").doc("pengaduan/PGD-XYZ789").update({ status: "ditangani" }));
  });
  it("unit boleh menangani tiket miliknya", async () => {
    await assertSucceeds(db("pranata_komputer").doc("pengaduan/PGD-XYZ789").update({ status: "ditangani" }));
  });
  it("menyelesaikan tiket wajib dengan catatan teknis", async () => {
    await assertFails(db("admin_asrama").doc("pengaduan/PGD-KLM456").update({ status: "selesai" }));
    await assertSucceeds(
      db("admin_asrama")
        .doc("pengaduan/PGD-KLM456")
        .update({ status: "selesai", catatanTeknis: "Keran diganti" }),
    );
  });
});

describe("akun dan log", () => {
  it("petugas boleh membaca dokumen akunnya sendiri saja", async () => {
    await assertSucceeds(db("ula", "uid-ula").doc("users/uid-ula").get());
    await assertFails(db("admin_asrama").doc("users/uid-ula").get());
  });
  it("tidak ada yang boleh menulis users dari browser, termasuk super admin", async () => {
    await assertFails(db("super_admin").doc("users/uid-baru").set({ role: "super_admin" }));
  });
  it("hanya super admin yang membaca audit log", async () => {
    await assertSucceeds(db("super_admin").collection("audit_log").get());
    await assertFails(db("ula").collection("audit_log").get());
  });
});
