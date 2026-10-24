import { expect, it } from "vitest";
import { parseLyrics, lyricIndex, neteaseSongId } from "@/lib/lyrics";
it("synchronizes repeated lyric timestamps and offsets", () => {
  const lines = parseLyrics("[offset:1000]\n[00:02.50][00:05]同一句\n[00:10]下一句");
  expect(lines.map(l => l.at)).toEqual([3.5, 6, 11]);
  expect(lyricIndex(lines, 6.5)).toBe(1);
  expect(lyricIndex(lines, 0)).toBe(-1);
});
it("only requests NetEase lyrics for NetEase song links", () => {
  expect(neteaseSongId("https://music.163.com/song/media/outer/url?id=123.mp3")).toBe("123");
  expect(neteaseSongId("https://music.163.com/song/media/outer/url?id=123&x=.mp3")).toBe("123");
  expect(neteaseSongId("https://example.com/?id=123")).toBe(null);
});