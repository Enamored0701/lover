export type PlaybackMode = "loop" | "shuffle" | "single";
export function advanceTrack(index: number, count: number, mode: PlaybackMode, ended = false, random = Math.random()) {
  if (count <= 1 || (ended && mode === "single")) return index;
  if (mode === "shuffle") return (index + 1 + Math.floor(random * (count - 1))) % count;
  return (index + 1) % count;
}