import { expect, it } from "vitest";
import { parseAnyJson, dedupe } from "@/lib/cards";

it("preserves named groups for string and array JSON values", () => {
  const cards = parseAnyJson({ 夜晚: "晚安", 清晨: ["早安"] }, "chat", "导入");
  expect(cards.map(c => [c.text, c.group])).toEqual([["晚安", "夜晚"], ["早安", "清晨"]]);
});
it("preserves explicit groups and deduplicates imported cards", () => {
  const cards = parseAnyJson([{ group: "同行", text: "我在" }, { group: "同行", text: "我在" }], "chat", "导入");
  expect(cards.every(c => c.group === "同行")).toBe(true);
  expect(dedupe(cards).cards).toHaveLength(1);
});