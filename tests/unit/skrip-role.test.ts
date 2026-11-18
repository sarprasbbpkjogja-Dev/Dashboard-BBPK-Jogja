import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/roles";

// scripts/set-role.mjs menyalin daftar role karena berjalan tanpa TypeScript.
// Tes ini memastikan salinannya tidak tertinggal saat lib/roles.ts berubah.
describe("skrip set-role", () => {
  it("daftar role di skrip sama dengan lib/roles.ts", () => {
    const isi = readFileSync("scripts/set-role.mjs", "utf8");
    const blok = isi.match(/const ROLES = \[([\s\S]*?)\];/)?.[1] ?? "";
    const diSkrip = [...blok.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
    expect(diSkrip).toEqual([...ROLES]);
  });
});
