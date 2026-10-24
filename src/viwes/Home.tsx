import { useEffect, useMemo, useState } from "react";
import { Heart, Lock, MessageCircle, Trash2, Unlock } from "lucide-react";
import { Avatar, EImg, Empty, Eyebrow, Header, SectionTitle, Sheet } from "@/components/kit";
import { scheduleComment, scheduleUnlock, useStore } from "@/lib/store";
import type { Post, PostKind } from "@/lib/types";
import { pad, timeAgo, uid } from "@/lib/util";
import { cn } from "@/lib/utils";
import { partnerName } from "@/lib/names";
import hero from "@/assets/hero.jpg";

export const KINDS: { key: PostKind; zh: string; en: string }[] = [
  { key: "murmur", zh: "碎碎念", en: "MURMURS" },
  { key: "essay", zh: "随笔", en: "ESSAYS" },
  { key: "diary", zh: "日记", en: "DIARY" },
  { key: "letter", zh: "想对你说", en: "LETTERS" },
];
export const kindOf = (k: PostKind) => KINDS.find((x) => x.key === k)!;

export function canRead(p: Post) {
  return !p.locked || p.who === "me" || p.unlocked;
}

export function Home() {
  const { s } = useStore();
  const [tab, setTab] = useState<PostKind | "all">("all");
  const [sort, setSort] = useState<"new" | "hot">("new");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => { const show = (ev: Event) => setOpen((ev as CustomEvent<string>).detail); window.addEventListener("previa-open-post", show); return () => window.removeEventListener("previa-open-post", show); }, []);

  const list = useMemo(() => {
    const l = s.posts.filter((p) => tab === "all" || p.kind === tab);
    return sort === "new" ? l : [...l].sort((a, b) => b.comments.length - a.comments.length);
  }, [s.posts, tab, sort]);
  const feat = list[0];
  const rest = list.slice(1);

  return (
    <div>
      <Header title="PREVIA" sub="把夜色折成信" />
      <div className="mx-auto max-w-xl px-5 pb-32">
        <Eyebrow className="mt-6" left="PRIVATE PRESS" />
        <h1 className="display mt-4 text-[48px] font-medium">PREVIA<span className="text-faint">.</span></h1>
        <div className="mt-4 flex items-end justify-between gap-4">
          <p className="serif text-[15px] leading-8 text-muted-foreground">我爱你，如爱夜色里<br />一盏不肯熄的灯。</p>
          <div className="text-right">
            <div className="display text-[24px]">001—{pad(Math.max(1, s.posts.length)).padStart(3, "0")}</div>
            <div className="eyebrow mt-1">ENTRIES</div>
          </div>
        </div>

        <EImg slot="home-hero" fallback={hero} className="mt-6 aspect-[3/2] w-full grayscale" label="FIG. 001" />
        

        <figure className="mt-8 border-l border-foreground pl-5">
          <p className="serif text-[15px] leading-8">在世界的另一端，与你相爱</p>
          <p className="display mt-3 text-base leading-6">Somewhere between the sun and the sea·</p>
          <div className="serif mt-6 space-y-5 text-[13px] leading-7">
            <p>我想与你走过很长的路。</p>
            <p>看不同的日出，听陌生的语言，在陌生的街<br />道上认出你的背影。</p>
            <p>倘若旅途终有尽头，那麽抵达以后，我们再<br />一起决定下一站。</p>
            <p>今日·新的开始。</p>
          </div>
          
        </figure>

        <div className="mt-10"><SectionTitle zh="星光与字句" en="PAGES / 04" /></div>
        <div className="no-scrollbar flex gap-7 overflow-x-auto border-b border-border">
          {[{ key: "all" as const, zh: "全部" }, ...KINDS].map((k) => (
            <button key={k.key} onClick={() => setTab(k.key)} className={cn("tab", tab === k.key && "tab-on")}>{k.zh}</button>
          ))}
        </div>

        {!feat ? <Empty text="第一页还空着，等你落笔。" /> : (
          <article className="border-b border-border py-6" onClick={() => setOpen(feat.id)}>
            <div className="flex items-center justify-between">
              <span className="eyebrow">{kindOf(feat.kind).en} · 01</span>
              <span className="border border-input px-3 py-1.5 font-[family-name:var(--font-display)] text-sm tracking-widest">{feat.who === "me" ? "BY ME" : "FOR YOU"} / NEW</span>
            </div>
            <FeatTitle p={feat} />
            <p className="mt-4 line-clamp-3 text-[15px] leading-8 text-muted-foreground">{canRead(feat) ? feat.text : "这一页，暂时只属于夜晚。"}</p>
            <Byline p={feat} />
          </article>
        )}

        {rest.length > 0 && (
          <>
            <div className="mt-12"><SectionTitle zh="往来" en="LATEST / NOTES" ink /></div>
            <div className="flex gap-6 py-4 text-sm">
              <button className={sort === "new" ? "font-semibold" : "text-muted-foreground"} onClick={() => setSort("new")}>最新</button>
              <button className={sort === "hot" ? "font-semibold" : "text-muted-foreground"} onClick={() => setSort("hot")}>回应最多</button>
            </div>
            {rest.map((p) => (
              <article key={p.id} className="flex gap-4 border-b border-border py-6" onClick={() => setOpen(p.id)}>
                <Avatar who={p.who} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{p.who === "me" ? s.profile.me : partnerName(s.profile)}</span>
                    <span className="tag">{p.who === "me" ? "ME" : "YOU"}</span>
                    {p.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <span className="ml-auto text-xs text-faint">{timeAgo(p.at)}</span>
                  </div>
                  {p.title && <h3 className="serif mt-3 text-xl font-bold">{p.title}</h3>}
                  <p className="mt-2 line-clamp-2 text-[15px] leading-7 text-muted-foreground">{canRead(p) ? p.text : "合上的日记，等一句许可。"}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="border-b border-border pb-0.5 text-xs text-muted-foreground"># {kindOf(p.kind).zh}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><MessageCircle className="h-3.5 w-3.5" strokeWidth={1.3} />{p.comments.length}</span>
                  </div>
                </div>
              </article>
            ))}
          </>
        )}
      </div>

      <PostSheet id={open} onClose={() => setOpen(null)} />

    </div>
  );
}

