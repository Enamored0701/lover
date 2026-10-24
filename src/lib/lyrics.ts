export interface LyricLine { at: number; text: string }
export function parseLyrics(source: string): LyricLine[] {
  const offset = Number(source.match(/\[offset:([+-]?\d+)\]/)?.[1] ?? 0) / 1000;
  return source.split(/\r?\n/).flatMap(line => {
    const text = line.replace(/\[[^\]]*\]/g, "").trim();
    return Array.from(line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g), m => ({ at: Math.max(0, Number(m[1]) * 60 + Number(m[2]) + offset), text }));
  }).filter(l => l.text).sort((a, b) => a.at - b.at);
}
export function lyricIndex(lines: LyricLine[], seconds: number) {
  let index = -1; for (const [i, line] of lines.entries()) { if (line.at > seconds) break; index = i; } return index;
}
export function neteaseSongId(src: string) {
  try { const url = new URL(src); const id = (url.searchParams.get("id") ?? "").replace(/\.mp3$/, ""); return url.hostname === "music.163.com" && /^\d{1,20}$/.test(id) ? id : null; } catch { return null; }
}