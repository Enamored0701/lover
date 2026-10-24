import { expect, it } from "vitest";
import { advanceTrack } from "@/lib/listening";
it("loops the playlist from the last track to the first", () => { expect(advanceTrack(2, 3, "loop", true)).toBe(0); });
it("single repeat keeps the track when it ends", () => { expect(advanceTrack(1, 3, "single", true)).toBe(1); });
it("manual next still changes the track in single repeat", () => { expect(advanceTrack(1, 3, "single")).toBe(2); });
it("shuffle selects a different track", () => { expect(advanceTrack(1, 3, "shuffle", true, 0.9)).toBe(0); });
it("one-song playlist loops the same song", () => { expect(advanceTrack(0, 1, "loop", true)).toBe(0); });