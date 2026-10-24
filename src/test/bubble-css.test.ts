import { expect, it } from "vitest";
import { BUBBLE_TEMPLATE, compileBubbleCss } from "@/lib/bubble-css";

it("maps the fixed two-sided format to scoped live bubbles", () => {
  const result = compileBubbleCss(BUBBLE_TEMPLATE);
  expect(result.error).toBe("");
  expect(result.css).toContain('[data-bubble-scope="live"] .bub-me');
  expect(result.css).toContain('[data-bubble-scope="live"] .bub-him');
  expect(result.css).toContain("border-radius:16px 3px 16px 16px !important");
});
it("keeps imported appearance from changing mobile bubble layout", () => {
  const result = compileBubbleCss(".bubble-me { width:900px; position:fixed; color:red; }");
  expect(result.css).not.toContain("width");
  expect(result.css).not.toContain("position");
  expect(result.css).toContain("color:red !important");
});
it("rejects unknown selectors instead of claiming they applied", () => {
  expect(compileBubbleCss(".unknown { color:red; }").error).toContain(".bubble-me");
});
it("separates editor preview from live applied bubbles", () => {
  expect(compileBubbleCss(BUBBLE_TEMPLATE, "preview").css).not.toContain('scope="live"');
});