"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

export function TombolKeluar() {
  const router = useRouter();
  const [proses, setProses] = useState(false);

  async function keluar() {
    setProses(true);
    try {
      await fetch("/api/sesi", { method: "DELETE" });
      await signOut(firebaseAuth()).catch(() => undefined);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={keluar}
      disabled={proses}
      className="self-start text-xs text-sidebar-quiet hover:text-surface disabled:opacity-60"
    >
      {proses ? "Keluar…" : "Keluar"}
    </button>
  );
}
