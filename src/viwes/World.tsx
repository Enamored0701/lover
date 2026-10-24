import { useState } from "react";
import { ArrowUpRight, Feather, Files, GitBranch, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Avatar, EImg, Empty, Eyebrow, Header, Modal, SectionTitle, Sheet } from "@/components/kit";
import { useStore } from "@/lib/store";
import type { Entry, WorldKey } from "@/lib/types";
import { compressImage, pad, uid, ymd } from "@/lib/util";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CharacterDossier } from "./CharacterDossier";
import { SettingDossier } from "./SettingDossier";
import cover from "@/assets/world.jpg";
import { WorldEmblem } from "@/components/WorldEmblem";
import { Timeline } from "@/components/Timeline";
import { hexColor, timelineColors } from "@/lib/timeline";

const SECS: { key: WorldKey; zh: string; en: string; desc: string }[] = [
  { key: "lore", zh: "设定", en: "SETTINGS", desc: "世界的规则与细节" },
  { key: "files", zh: "档案", en: "DOSSIER", desc: "人物与过往" },
  { key: "ifs", zh: "if 线", en: "IF LINES", desc: "另一种可能" },
  { key: "ideas", zh: "灵感暂存", en: "SKETCHBOOK", desc: "随手记下的火花" },
  { key: "timeline", zh: "时间线", en: "TIMELINE", desc: "我们走过的路" },
];
const ID_FIELDS = ["姓名", "身份", "生日", "身高", "所在", "备注"];