function FeatTitle({ p }: { p: Post }) {
  const t = p.title || (canRead(p) ? p.text.slice(0, 18) : "合上的一页");
  const cut = Math.ceil(t.length / 2);
  return <h2 className="mt-4 text-[26px] font-black leading-[1.25]">{t.slice(0, cut)}<span className="text-faint">{t.slice(cut)}</span></h2>;
}

function Byline({ p }: { p: Post }) {
  const { s, up } = useStore();
  return (
    <div className="mt-6 flex items-center gap-3">
      <Avatar who={p.who} size={46} />
      <div className="flex-1">
        <div className="text-sm">{p.who === "me" ? s.profile.me : partnerName(s.profile)}</div>
        <div className="text-xs text-faint">写下{kindOf(p.kind).zh} · {timeAgo(p.at)}</div>
      </div>
      <button className="flex items-center gap-1 text-muted-foreground" onClick={(e) => { e.stopPropagation(); up((d) => { const x = d.posts.find((y) => y.id === p.id); if (x) x.liked = !x.liked; }); }}>
        <Heart className={cn("h-5 w-5", (p.liked || p.likedByHim) && "fill-foreground text-foreground")} strokeWidth={1.3} />
      </button>
      <span className="flex items-center gap-1 text-muted-foreground"><MessageCircle className="h-5 w-5" strokeWidth={1.3} />{p.comments.length}</span>
    </div>
  );
}

function PostSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { s, up } = useStore();
  const [txt, setTxt] = useState("");
  const p = s.posts.find((x) => x.id === id);
  if (!p) return null;
  const readable = canRead(p);
  const mut = (fn: (x: Post) => void) => up((d) => { const x = d.posts.find((y) => y.id === p.id); if (x) fn(x); });
  const replyOf = p.replyTo ? s.posts.find((x) => x.id === p.replyTo) : null;

  return (
    <Sheet open onClose={onClose} title={kindOf(p.kind).zh} sub={kindOf(p.kind).en} right={p.who === "me" && (
      <button onClick={() => { if (confirm("删除这一页？")) { up((d) => { d.posts = d.posts.filter((x) => x.id !== p.id); }); onClose(); } }} aria-label="删除"><Trash2 className="h-5 w-5" strokeWidth={1.3} /></button>
    )}>
      <Eyebrow left={`${kindOf(p.kind).en} · ${new Date(p.at).toLocaleDateString("zh-CN")}`} />
      <div className={`reading-page reading-${p.kind}`}>
      <h1 className="serif mt-5 text-3xl font-bold leading-snug">{p.title || "无题"}</h1>
      {replyOf && <p className="mt-2 text-xs text-muted-foreground">回复你的信 ·「{replyOf.title || "无题"}」</p>}
      <div className="mt-6 rule" />

      {p.locked && (
        <div className="mt-6 card-box p-4">
          <div className="flex items-center gap-2 text-sm">{readable ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {p.who === "me" ? "这是一篇上锁的日记" : readable ? "已为你解锁" : "这一页暂时合上了"}</div>
          {p.who === "me" && p.req?.status === "pending" && p.req.by === "him" && (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">{partnerName(s.profile)} 申请翻开这一页。</p>
              <div className="mt-3 flex gap-2">
                <button className="btn" onClick={() => up(d => { const x = d.posts.find(x => x.id === p.id); if (!x?.req) return; x.req.status = "ok"; x.unlocked = true; scheduleComment(d, x.id); })}>同意</button>
                <button className="btn-line" onClick={() => mut((x) => { if (x.req) x.req.status = "no"; })}>再等等</button>
              </div>
            </div>
          )}
          {p.who === "me" && p.req?.status === "ok" && <p className="mt-2 text-xs text-muted-foreground">他已经读过了。</p>}
          {p.who === "me" && (
            <button className="btn-line mt-3" onClick={() => mut((x) => { x.locked = false; })}>取消上锁</button>
          )}
          {p.who === "him" && !readable && (
            p.req?.status === "pending" ? <p className="mt-2 text-xs text-muted-foreground">已申请，等他回应…</p> : (
              <>
                {p.req?.status === "no" && <p className="mt-2 text-xs text-muted-foreground">他说再等等。可以过些时候再问。</p>}
                <button className="btn mt-3" onClick={() => up((d) => { const x = d.posts.find((y) => y.id === p.id); if (!x) return; x.req = { by: "me", at: Date.now(), status: "pending" }; scheduleUnlock(d, p.id); })}>申请解锁</button>
              </>
            )
          )}
        </div>
      )}

      {readable ? (
        <>
          <div className="serif mt-6 whitespace-pre-wrap text-[14px] leading-8">{p.text}</div>
          {p.imgs.map((k) => <EImg key={k} slot={k} className="mt-5 w-full" label="IMAGE" />)}
        </>
      ) : <div className="mt-10 text-center"><div className="display text-6xl text-faint">∙ ∙ ∙</div></div>}

      </div>
      <div className="mt-12"><SectionTitle zh="页边" en={`REMARKS / ${pad(p.comments.length)}`} ink /></div>
      {p.comments.map((c) => (
        <div key={c.id} className={cn("flex gap-3 border-b border-border py-4", c.who === "me" && "flex-row-reverse text-right")}>
          <Avatar who={c.who} size={34} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] leading-7">{c.text}</p>
            <span className="text-[11px] text-faint">{timeAgo(c.at)}</span>
          </div>
        </div>
      ))}
      {readable && (
        <div className="mt-4 flex items-end gap-3">
          <textarea value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="写在页边…" className="field min-h-10 flex-1 resize-none" rows={1} />
          <button className="btn" disabled={!txt.trim()} onClick={() => { const t = txt.trim(); setTxt(""); up((d) => { const x = d.posts.find((y) => y.id === p.id); if (!x) return; x.comments.push({ id: uid(), who: "me", text: t, at: Date.now() }); scheduleComment(d, p.id); }); }}>留下</button>
        </div>
      )}
    </Sheet>
  );
}
