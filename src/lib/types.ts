export type Who = "me" | "him";
export type PostKind = "murmur" | "essay" | "diary" | "letter";
export type Use = "chat" | "russian" | "period" | "comment" | "letter" | "post" | "note" | "remind" | "call" | "sticker" | "emoji" | "quiz" | "music" | "pat";

export interface Comment { id: string; who: Who; text: string; at: number }
export interface UnlockReq { by: Who; at: number; status: "pending" | "ok" | "no" }
export interface Post {
  id: string; kind: PostKind; who: Who; title: string; text: string; at: number;
  imgs: string[]; // image slot keys
  locked?: boolean; unlocked?: boolean; req?: UnlockReq;
  comments: Comment[]; replyTo?: string; liked?: boolean; likedByHim?: boolean;
}
export interface Quiz { id: string; q: string; options: string[]; multi: boolean }
export interface Msg {
  id: string; who: Who; at: number;
  type: "text" | "sticker" | "quiz" | "answer" | "call" | "system";
  text?: string; translation?: string; src?: string; quiz?: Quiz; picks?: string[]; questionId?: string; answers?: Partial<Record<Who, string[]>>;
}
export interface Card { id: string; text: string; group: string; use: Use }
export interface CallLog { id: string; caller: Who; at: number; dur: number; missed: boolean }
export interface CalEvent { id: string; date: string; text: string; who: Who; kind: "note" | "anniv"; careGroup?: string }
export interface Entry { id: string; title: string; text: string; tag: string; date: string; at: number; fields?: Record<string, string>; gallery?: string[] }
export type WorldKey = "lore" | "ids" | "files" | "ifs" | "ideas" | "timeline";
export interface Notice { id: string; text: string; at: number; read: boolean; go: View; kind?: "comment" | "like" | "unlock" | "post"; postId?: string }
export type View = "home" | "calendar" | "world" | "chat" | "us";
export interface Task { id: string; at: number; kind: "chatReply" | "proactive" | "comment" | "letterReply" | "unlock" | "pat" | "periodCare"; ref?: string }
export interface Track { id: string; title: string; artist: string; src: string }

export interface State {
  v: 1;
  profile: { me: string; him: string; nick: string; bio: string; together: string; motto: string };
  images: Record<string, string>;
  theme: { bubbleMe: string; bubbleHim: string; bubbleCss: string; font: string; fontName: string; chatFont: number; baseFont: number; pageBgOpacity: number; chatBgOpacity: number };
  posts: Post[];
  msgs: Msg[];
  quizzes: Quiz[];
  calls: CallLog[];
  cards: Card[];
  events: CalEvent[];
  period: { days: string[]; cycle: number; len: number };
  world: Record<WorldKey, Entry[]>;
  chat: {
    status: string; autoStatus: boolean; replyMin: number; replyMax: number;
    proactive: boolean; cooldown: number; allowCall: boolean; unread: number;
    showTime: boolean; enterSend: boolean; patMe: string; patHim: string; statuses: string[];
  };
  freq: { commentMin: number; commentMax: number; letterMin: number; letterMax: number };
  sched: { proactive: number; call: number; status: number; post: number; remind: number; note: number; diaryReq: number; pat: number; like: number; care: number };
  tasks: Task[];
  notices: Notice[];
  sounds: { ring: string; msg: string };
  playback: { crossPage: boolean; mediaControls: boolean; notifications: boolean; backgroundAudio: boolean };
  music: { tracks: Track[]; playlistLink: string; partner: boolean; listening: boolean; shared: boolean; mode: "loop" | "shuffle" | "single"; nextAt: number; invite?: { text: string; at: number; trackId?: string }; command?: { kind: "pause" | "next"; at: number; text: string } };
  remindToday?: { text: string; date: string; at: number } | undefined;
  incoming?: number | undefined;
  splashEvery: boolean;
  worldCard: Record<string, Record<string, string>>;
}
