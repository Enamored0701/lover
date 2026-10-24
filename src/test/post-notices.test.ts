import { expect, it, vi, afterEach } from "vitest";
import { initialState, tick } from "@/lib/store";
afterEach(() => vi.restoreAllMocks());
it("links diary access requests to the exact diary", () => {
  const s = initialState();
  s.posts.push({ id: "private-diary", kind: "diary", who: "me", title: "日记", text: "私密内容", at: 1, imgs: [], comments: [], locked: true });
  s.sched.diaryReq = 0;
  vi.spyOn(Math, "random").mockReturnValue(0.1);
  tick(s, Date.now());
  expect(s.notices.find(n => n.kind === "unlock")?.postId).toBe("private-diary");
  expect(s.posts[0]?.req?.status).toBe("pending");
});
it("links comments and partner likes to the exact post", () => {
  const s = initialState();
  s.posts.push({ id: "essay", kind: "essay", who: "me", title: "随笔", text: "正文", at: 1, imgs: [], comments: [] });
  s.tasks.push({ id: "comment", kind: "comment", ref: "essay", at: 0 });
  vi.spyOn(Math, "random").mockReturnValue(0.1);
  tick(s, Date.now());
  expect(s.notices.find(n => n.kind === "comment")?.postId).toBe("essay");
  expect(s.notices.find(n => n.kind === "like")?.postId).toBe("essay");
  expect(s.posts[0]?.likedByHim).toBe(true);
});