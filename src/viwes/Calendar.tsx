import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Avatar, EImg, Eyebrow, Header, Modal, SectionTitle, Slider } from "@/components/kit";
import { schedulePeriodCare, useStore } from "@/lib/store";
import { predict } from "@/lib/period";
import { diffDays, pad, uid, ymd } from "@/lib/util";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function CalendarView() {
  const { s, up } = useStore();
  const today = ymd(new Date());
  const [cur, setCur] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [sel, setSel] = useState<string | null>(null);
  const [cfg, setCfg] = useState(false);
  const [details, setDetails] = useState(false);
  const pr = useMemo(() => predict(s.period.days, s.period.cycle, s.period.len), [s.period]);
  const marked = new Set(s.period.days);

  const first = new Date(cur.y, cur.m, 1);
  const startPad = (first.getDay() + 6) % 7;
  const nDays = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(startPad).fill(null), ...Array.from({ length: nDays }, (_, i) => `${cur.y}-${pad(cur.m + 1)}-${pad(i + 1)}`)];
  while (cells.length % 7) cells.push(null);
  const move = (k: number) => setCur((c) => { const d = new Date(c.y, c.m + k, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const days = diffDays(s.profile.together, today) + 1;
  const upcoming = s.events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const recentHim = s.events.filter((e) => e.who === "him").slice(-3).reverse();

  return (
    <div className="calendar-page compact-page">
      <Header title="日历" sub="THE ALMANAC" />
      <div className="mx-auto max-w-xl px-5 pb-20">
        <Eyebrow className="mt-3" left="CALENDAR / 01" />
        <div className="mt-3 flex items-end justify-between">
          <div className="display text-[40px] leading-none">{MONTHS[cur.m]}<span className="text-faint">.</span></div>
          <div className="text-right"><div className="display text-4xl">{cur.y}</div><div className="eyebrow mt-1">{pad(cur.m + 1)} / 12</div></div>
        </div>
        <div className="mt-3 flex items-center justify-between border-y border-border py-3">
          <button onClick={() => move(-1)} aria-label="上个月"><ChevronLeft className="h-5 w-5" strokeWidth={1.3} /></button>
          <button className="eyebrow" onClick={() => { const d = new Date(); setCur({ y: d.getFullYear(), m: d.getMonth() }); }}>TODAY</button>
          <button onClick={() => move(1)} aria-label="下个月"><ChevronRight className="h-5 w-5" strokeWidth={1.3} /></button>
        </div>
        <div className="mt-3 grid grid-cols-7 text-center">
          {["一", "二", "三", "四", "五", "六", "日"].map((w) => <div key={w} className="py-2 text-[11px] text-muted-foreground">{w}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const ev = s.events.filter((e) => e.date === d);
            const isP = marked.has(d), isPred = !isP && pr.periodDays.has(d), isOv = pr.ovuDays.has(d), isF = pr.fertileDays.has(d);
            return (
              <button key={d} onClick={() => setSel(d)} className={cn("relative flex aspect-square flex-col items-center justify-center border-b border-border", isF && !isP && "bg-muted")}>
                <span className={cn("display flex h-9 w-9 items-center justify-center text-xl", isP && "rounded-full bg-foreground text-background", isPred && "rounded-full border border-dashed border-foreground", d === today && !isP && "underline underline-offset-4")}>{Number(d.slice(8))}</span>
                <span className="absolute bottom-1 flex gap-0.5">
                  {isOv && <span className="h-1.5 w-1.5 rotate-45 border border-foreground" />}
                  {ev.slice(0, 3).map((e) => <span key={e.id} className={cn("h-1 w-1 rounded-full", e.who === "him" ? "bg-foreground" : "bg-faint")} />)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-foreground" />经期</span>
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full border border-dashed border-foreground" />预测</span>
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 bg-muted" />易孕期</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rotate-45 border border-foreground" />排卵日</span>
          <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-foreground" />他的留言</span>
        </div>

        <div className="mt-4 flex justify-end"><Button variant="ghost" size="sm" onClick={() => setCfg(true)}>周期设置</Button></div>
        <section className="grid grid-cols-2 border border-border">
          <div className="row-span-2 border-r border-border p-3">
            <div className="eyebrow">CYCLE</div>
            <div className="mt-2 text-sm text-muted-foreground">下次预计</div>
            <div className="display mt-1 text-4xl">{pr.next ? pr.next.slice(5).replace("-", ".") : "—"}</div>
            <div className="mt-2 text-xs text-muted-foreground">{pr.next ? `还有 ${Math.max(0, diffDays(today, pr.next))} 天` : "标记一次经期后开始预测"}</div>
          </div>
          <div className="border-b border-border p-3"><div className="eyebrow">周期</div><div className="display mt-2 text-3xl">{pr.cycle}<span className="text-xs"> 天</span></div></div>
          <div className="p-3"><div className="eyebrow">排卵日</div><div className="display mt-2 text-3xl">{pr.ovulation ? pr.ovulation.slice(5).replace("-", ".") : "—"}</div></div>
        </section>

        <button className="btn-line mt-3 w-full" onClick={() => setDetails(!details)}>{details ? "收起日历附页" : "日历附页 · 同行与留言"}</button>
        {details && <>
        <section className="mt-4">
          <SectionTitle zh="在一起" en="TOGETHER" />
          <div className="mt-3 flex items-center gap-3">
            <EImg slot="cal-cover" className="h-14 w-12 shrink-0 grayscale" label="FIG." />
            <div><div className="eyebrow">SINCE {s.profile.together.replaceAll("-", ".")}</div><div className="serif mt-2 text-2xl font-bold">第 {days} 天</div></div>
          </div>
        </section>

        {recentHim.length > 0 && (
          <section className="mt-4">
            <SectionTitle zh="他留在日子里的话" en="NOTES / HIM" ink />
            {recentHim.map((e) => (
              <div key={e.id} className="flex gap-3 border-b border-border py-4"><Avatar who="him" size={34} /><div><div className="eyebrow">{e.date.replaceAll("-", ".")}</div><p className="serif mt-1 text-[15px] leading-7">{e.text}</p></div></div>
            ))}
          </section>
        )}

        <section className="mt-4">
          <SectionTitle zh="将至" en="UPCOMING" />
          {upcoming.length === 0 ? <p className="py-6 text-sm text-muted-foreground">点一个日子，写下纪念或待办。</p> : upcoming.map((e) => (
            <div key={e.id} className="flex items-baseline gap-4 border-b border-border py-4"><span className="display w-16 text-2xl">{e.date.slice(5).replace("-", ".")}</span><span className="flex-1 text-sm">{e.text}</span><span className="tag">{e.kind === "anniv" ? "纪念" : e.who === "him" ? "他" : "我"}</span></div>
          ))}
        </section>
        </>}
      </div>

      <DayModal date={sel} onClose={() => setSel(null)} />
      <Modal open={cfg} onClose={() => setCfg(false)} title="周期设置">
        <p className="text-xs text-muted-foreground">有两次以上记录后，周期与经期天数将自动按记录计算；以下为默认值。</p>
        <Slider label="默认周期" value={s.period.cycle} min={20} max={45} unit="天" onChange={(v) => up((d) => { d.period.cycle = v; })} />
        <Slider label="默认经期" value={s.period.len} min={2} max={10} unit="天" onChange={(v) => up((d) => { d.period.len = v; })} />
        <button className="btn-line mt-4 w-full" onClick={() => confirm("清空所有经期记录？") && up((d) => { d.period.days = []; })}>清空经期记录</button>
      </Modal>
    </div>
  );
}

function DayModal({ date, onClose }: { date: string | null; onClose: () => void }) {
  const { s, up } = useStore();
  const [txt, setTxt] = useState("");
  const [anniv, setAnniv] = useState(false);
  if (!date) return null;
  const on = s.period.days.includes(date);
  const ev = s.events.filter((e) => e.date === date);
  return (
    <Modal open onClose={onClose} title={date.replaceAll("-", ".")}>
      <button className={cn("w-full py-3 text-sm", on ? "btn" : "btn-line")} onClick={() => up((d) => { d.period.days = on ? d.period.days.filter((x) => x !== date) : [...d.period.days, date]; if (!on) schedulePeriodCare(d, date); else d.tasks = d.tasks.filter(t => !(t.kind === "periodCare" && t.ref === date)); })}>
        {on ? "取消经期标记" : "标记为经期"}
      </button>
      <div className="mt-6 eyebrow">NOTES</div>
      {ev.length === 0 && <p className="py-3 text-sm text-muted-foreground">这一天还空着。</p>}
      {ev.map((e) => (
        <div key={e.id} className="flex items-start gap-3 border-b border-border py-3">
          <Avatar who={e.who} size={28} />
          <p className="flex-1 text-sm leading-6">{e.kind === "anniv" && <span className="tag mr-2">纪念</span>}{e.text}</p>
          <button onClick={() => up((d) => { d.events = d.events.filter((x) => x.id !== e.id); })} aria-label="删除"><Trash2 className="h-4 w-4 text-faint" /></button>
        </div>
      ))}
      <textarea className="area mt-4 min-h-20" placeholder="写下这一天…" value={txt} onChange={(e) => setTxt(e.target.value)} />
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={anniv} onChange={(e) => setAnniv(e.target.checked)} />设为纪念日</label>
      <button className="btn mt-4 w-full" disabled={!txt.trim()} onClick={() => { const t = txt.trim(); setTxt(""); up((d) => { d.events.push({ id: uid(), date, text: t, who: "me", kind: anniv ? "anniv" : "note" }); }); }}>记下</button>
    </Modal>
  );
}
