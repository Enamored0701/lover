import { expect, it } from "vitest";
import { dossierFields, clampStat } from "@/lib/dossier";
it("provides Chinese sentinel and campus numeric presets", () => {
  expect(dossierFields("sentinel")["label-1"]).toBe("精神力");
  expect(dossierFields("campus")["label-0"]).toBe("专注");
  expect(dossierFields("sentinel")["stat-1"]).toBe("84");
});
it("bounds editable character statistics", () => {
  expect(clampStat(-1)).toBe(0);
  expect(clampStat(101)).toBe(100);
});
it("offers personality and ancient theme-specific groups and checklists", () => {
  expect(dossierFields("personality")["label-0"]).toBe("外向");
  expect(dossierFields("ancient")["label-0"]).toBe("谋略");
  for (const theme of ["sentinel", "campus", "personality", "ancient"] as const) {
    const f = dossierFields(theme);
    expect(f["meta-groups"]).toBe("2");
    expect(f["g1-label-0"]).not.toBe(f["label-0"]);
    expect(f["g1-stat-0"]).not.toBe(f["stat-0"]);
    expect(Number(f["meta-checks"])).toBeGreaterThan(0);
  }
});