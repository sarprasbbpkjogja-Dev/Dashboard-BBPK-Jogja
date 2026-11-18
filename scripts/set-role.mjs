// Menetapkan role untuk akun yang sudah ada di Firebase Authentication.
// Dipakai untuk membuat super admin pertama; akun lain sebaiknya dibuat lewat dashboard super admin.
//
// Pemakaian (dari folder proyek, .env.local berisi kredensial Admin SDK):
//   npm run set-role -- nama@email.go.id super_admin
//
// Akun harus dibuat dulu di Firebase Console → Authentication → Users → Add user.
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

// Sama dengan ROLES di lib/roles.ts.
const ROLES = [
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
];

const [email, role] = process.argv.slice(2);
if (!email || !ROLES.includes(role)) {
  console.error("Pemakaian: npm run set-role -- <email> <role>");
  console.error("Role yang tersedia:", ROLES.join(", "));
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  console.error("Isi FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, dan FIREBASE_ADMIN_PRIVATE_KEY di .env.local.");
  process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth();
const db = getFirestore();

let user;
try {
  user = await auth.getUserByEmail(email);
} catch {
  console.error(`Akun ${email} belum ada. Buat dulu di Firebase Console → Authentication → Users → Add user.`);
  process.exit(1);
}

await auth.setCustomUserClaims(user.uid, { role });
await auth.revokeRefreshTokens(user.uid);
await db
  .collection("users")
  .doc(user.uid)
  .set(
    {
      nama: user.displayName || email,
      email,
      role,
      aktif: !user.disabled,
      diubahPada: FieldValue.serverTimestamp(),
      diubahOleh: "skrip set-role",
    },
    { merge: true },
  );
await db.collection("audit_log").add({
  waktu: FieldValue.serverTimestamp(),
  uid: "skrip set-role",
  aksi: `Menetapkan role ${role} untuk ${email}`,
  target: `users/${user.uid}`,
});

console.log(`Selesai: ${email} sekarang ber-role ${role}. Silakan masuk ulang di /login.`);
