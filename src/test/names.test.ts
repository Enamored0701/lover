import { describe, expect, it } from "vitest";
import { partnerName } from "@/lib/names";

const profile = { me: "我", him: "郇玴", nick: "亲爱的", bio: "", together: "2026-10-24", motto: "" };
describe("Partner name scope", () => {
  it("uses the global name outside the chat header and letters", () => {
    expect(partnerName(profile)).toBe("郇玴");
  });
  it("uses the remark in the chat header", () => {
    expect(partnerName(profile, "chat-header")).toBe("亲爱的");
  });
  it("uses the nickname when writing letters", () => {
    expect(partnerName(profile, "letter")).toBe("亲爱的");
  });
});