export function World() {
  const { s, up, go } = useStore();
  const [sec, setSec] = useState<WorldKey | null>(null);
  const latest = [...s.world.timeline].sort((a,b) => b.date.localeCompare(a.date))[0];
  const icons = { lore: Feather, files: Files, ifs: GitBranch, ideas: Sparkles };
  return <div className="compact-page">
    <Header title="世界" sub="WORLD ARCHIVE" onBack={() => go("us")} />
    <div className="overview-shell mx-auto max-w-xl px-5 pb-20">
      <div className="relative mt-4 overflow-hidden bg-foreground text-background">
        <EImg slot="world-cover" fallback={cover} className="world-feature-image h-40 w-full grayscale" label="COVER" />
        <div className="pointer-events-none absolute inset-3 border border-background/40" />
        <Button variant="ghost" className="absolute inset-x-4 bottom-3 grid h-auto grid-cols-[minmax(0,1fr)_auto] rounded-none px-0 text-left text-background hover:bg-transparent hover:text-background" onClick={() => setSec("timeline")}>
          <span className="min-w-0"><span className="block text-[9px]">FIELD NOTES / 01</span><span className="serif mt-1 block text-3xl">时间线</span><span className="mt-1 block truncate text-xs font-normal">{latest ? latest.title : "星光走过的地方，都算数"}</span></span><span className="grid h-9 w-9 place-items-center rounded-full border border-background/50"><ArrowUpRight /></span>
        </Button>
      </div>
      <div className="flex items-center justify-between border-b border-border py-3"><span className="eyebrow">OUR PASSPORT</span><span className="display text-2xl">{String(s.world.timeline.length).padStart(2,"0")}</span></div>
      {s.remindToday && <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start border-l border-foreground pl-3"><p className="serif text-xs leading-5">{s.remindToday.text}</p><Button variant="ghost" size="icon" aria-label="知道了" onClick={() => up(d => { d.remindToday = undefined; })}><X /></Button></div>}
      <div className="mt-4 flex items-baseline justify-between"><h2 className="serif text-lg">世界档案</h2><span className="eyebrow">THE COLLECTION</span></div>
      <Timeline entries={s.world.timeline.slice(0, 3)} compact onSelect={() => setSec("timeline")} />
      <Button variant="ghost" className="w-full justify-between rounded-none border-b border-border px-0 text-xs" onClick={() => setSec("timeline")}>完整时间线<ArrowUpRight className="h-4 w-4" /></Button>
      <div className="world-index mt-2 grid grid-cols-2 gap-x-4">
        {SECS.filter(x => x.key !== "timeline").map((x,i) => {
          const Icon = icons[x.key as keyof typeof icons];
          return <Button variant="ghost" key={x.key} className="grid h-auto min-w-0 grid-cols-[minmax(0,1fr)_auto] rounded-none border-b border-border px-0 py-4 text-left" onClick={() => setSec(x.key)}>
            <span className="min-w-0"><span className="eyebrow block">{pad(i+1)} / {x.en}</span><span className="serif mt-2 block text-lg">{x.zh}</span><span className="mt-1 block text-[10px] font-normal">{s.world[x.key].length} 页</span></span><Icon className="text-faint" />
          </Button>;
        })}
      </div>
            <div className="world-colophon mt-5 flex items-center gap-4 border-y border-border py-4"><div className="h-14 w-14 shrink-0 text-faint"><WorldEmblem /></div><div className="min-w-0"><span className="eyebrow">TWO AUTHORS / ONE WORLD</span><p className="serif mt-1 text-xs leading-5">{latest?.text ? latest.text.slice(0, 70) : `${s.profile.me} 与 ${s.profile.him}。爱是短暂的，遗忘却太长，所以写下来。`}</p></div><span className="display text-3xl text-faint">∞</span></div>
    </div>
    {sec && <SectionSheet k={sec} onClose={() => setSec(null)} />}
  </div>;
}

function SectionSheet({ k, onClose }: { k: WorldKey; onClose: () => void }) {
  const { s, up } = useStore();
  const meta = SECS.find((x) => x.key === k) ?? SECS[0];
  const [edit, setEdit] = useState<Entry | "new" | null>(null);
  const [viewId, setViewId] = useState<Entry | null>(null);
  const editorKey = edit && edit !== "new" && s.world.ids.some(x => x.id === edit.id) ? "ids" : k;
  if (!meta) return null;
  let list = s.world[k];
  if (k === "timeline") list = [...list].sort((a, b) => a.at - b.at);

  return (
    <Sheet open onClose={onClose} title={meta.zh} sub={meta.en} right={<Button variant="ghost" size="icon" onClick={() => setEdit("new")} aria-label="新增"><Plus className="h-6 w-6" strokeWidth={1.3} /></Button>}>
      <Eyebrow left={`${meta.en} / ${pad(list.length)}`} />
      {(k === "ifs" || k === "ideas" || k === "timeline") && <SectionFront k={k} />}
      {k === "lore" && <SettingDossier />}
      {list.length === 0 && k !== "lore" && <div className="world-blank-page mt-5 border-y border-border py-5"><Button variant="ghost" className="w-full justify-between rounded-none px-0" onClick={() => setEdit("new")}>新的一页<Plus /></Button></div>}

      {k === "ids" && (
        <div className="mt-6 space-y-5">
          {list.map((e, i) => (
            <div key={e.id} onClick={() => setViewId(e)} className="card-box flex gap-4 p-4">
              <EImg slot={`w-${e.id}`} className="aspect-[3/4] w-28 shrink-0 grayscale" label="PHOTO" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between"><span className="eyebrow">ID · {pad(i + 1)}</span><span className="eyebrow-i">{e.tag}</span></div>
                <div className="serif mt-2 text-2xl font-bold">{e.title || e.fields?.["姓名"] || "未命名"}</div>
                <dl className="mt-2 space-y-1 text-xs">
                  {ID_FIELDS.slice(1).filter((f) => e.fields?.[f]).map((f) => <div key={f} className="flex gap-2"><dt className="w-10 shrink-0 text-muted-foreground">{f}</dt><dd className="truncate">{e.fields?.[f]}</dd></div>)}
                </dl>
              </div>
            </div>
          ))}
        </div>
      )}

      {k === "timeline" && <><div className="mt-5 grid grid-cols-2 gap-4">{(["me", "him"] as const).map(who => <label key={who} className="min-w-0 text-xs">{who === "me" ? s.profile.me : s.profile.him} · 代表色<div className="mt-2 flex items-center gap-2"><span className="h-4 w-4 shrink-0 rounded-full border border-border" style={{ backgroundColor: hexColor(s.worldCard["timeline"]?.[`color-${who}`], timelineColors[who]) }} /><input aria-label={`${who === "me" ? "我的" : "他的"}代表色`} className="field min-w-0 text-xs" placeholder="#FDFDFD" maxLength={7} value={s.worldCard["timeline"]?.[`color-${who}`] ?? timelineColors[who]} onChange={event => up(d => { d.worldCard["timeline"] = { ...d.worldCard["timeline"], [`color-${who}`]: event.target.value }; })} /></div></label>)}</div><Timeline entries={list} onSelect={setEdit} /></>}

      {k === "ideas" && (
        <div className="mt-6 columns-2 gap-3">
          {list.map((e, i) => (
            <div key={e.id} onClick={() => setEdit(e)} className={cn("mb-3 break-inside-avoid border border-border p-4", i % 3 === 0 ? "bg-card" : i % 3 === 1 ? "bg-muted" : "bg-background")}>
              <div className="eyebrow">NO. {pad(i + 1)}</div>
              {s.images[`w-${e.id}`] && <EImg slot={`w-${e.id}`} className="mt-2 w-full" />}
              <div className="mt-2 font-semibold">{e.title}</div>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">{e.text}</p>
            </div>
          ))}
        </div>
      )}

      {k === "ifs" && <div className="mt-6 space-y-4">{list.map((e, i) => <Button key={e.id} variant="ghost" className="archive-drawer grid h-auto w-full grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-none text-left" onClick={() => setEdit(e)}><span className="min-w-0"><span className="block text-[9px]">IF / {pad(i + 1)} · {e.tag || "故事档案"}</span><span className="serif mt-2 block whitespace-normal text-base">{e.title || "未命名故事"}</span><span className="mt-2 line-clamp-2 block whitespace-normal text-xs font-normal leading-5">{e.fields?.["世界背景"] || e.text}</span><span className="drawer-handle" /></span><Files className="h-5 w-5 text-faint" /></Button>)}</div>}

      {(k === "lore" || k === "files") && list.filter(e => e.id !== "pair-dossier").map((e, i) => (
        <article key={e.id} onClick={() => setEdit(e)} className="grid grid-cols-[1fr_auto] gap-4 border-b border-border py-6">
          <div className="min-w-0">
            <span className="eyebrow">{k === "files" ? "FILE" : "NOTE"} · {pad(i + 1)}</span>
            <h3 className="serif mt-2 text-xl font-bold">{e.title}</h3>
            <p className="mt-1 line-clamp-3 text-sm leading-7 text-muted-foreground">{e.text}</p>
            {k === "files" && <div className="mt-3 grid grid-cols-3 gap-2">{Array.from({ length: 6 }, (_, j) => <span key={j} className="border-t border-border pt-1 text-[10px]">{e.fields?.[`label-${j}`] ?? `属性${j + 1}`} <strong>{e.fields?.[`stat-${j}`] ?? "—"}</strong></span>)}</div>}
            {e.tag && <span className="mt-2 inline-block border-b border-border text-xs text-muted-foreground"># {e.tag}</span>}
          </div>
          {s.images[`w-${e.id}`] && <EImg slot={`w-${e.id}`} className="h-24 w-20 grayscale" label="FIG" />}
        </article>
      ))}

      {k === "lore" && s.world.ids.length > 0 && <div className="mt-5 border-t border-border"><span className="eyebrow">IDENTITY / 已有档案</span>{s.world.ids.map(e => <Button variant="ghost" key={e.id} className="h-auto w-full justify-between rounded-none border-b border-border px-0 py-3" onClick={() => setViewId(e)}>{e.title || e.fields?.["姓名"] || "身份档案"}<ArrowUpRight /></Button>)}</div>}
      {edit && (k === "files" ? <CharacterDossier entry={edit === "new" ? null : edit} onClose={() => setEdit(null)} /> : <EntryEditor k={editorKey} entry={edit === "new" ? null : edit} onClose={() => setEdit(null)} />)}
      {viewId && <IdCard e={viewId} onClose={() => setViewId(null)} onEdit={() => { setEdit(viewId); setViewId(null); }} />}
    </Sheet>
  );
}

/** 证件照详情：黑白灰档案卡，胶带贴纸风格 */
function IdCard({ e, onClose, onEdit }: { e: Entry; onClose: () => void; onEdit: () => void }) {
  const { s } = useStore();
  const fields = ID_FIELDS.filter((f) => e.fields?.[f]?.trim());
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-foreground/40" onClick={onClose}>
      <div className="mx-auto my-10 w-[92%] max-w-md" onClick={(ev) => ev.stopPropagation()}>
        <div className="relative border border-border bg-card p-6 pb-8 shadow-xl">
          <span className="absolute -top-3 left-8 h-6 w-16 rotate-[-6deg] bg-muted/80" />
          <span className="absolute -top-3 right-8 h-6 w-16 rotate-[5deg] bg-muted/80" />
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">IDENTITY / FILE</span>
            <span className="display text-sm text-faint">{e.date}</span>
          </div>
          <div className="mt-2 rule-ink" />
          <div className="mt-6 flex justify-center gap-6">
            <div className="relative rotate-[-3deg] border border-border bg-background p-2 pb-6 shadow-md">
              <span className="absolute -top-2.5 left-1/2 h-5 w-12 -translate-x-1/2 rotate-[-2deg] bg-muted/80" />
              <EImg slot={`w-${e.id}`} className="h-36 w-28 grayscale" label="PHOTO" />
            </div>
            <div className="relative rotate-[2.5deg] border border-border bg-background p-2 pb-6 shadow-md">
              <span className="absolute -top-2.5 left-1/2 h-5 w-12 -translate-x-1/2 rotate-[2deg] bg-muted/80" />
              <EImg slot={e.gallery?.[0] ?? `w-${e.id}-g-alt`} className="h-36 w-28 grayscale" label="PHOTO" />
            </div>
          </div>
          <h2 className="serif mt-6 text-center text-2xl font-bold">{e.title || e.fields?.["姓名"] || "未命名"}</h2>
          {e.tag && <p className="mt-1 text-center text-[11px] tracking-[0.3em] text-muted-foreground">{e.tag}</p>}
          {fields.length > 0 && (
            <div className="mt-5 border-y border-border">
              {fields.map((f) => (
                <div key={f} className="flex justify-between gap-4 border-b border-border py-2.5 last:border-0">
                  <span className="text-xs tracking-[0.2em] text-muted-foreground">{f}</span>
                  <span className="text-sm">{e.fields?.[f]}</span>
                </div>
              ))}
            </div>
          )}
          {e.text && <p className="serif mt-5 whitespace-pre-wrap text-[14px] leading-7 text-muted-foreground">{e.text}</p>}
          {(e.gallery?.length ?? 0) > 1 && (
            <div className="mt-5 flex gap-2 overflow-x-auto">
              {e.gallery?.slice(1).map((k2) => <EImg key={k2} slot={k2} className="h-20 w-16 shrink-0 grayscale" label="" />)}
            </div>
          )}
          <button className="btn-line mt-6 w-full" onClick={onEdit}>编辑这份档案</button>
        </div>
      </div>
    </div>
  );
}

function EntryEditor({ k, entry, onClose }: { k: WorldKey; entry: Entry | null; onClose: () => void }) {
  const { s, up } = useStore();
  const [e, setE] = useState<Entry>(() => entry ?? { id: uid(), title: "", text: "", tag: "", date: ymd(new Date()), at: Date.now(), fields: {}, gallery: [] });
  const isNew = !entry;
  const save = () => {
    up((d) => {
      const l = d.world[k];
      const i = l.findIndex((x) => x.id === e.id);
      if (i >= 0) l[i] = e; else l.unshift(e);
    });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={k === "ifs" ? "故事档案" : k === "timeline" ? "记录足迹" : k === "ideas" ? "灵感便笺" : k === "lore" ? "设定条目" : isNew ? "新的一页" : "编辑"}>
      <div className={`editor-${k}`}>
      {(k === "ids" || k === "timeline" || k === "files" || k === "lore" || k === "ifs") && <EImg slot={`w-${e.id}`} className={cn("w-full", k === "ids" ? "mx-auto aspect-[3/4] max-w-48" : k === "ifs" ? "mx-auto aspect-[3/4] max-w-36" : "aspect-[2/1]")} label={k === "ids" ? "证件照" : k === "ifs" ? "人物图" : "展示图"} />}
      <input aria-label="条目标题" className="field serif mt-4 text-base" placeholder={k === "ifs" ? "故事名称" : k === "timeline" ? "足迹标题" : k === "ideas" ? "灵感标题" : "标题"} value={e.title} onChange={(x) => setE({ ...e, title: x.target.value })} />
      <div className="mt-2 grid grid-cols-2 gap-4">
        <input className="field text-sm" placeholder="标签" value={e.tag} onChange={(x) => setE({ ...e, tag: x.target.value })} />
        {k !== "timeline" && k !== "ifs" && k !== "ideas" && <input type="date" className="field text-sm" value={e.date} onChange={(x) => setE({ ...e, date: x.target.value })} />}
      </div>
      {k === "ids" && (
        <div className="mt-2 grid grid-cols-2 gap-x-4">
          {ID_FIELDS.map((f) => <input key={f} className="field text-sm" placeholder={f} value={e.fields?.[f] ?? ""} onChange={(x) => setE({ ...e, fields: { ...e.fields, [f]: x.target.value } })} />)}
        </div>
      )}
      {k === "ifs" && <div className="mt-4 grid grid-cols-2 gap-3">{["世界背景", "人物关系", "分歧节点", "故事走向"].map(f => <label key={f} className="min-w-0 text-xs">{f}<input className="field text-xs" value={e.fields?.[f] ?? ""} onChange={x => setE({ ...e, fields: { ...e.fields, [f]: x.target.value } })} /></label>)}</div>}
      {k === "timeline" && <fieldset className="mt-4"><legend className="text-xs">这段经历属于</legend><div className="mt-2 grid grid-cols-3 gap-2">{(["me", "him", "both"] as const).map(who => <Button key={who} size="sm" variant={(e.fields?.["timeline-owner"] ?? "both") === who ? "default" : "outline"} aria-pressed={(e.fields?.["timeline-owner"] ?? "both") === who} onClick={() => setE({ ...e, fields: { ...e.fields, "timeline-owner": who } })}>{who === "me" ? s.profile.me : who === "him" ? s.profile.him : "我们"}</Button>)}</div></fieldset>}
      <textarea aria-label="条目内容" className="area mt-4" placeholder={k === "ifs" ? "故事正文" : k === "timeline" ? "记下这一程" : k === "ideas" ? "片段、意象与念头" : "内容"} value={e.text} onChange={(x) => setE({ ...e, text: x.target.value })} />
      {(k !== "ifs" && k !== "ideas") && <>
      <div className="mt-4 eyebrow">GALLERY · 更多图片</div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {(e.gallery ?? []).map((g) => (
          <div key={g} className="relative aspect-square">
            <EImg slot={g} className="h-full w-full" />
            <button className="absolute right-0 top-0 bg-background p-0.5" onClick={() => setE({ ...e, gallery: (e.gallery ?? []).filter((x) => x !== g) })}><X className="h-3 w-3" /></button>
          </div>
        ))}
        <label className="ph flex aspect-square cursor-pointer items-center justify-center"><Plus className="h-4 w-4" />
          <input type="file" accept="image/*" multiple hidden onChange={async (x) => {
            const fs = [...(x.target.files || [])];
            const urls = await Promise.all(fs.map((f) => compressImage(f)));
            const keys = urls.map(() => `w-${e.id}-g-${uid()}`);
            up((d) => keys.forEach((kk, i) => (d.images[kk] = urls[i] ?? "")));
            setE((p) => ({ ...p, gallery: [...(p.gallery ?? []), ...keys] }));
          }} />
        </label>
      </div>
      </>}
      </div>
      <div className="mt-6 flex gap-2">
        <Button className="flex-1" onClick={save}>保存</Button>
        {!isNew && <button className="btn-line" onClick={() => { if (confirm("删除这一页？")) { up((d) => { d.world[k] = d.world[k].filter((x) => x.id !== e.id); }); onClose(); } }}><Trash2 className="h-4 w-4" /></button>}
      </div>
      {!isNew && s.images[`w-${e.id}`] && <button className="mt-3 w-full text-xs text-muted-foreground" onClick={() => up((d) => { delete d.images[`w-${e.id}`]; })}>移除主图</button>}
    </Modal>
  );
}


function SectionFront({ k }: { k: WorldKey }) {
  const { s, up } = useStore();
  const text = s.worldCard[k]?.["name"] ?? (k === "ifs" ? "另一页人生" : k === "ideas" ? "拾起一束光" : "我们走过的路");
  const title = <input aria-label="版面标题" className="serif min-w-0 w-full bg-transparent text-xl outline-none" value={text} onChange={e => up(d => { d.worldCard[k] = { ...d.worldCard[k], name: e.target.value }; })} />;
  if (k === "timeline") return <section className="mt-4"><EImg slot="world-hero-timeline" fallback={s.images["world-banner-timeline"] || cover} className="aspect-[2/1] w-full grayscale" label="封面" /><div className="mt-4 flex items-center justify-between gap-3">{title}<span className="display text-3xl">{pad(s.world.timeline.length)}</span></div></section>;
  if (k === "ifs") return <section className="if-spread mt-2"><div className="mb-5 flex items-end justify-between gap-3"><div className="min-w-0">{title}<span className="mt-2 block text-[10px]">IF / 另一种可能</span></div><span className="display text-4xl text-faint">if.</span></div><div className="portrait-panel if-portrait-panel"><div className="relative z-10 flex flex-col justify-between gap-2">{[0,1,2].map(i => <EImg key={i} slot={`world-thumb-ifs-${i}`} fallback={s.images["world-hero-ifs"]} className="portrait-thumb aspect-square w-full grayscale" label="" />)}</div><div className="relative min-w-0"><EImg slot="world-hero-ifs" className="h-full min-h-52 w-full grayscale" label="人物图" /><div className="portrait-cross" /><div className="portrait-ring" /><div className="pointer-events-none absolute bottom-3 right-2 grid w-[75%] gap-2">{["身份", "另一种相遇"].map((label,i) => <label key={label} className="portrait-tag pointer-events-auto px-2 py-1 text-[10px]"><span className="block border-b border-border pb-1">{label}</span><input aria-label={`if线${label}`} className="w-full min-w-0 bg-transparent py-1 outline-none" value={s.worldCard["ifs"]?.[`detail-${i}`] ?? ""} onChange={e => up(d => { d.worldCard["ifs"] = {...d.worldCard["ifs"], [`detail-${i}`]: e.target.value}; })} /></label>)}</div></div></div><div className="mt-6 flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-faint" /><span className="h-1 w-1 rounded-full bg-faint" /><span className="h-1 w-1 rounded-full bg-faint" /></div></section>;
  return <section className="mt-4 border-b border-border pb-4"><div className="mb-3 flex items-center gap-3">{title}<Sparkles className="h-4 w-4 shrink-0" /></div><div className="grid grid-cols-[1fr_1fr_1fr] items-center gap-3">{[0, 1, 2].map(i => <EImg key={i} slot={`world-thumb-ideas-${i}`} className={cn("aspect-square w-full grayscale", i === 1 && "-rotate-3 border-4 border-card")} label="" />)}</div></section>;
}
