import type { State } from "./types";

export function partnerName(profile: State["profile"], context: "global" | "chat-header" | "letter" = "global") {
  return context === "global" ? profile.him : profile.nick || profile.him;
}