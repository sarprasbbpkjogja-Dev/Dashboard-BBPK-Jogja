"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

function pesanGalat(e: unknown): string {
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email atau kata sandi salah.";
      case "auth/invalid-email":
        return "Format email tidak valid.";
      case "auth/user-disabled":
        return "Akun ini dinonaktifkan. Hubungi super admin.";
      case "auth/too-many-requests":
        return "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.";
      case "auth/network-request-failed":
        return "Tidak ada koneksi internet.";
    }
  }
  if (e instanceof Error && e.message.startsWith("Konfigurasi Firebase")) return e.message;
  return "Gagal masuk. Coba lagi.";
}

export function FormLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState("");
  const [info, setInfo] = useState("");

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");
    setInfo("");
    if (!email.trim() || !sandi) {
      setGalat("Email dan kata sandi wajib diisi.");
      return;
    }
    setProses(true);
    try {
      const auth = firebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), sandi);
      const kirim = async (paksaBaru: boolean) =>
        fetch("/api/sesi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: await cred.user.getIdToken(paksaBaru) }),
        });
      let res = await kirim(false);
      // 409 = role baru saja ditetapkan server (super admin pertama); ambil token baru sekali.
      if (res.status === 409) res = await kirim(true);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { pesan?: string };
        await signOut(auth);
        setGalat(data.pesan ?? "Gagal membuat sesi.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setGalat(pesanGalat(err));
    } finally {
      setProses(false);
    }
  }

  async function lupaSandi() {
    setGalat("");
    setInfo("");
    if (!email.trim()) {
      setGalat("Isi email terlebih dahulu, lalu tekan Lupa kata sandi.");
      return;
    }
    try {
      await sendPasswordResetEmail(firebaseAuth(), email.trim());
    } catch (err) {
      if (err instanceof FirebaseError && err.code === "auth/invalid-email") {
        setGalat("Format email tidak valid.");
        return;
      }
    }
    // Pesan sama untuk email terdaftar maupun tidak, agar daftar akun tidak bisa ditebak.
    setInfo("Jika email terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim.");
  }

  return (
    <form onSubmit={masuk} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-[48px] rounded-lg border border-line bg-surface px-3.5"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sandi" className="text-sm font-semibold">
          Kata sandi
        </label>
        <input
          id="sandi"
          type="password"
          autoComplete="current-password"
          value={sandi}
          onChange={(e) => setSandi(e.target.value)}
          className="min-h-[48px] rounded-lg border border-line bg-surface px-3.5"
        />
      </div>
      <button type="button" onClick={lupaSandi} className="min-h-tap self-start text-sm font-semibold text-primary">
        Lupa kata sandi?
      </button>
      <button type="submit" className="btn-primary disabled:opacity-60" disabled={proses}>
        {proses ? "Memproses…" : "Masuk"}
      </button>
      {galat ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-3 text-sm font-semibold text-danger-ink">
          {galat}
        </p>
      ) : null}
      {info ? (
        <p role="status" className="rounded-lg bg-primary-soft px-3.5 py-3 text-sm text-primary">
          {info}
        </p>
      ) : null}
    </form>
  );
}
