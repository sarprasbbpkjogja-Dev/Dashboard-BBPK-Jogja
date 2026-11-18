import { describe, expect, it } from "vitest";
import { MENU, ROLE_LABEL, ROLES, isRole } from "@/lib/roles";

describe("daftar role", () => {
  it("setiap role punya label dan minimal satu menu", () => {
    for (const role of ROLES) {
      expect(ROLE_LABEL[role]).toBeTruthy();
      expect(MENU[role].length).toBeGreaterThan(0);
    }
  });

  it("semua tautan menu berada di bawah /admin", () => {
    for (const role of ROLES) {
      for (const item of MENU[role]) expect(item.href.startsWith("/admin")).toBe(true);
    }
  });

  it("isRole menolak nilai di luar daftar", () => {
    expect(isRole("ula")).toBe(true);
    expect(isRole("admin")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});
