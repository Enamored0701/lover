import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { produce } from "immer";
import { get, set } from "idb-keyval";
import type { Card, Msg, Post, State, Use, View, WorldKey, Notice } from "./types";
import { defaultCards, parseQuizCard, STATUSES, withNewDefaultCards } from "./cards";
import { DAY, HOUR, MIN, pick, playSound, rand, randInt, uid, ymd } from "./util";
import { playbackDefaults } from "./playback";
import { answerQuiz, messageBody, parseRussianCard } from "./messages";
import { careTargets, ordinaryChance, RARE_CHANCE } from "./interactions";

const KEY = "previa-state-v1";

export function initialState(): State {
  const now = Date.now();
  const w = (): Record<WorldKey, []> => ({ lore: [], ids: [], files: [], ifs: [], ideas: [], timeline: [] });
  return {
    v: 1,
    profile: { me: "我", him: "他", nick: "亲爱的", bio: "我们隔着丝绸般的长路相爱，像星辰隔着夜色，彼此照亮。", together: ymd(new Date()), motto: "Somewhere between the words and the world." },
    images: {},
    theme: { bubbleMe: "", bubbleHim: "", bubbleCss: "", font: "", fontName: "", chatFont: 15, baseFont: 92, pageBgOpacity: 18, chatBgOpacity: 30 },
    posts: [], msgs: [], quizzes: [], calls: [], cards: defaultCards(), events: [],
    period: { days: [], cycle: 28, len: 5 },
    world: w(),
    chat: { status: "在线", autoStatus: true, replyMin: 4, replyMax: 40, proactive: true, cooldown: 30, allowCall: true, unread: 0, showTime: true, enterSend: true, patMe: "的肩", patHim: "的肩", statuses: [...STATUSES] },
    freq: { commentMin: 5, commentMax: 40, letterMin: 6, letterMax: 24 },
    sched: {
      proactive: now + 30 * MIN * rand(1, 3), call: now + rand(2 * HOUR, 10 * HOUR), status: now + rand(30 * MIN, 3 * HOUR), pat: now + rand(6 * HOUR, 18 * HOUR),
      post: now + rand(3 * HOUR, 14 * HOUR), remind: now + rand(6 * HOUR, 30 * HOUR), note: now + rand(8 * HOUR, 30 * HOUR), diaryReq: now + rand(DAY, 3 * DAY),
      like: now + rand(HOUR, 6 * HOUR), care: now + rand(MIN, 15 * MIN),
    },
    tasks: [], notices: [], splashEvery: true, worldCard: {},
    sounds: { ring: "", msg: "" },
    playback: { ...playbackDefaults },
    music: { tracks: [], playlistLink: "", partner: true, listening: false, shared: false, mode: "loop", nextAt: now + rand(2 * HOUR, 8 * HOUR) },
  };
}

const fill = (s: State, t: string) => t.replaceAll("{me}", s.profile.me).replaceAll("{him}", s.profile.him).replaceAll("{nick}", s.profile.nick);

export function pickCard(s: State, use: Use): Card | undefined {
  return pick(s.cards.filter((c) => c.use === use));
}
const line = (s: State, use: Use, fb: string) => fill(s, pickCard(s, use)?.text ?? fb);

function pushHim(d: State, m: Omit<Msg, "id" | "who" | "at">, at = Date.now()) {
  d.msgs.push({ id: uid(), who: "him", at, ...m });
  d.chat.unread += 1;
}
function notify(d: State, text: string, go: View, detail: Pick<Notice, "kind" | "postId"> = {}) {
  d.notices.unshift({ id: uid(), text, at: Date.now(), read: false, go, ...detail });
  d.notices = d.notices.slice(0, 80);
}

