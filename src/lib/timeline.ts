import type { Entry } from "./types";
export type TimelineOwner = "me" | "him" | "both";
export const timelineColors = { me: "#777777", him: "#222222" };
export function hexColor(value: string | undefined, fallback: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
export function timelineOwner(entry: Entry): TimelineOwner {
  const owner = entry.fields?.["timeline-owner"];
  return owner === "me" || owner === "him" ? owner : "both";
}