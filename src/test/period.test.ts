import { describe, expect, it } from "vitest";
import { predict } from "@/lib/period";
import { parseAnyJson, dedupe } from "@/lib/cards";

describe("period prediction", () => {
  it("uses average cycle between marked starts", () => {
    const p = predict(["2026-01-01", "2026-01-02", "2026-01-31", "2026-02-01"]);
    expect(p.cycle).toBe(30);
    expect(p.next).toBe("2026-03-02");
    expect(p.ovulation).toBe("2026-02-16");
  });
  it("defaults to 28 days with one period", () => {
    const p = predict(["2026-05-01"]);
    expect(p.next).toBe("2026-05-29");
  });
});

describe("card import", () => {
  it("reads any json shape and dedupes", () => {
    const cards = parseAnyJson({ 早安: ["早", "早"], list: [{ text: "晚安", group: "夜" }] }, "chat", "x");
    expect(cards.map((c) => c.text)).toEqual(["早", "早", "晚安"]);
    expect(cards[2]?.group).toBe("夜");
    expect(dedupe(cards).removed).toBe(1);
  });
});
