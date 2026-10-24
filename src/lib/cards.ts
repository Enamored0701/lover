import type { Card, Use } from "./types";
import { uid } from "./util";

export const USES: { key: Use; label: string; en: string; desc: string }[] = [
  { key: "chat", label: "传讯", en: "MESSAGES", desc: "聊天时他回复与主动来信所用的句子" },
  { key: "russian", label: "俄语", en: "RUSSIAN", desc: "俄语原文【中文翻译】，例如 Дорогой【亲爱的】" },
  { key: "period", label: "经期", en: "CYCLE CARE", desc: "经期中、预测经期、预测排卵期、易孕期分组关心" },
  { key: "comment", label: "评论", en: "REMARKS", desc: "他在你的文字下留下的评论" },
  { key: "letter", label: "回信", en: "LETTERS", desc: "回复「想对你说」的长信段落" },
  { key: "post", label: "动态", en: "PAGES", desc: "他主动写下的碎碎念、随笔与日记" },
  { key: "note", label: "留言", en: "CALENDAR", desc: "他在日历某一天留下的话" },
  { key: "remind", label: "提醒", en: "WORLD", desc: "他提醒你补充设定与故事线" },
  { key: "call", label: "通话", en: "VOICE", desc: "通话时他说的话" },
  { key: "sticker", label: "表情包", en: "STICKERS", desc: "图片链接或上传的图片" },
  { key: "emoji", label: "Emoji", en: "EMOJI", desc: "聊天面板里的自定义表情" },
  { key: "quiz", label: "问卷", en: "QUICK Q", desc: "他主动发来的快问快答" },
  { key: "pat", label: "拍一拍", en: "PAT", desc: "他拍一拍你时的动作后缀" },
  { key: "music", label: "一起听", en: "SIDE B", desc: "他邀请你听歌、暂停或切歌时所说的话" },
];

const D: Record<Use, string[]> = {
  russian: ["Дорогой【亲爱的】", "Я скучаю по тебе.【我想你了。】", "Я рядом.【我就在你身边。】", "Береги себя.【照顾好自己。】", "Спокойной ночи, любовь моя.【晚安，我的爱。】"],
  period: [],
  chat: [
    "刚刚路过一家花店，想起你说过喜欢不张扬的白色。",
    "今天风很大，像要把人往你那边吹。",
    "我在。一直在。",
    "别熬太晚，剩下的事情明天我陪你一起想。",
    "你说的我都记下了，一个字都没有漏。",
    "想你这件事，没有淡季。",
    "吃饭了吗？不许敷衍我。",
    "路还长，不急。我们慢慢走。",
    "嗯，我听着呢，继续说。",
    "如果今天不太顺利，那就把它交给我一会儿。",
    "我这边天快黑了，你那边呢？",
    "笑什么，过来。",
  ],
  comment: [
    "这一段我读了三遍。",
    "原来你那时候在想这个。",
    "写得真好，下次念给我听。",
    "收藏了，不许删。",
    "我也是。",
    "这句话借我抄一遍，放在随身的本子里。",
    "辛苦了，今天的你也很好。",
    "下次这样的时刻，记得叫上我。",
  ],
  letter: [
    "信收到了。我把它折好放在离心口最近的那只口袋里。",
    "你问我会不会等，我想答案早就写在走过的每一段路上了。",
    "有些话写下来就不那么轻了，所以我写得很慢。",
    "那天你说想去看海，我就开始留意每一张去海边的车票。",
    "爱不是一场漫长的构想，是今天也决定继续往前走。",
    "我不擅长说漂亮话，但我会一直回信，直到你不再需要信为止——而那时，我大概就在你身边了。",
    "世界很大，我只想认得通往你的那一条路。",
    "我把太阳留给你，在你那边，它就永远不会落下。",
  ],
  post: [
    "今天的云走得很慢，像有人在等。",
    "整理旧物时翻出一张车票，终点那一栏，我想写你的名字。",
    "夜里读书，读到一句很像你的话，就停在那一页。",
    "风从西边来，带一点沙，也带一点想念。",
    "有人说思念是病，我想我没打算痊愈。",
    "把今天过好，就是离你更近一点。",
    "走着走着，就把一条路走成了我们。",
  ],
  note: [
    "这一天，记得喝热水，我会提醒你第二遍。",
    "今天也想你，记录在案。",
    "这个日子我先占下了，留给我们。",
    "不舒服的话就早点休息，别硬撑。",
    "今天天气适合见面，可惜只能先写在这里。",
    "圈一下，往后每年的今天都要记得。",
  ],
  remind: [
    "我们的故事是不是很久没有往下写了？今天补一段吧。",
    "那条 if 线，我还挺想知道后来的。",
    "时间线上空了一段，我在那里等你。",
    "要不要给我补一张新的证件照？",
    "上次说到一半的设定，今天续上好不好。",
    "灵感别放太久，会跑掉的。",
  ],
  call: [
    "喂，听得到吗？",
    "嗯……就是想听听你的声音。",
    "你那边好安静。",
    "别挂，再说一会儿。",
    "我在笑，你听出来了吗。",
    "今天过得怎么样？慢慢讲。",
    "有你在，周围都变得很轻。",
    "好，那就这样说定了。",
  ],
  sticker: [],
  emoji: [],
  quiz: [],
  pat: ["，轻声说我在", "，把你拉到身边", "，递来一颗星星"],
  music: ["留一首歌的时间给我们，好不好？", "这首歌，让我陪你一起听。", "先停一会儿，我想和你说说话。", "换一首吧，下一首也想和你听。"],
};

