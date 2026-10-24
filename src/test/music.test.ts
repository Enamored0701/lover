import { expect, it } from "vitest";
import { parseTracks } from "@/lib/music";

it("imports actual playable track URLs from a playlist file", () => {
  expect(parseTracks({ tracks: [{ name: "丝路", artist: "我们", url: "https://example.com/song.mp3" }] })).toEqual([
    expect.objectContaining({ title: "丝路", artist: "我们", src: "https://example.com/song.mp3" }),
  ]);
});
it("does not import unsafe or missing audio URLs", () => {
  expect(parseTracks([{ title: "x", src: "javascript:alert(1)" }, { name: "no audio" }])).toEqual([]);
});