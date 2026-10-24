import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Minimize2, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Plus, Send, Settings2, Smile, Trash2, X } from "lucide-react";
import { Avatar, Block, EImg, Header, Modal, Row, SectionTitle, Sheet, Slider, Switch } from "@/components/kit";
import { patAvatar, scheduleChatReply, scheduleProactive, useStore } from "@/lib/store";
import { EMOJIS } from "@/lib/cards";
import { PatCards } from "@/components/PatCards";
import type { Msg, Quiz } from "@/lib/types";
import { countdown, dur, hm, playSound, rand, stopSound, timeAgo, uid } from "@/lib/util";
import { partnerName } from "@/lib/names";
import { Button } from "@/components/ui/button";
import { BUBBLE_TEMPLATE, compileBubbleCss } from "@/lib/bubble-css";
import { cn } from "@/lib/utils";
import { answerQuiz, parseRussianCard } from "@/lib/messages";

export function startCall(setCall: ReturnType<typeof useStore>["setCall"], caller: "me" | "him") {
  setCall({ start: Date.now() + (caller === "me" ? rand(2000, 6000) : 0), min: false, x: 16, y: 120, caller, lines: [] });
}

export function ChatView() {
  const { s, up } = useStore();
  const [room, setRoom] = useState(false);
  useEffect(() => { const open = () => { setRoom(true); up(d => { d.chat.unread = 0; }); }; window.addEventListener("previa-open-chat", open); return () => window.removeEventListener("previa-open-chat", open); }, [up]);
  const last = s.msgs[s.msgs.length - 1];
  const preview = !last ? "把第一颗星点亮" : last.type === "text" ? last.text : last.type === "sticker" ? "[表情]" : last.type === "call" ? "[通话]" : last.type === "quiz" ? "[快问快答]" : last.type === "answer" ? "[回答]" : last.text;

  return (
    <div className="compact-page">
      <Header title="传讯" sub="CORRESPONDENCE" />
      <div className="mx-auto max-w-xl px-5 pb-20">
        <h1 className="serif mt-6 text-[28px] font-light leading-tight">隔着千山<br />也要寄出的话<span className="text-faint">。</span></h1>
        <div className="mt-5"><SectionTitle zh="联系人" en="CONTACT" ink /></div>
        <button className="flex w-full items-center gap-4 border-b border-border py-5 text-left" onClick={() => { setRoom(true); up((d) => { d.chat.unread = 0; }); }}>
          <div className="relative"><Avatar who="him" size={56} /><span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-background bg-foreground" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between"><span className="serif text-lg font-semibold">{partnerName(s.profile)}</span><span className="text-[11px] text-faint">{last ? timeAgo(last.at) : ""}</span></div>
            <div className="mt-0.5 text-[11px] tracking-widest text-muted-foreground">{s.chat.status}</div>
            <div className="mt-1 flex items-center justify-between gap-2"><span className="truncate text-sm text-muted-foreground">{preview}</span>
              {s.chat.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] text-background">{s.chat.unread}</span>}</div>
          </div>
        </button>

        <div id="gramophone-entry" />
        <div className="mt-4"><SectionTitle zh="通话记录" en={`CALLS / ${s.calls.length}`} /></div>
        {s.calls.length === 0 ? <p className="py-8 text-sm text-muted-foreground">还没有通话。隔着长夜，也想听见你的呼吸。</p> : (
          s.calls.slice().reverse().map((c) => (
            <div key={c.id} className="flex items-center gap-4 border-b border-border py-4">
              {c.missed ? <PhoneMissed className="h-4 w-4" strokeWidth={1.3} /> : c.caller === "me" ? <PhoneOutgoing className="h-4 w-4" strokeWidth={1.3} /> : <PhoneIncoming className="h-4 w-4" strokeWidth={1.3} />}
              <div className="flex-1"><div className="text-sm">{c.missed ? (c.caller === "him" ? "未接来电" : "未接通") : c.caller === "me" ? "我拨出的" : `${partnerName(s.profile)} 打来的`}</div><div className="text-[11px] text-faint">{new Date(c.at).toLocaleString("zh-CN")}</div></div>
              <span className="display text-xl">{c.missed ? "—" : dur(c.dur)}</span>
            </div>
          ))
        )}
        {s.calls.length > 0 && <button className="mt-4 text-xs text-muted-foreground" onClick={() => confirm("清空通话记录？") && up((d) => { d.calls = []; })}>清空通话记录</button>}
      </div>
      {room && <Room onClose={() => setRoom(false)} />}
    </div>
  );
}

