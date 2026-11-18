import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

/** Menulis satu baris ke audit_log. Hanya server yang boleh menulis koleksi ini. */
export async function catatAudit(uid: string, aksi: string, target: string): Promise<void> {
  await adminDb().collection("audit_log").add({ waktu: FieldValue.serverTimestamp(), uid, aksi, target });
}
