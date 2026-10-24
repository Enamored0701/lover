import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { backgroundTone, canNotify } from "@/lib/playback";
import { messageBody } from "@/lib/messages";

export function BackgroundServices() {
  const { s, up, go } = useStore();
  const tone = useRef<HTMLAudioElement | null>(null);
  const [toneUrl, setToneUrl] = useState("");
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    const src = backgroundTone(); setToneUrl(src);
    return () => URL.revokeObjectURL(src);
  }, []);
  useEffect(() => {
    if (!s.playback.backgroundAudio || !toneUrl) { tone.current?.pause(); return; }
    const start = () => { void tone.current?.play().catch(() => up(d => { d.playback.backgroundAudio = false; })); };
    start();
    document.addEventListener("pointerdown", start, { once: true });
    return () => { document.removeEventListener("pointerdown", start); tone.current?.pause(); };
  }, [s.playback.backgroundAudio, toneUrl, up]);
  useEffect(() => {
    const records = [...s.notices.filter(n => n.go !== "chat").map(n => ({ id: n.id, body: n.text, view: n.go })), ...s.msgs.filter(m => m.who === "him").map(m => ({ id: m.id, body: messageBody(m), view: "chat" as const }))];
    if (!seen.current) { seen.current = new Set(records.map(r => r.id)); return; }
    for (const record of records) {
      if (seen.current.has(record.id)) continue;
      seen.current.add(record.id);
      if (!("Notification" in window) || !canNotify(s.playback.notifications, Notification.permission)) continue;
      try {
        const notice = new Notification(record.view === "chat" ? s.profile.him : "PREVIA", { body: record.body, icon: "/apple-touch-icon.png", tag: `previa-${record.view}` });
        notice.onclick = () => { window.focus(); go(record.view); if (record.view === "chat") setTimeout(() => window.dispatchEvent(new Event("previa-open-chat")), 60); notice.close(); };
      } catch { /* Some mobile browsers require connected web push instead. */ }
    }
  }, [s.notices, s.msgs, s.playback.notifications, go]);
  return <audio ref={tone} src={toneUrl || undefined} loop preload="none" aria-hidden="true" />;
}