import { expect, it } from "vitest";
import { hexColor, timelineOwner } from "@/lib/timeline";
const entry = { id: "1", title: "", text: "", date: "", tag: "", at: 0 };
it("accepts the requested six-digit representative color", () => { expect(hexColor("#FDFDFD", "#777777")).toBe("#FDFDFD"); expect(hexColor("red", "#777777")).toBe("#777777"); });
it("distinguishes my, his and shared timeline experiences", () => { expect(timelineOwner({ ...entry, fields: { "timeline-owner": "me" } })).toBe("me"); expect(timelineOwner({ ...entry, fields: { "timeline-owner": "him" } })).toBe("him"); expect(timelineOwner(entry)).toBe("both"); });