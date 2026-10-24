import { expect, it, vi } from "vitest";
import { initialState, tick } from "@/lib/store";

function setup() {
  const s = initialState();
  for (const key of Object.keys(s.sched) as (keyof typeof s.sched)[]) s.sched[key] = 1e15;
  s.music.tracks = [{ id: "song", title: "同行", artist: "", src: "https://example.com/song.mp3" }];
  s.music.nextAt = 0;
  return s;
}
it("invites shared listening when music is stopped", () => {
  const s = setup(); const spy = vi.spyOn(Math, "random").mockReturnValue(0.1); tick(s, 100); spy.mockRestore();
  expect(s.music.invite?.text).toBeTruthy();
  expect(s.music.nextAt).toBeGreaterThan(100);
});
it("pauses a single-track listening session", () => {
  const s = setup(); s.music.shared = true; s.music.listening = true; const spy = vi.spyOn(Math, "random").mockReturnValue(0.1); tick(s, 100); spy.mockRestore();
  expect(s.music.command?.kind).toBe("pause");
});
it("can switch tracks during shared listening", () => {
  const s = setup(); s.music.shared = true; s.music.listening = true; s.music.tracks.push({ ...s.music.tracks[0], id: "two", title: "下一首", artist: "", src: "https://example.com/two.mp3" });
  const spy = vi.spyOn(Math, "random").mockReturnValue(0.1);
  tick(s, 100); expect(s.music.command?.kind).toBe("next"); spy.mockRestore();
});
it("does not automatically invite outside the random chance", () => {
  const s = setup(); const spy = vi.spyOn(Math, "random").mockReturnValue(0.99);
  tick(s, 100); spy.mockRestore(); expect(s.music.invite).toBeUndefined();
});
it("starts without shared membership and cannot control an uninvited session", () => {
  const s = setup(); expect(s.music.shared).toBe(false); s.music.listening = true;
  tick(s, 100); expect(s.music.command).toBeUndefined();
});
it("does not control music when partner listening is disabled", () => {
  const s = setup(); s.music.partner = false; tick(s, 100);
  expect(s.music.invite).toBeUndefined(); expect(s.music.command).toBeUndefined();
});