// Firebase untuk browser. Admin SDK ada di lib/firebase/admin.ts (server only).
// Inisialisasi dibuat malas (lazy): baru berjalan saat fungsi dipanggil, sehingga build
// tidak gagal bila environment variable belum diisi.
import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const pakaiEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

let auth: Auth | undefined;
let db: Firestore | undefined;

export function firebaseApp(): FirebaseApp {
  if (!firebaseConfig.apiKey) {
    throw new Error("Konfigurasi Firebase belum diisi (NEXT_PUBLIC_FIREBASE_*).");
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function firebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(firebaseApp());
    if (pakaiEmulator) connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return auth;
}

export function firestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(firebaseApp());
    if (pakaiEmulator) connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  return db;
}
