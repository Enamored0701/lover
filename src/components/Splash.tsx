import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/** A suspended ribbon pauses; a blue sun-ring glides down it after a tap. */
export function Splash({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<"drop" | "hold" | "ring">("drop");
  useEffect(() => {
    const t = setTimeout(() => setStage("hold"), 2800);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (stage !== "ring") return;
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [stage, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-background ${stage === "ring" ? "splash-out" : ""}`}
      onClick={() => stage === "hold" && setStage("ring")}
    >
      {/* 刊头 */}
      <div className="absolute inset-x-0 top-10 flex items-baseline justify-between px-6">
        <span className="eyebrow">PREVIA · No. 001</span>
        <span className="eyebrow-i">private press</span>
      </div>

      <div className={`splash-ribbon-wrap ${stage === "hold" ? "ribbon-paused" : ""}`}>
        <svg className="splash-ribbon" viewBox="0 0 100 500" preserveAspectRatio="none" aria-hidden="true">
          <path d="M43 -20C25 80 76 155 47 230S20 365 47 440L49 489L57 468L63 490L59 440C32 365 58 315 59 233S37 80 55 -20" fill="var(--muted)" stroke="var(--foreground)" strokeWidth=".7" />
          <path d="M49 0C31 80 82 160 53 233S26 365 53 440" stroke="var(--faint)" strokeWidth=".5" fill="none" />
        </svg>
      </div>

      {/* 线戒 */}
      {stage === "ring" && (
        <div className="absolute inset-x-0 top-[36vh] flex justify-center">
          <div className="sun-ring-fall">
            <svg width="96" height="112" viewBox="0 0 96 112" aria-label="蓝色太阳纹样婚戒">
              <ellipse cx="48" cy="66" rx="28" ry="33" fill="none" stroke="var(--foreground)" strokeWidth="1.4" />
              <ellipse cx="48" cy="66" rx="24" ry="29" fill="none" stroke="var(--faint)" strokeWidth=".7" />
              <g stroke="var(--foreground)" fill="none" strokeWidth=".8">
                <circle cx="48" cy="31" r="12" />
                {Array.from({ length: 12 }, (_, i) => <path key={i} d="M48 11l2 6-2-1-2 1z" transform={`rotate(${i * 30} 48 31)`} fill="var(--background)" />)}
              </g>
              <path d="M48 21l8 5v10l-8 5-8-5V26z" fill="var(--gem)" stroke="var(--foreground)" strokeWidth=".6" />
              <path d="M48 21v20m-8-15l16 10m0-10L40 36" stroke="var(--gem-glow)" strokeWidth=".7" />
              <path className="sun-gem-flash" d="M48 16l2 12 12 3-12 3-2 12-2-12-12-3 12-3z" fill="var(--gem-glow)" />
            </svg>
          </div>
        </div>
      )}

      {/* 刊名 */}
      <div className="absolute inset-x-0 bottom-16 text-center">
        <div className="display splash-title text-5xl">PREVIA</div>
        <div className="rule mx-auto mt-4 w-10" />
        <div className="mt-4 text-[10px] tracking-[0.35em] text-muted-foreground">SOMEWHERE BETWEEN THE WORDS AND THE WORLD</div>
        <div className="mt-8 h-5 text-xs tracking-[0.4em] text-muted-foreground">
          {stage === "hold" && <Button variant="ghost" className="splash-hint rounded-none text-xs text-muted-foreground" onClick={() => setStage("ring")}>轻点继续</Button>}
        </div>
      </div>
    </div>
  );
}
