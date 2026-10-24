import { useState } from "react";
import { ImagePlus, X, BookOpen, Feather, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, Switch } from "@/components/kit";
import { scheduleComment, scheduleLetter, useStore } from "@/lib/store";
import type { PostKind } from "@/lib/types";
import { compressImage, uid } from "@/lib/util";
import { cn } from "@/lib/utils";
import { KINDS } from "./Home";

export function Compose({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s, up, go } = useStore();
  const [kind, setKind] = useState<PostKind>("murmur");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [lock, setLock] = useState(false);
  const [imgs, setImgs] = useState<string[]>([]);

  const submit = () => {
    if (!text.trim()) return;
    const id = uid();
    const slots = imgs.map(() => `post-${uid()}`);
    up((d) => {
      slots.forEach((k, i) => (d.images[k] = imgs[i] ?? ""));
      d.posts.unshift({ id, kind, who: "me", title: title.trim(), text: text.trim(), at: Date.now(), imgs: slots, comments: [], locked: kind === "diary" && lock });
      if (kind === "letter") scheduleLetter(d, id);
      else if (!(kind === "diary" && lock)) scheduleComment(d, id);
    });
    setTitle(""); setText(""); setImgs([]); setLock(false);
    onClose(); go("home");
  };

  return (
    <Sheet open={open} onClose={onClose} title="写下一页" sub="A NEW PAGE" right={<Button variant="ghost" size="sm" disabled={!text.trim()} onClick={submit}>落笔</Button>}>
      
      <div className="grid grid-cols-2 gap-2 border-b border-border pb-4">{KINDS.map(k => { const Icon = k.key === "diary" ? BookOpen : k.key === "essay" ? Feather : k.key === "murmur" ? MessageCircle : Mail; return <Button key={k.key} variant={kind === k.key ? "default" : "outline"} className="h-10 justify-start" onClick={() => setKind(k.key)}><Icon className="h-4 w-4" />{k.zh}</Button>; })}</div>

      <div className={`writing-page writing-${kind} paper-sheet mt-5`}>
        <div className="writing-date flex items-end justify-between border-b border-border pb-3">
          <div className="flex items-end gap-3"><span className="display text-5xl">{String(new Date().getDate()).padStart(2, "0")}</span><span className="pb-1 text-[10px] tracking-[0.25em]">{new Date().toLocaleDateString("en-US", { month: "short", weekday: "short" }).toUpperCase()}</span></div>
          <span className="pb-1 text-[10px] tracking-[0.25em]">{KINDS.find((k) => k.key === kind)?.en}</span>
        </div>
        <input className="paper-title serif mt-4 text-xl" placeholder={kind === "letter" ? "致 " + s.profile.nick : kind === "murmur" ? "此刻" : kind === "essay" ? "篇名" : "无题"} value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="paper-lines serif mt-2 min-h-[240px] w-full resize-none bg-transparent text-[15px] outline-none" placeholder={kind === "letter" ? "我在远方点灯，你一抬头就能看见。" : kind === "diary" ? "今天的云，替我记得你。" : kind === "essay" ? "把夜色写成一页信。" : "此刻想到你了。"} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-2 text-right text-[10px] tracking-[0.2em] text-faint">{text.length} 字</div>
      </div>

      <div className="mt-5 flex items-center justify-between border-b border-border pb-2"><span className="serif text-xs">{kind === "letter" ? "随信附上" : kind === "diary" ? "今日照片" : kind === "essay" ? "配图" : "此刻的画面"}</span><span className="text-[10px]">{imgs.length}</span></div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {imgs.map((u, i) => (
          <div key={i} className="relative aspect-square"><img src={u} className="h-full w-full object-cover" alt="" />
            <button className="absolute right-1 top-1 bg-background p-0.5" onClick={() => setImgs(imgs.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button></div>
        ))}
        <label className="ph flex aspect-square cursor-pointer items-center justify-center"><ImagePlus className="h-5 w-5 text-muted-foreground" strokeWidth={1.3} />
          <input type="file" accept="image/*" multiple hidden onChange={async (e) => { const fs = [...(e.target.files || [])]; const r = await Promise.all(fs.map((f) => compressImage(f))); setImgs((x) => [...x, ...r]); e.target.value = ""; }} />
        </label>
      </div>

      {kind === "diary" && (
        <div className="mt-8 flex items-center justify-between border-y border-border py-4">
          <div>上锁</div>
          <Switch on={lock} onChange={setLock} />
        </div>
      )}
      <Button className="mt-6 w-full" onClick={submit} disabled={!text.trim()}>{kind === "letter" ? "寄 出" : "落 笔"}</Button>
    </Sheet>
  );
}
