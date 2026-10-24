import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { Splash } from "@/components/Splash";
import { TabBar } from "@/components/TabBar";
import { Home } from "@/views/Home";
import { CalendarView } from "@/views/Calendar";
import { World } from "@/views/World";
import { ChatView, CallLayer } from "@/views/Chat";
import { Us } from "@/views/Us";
import { Compose } from "@/views/Compose";
import { Gramophone } from "@/views/Gramophone";
import { MessageAlerts } from "@/components/MessageAlerts";
import { BackgroundServices } from "@/components/BackgroundServices";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PREVIA — 在言语与世界之间" },
      { name: "description", content: "Somewhere between the words and the world. 一座只属于两个人的私人页刊。" },
      { property: "og:title", content: "PREVIA — 在言语与世界之间" },
      { property: "og:description", content: "Somewhere between the words and the world. 一座只属于两个人的私人页刊。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <StoreProvider><App /></StoreProvider>;
}

function App() {
  const { s, ready, view } = useStore();
  const [splash, setSplash] = useState<boolean | null>(null);
  const [compose, setCompose] = useState(false);

  useEffect(() => {
    if (!ready || splash !== null) return;
    const seen = sessionStorage.getItem("previa-splash");
    const first = !localStorage.getItem("previa-opened");
    setSplash(first || (s.splashEvery && !seen));
  }, [ready, splash, s.splashEvery]);

  useEffect(() => { document.documentElement.style.fontSize = `${s.theme.baseFont}%`; }, [s.theme.baseFont]);

  const done = useCallback(() => {
    sessionStorage.setItem("previa-splash", "1");
    localStorage.setItem("previa-opened", "1");
    setSplash(false);
  }, []);

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <div className="relative min-h-screen">
      {s.theme.font && <style>{`@font-face{font-family:"PreviaCustom";src:url(${s.theme.font});font-display:swap}:root{--font-sans:"PreviaCustom",system-ui,sans-serif;--font-serif:"PreviaCustom",serif;--font-display:"PreviaCustom",serif}html,body{font-family:"PreviaCustom",system-ui,sans-serif}`}</style>}
      {s.images["page-bg"] && (
        <img src={s.images["page-bg"]} alt="" className="pointer-events-none fixed inset-0 -z-0 h-full w-full object-cover" style={{ opacity: s.theme.pageBgOpacity / 100 }} />
      )}
      <div className="relative">
        {view === "home" && <Home />}
        {view === "calendar" && <CalendarView />}
        {view === "world" && <World />}
        {view === "chat" && <ChatView />}
        {view === "us" && <Us onReplay={() => setSplash(true)} />}
      </div>
      <TabBar onCompose={() => setCompose(true)} />
      <Compose open={compose} onClose={() => setCompose(false)} />
      <CallLayer />
      <Gramophone />
      <BackgroundServices />
      <MessageAlerts />
      {splash && <Splash onDone={done} />}
    </div>
  );
}