function Room({ onClose }: { onClose: () => void }) {
  const { s, up, typing, setCall, call } = useStore();
  const [txt, setTxt] = useState("");
  const [panel, setPanel] = useState<null | "sticker" | "emoji" | "quiz">(null);
  const [plus, setPlus] = useState(false);
  const [settings, setSettings] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const tap = useRef(0);
  const avatarTap = useRef<{ who: string; at: number }>({ who: "", at: 0 });
  const t = s.theme;

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [s.msgs.length, typing]);
  useEffect(() => { if (s.chat.unread) up((d) => { d.chat.unread = 0; }); }, [s.chat.unread, up]);

  const send = (m: Omit<Msg, "id" | "who" | "at">) => up((d) => { d.msgs.push({ id: uid(), who: "me", at: Date.now(), ...m }); scheduleChatReply(d); });
  const sendText = () => { const v = txt.trim(); if (!v) return; setTxt(""); send({ type: "text", text: v }); };
  const stickers = s.cards.filter((c) => c.use === "sticker");

  return (
    <div data-bubble-scope="live" className="chat-room fixed inset-0 z-40 flex flex-col bg-background" style={{ fontSize: t.chatFont }}>
      <BubbleStyle />
      {s.images["chat-bg"] && <img src={s.images["chat-bg"]} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: t.chatBgOpacity / 100 }} />}
      <header className="ios-topbar relative z-10">
        <div className="mx-auto flex h-12 max-w-xl items-center gap-2 px-3">
          <button onClick={onClose} aria-label="返回"><ChevronLeft className="h-6 w-6" strokeWidth={1.4} /></button>
          <button aria-label="双击让他说话" className="touch-manipulation" onClick={() => { const n = Date.now(); if (n - tap.current < 350) { up((d) => { scheduleProactive(d); }); tap.current = 0; } else tap.current = n; }}><Avatar who="him" size={38} /></button>
          <div className="min-w-0 flex-1">
            <div className="serif break-words text-xs font-semibold">{partnerName(s.profile, "chat-header")}</div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {typing ? <>正在输入<span className="typing-dot">·</span><span className="typing-dot" style={{ animationDelay: ".2s" }}>·</span><span className="typing-dot" style={{ animationDelay: ".4s" }}>·</span></> : <><span className="h-1.5 w-1.5 rounded-full bg-foreground" />{s.chat.status}</>}
            </div>
          </div>
          <button onClick={() => setSettings(true)} aria-label="聊天设置"><Settings2 className="h-5 w-5" strokeWidth={1.3} /></button>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl px-4 py-6">
          <div className="mb-6 text-center"><span className="eyebrow">— {new Date().toLocaleDateString("zh-CN")} —</span></div>
          {s.msgs.map((m, i) => {
            const prev = s.msgs[i - 1];
            const gap = !prev || m.at - prev.at > 10 * 60_000;
            return (
              <div key={m.id}>
                {s.chat.showTime && gap && <div className="my-4 text-center text-[11px] text-faint">{hm(m.at)}</div>}
                {m.type === "system" || m.type === "call" ? (
                  <div className="my-3 text-center text-[11px] text-muted-foreground">{m.type === "call" && <Phone className="mr-1 inline h-3 w-3" />}{m.text}</div>
                ) : (
                  <div className={cn("mb-3 flex items-start gap-2.5", m.who === "me" ? "outgoing message-sent flex-row-reverse" : "incoming message-received flex-row")}>
                    <Button variant="ghost" className="h-auto shrink-0 touch-manipulation p-0" aria-label={`拍一拍${m.who === "me" ? "自己" : s.profile.him}`} onClick={() => { const n = Date.now(); const last = avatarTap.current; if (last.who === m.who && n - last.at < 350) { up(d => patAvatar(d, m.who)); avatarTap.current = { who: "", at: 0 }; } else avatarTap.current = { who: m.who, at: n }; }}><Avatar who={m.who} size={36} /></Button>
                    <div className={cn("flex max-w-[72%] flex-col", m.who === "me" ? "items-end" : "items-start")}>
                      <Bubble m={m} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {typing && (
            <div className="incoming message-received mb-3 flex items-start gap-2.5"><Avatar who="him" size={36} /><div className="bub bub-him bubble"><span className="typing-dot">●</span> <span className="typing-dot" style={{ animationDelay: ".2s" }}>●</span> <span className="typing-dot" style={{ animationDelay: ".4s" }}>●</span></div></div>
          )}
          <div ref={end} />
        </div>
      </div>

      <div className="relative z-10 border-t border-border bg-background">
        <div className="mx-auto flex max-w-xl items-end gap-2 px-3 py-2.5">
          <button className={cn("flex h-10 w-10 shrink-0 items-center justify-center border border-input transition-transform", plus && "rotate-45")} onClick={() => { setPlus(!plus); setPanel(null); }} aria-label="更多"><Plus className="h-5 w-5" strokeWidth={1.3} /></button>
          <textarea rows={1} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="写给远方…" className="max-h-28 min-h-10 flex-1 resize-none border border-input bg-card px-3 py-2 text-[15px] outline-none focus:border-foreground"
            onKeyDown={(e) => { if (s.chat.enterSend && e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); sendText(); } }} />
          <button className="flex h-10 w-10 shrink-0 items-center justify-center" onClick={() => !call && startCall(setCall, "me")} aria-label="通话"><Phone className="h-5 w-5" strokeWidth={1.3} /></button>
          <button className="flex h-10 w-10 shrink-0 items-center justify-center bg-foreground text-background disabled:opacity-40" disabled={!txt.trim()} onClick={sendText} aria-label="发送"><Send className="h-4 w-4" /></button>
        </div>
        {plus && (
          <div className="mx-auto max-w-xl border-t border-border px-4 pb-6">
            <div className="grid grid-cols-3 gap-3 py-4">
              {([["sticker", "表情包", "STICKERS"], ["emoji", "Emoji", "EMOJI"], ["quiz", "快问快答", "QUICK Q"]] as const).map(([k, zh, en]) => (
                <button key={k} onClick={() => setPanel(panel === k ? null : k)} className={cn("border py-3", panel === k ? "border-foreground bg-foreground text-background" : "border-border")}>
                  <div className="text-sm">{zh}</div><div className="text-[8px] tracking-[0.2em] opacity-60">{en}</div>
                </button>
              ))}
            </div>
            {panel === "emoji" && <EmojiPanel onPick={(e) => setTxt((x) => x + e)} />}
            {panel === "sticker" && (stickers.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">还没有表情包。到「我们 · 字卡库 · 表情包」添加。</p> : (
              <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto">{stickers.map((c) => <button key={c.id} onClick={() => { send({ type: "sticker", src: c.text }); setPlus(false); }} className="aspect-square border border-border"><img src={c.text} alt="" className="h-full w-full object-contain" /></button>)}</div>
            ))}
            {panel === "quiz" && <QuizPanel onSend={(q) => { send({ type: "quiz", quiz: q }); setPlus(false); }} />}
          </div>
        )}
      </div>
      {settings && <ChatSettings onClose={() => setSettings(false)} />}
    </div>
  );
}

function EmojiPanel({ onPick }: { onPick: (e: string) => void }) {
  const { s, up } = useStore();
  const [val, setVal] = useState("");
  const custom = s.cards.filter((c) => c.use === "emoji");
  const add = () => {
    const list = [...val.trim()].filter(Boolean);
    if (!list.length) return;
    up((d) => {
      const have = new Set(d.cards.filter((c) => c.use === "emoji").map((c) => c.text));
      list.forEach((e) => { if (!have.has(e)) d.cards.push({ id: uid(), text: e, group: "默认", use: "emoji" }); });
    });
    setVal("");
  };
  return (
    <div>
      <div className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto text-2xl">
        {EMOJIS.map((e) => <button key={e} onClick={() => onPick(e)}>{e}</button>)}
        {custom.map((c) => (
          <span key={c.id} className="group relative">
            <button onClick={() => onPick(c.text)}>{c.text}</button>
            <button className="absolute -right-0.5 -top-0.5 hidden h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] text-background group-hover:flex" onClick={() => up((d) => { d.cards = d.cards.filter((x) => x.id !== c.id); })} aria-label="删除">×</button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <input className="field flex-1 text-sm" placeholder="粘贴 emoji，可一次多个" value={val} onChange={(e) => setVal(e.target.value)} />
        <button className="btn-line shrink-0" disabled={!val.trim()} onClick={add}>添加</button>
      </div>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  const { s, up } = useStore();
  const [answerer, setAnswerer] = useState<"me" | "him">(m.who === "me" ? "him" : "me");
  const [selected, setSelected] = useState<string[]>([]);
  const cls = m.who === "me" ? "bub bub-me bubble" : "bub bub-him bubble";
  if (m.type === "sticker") return <img src={m.src} alt="表情" className="h-24 w-24 object-contain" />;
  if (m.type === "quiz" && m.quiz) return (
    <div className={cn(cls, "min-w-52")}>
      <div className="text-[9px] tracking-[0.25em] opacity-60">QUICK Q · {m.quiz.multi ? "多选" : "单选"}</div>
      <div className="mt-1 font-semibold">{m.quiz.q}</div>
      <div className="mt-3 flex gap-2">{(["me", "him"] as const).map(who => <Button key={who} size="sm" variant="ghost" className="h-6 px-2 text-current hover:text-current" aria-pressed={answerer === who} onClick={() => { setAnswerer(who); setSelected(m.answers?.[who] ?? []); }}>{answerer === who ? "● " : "○ "}{who === "me" ? s.profile.me : s.profile.him}</Button>)}</div>
      <div className="mt-2 space-y-1">{m.quiz.options.map((o) => <Button key={o} variant="ghost" className="h-auto w-full justify-start whitespace-normal rounded-none border border-current/30 px-2 py-2 text-left text-current hover:text-current" aria-pressed={(selected.length ? selected : m.answers?.[answerer] ?? []).includes(o)} onClick={() => { if (!m.quiz) return; if (m.quiz.multi) setSelected(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o]); else { setSelected([o]); up(d => answerQuiz(d, m.id, answerer, [o])); } }}>{(selected.length ? selected : m.answers?.[answerer] ?? []).includes(o) ? "● " : "○ "}{o}</Button>)}</div>
      {m.quiz.multi && <Button variant="ghost" size="sm" className="mt-2 text-current hover:text-current" disabled={!selected.length} onClick={() => up(d => answerQuiz(d, m.id, answerer, selected))}>确认选择</Button>}
      {(["me", "him"] as const).filter(who => m.answers?.[who]?.length).map(who => <p key={who} className="mt-2 border-t border-current/20 pt-2 text-xs">{who === "me" ? s.profile.me : s.profile.him}：{m.answers?.[who]?.join("、")}</p>)}
    </div>
  );
  if (m.type === "answer") return (
    <div className={cn(cls, "min-w-44")}>
      <div className="text-[9px] tracking-[0.25em] opacity-60">ANSWER</div>
      <div className="text-[0.85em] opacity-70">{m.text}</div>
      <div className="mt-1 font-semibold">{m.picks?.join("、")}</div>
    </div>
  );
  const translated = m.who === "him" ? parseRussianCard(m.text ?? "") : { text: m.text, translation: undefined };
  const translation = m.translation ?? translated.translation;
  return <><div className={cls}>{translated.text}</div>{translation && <p className="mt-1 max-w-full break-words px-1 text-[11px] leading-5 text-muted-foreground" aria-label="中文翻译">{translation}</p>}</>;
}

function QuizPanel({ onSend }: { onSend: (q: Quiz) => void }) {
  const { s, up } = useStore();
  const [make, setMake] = useState(false);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<string[]>(["", ""]);
  const [multi, setMulti] = useState(false);
  return (
    <div>
      <div className="max-h-52 space-y-2 overflow-y-auto">
        {s.quizzes.length === 0 && <p className="py-2 text-center text-xs text-muted-foreground">还没有题目，先出一道吧。</p>}
        {s.quizzes.map((x) => (
          <div key={x.id} className="flex items-center gap-2 border border-border p-3">
            <button className="min-w-0 flex-1 text-left" onClick={() => onSend(x)}>
              <div className="truncate text-sm">{x.q}</div><div className="text-[11px] text-muted-foreground">{x.multi ? "多选" : "单选"} · {x.options.join(" / ")}</div>
            </button>
            <button onClick={() => up((d) => { d.quizzes = d.quizzes.filter((y) => y.id !== x.id); })} aria-label="删除"><Trash2 className="h-4 w-4 text-faint" /></button>
          </div>
        ))}
      </div>
      <button className="btn-line mt-3 w-full" onClick={() => setMake(true)}>＋ 新的题目</button>
      <Modal open={make} onClose={() => setMake(false)} title="出一道题">
        <input className="field" placeholder="问题，例如：今晚想吃什么？" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mt-4 flex gap-2">
          <button className={cn("chip", !multi && "chip-on")} onClick={() => setMulti(false)}>单选</button>
          <button className={cn("chip", multi && "chip-on")} onClick={() => setMulti(true)}>多选</button>
        </div>
        {opts.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className="field" placeholder={`选项 ${i + 1}`} value={o} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))} />
            {opts.length > 2 && <button onClick={() => setOpts(opts.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>}
          </div>
        ))}
        <button className="mt-3 text-sm text-muted-foreground" onClick={() => setOpts([...opts, ""])}>＋ 添加选项</button>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="btn" disabled={!q.trim() || opts.filter((o) => o.trim()).length < 2} onClick={() => {
            const quiz = { id: uid(), q: q.trim(), options: opts.map((o) => o.trim()).filter(Boolean), multi };
            onSend(quiz);
            setQ(""); setOpts(["", ""]); setMake(false);
          }}>直接发送</button>
          <button className="btn-line" disabled={!q.trim() || opts.filter((o) => o.trim()).length < 2} onClick={() => {
            const quiz = { id: uid(), q: q.trim(), options: opts.map((o) => o.trim()).filter(Boolean), multi };
            up((d) => { d.quizzes.unshift(quiz); });
            setQ(""); setOpts(["", ""]); setMake(false);
          }}>存入题库</button>
        </div>
      </Modal>
    </div>
  );
}

const PRESETS: { name: string; me: string; him: string }[] = [
  { name: "默认 · 墨", me: "", him: "" },
  { name: "杂志 · 直角", me: "border-radius:0;background:#111;color:#fafafa;letter-spacing:.02em;", him: "border-radius:0;background:#fff;border:1px solid #111;" },
  { name: "灰 · 柔", me: "border-radius:18px;background:#5a5a5a;color:#fff;", him: "border-radius:18px;background:#ececec;border:none;" },
  { name: "信笺", me: "border-radius:4px;background:#fdfdfb;color:#222;border:1px solid #222;font-family:'Noto Serif SC',serif;", him: "border-radius:4px;background:#f2f2f0;color:#222;border:1px dashed #888;font-family:'Noto Serif SC',serif;" },
];

const presetCss = (p: { me: string; him: string }) => p.me || p.him ? `.bubble-me {\n  ${p.me}\n}\n.bubble-him {\n  ${p.him}\n}` : "";

/** Scoped appearance-only styles; editor preview never overrides live chat. */
export function BubbleStyle({ css, scope = "live" }: { css?: string; scope?: string }) {
  const { s } = useStore();
  const compiled = compileBubbleCss(css ?? s.theme.bubbleCss, scope);
  return <style>{compiled.css}</style>;
}

function ChatSettings({ onClose }: { onClose: () => void }) {
  const { s, up, now } = useStore();
  const [statusDraft, setStatusDraft] = useState("");
  const c = s.chat;
  const set = (fn: (d: typeof s.chat) => void) => up((d) => fn(d.chat));
  return (
    <Sheet open onClose={onClose} title="聊天设置" sub="CHAT ATELIER">
      <div className="mb-10 flex items-center gap-4">
        <Avatar who="him" size={72} />
        <div className="min-w-0 flex-1"><div className="eyebrow">CONTACT</div><div className="serif mt-1 text-2xl font-bold">{partnerName(s.profile)}</div><div className="mt-1 text-xs text-muted-foreground">{c.status}</div></div>
      </div>

      <Block no="01" en="NAME" zh="称呼">
        <div className="py-4"><div className="text-xs text-muted-foreground">爱称（聊天顶栏与写信）</div>
          <input className="field serif mt-1 text-2xl" value={s.profile.nick} onChange={(e) => up((d) => { d.profile.nick = e.target.value; })} /></div>
      </Block>

      <Block no="02" en="STATUS" zh="此刻的他">
        <Row label="随机切换状态" hint="不定时地，他的状态会自己变化"><Switch on={c.autoStatus} onChange={(v) => set((d) => { d.autoStatus = v; })} /></Row>
        <div className="flex flex-wrap gap-2 py-4">{c.statuses.map((st) => <Button key={st} variant={c.status === st ? "default" : "outline"} size="sm" onClick={() => set(d => { d.status = st; })}>{st}</Button>)}</div>
        <div className="flex items-center gap-2"><input aria-label="新增状态" className="field text-xs" placeholder="添加他的状态" value={statusDraft} onChange={e => setStatusDraft(e.target.value)} /><Button variant="ghost" size="icon" aria-label="添加状态" disabled={!statusDraft.trim()} onClick={() => { set(d => { d.statuses = [...new Set([...d.statuses, statusDraft.trim()])]; }); setStatusDraft(""); }}><Plus /></Button></div>
      </Block>

      <Block no="03" en="RHYTHM" zh="回复的节奏">
        <Slider label="最快回复" value={c.replyMin} min={2} max={300} unit="秒" onChange={(v) => set((d) => { d.replyMin = Math.min(v, d.replyMax); })} />
        <Slider label="最慢回复" value={c.replyMax} min={2} max={300} unit="秒" onChange={(v) => set((d) => { d.replyMax = Math.max(v, d.replyMin); })} hint="每次回复的时间在两者之间随机" />
        <Row label="允许主动发消息" hint="冷却之后，他偶尔会先开口"><Switch on={c.proactive} onChange={(v) => set((d) => { d.proactive = v; })} /></Row>
        {c.proactive && <>
          <Slider label="主动消息冷却" value={c.cooldown} min={1} max={60} unit="分钟" onChange={(v) => up((d) => { d.chat.cooldown = v; d.sched.proactive = Math.min(d.sched.proactive, Date.now() + v * 60_000 * 3); })} />
          <div className="border-b border-border py-3 text-xs text-muted-foreground">下一次可能的时机：{countdown(s.sched.proactive - now)} 之后（不一定会发生）</div>
        </>}
        <Row label="允许他打来电话" hint="很偶尔才会响起"><Switch on={c.allowCall} onChange={(v) => set((d) => { d.allowCall = v; })} /></Row>
      </Block>

      <Block no="04" en="TYPE" zh="字与显示">
        <Slider label="聊天字号" value={s.theme.chatFont} min={12} max={22} unit="px" onChange={(v) => up((d) => { d.theme.chatFont = v; })} />
        <Row label="显示时间"><Switch on={c.showTime} onChange={(v) => set((d) => { d.showTime = v; })} /></Row>
        <Row label="回车发送" hint="关闭后回车换行"><Switch on={c.enterSend} onChange={(v) => set((d) => { d.enterSend = v; })} /></Row>
      </Block>

      <Block no="05" en="BACKDROP" zh="聊天背景">
        <EImg slot="chat-bg" className="mt-4 aspect-[3/4] w-40" label="背景图" />
        <Slider label="背景浓度" value={s.theme.chatBgOpacity} min={0} max={100} unit="%" onChange={(v) => up((d) => { d.theme.chatBgOpacity = v; })} />
        {s.images["chat-bg"] && <button className="btn-line mt-3" onClick={() => up((d) => { delete d.images["chat-bg"]; })}>移除背景</button>}
      </Block>

      <Block no="06" en="BUBBLES" zh="气泡样式">
        <div className="flex flex-wrap gap-2 py-4">{PRESETS.map((p) => <button key={p.name} className="chip" onClick={() => up((d) => { d.theme.bubbleMe = ""; d.theme.bubbleHim = ""; d.theme.bubbleCss = presetCss(p); })}>{p.name}</button>)}</div>
        <BubbleCss />
      </Block>

      <Block no="08" en="PAT" zh="拍一拍">
        <label className="block py-3 text-xs">我被拍时的后缀<input aria-label="我的拍一拍后缀" className="field" value={c.patMe} onChange={e => set(d => { d.patMe = e.target.value; })} /></label>
        <label className="block py-3 text-xs">他被拍时的后缀<input aria-label="他的拍一拍后缀" className="field" value={c.patHim} onChange={e => set(d => { d.patHim = e.target.value; })} /></label>
        <p className="my-2 text-xs">{s.profile.me}拍了拍{s.profile.him}{c.patHim}</p>
        <PatCards />
      </Block>
      <Block no="07" en="ARCHIVE" zh="记录">
        <Row label="消息总数"><span className="display text-2xl">{s.msgs.length}</span></Row>
        <button className="btn-line mt-4 w-full" onClick={() => confirm("清空全部聊天记录？") && up((d) => { d.msgs = []; d.tasks = d.tasks.filter((t) => t.kind !== "chatReply"); })}>清空聊天记录</button>
      </Block>
    </Sheet>
  );
}

/** Bubble CSS editor with a live preview; one stylesheet covers both sides and applies on demand. */
export function BubbleCss() {
  const { s, up } = useStore();
  const [draft, setDraft] = useState(s.theme.bubbleCss);
  const [done, setDone] = useState("");
  useEffect(() => { setDraft(s.theme.bubbleCss); }, [s.theme.bubbleCss]);
  return (
    <div data-bubble-scope="preview" className="chat-room py-3">
      <BubbleStyle css={draft} scope="preview" />
      <div className="card-box space-y-3 p-4" style={{ fontSize: s.theme.chatFont }}>
        <div className="incoming message-received flex items-start gap-2"><Avatar who="him" size={30} /><div className="bub bub-him bubble">今天的风，从你那边吹来。</div></div>
        <div className="outgoing message-sent flex flex-row-reverse items-start gap-2"><Avatar who="me" size={30} /><div className="bub bub-me bubble">那我把窗开着。</div></div>
      </div>
      <p className="mt-3 text-xs leading-5">固定格式：.bubble-me 是我方，.bubble-him 是对方。只改颜色、边框、圆角与字体；宽度和定位由聊天自动适配。</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={() => { setDraft(BUBBLE_TEMPLATE); setDone(""); }}>填入格式模板</Button>
      <pre className="mt-2 overflow-x-auto border-l border-border pl-3 text-[10px] leading-5">{".bubble-me { background: var(--foreground); color: var(--background); }\n.bubble-him { background: var(--card); color: var(--foreground); }"}</pre>
      <textarea aria-label="气泡 CSS" className="area mt-4 min-h-48 font-mono text-xs" value={draft} onChange={(e) => { setDraft(e.target.value); setDone(""); }} placeholder={BUBBLE_TEMPLATE} />
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <button className="btn" onClick={() => { const result = compileBubbleCss(draft); if (result.error) { setDone(result.error); return; } up((d) => { d.theme.bubbleCss = draft; d.theme.bubbleMe = ""; d.theme.bubbleHim = ""; }); setDone("已应用"); }}>应用</button>
        <button className="btn-line" onClick={() => { setDraft(""); up((d) => { d.theme.bubbleCss = ""; d.theme.bubbleMe = ""; d.theme.bubbleHim = ""; }); setDone("已还原"); }}>还原</button>
      </div>
      {done && <p role="status" className="mt-2 text-xs">{done}</p>}
    </div>
  );
}

/** Incoming-call screen, active call, and draggable minimized window. Lives above every page. */
export function CallLayer() {
  const { s, up, call, setCall, now } = useStore();
  const [say, setSay] = useState("");
  const dragRef = useRef<{ dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (!call || now < call.start) return;
    let alive = true;
    let to: ReturnType<typeof setTimeout>;
    const loop = () => {
      to = setTimeout(() => {
        if (!alive) return;
        const cs = s.cards.filter((c) => c.use === "call");
        const t = cs[Math.floor(Math.random() * cs.length)]?.text ?? "嗯，我在听。";
        setCall((c) => (c ? { ...c, lines: [...c.lines, { who: "him" as const, text: t, at: Date.now() }].slice(-30) } : c));
        loop();
      }, rand(6000, 16000));
    };
    loop();
    return () => { alive = false; clearTimeout(to); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.start, now >= (call?.start ?? Infinity)]);

  const hang = () => {
    if (!call) return;
    const connected = Date.now() >= call.start;
    const d = connected ? Date.now() - call.start : 0;
    up((st) => {
      st.calls.push({ id: uid(), caller: call.caller, at: Date.now(), dur: d, missed: !connected });
      st.msgs.push({ id: uid(), who: call.caller, at: Date.now(), type: "call", text: connected ? `通话时长 ${dur(d)}` : "通话未接通" });
    });
    setCall(null);
  };

  useEffect(() => {
    if (!s.incoming || call || !s.sounds.ring) return;
    playSound(s.sounds.ring, true);
    return () => stopSound();
  }, [s.incoming, call, s.sounds.ring]);

  if (s.incoming && !call) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center p-3">
      <div className="call-window pointer-events-auto flex w-full max-w-[340px] items-center gap-3 p-3 fade-up">
        <div className="ring-pulse rounded-full"><Avatar who="him" size={48} /></div>
        <div className="min-w-0 flex-1"><div className="text-[10px] tracking-[0.3em] opacity-60">INCOMING</div><div className="serif truncate text-lg">{partnerName(s.profile)}</div></div>
        <div className="flex gap-3">
          <button aria-label="拒绝" onClick={() => up((d) => { d.incoming = undefined; d.calls.push({ id: uid(), caller: "him", at: Date.now(), dur: 0, missed: true }); d.msgs.push({ id: uid(), who: "him", at: Date.now(), type: "call", text: "未接来电" }); })}>
            <span className="call-btn call-btn-end"><X className="h-5 w-5" /></span></button>
          <button aria-label="接听" onClick={() => { up((d) => { d.incoming = undefined; }); startCall(setCall, "him"); }}>
            <span className="call-btn call-btn-ok"><Phone className="h-5 w-5" /></span></button>
        </div>
      </div>
      </div>
    );
  }
  if (!call) return null;
  const connected = now >= call.start;
  const time = connected ? dur(now - call.start) : "等待接通…";

  const drag = dragRef;
  const startDrag = (e: React.PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("[data-nodrag]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - call.x, dy: e.clientY - call.y, sx: e.clientX, sy: e.clientY, moved: false };
  };
  const moveDrag = (e: React.PointerEvent<HTMLElement>, w: number, h: number) => {
    const g = drag.current; if (!g) return;
    if (Math.abs(e.clientX - g.sx) + Math.abs(e.clientY - g.sy) > 4) g.moved = true;
    if (!g.moved) return;
    const x = Math.max(4, Math.min(window.innerWidth - w - 4, e.clientX - g.dx));
    const y = Math.max(4, Math.min(window.innerHeight - h - 4, e.clientY - g.dy));
    setCall((c) => (c ? { ...c, x, y } : c));
  };

  if (call.min) {
    return (
      <div className="call-pill fixed z-[90] flex touch-none select-none items-center gap-2 py-1.5 pl-1.5 pr-4"
        style={{ left: call.x, top: call.y }}
        onPointerDown={startDrag}
        onPointerMove={(e) => moveDrag(e, 150, 52)}
        onPointerUp={() => { const moved = drag.current?.moved; drag.current = null; if (!moved) setCall((c) => (c ? { ...c, min: false } : c)); }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <Avatar who="him" size={36} /><div><div className="text-[10px] opacity-60">通话中</div><div className="display text-lg leading-none">{time}</div></div>
      </div>
    );
  }
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-6">
      <div className="call-window pointer-events-auto flex max-h-[78vh] w-full max-w-[320px] flex-col fade-up">
        <div className="flex items-center justify-between px-5 pt-4">
          <button onClick={() => setCall((c) => (c ? { ...c, min: true, x: Math.max(8, window.innerWidth - 168), y: 90 } : c))} className="call-btn-sm" aria-label="最小化"><Minimize2 className="h-3.5 w-3.5" /></button>
          <span className="text-[10px] tracking-[0.3em] opacity-60">{connected ? "VOICE" : "CALLING"}</span>
          <span className="w-7" />
        </div>
        <div className="flex flex-col items-center px-5 pt-3">
          <div className={cn("rounded-full", !connected && "ring-pulse")}><Avatar who="him" size={76} /></div>
          <div className="serif mt-3 text-xl">{partnerName(s.profile)}</div>
          <div className="display mt-1 text-lg opacity-70">{time}</div>
        </div>
        <div className="mt-3 min-h-16 flex-1 space-y-2 overflow-y-auto px-5">
          {call.lines.map((l, i) => <p key={i} className={cn("serif text-[13px] leading-6 fade-up", l.who === "me" ? "text-right opacity-60" : "")}>{l.text}</p>)}
        </div>
        {connected && (
          <div className="mx-5 mt-2 flex items-center gap-2 rounded-full call-input px-4">
            <input className="flex-1 bg-transparent py-2 text-sm outline-none" placeholder="轻声说…" value={say} onChange={(e) => setSay(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && say.trim()) { const t = say.trim(); setSay(""); setCall((c) => (c ? { ...c, lines: [...c.lines, { who: "me", text: t, at: Date.now() }] } : c)); } }} />
          </div>
        )}
        <div className="flex justify-center gap-8 pb-5 pt-4">
          <button onClick={() => setCall((c) => (c ? { ...c, min: true, x: Math.max(8, window.innerWidth - 168), y: 90 } : c))} className="call-btn" aria-label="收起"><Minimize2 className="h-5 w-5" /></button>
          <button onClick={hang} className="call-btn call-btn-end" aria-label="挂断"><Phone className="h-5 w-5 rotate-[135deg]" /></button>
        </div>
      </div>
    </div>
  );
}
