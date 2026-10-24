import { CalendarDays, Home, MessageSquare, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { View } from "@/lib/types";
import { cn } from "@/lib/utils";

const L: { v: View; zh: string; I: typeof Home }[] = [
  { v: "home", zh: "首页", I: Home },
  { v: "calendar", zh: "日历", I: CalendarDays },
  { v: "chat", zh: "传讯", I: MessageSquare },
  { v: "us", zh: "我们", I: User },
];

export function TabBar({ onCompose }: { onCompose: () => void }) {
  const { view, go, s } = useStore();
  const item = (x: (typeof L)[number]) => (
    <Button variant="ghost" key={x.v} onClick={() => { go(x.v); window.scrollTo({ top: 0 }); }} className={cn("relative h-full w-full flex-col gap-1 rounded-none px-0 pt-2", (view === x.v || (view === "world" && x.v === "us")) ? "text-foreground" : "text-faint")}>
      {(view === x.v || (view === "world" && x.v === "us")) && <span className="absolute top-0 h-0.5 w-8 bg-foreground" />}
      <x.I className="h-5 w-5" strokeWidth={1.3} />
      <span className="text-[11px] tracking-widest">{x.zh}</span>
      {x.v === "chat" && s.chat.unread > 0 && <span className="absolute right-[30%] top-2 h-1.5 w-1.5 rounded-full bg-foreground" />}
    </Button>
  );
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid h-14 max-w-xl grid-cols-5 items-start">
        {L.slice(0, 2).map(item)}
        <div className="flex justify-center">
          <Button onClick={onCompose} className="-mt-3 h-12 w-12 rounded-full p-0" aria-label="写下一页"><Plus className="h-6 w-6" /></Button>
        </div>
        {L.slice(2).map(item)}
      </div>
    </nav>
  );
}
