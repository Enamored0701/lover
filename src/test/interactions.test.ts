import { afterEach, expect, it, vi } from "vitest";
import { initialState, schedulePeriodCare, tick } from "@/lib/store";
import { careTargets, ordinaryChance, RARE_CHANCE } from "@/lib/interactions";
import { parseRussianCard } from "@/lib/messages";
import { parseAnyJson, withNewDefaultCards } from "@/lib/cards";
import { MIN } from "@/lib/util";
afterEach(() => vi.restoreAllMocks());
function isolated() {
  const s = initialState();
  for (const key of Object.keys(s.sched) as (keyof typeof s.sched)[]) s.sched[key] = 1e15;
  s.music.nextAt = 1e15;
  return s;
}
for (const kind of ["call", "pat"] as const) it(`${kind} uses exactly a 5% independent chance`, () => {
  expect(RARE_CHANCE).toBe(0.05);
  const s = isolated(); s.sched[kind] = 0;
  vi.spyOn(Math, "random").mockReturnValue(0.049); tick(s, 100);
  expect(kind === "call" ? s.incoming === 100 : s.msgs.length > 0).toBe(true);
  const outside = isolated(); outside.sched[kind] = 0;
  vi.spyOn(Math, "random").mockReturnValue(0.05); tick(outside, 100);
  expect(kind === "call" ? outside.incoming : outside.msgs[0]).toBeUndefined();
});
it("ordinary interactions use a higher freshly randomized chance", () => {
  const spy = vi.spyOn(Math, "random").mockReturnValueOnce(0.39).mockReturnValueOnce(0);
  expect(ordinaryChance()).toBe(true);
  spy.mockReturnValueOnce(0.91).mockReturnValueOnce(1);
  expect(ordinaryChance()).toBe(false);
});
for (const [kind, random] of [["murmur", 0.1], ["essay", 0.3], ["diary", 0.55], ["letter", 0.8]] as const) it(`can autonomously write ${kind} from cards`, () => {
  const s = isolated(); s.sched.post = 0;
  vi.spyOn(Math, "random").mockReturnValueOnce(random).mockReturnValue(kind === "diary" ? 0.55 : 0.1);
  tick(s, 100); expect(s.posts[0]?.kind).toBe(kind);
  expect(s.notices[0]?.postId).toBe(s.posts[0]?.id);
  if (kind === "diary") expect(s.posts[0]?.locked).toBe(true);
});
it("invites an exact song from the saved playlist", () => {
  const s = isolated(); s.music.nextAt = 0;
  s.music.tracks = [{ id: "silk", title: "丝路", artist: "", src: "https://example.com/song.mp3" }];
  vi.spyOn(Math, "random").mockReturnValue(0.1); tick(s, 100);
  expect(s.music.invite?.trackId).toBe("silk"); expect(s.music.invite?.text).toContain("《丝路》");
});
it("schedules period care randomly rather than immediately", () => {
  const s = isolated(); const now = Date.now(); schedulePeriodCare(s, "2026-10-24");
  expect(s.tasks[0]?.kind).toBe("periodCare");
  expect(s.tasks[0]?.at ?? 0).toBeGreaterThanOrEqual(now + MIN);
  expect(s.tasks[0]?.at ?? 0).toBeLessThanOrEqual(Date.now() + 15 * MIN);
});
it("uses only the matching editable period group and avoids duplicate care", () => {
  const s = isolated(); s.period.days = ["2026-10-24"]; s.sched.care = 0;
  s.cards = [{ id: "care", use: "period", group: "经期中", text: "今天我陪你休息。" }];
  vi.spyOn(Math, "random").mockReturnValue(0.1);
  const now = new Date(2026, 9, 24, 12).getTime(); tick(s, now);
  expect(s.events[0]).toMatchObject({ text: "今天我陪你休息。", careGroup: "经期中", date: "2026-10-24" });
  s.sched.care = 0; tick(s, now); expect(s.events).toHaveLength(1);
});
for (const [date, group] of [["2026-10-01", "经期中"], ["2026-10-29", "预测经期"], ["2026-10-15", "预测排卵期"], ["2026-10-12", "易孕期"]]) it(`classifies ${group} separately`, () => {
  const period = { days: ["2026-10-01"], cycle: 28, len: 5 };
  expect(careTargets(period, date ?? "")).toContainEqual({ date, group });
});
it("imports Russian bracket translations and sends parsed text", () => {
  const cards = parseAnyJson({ 温柔: ["Дорогой【亲爱的】"] }, "russian", "导入");
  expect(parseRussianCard(cards[0]?.text ?? "")).toEqual({ text: "Дорогой", translation: "亲爱的" });
  const s = isolated(); s.cards = cards; s.tasks = [{ id: "r", kind: "proactive", at: 0 }]; tick(s, 100);
  expect(s.msgs[0]).toMatchObject({ text: "Дорогой", translation: "亲爱的" });
});
it("adds new libraries to old restores without removing existing cards", () => {
  const old = [{ id: "custom", use: "chat" as const, group: "我的", text: "我在" }];
  const restored = withNewDefaultCards(old);
  expect(restored[0]).toEqual(old[0]); expect(restored.some(c => c.use === "russian")).toBe(true);
  expect(new Set(restored.filter(c => c.use === "period").map(c => c.group))).toEqual(new Set(["经期中", "预测经期", "预测排卵期", "易孕期"]));
});
for (const [random, status] of [[0.1, "ok"], [0.99, "no"]] as const) it(`randomly ${status} a partner diary request`, () => {
  const s = isolated(); s.posts = [{ id: "d", who: "him", kind: "diary", locked: true, title: "夜", text: "私密", at: 0, imgs: [], comments: [], req: { by: "me", at: 0, status: "pending" } }];
  s.tasks = [{ id: "u", kind: "unlock", ref: "d", at: 0 }]; vi.spyOn(Math, "random").mockReturnValue(random); tick(s, 100);
  expect(s.posts[0]?.req?.status).toBe(status); expect(Boolean(s.posts[0]?.unlocked)).toBe(status === "ok");
});
it("does not comment on a user's still-locked diary", () => {
  const s = isolated(); s.posts = [{ id: "d", who: "me", kind: "diary", locked: true, title: "夜", text: "私密", at: 0, imgs: [], comments: [] }];
  s.tasks = [{ id: "c", kind: "comment", ref: "d", at: 0 }]; tick(s, 100); expect(s.posts[0]?.comments).toHaveLength(0);
});
it("independently likes and schedules a comment without a user trigger", () => {
  const s = isolated(); s.sched.like = 0;
  s.posts = [{ id: "essay", who: "me", kind: "essay", title: "远方", text: "正文", at: 0, imgs: [], comments: [] }];
  vi.spyOn(Math, "random").mockReturnValue(0.1); tick(s, 100);
  expect(s.posts[0]?.likedByHim).toBe(true); expect(s.tasks.some(t => t.kind === "comment" && t.ref === "essay")).toBe(true);
});
it("randomly requests access to my locked diary, without commenting first", () => {
  const s = isolated(); s.sched.diaryReq = 0;
  s.posts = [{ id: "mine", who: "me", kind: "diary", locked: true, title: "夜", text: "私密", at: 0, imgs: [], comments: [] }];
  vi.spyOn(Math, "random").mockReturnValue(0.1); tick(s, 100);
  expect(s.posts[0]?.req).toMatchObject({ by: "him", status: "pending" });
  expect(s.notices[0]).toMatchObject({ kind: "unlock", postId: "mine" }); expect(s.posts[0]?.comments).toHaveLength(0);
});
it("randomly skips a diary access request outside its ordinary chance", () => {
  const s = isolated(); s.sched.diaryReq = 0;
  s.posts = [{ id: "mine", who: "me", kind: "diary", locked: true, title: "夜", text: "私密", at: 0, imgs: [], comments: [] }];
  vi.spyOn(Math, "random").mockReturnValue(0.99); tick(s, 100); expect(s.posts[0]?.req).toBeUndefined();
});
it("uses editable world reminder cards and stores the target day", () => {
  const s = isolated(); s.sched.remind = 0; s.cards = [{ id: "world", use: "remind", group: "设定", text: "今天补充我们的校园故事吧。" }];
  vi.spyOn(Math, "random").mockReturnValue(0.1); tick(s, new Date(2026, 9, 24, 12).getTime());
  expect(s.remindToday).toMatchObject({ text: "今天补充我们的校园故事吧。", date: "2026-10-25" });
  expect(s.notices[0]?.go).toBe("world");
});