/** Schedules a comment from him on a post. */
export function scheduleComment(d: State, postId: string) {
  if (d.tasks.some((t) => t.kind === "comment" && t.ref === postId)) return;
  const a = Math.min(d.freq.commentMin, d.freq.commentMax), b = Math.max(d.freq.commentMin, d.freq.commentMax);
  d.tasks.push({ id: uid(), kind: "comment", ref: postId, at: Date.now() + rand(a, b) * MIN });
}
export function scheduleLetter(d: State, postId: string) {
  const a = Math.min(d.freq.letterMin, d.freq.letterMax), b = Math.max(d.freq.letterMin, d.freq.letterMax);
  d.tasks.push({ id: uid(), kind: "letterReply", ref: postId, at: Date.now() + rand(a, b) * HOUR });
}
export function scheduleChatReply(d: State) {
  if (d.tasks.some((t) => t.kind === "chatReply")) return;
  const a = Math.min(d.chat.replyMin, d.chat.replyMax), b = Math.max(d.chat.replyMin, d.chat.replyMax);
  d.tasks.push({ id: uid(), kind: "chatReply", at: Date.now() + rand(a, b) * 1000 });
}
/** Double-tapping his avatar: he starts talking after a short, random pause. */
export function scheduleProactive(d: State) {
  const pending = d.tasks.find((t) => t.kind === "proactive" || t.kind === "chatReply");
  if (pending) { pending.at = Date.now() + rand(1500, 3500); return; }
  d.tasks.push({ id: uid(), kind: "proactive", at: Date.now() + rand(1500, 3500) });
}
export function patAvatar(d: State, target: "me" | "him") {
  const name = target === "me" ? d.profile.me : d.profile.him;
  d.msgs.push({ id: uid(), who: "me", at: Date.now(), type: "system", text: `${d.profile.me}拍了拍${name}${target === "me" ? d.chat.patMe : d.chat.patHim}` });
}
export function scheduleUnlock(d: State, postId: string) {
  d.tasks.push({ id: uid(), kind: "unlock", ref: postId, at: Date.now() + rand(1, 60) * MIN });
}
export function schedulePeriodCare(d: State, date: string) {
  if (!d.tasks.some(t => t.kind === "periodCare" && t.ref === date)) d.tasks.push({ id: uid(), kind: "periodCare", ref: date, at: Date.now() + rand(1, 15) * MIN });
}
function sendCardMessage(d: State, at: number) {
  const c = pick(d.cards.filter(c => ["chat", "russian", "sticker"].includes(c.use)));
  if (!c) return;
  if (c.use === "sticker") pushHim(d, { type: "sticker", src: c.text }, at);
  else pushHim(d, { type: "text", ...(c.use === "russian" ? parseRussianCard(fill(d, c.text)) : { text: fill(d, c.text) }) }, at);
}
function cycleCare(d: State, now: number, markedDate?: string) {
  const today = ymd(new Date(now));
  const targets = markedDate && d.period.days.includes(markedDate) ? [{ date: markedDate, group: "经期中" }] : careTargets(d.period, today);
  for (const target of targets) {
    if (d.events.some(e => e.who === "him" && e.date === target.date && e.careGroup === target.group) || !ordinaryChance()) continue;
    const card = pick(d.cards.filter(c => c.use === "period" && c.group === target.group));
    if (!card) continue;
    const text = fill(d, card.text).replaceAll("{date}", target.date);
    d.events.push({ id: uid(), date: target.date, text, who: "him", kind: "note", careGroup: target.group });
    notify(d, `${d.profile.him}：${text}`, "calendar");
  }
}

function himPostText(d: State, n: number) {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(line(d, "post", "今天也很想你。"));
  return [...new Set(out)].join("\n\n");
}

function runTask(d: State, t: State["tasks"][number], now: number) {
  if (t.kind === "pat") {
    const suffix = pickCard(d, "pat")?.text;
    if (suffix) {
      const text = `${d.profile.him}拍了拍${d.profile.me}${d.chat.patMe}${fill(d, suffix)}`;
      pushHim(d, { type: "system", text }, now);
      notify(d, text, "chat");
    }
  } else if (t.kind === "chatReply") {
    const last = [...d.msgs].reverse().find((m) => m.who === "me");
    let at = now;
    if (last?.type === "quiz" && last.quiz) {
      const q = last.quiz;
      const fallback = pick(q.options);
      const picks = q.multi ? q.options.filter(() => Math.random() < Math.random()) : fallback ? [fallback] : [];
      if (!last.answers?.him) answerQuiz(d, last.id, "him", picks.length ? picks : fallback ? [fallback] : []);
      at += 900;
    }
    const n = randInt(1, 3);
    for (let i = 0; i < n; i++) {
      sendCardMessage(d, at);
      at += randInt(700, 2200);
    }
    const latest = d.msgs.at(-1); if (latest) notify(d, messageBody(latest), "chat");
  } else if (t.kind === "proactive") {
    const n = randInt(1, 2);
    let at = now;
    for (let i = 0; i < n; i++) { sendCardMessage(d, at); at += randInt(800, 2000); }
    const latest = d.msgs.at(-1); if (latest) notify(d, messageBody(latest), "chat");
  } else if (t.kind === "comment") {
    const p = d.posts.find((x) => x.id === t.ref);
    if (p && (!p.locked || p.unlocked)) {
      p.comments.push({ id: uid(), who: "him", text: line(d, "comment", "看到了。"), at: now });
      notify(d, `${d.profile.him} 在「${p.title || "你的文字"}」下留了言`, "home", { kind: "comment", postId: p.id });
      if (!p.likedByHim && ordinaryChance()) { p.likedByHim = true; notify(d, `${d.profile.him} 喜欢「${p.title || "你的文字"}」`, "home", { kind: "like", postId: p.id }); }
    }
  } else if (t.kind === "letterReply") {
    const p = d.posts.find((x) => x.id === t.ref);
    const parts = new Set<string>();
    const k = randInt(2, 4);
    for (let i = 0; i < k; i++) parts.add(line(d, "letter", "信收到了。"));
    const replyId = uid();
    d.posts.unshift({ id: replyId, kind: "letter", who: "him", title: p ? `回信 · ${p.title || "无题"}` : "回信", text: [...parts].join("\n\n"), at: now, imgs: [], comments: [], ...(t.ref ? { replyTo: t.ref } : {}) });
    notify(d, `你有一封来自 ${d.profile.nick} 的回信`, "home", { kind: "post", postId: replyId });
  } else if (t.kind === "unlock") {
    const p = d.posts.find((x) => x.id === t.ref);
    if (p?.who === "him" && p.req?.by === "me" && p.req.status === "pending") {
      const ok = ordinaryChance();
      p.req.status = ok ? "ok" : "no";
      if (ok) p.unlocked = true;
      notify(d, ok ? `${d.profile.him} 同意你翻开那篇日记` : `${d.profile.him} 说那篇日记，再等等`, "home", { kind: "post", postId: p.id });
    }
  } else if (t.kind === "periodCare") cycleCare(d, now, t.ref);
}