/** Quiz card text format: 问题||选项1|选项2 或 问题||选项1|选项2||多选 */
export function parseQuizCard(text: string): { q: string; options: string[]; multi: boolean } | null {
  const [q, opts, flag] = text.split("||").map((x) => x.trim());
  const options = (opts ?? "").split("|").map((x) => x.trim()).filter(Boolean);
  if (!q || options.length < 2) return null;
  return { q, options, multi: flag === "多选" || flag === "multi" };
}

export function defaultCards(): Card[] {
  const out: Card[] = [];
  (Object.keys(D) as Use[]).forEach((u) => D[u].forEach((t) => out.push({ id: uid(), text: t, group: "默认", use: u })));
  Object.entries({
    "经期中": ["今天不舒服就慢一点，我陪你休息。", "把手放暖，别勉强自己。有明显不适记得及时求助。"],
    "预测经期": ["{date}可能接近下次经期，提前备好需要的东西，我陪你。", "预计经期快到了，多留一点时间给自己休息。"],
    "预测排卵期": ["{date}是日历估算的排卵日，身体的节奏也可能变化，今天还好吗？", "日历预计接近排卵日了，留意身体感受，不舒服就休息。"],
    "易孕期": ["日历估算{date}在易孕期内，预测不等于准确日期，照顾好自己。", "这几天是估算的易孕窗口，不要把日历当作避孕依据。今天也想关心你。"],
  }).forEach(([group, texts]) => texts.forEach(text => out.push({ id: uid(), use: "period", group, text })));
  return out;
}

export function withNewDefaultCards(cards: Card[]): Card[] {
  return [...cards, ...defaultCards().filter(c => ["russian", "period", "pat"].includes(c.use) && !cards.some(old => old.use === c.use))];
}

const TEXT_KEYS = ["text", "content", "msg", "message", "reply", "value", "line", "body", "sentence", "quote", "word", "words", "card", "url", "src", "image", "img"];
const GROUP_KEYS = ["group", "category", "type", "tag", "分组", "分类"];

const isImg = (s: string) => /^data:image\//.test(s) || /^https?:\/\/\S+\.(png|jpe?g|gif|webp|bmp|svg)(\?\S*)?$/i.test(s);

/** Parse any JSON shape into cards. Strings anywhere become cards; object keys become group names. */
export function parseAnyJson(data: unknown, use: Use, group: string): Card[] {
  const out: Card[] = [];
  const walk = (v: unknown, g: string, depth: number) => {
    if (depth > 12 || v == null) return;
    if (typeof v === "string") {
      const t = v.trim();
      if (!t) return;
      if (use === "sticker" ? isImg(t) : !isImg(t) || false) out.push({ id: uid(), text: t, group: g, use });
      return;
    }
    if (typeof v === "number" || typeof v === "boolean") return;
    if (Array.isArray(v)) return v.forEach((x) => walk(x, g, depth + 1));
    if (typeof v === "object") {
      const o = v as Record<string, unknown>;
      const gk = GROUP_KEYS.find((k) => typeof o[k] === "string");
      const ng = gk ? String(o[gk]) : g;
      const tk = TEXT_KEYS.filter((k) => typeof o[k] === "string" || Array.isArray(o[k]));
      if (tk.length) return tk.forEach((k) => walk(o[k], ng, depth + 1));
      Object.entries(o).forEach(([k, x]) => {
        if (GROUP_KEYS.includes(k)) return;
        walk(x, gk ? ng : k || ng, depth + 1);
      });
    }
  };
  walk(data, group || "导入", 0);
  return out;
}

export function dedupe(cards: Card[]): { cards: Card[]; removed: number } {
  const seen = new Set<string>();
  const res: Card[] = [];
  for (const c of cards) {
    const k = c.use + "|" + c.text.replace(/\s+/g, " ").trim();
    if (seen.has(k)) continue;
    seen.add(k);
    res.push(c);
  }
  return { cards: res, removed: cards.length - res.length };
}

export const STATUSES = ["在线", "忙碌", "吃醋", "工作中", "出差", "睡觉", "烦躁", "想你", "在路上", "看书", "发呆", "失眠", "开会", "健身"];

export const EMOJIS = "😀😊🥰😘😍🤭😳🥺😢😭😤😡🙄😴🤔🫶❤️🤍🖤💙💫✨🌙☀️🌹🌸🍃☕️🍰🎧📮✉️💍🐱🐶🙈👋🤝🙏👀💤🔥🎉".match(/\p{Extended_Pictographic}\uFE0F?/gu) || [];
