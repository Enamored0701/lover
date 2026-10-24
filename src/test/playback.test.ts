import { expect, it } from "vitest";
import { canNotify, pauseForNavigation, playbackDefaults } from "@/lib/playback";
it("continues across pages when the playback switch is on", () => { expect(pauseForNavigation(true, "us")).toBe(false); });
it("pauses outside messages when cross-page playback is off", () => { expect(pauseForNavigation(false, "calendar")).toBe(true); expect(pauseForNavigation(false, "chat")).toBe(false); });
it("disables notifications when their switch is off", () => { expect(canNotify(false, "granted")).toBe(false); });
it("requires permission even when notifications are enabled", () => { expect(canNotify(true, "denied")).toBe(false); expect(canNotify(true, "granted")).toBe(true); });
it("keeps background audio opt-in and phone controls independently enabled", () => { expect(playbackDefaults.backgroundAudio).toBe(false); expect(playbackDefaults.mediaControls).toBe(true); });