export function tick(d: State, now: number) {
  if (now >= d.sched.pat) {
    if (Math.random() < RARE_CHANCE) runTask(d, { id: uid(), kind: "pat", at: now }, now);
    d.sched.pat = now + rand(6 * HOUR, 18 * HOUR);
  }
  if (now >= d.music.nextAt) {
    const text = pickCard(d, "music")?.text;
    if (d.music.partner && d.music.tracks.length && text) {
      if (!d.music.shared && !d.music.invite && ordinaryChance()) {
        const track = pick(d.music.tracks);
        if (track) { d.music.invite = { text: `${fill(d, text)} 一起听《${track.title}》。`, at: now, trackId: track.id }; notify(d, `${d.profile.him} 邀请你一起听《${track.title}》`, "chat"); }
      } else if (d.music.shared && d.music.listening && ordinaryChance()) {
        d.music.command = { kind: d.music.tracks.length > 1 && Math.random() < 0.5 ? "next" : "pause", text: fill(d, text), at: now };
      }
    }
    d.music.nextAt = now + rand(2 * HOUR, 8 * HOUR);
  }
  const due = d.tasks.filter((t) => t.at <= now);
  if (due.length) {
    d.tasks = d.tasks.filter((t) => t.at > now);
    due.sort((a, b) => a.at - b.at).forEach((t) => runTask(d, t, now));
  }
  const s = d.sched;
  if (now >= s.care) { cycleCare(d, now); s.care = now + rand(2 * HOUR, 6 * HOUR); }
  if (now >= s.like) {
    const post = pick(d.posts.filter(p => p.who === "me" && (!p.locked || p.unlocked)));
    if (post && ordinaryChance()) {
      if (!post.likedByHim && ordinaryChance()) { post.likedByHim = true; notify(d, `${d.profile.him} 喜欢「${post.title || "你的文字"}」`, "home", { kind: "like", postId: post.id }); }
      if (ordinaryChance()) scheduleComment(d, post.id);
    }
    s.like = now + rand(2 * HOUR, 10 * HOUR);
  }
  if (d.chat.autoStatus && now >= s.status) {
    d.chat.status = pick(d.chat.statuses) ?? d.chat.status;
    s.status = now + rand(40 * MIN, 4 * HOUR);
  }
  if (now >= s.proactive) {
    if (d.chat.proactive && ordinaryChance()) {
      const qc = pick(d.cards.filter((c) => c.use === "quiz").map((c) => parseQuizCard(c.text)).filter((x) => x !== null));
      if (qc && Math.random() < 0.35) {
        pushHim(d, { type: "quiz", quiz: { id: uid(), q: fill(d, qc.q), options: qc.options.map((o) => fill(d, o)), multi: qc.multi } });
        notify(d, `${d.profile.him} 发来一道快问快答`, "chat");
      } else {
        sendCardMessage(d, now);
        const latest = d.msgs.at(-1); if (latest) notify(d, messageBody(latest), "chat");
      }
    }
    s.proactive = now + d.chat.cooldown * MIN * rand(1, 3);
  }
  if (now >= s.call) {
    if (d.chat.allowCall && !d.incoming && Math.random() < RARE_CHANCE) d.incoming = now;
    s.call = now + rand(4 * HOUR, 20 * HOUR);
  }
  if (now >= s.post) {
    const kind = pick<Post["kind"]>(["murmur", "essay", "diary", "letter"]);
    if (kind && ordinaryChance()) {
      const id = uid();
      d.posts.unshift({ id, kind, who: "him", title: kind === "murmur" ? "" : pick(["无题", "途中", "今天", "风", "关于你", "夜行", "旧票根"]) ?? "无题", text: kind === "letter" ? line(d, "letter", "") : himPostText(d, kind === "murmur" ? 1 : randInt(2, 4)), at: now, imgs: [], comments: [], locked: kind === "diary" && ordinaryChance() });
      notify(d, `${d.profile.him} 写下了新的文字`, "home", { kind: "post", postId: id });
    }
    s.post = now + rand(10 * HOUR, 40 * HOUR);
  }
  if (now >= s.remind) {
    if (ordinaryChance()) {
    const text = line(d, "remind", "今天补一段设定吧。");
    d.remindToday = { text, date: ymd(new Date(now + (Math.random() < Math.random() ? 0 : randInt(1, 3) * DAY))), at: now };
    notify(d, `${d.profile.him}：${text}`, "world");
    }
    s.remind = now + rand(20 * HOUR, 60 * HOUR);
  }
  if (now >= s.note) {
    if (ordinaryChance()) {
    d.events.push({ id: uid(), date: ymd(new Date(now)), text: line(d, "note", "今天也想你。"), who: "him", kind: "note" });
    notify(d, `${d.profile.him} 在今天的日历上留了言`, "calendar");
    }
    s.note = now + rand(18 * HOUR, 54 * HOUR);
  }
  if (now >= s.diaryReq) {
    const cand = d.posts.filter((p) => p.who === "me" && p.kind === "diary" && p.locked && !p.req);
    const p = pick(cand);
    if (p && ordinaryChance()) {
      p.req = { by: "him", at: now, status: "pending" };
      notify(d, `${d.profile.him} 想看你那篇上锁的日记`, "home", { kind: "unlock", postId: p.id });
    }
    s.diaryReq = now + rand(DAY, 4 * DAY);
  }
}

