// Firebase Admin SDK. Hanya boleh diimpor dari kode server (route handler, server component).
// Import "server-only" membuat build gagal bila file ini terbawa ke bundle browser.
// Inisialisasi dibuat malas agar build tidak gagal saat kredensial belum diisi.
import "server-only";
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function adminApp(): App {
  if (getApps().length) return getApp();

  // Saat emulator berjalan, Admin SDK otomatis memakai FIRESTORE_EMULATOR_HOST dan
  // FIREBASE_AUTH_EMULATOR_HOST, sehingga kredensial tidak diperlukan.
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return initializeApp({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID });
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Vercel menyimpan baris baru sebagai "\n" literal; kembalikan ke baris baru asli.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Kredensial Admin SDK belum lengkap. Isi FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, dan FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}
