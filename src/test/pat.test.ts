import { expect, it, vi } from "vitest";
import { initialState, patAvatar, tick } from "@/lib/store";

it("uses both names and does not schedule a reactive partner pat", () => {
  const s = initialState();
  s.profile.me = "小雨"; s.profile.him = "郇玴";
  s.chat.patHim = "的袖口";
  s.chat.patMe = "的肩";
  s.cards = [{ id: "pat", use: "pat", group: "默认", text: "，说我在" }];
  patAvatar(s, "him");
  expect(s.msgs[0]?.text).toBe("小雨拍了拍郇玴的袖口");
  expect(s.tasks).toHaveLength(0);
});
it("independently sends a rare partner pat from editable cards", () => {
  const s = initialState(); s.profile.me = "小雨"; s.profile.him = "郇玴";
  s.cards = [{ id: "pat", use: "pat", group: "默认", text: "，说我在" }];
  s.sched.pat = 0;
  const spy = vi.spyOn(Math, "random").mockReturnValue(0.01);
  tick(s, Date.now()); spy.mockRestore();
  expect(s.msgs.at(-1)?.text).toBe("郇玴拍了拍小雨的肩，说我在");
  expect(s.notices[0]?.text).toBe("郇玴拍了拍小雨的肩，说我在");
  expect(s.notices[0]?.go).toBe("chat");
});
it("double tapping yourself does not trigger a partner task", () => {
  const s = initialState(); s.chat.patMe = "的口袋";
  patAvatar(s, "me");
  expect(s.msgs[0]?.text).toBe("我拍了拍我的口袋");
  expect(s.tasks).toHaveLength(0);
});
it("skips the independent pat outside the 5 percent chance and waits 6–18 hours", () => {
  const s = initialState(); s.sched.pat = 0;
  const now = Date.now();
  const spy = vi.spyOn(Math, "random").mockReturnValue(0.5);
  tick(s, now); spy.mockRestore();
  expect(s.msgs).toHaveLength(0);
  expect(s.sched.pat - now).toBeGreaterThanOrEqual(6 * 3600000);
  expect(s.sched.pat - now).toBeLessThanOrEqual(18 * 3600000);
});
it("imports grouped pat cards with the shared JSON parser", async () => {
  const { parseAnyJson } = await import("@/lib/cards");
  const cards = parseAnyJson({ 温柔: ["，替你整理衣领"] }, "pat", "导入");
  expect(cards[0]).toMatchObject({ use: "pat", group: "温柔", text: "，替你整理衣领" });
});
it("random status changes draw from user-added statuses", () => {
  const s = initialState(); s.chat.statuses = ["在学校等你"]; s.sched.status = 0;
  tick(s, Date.now());
  expect(s.chat.status).toBe("在学校等你");
});