interface Ctx {
  s: State;
  up: (fn: (d: State) => void) => void;
  ready: boolean;
  now: number;
  typing: boolean;
  view: View;
  go: (v: View) => void;
  call: CallState | null;
  setCall: (c: CallState | null | ((c: CallState | null) => CallState | null)) => void;
}
export interface CallState { start: number; min: boolean; x: number; y: number; caller: "me" | "him"; lines: { who: "me" | "him"; text: string; at: number }[] }

const C = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(() => initialState());
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [view, go] = useState<View>("home");
  const [call, setCall] = useState<CallState | null>(null);
  const saveT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgCount = useRef<number | null>(null);

  useEffect(() => {
    get(KEY)
      .then((v) => {
        if (v && typeof v === "object") {
          const base = initialState();
          const st = v as State;
          setS({ ...base, ...st, tasks: st.tasks.filter(t => t.kind !== "pat"), cards: withNewDefaultCards(st.cards), playback: { ...base.playback, ...st.playback }, music: { ...base.music, ...st.music, listening: false, shared: false }, profile: { ...base.profile, ...st.profile }, theme: { ...base.theme, ...st.theme }, worldCard: { ...base.worldCard, ...st.worldCard }, chat: { ...base.chat, ...st.chat }, freq: { ...base.freq, ...st.freq }, sched: { ...base.sched, ...st.sched }, world: { ...base.world, ...st.world } });
        }
      })
      .finally(() => setReady(true));
  }, []);

  const up = useCallback((fn: (d: State) => void) => setS((prev) => produce(prev, fn)), []);

  useEffect(() => {
    if (!ready) return;
    if (saveT.current) clearTimeout(saveT.current);
    saveT.current = setTimeout(() => set(KEY, s).catch(() => null), 400);
  }, [s, ready]);

  useEffect(() => {
    if (!ready) return;
    const i = setInterval(() => {
      const n = Date.now();
      setNow(n);
      setS((prev) => {
        const needs = prev.music.nextAt <= n || prev.tasks.some((t) => t.at <= n) || Object.values(prev.sched).some((x) => x <= n);
        return needs ? produce(prev, (d) => tick(d, n)) : prev;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [ready]);

  const typing = s.tasks.some((t) => (t.kind === "chatReply" || t.kind === "proactive") && t.at - now < 4500);

  useEffect(() => {
    if (!ready) return;
    const his = s.msgs.filter((m) => m.who === "him").length;
    if (msgCount.current === null) { msgCount.current = his; return; }
    if (his > msgCount.current) playSound(s.sounds.msg);
    msgCount.current = his;
  }, [s.msgs, ready, s.sounds.msg]);

  return <C.Provider value={{ s, up, ready, now, typing, view, go, call, setCall }}>{children}</C.Provider>;
}

export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}

export { line as cardLine };
