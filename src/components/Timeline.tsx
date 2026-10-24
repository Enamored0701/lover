import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { EImg } from "@/components/kit";
import { useStore } from "@/lib/store";
import type { Entry } from "@/lib/types";
import { hexColor, timelineColors, timelineOwner } from "@/lib/timeline";

export function Timeline({ entries, compact = false, onSelect }: { entries: Entry[]; compact?: boolean; onSelect: (entry: Entry) => void }) {
  const { s } = useStore();
  const colors = s.worldCard["timeline"] ?? {};
  const style = { "--timeline-me": hexColor(colors["color-me"], timelineColors.me), "--timeline-him": hexColor(colors["color-him"], timelineColors.him) } as CSSProperties;
  return <section style={style} className={compact ? "paired-timeline timeline-compact" : "paired-timeline"} aria-label="双人时间线">
    <div className="timeline-legend"><span><i className="timeline-dot owner-me" />{s.profile.me}</span><span><i className="timeline-dot owner-him" />{s.profile.him}</span><span><i className="timeline-dot owner-both" />我们</span></div>
    <div className="timeline-spine">{entries.map(entry => <div key={entry.id} className={`timeline-event event-${timelineOwner(entry)}`}><i className={`timeline-dot owner-${timelineOwner(entry)}`} /><Button variant="ghost" className="timeline-entry h-auto whitespace-normal rounded-none px-0 text-left" onClick={() => onSelect(entry)}><span className="block w-full min-w-0"><strong className="serif block text-sm font-medium">{entry.title || "未题的足迹"}</strong><span className={compact ? "mt-2 line-clamp-2 block text-xs font-normal leading-5" : "mt-2 block whitespace-pre-wrap text-xs font-normal leading-6"}>{entry.text}</span>{s.images[`w-${entry.id}`] && <EImg editable={false} slot={`w-${entry.id}`} className="mt-3 aspect-[4/3] w-full" />}</span></Button></div>)}</div>
  </section>;
}