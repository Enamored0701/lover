import { expect, it } from "vitest";
import { produce } from "immer";
import { initialState, scheduleChatReply, scheduleProactive, tick } from "@/lib/store";

it("double-tapping his avatar makes him send a message within a few seconds", () => {
  let s = produce(initialState(), (d) => { scheduleProactive(d); });
  const before = s.msgs.length;
  s = produce(s, (d) => tick(d, Date.now() + 6000));
  expect(s.msgs.length).toBeGreaterThan(before);
  expect(s.msgs.at(-1)?.who).toBe("him");
});
it("double-tapping makes a pending reply immediately enter its typing window", () => {
  const s = initialState(); s.chat.replyMin = 40; s.chat.replyMax = 40;
  scheduleChatReply(s); scheduleProactive(s);
  expect(s.tasks).toHaveLength(1);
  const pending = s.tasks[0];
  expect((pending?.at ?? 0) - Date.now()).toBeLessThanOrEqual(3500);
  expect((pending?.at ?? 0) - Date.now()).toBeGreaterThan(0);
});
