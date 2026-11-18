// Firebase Admin SDK. Hanya boleh diimpor dari kode server (route handler, server action).
// Import "server-only" membuat build gagal bila file ini terbawa ke bundle browser.
import "server-only";
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function buatApp(): App {
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

export const adminApp = buatApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
