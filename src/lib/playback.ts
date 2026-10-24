import type { View } from "./types";

export const playbackDefaults = { crossPage: true, mediaControls: true, notifications: false, backgroundAudio: false };
export function pauseForNavigation(crossPage: boolean, view: View) { return !crossPage && view !== "chat"; }
export function canNotify(enabled: boolean, permission: string) { return enabled && permission === "granted"; }

/** A quiet audible tone, not a promise that the operating system will keep JS alive. */
export function backgroundTone(): string {
  const rate = 8000, samples = rate * 2;
  const buffer = new ArrayBuffer(44 + samples * 2), v = new DataView(buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF"); v.setUint32(4, buffer.byteLength - 8, true); text(8, "WAVE"); text(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  text(36, "data"); v.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) v.setInt16(44 + i * 2, Math.round(Math.sin(2 * Math.PI * 160 * i / rate) * 160), true);
  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}