import type { Track } from "./types";
import { uid } from "./util";

export function parseTracks(data: unknown): Track[] {
  const source = Array.isArray(data) ? data : data && typeof data === "object" && "tracks" in data ? (data as { tracks: unknown }).tracks : [];
  if (!Array.isArray(source)) return [];
  return source.flatMap((v: unknown) => {
    if (!v || typeof v !== "object") return [];
    const item = v as Record<string, unknown>;
    const title = typeof item['title'] === "string" ? item['title'] : typeof item['name'] === "string" ? item['name'] : "";
    const src = typeof item['src'] === "string" ? item['src'] : typeof item['url'] === "string" ? item['url'] : "";
    if (!title || !/^https:\/\//.test(src)) return [];
    return [{ id: uid(), title, artist: typeof item['artist'] === "string" ? item['artist'] : "", src }];
  });
}