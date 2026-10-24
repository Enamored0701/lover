import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, LockKeyhole, MessageCircle, X } from "lucide-react";
import { scheduleComment, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/kit";
import type { Notice } from "@/lib/types";

export function MessageAlerts() {
  const { s, ready, go, up } = useStore();
  const seen = useRef<Set<string> | null>(null);
  const [queue, setQueue] = useState<Notice[]>([]);
  const notice = queue[0];
  const dismiss = () => setQueue(q => q.slice(1));
  useEffect(() => {
    if (!ready) return;
    if (!seen.current) { seen.current = new Set(s.notices.filter(n => n.read || !n.postId).map(n => n.id)); }
    const fresh = s.notices.filter(n => !seen.current?.has(n.id));
    fresh.forEach(n => seen.current?.add(n.id));
    if (fresh.length) setQueue(q => [...q, ...fresh.reverse()]);
  }, [s.notices, ready]);
  useEffect(() => {
    if (!notice || notice.postId) return;
    const timer = setTimeout(() => setQueue(q => q.slice(1)), 6500);
    return () => clearTimeout(timer);
  }, [notice?.id]);
  if (!notice) return null;
  const post = s.posts.find(p => p.id === notice.postId);
  const mark = () => up(d => { const row = d.notices.find(n => n.id === notice.id); if (row) row.read = true; });
  const open = () => { mark(); go(notice.go); if (post) setTimeout(() => window.dispatchEvent(new CustomEvent("previa-open-post", { detail: post.id })), 60); else if (notice.go === "chat") setTimeout(() => window.dispatchEvent(new Event("previa-open-chat")), 60); dismiss(); };
  const decide = (allow: boolean) => { if (!post) return; up(d => { const p = d.posts.find(p => p.id === post.id); if (!p?.req || p.req.by !== "him" || p.req.status !== "pending") return; p.req.status = allow ? "ok" : "no"; p.unlocked = allow; if (allow) scheduleComment(d, p.id); const n = d.notices.find(n => n.id === notice.id); if (n) n.read = true; }); dismiss(); };
  if (post) return createPortal(<div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/15 p-5" onClick={dismiss}><section role="dialog" aria-modal="true" aria-label="页边提醒" className="post-alert notice-glass" onClick={e => e.stopPropagation()}><div className="flex items-center gap-2"><Avatar who="him" size={30} /><span className="min-w-0 flex-1 text-xs">{s.profile.him}</span>{notice.kind === "unlock" ? <LockKeyhole className="h-4 w-4" /> : notice.kind === "like" ? <Heart className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}<Button variant="ghost" size="icon" className="h-6 w-6" aria-label="关闭提醒" onClick={dismiss}><X /></Button></div><h2 className="serif mt-4 break-words text-base">{post.title || "未题的一页"}</h2><p className="mt-2 text-xs leading-6">{notice.text}</p>{notice.kind === "comment" && <p className="mt-2 line-clamp-3 border-l border-border pl-3 text-xs leading-5">{[...post.comments].reverse().find(c => c.who === "him")?.text}</p>}<div className="mt-4 flex gap-2">{notice.kind === "unlock" && post.req?.status === "pending" ? <><Button size="sm" className="flex-1" onClick={() => decide(true)}>同意查看</Button><Button size="sm" variant="outline" className="flex-1" onClick={() => decide(false)}>暂不同意</Button></> : <><Button size="sm" className="flex-1" onClick={open}>查看</Button><Button size="sm" variant="outline" className="flex-1" onClick={() => { mark(); dismiss(); }}>稍后</Button></>}</div></section></div>, document.body);
  return <div role="status" className="notice-glass fixed inset-x-3 top-2 z-[80] mx-auto flex max-w-md items-center gap-2 rounded-lg border border-border p-3"><Avatar who="him" size={32} /><Button variant="ghost" className="h-auto min-w-0 flex-1 justify-start px-1 text-left" onClick={open}><span className="block min-w-0"><span className="block text-[10px]">{s.profile.him} · PREVIA</span><span className="line-clamp-2 block whitespace-normal text-xs leading-5">{notice.go === "chat" ? [...s.msgs].reverse().find(m => m.who === "him")?.text || notice.text : notice.text}</span></span></Button><Button variant="ghost" size="icon" className="h-6 w-6" aria-label="关闭消息提醒" onClick={dismiss}><X /></Button></div>;
}