import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, Music, Play, Settings2, Trash2 } from "lucide-react";
import { Avatar, Block, EImg, Eyebrow, Header, Row, SectionTitle, Sheet, Slider, Switch } from "@/components/kit";
import { initialState, useStore } from "@/lib/store";
import { dedupe, parseAnyJson, USES, withNewDefaultCards } from "@/lib/cards";
import type { Use } from "@/lib/types";
import { compressImage, diffDays, download, pad, playSound, readFile, stopSound, ymd } from "@/lib/util";
import { cn } from "@/lib/utils";
import { BubbleCss } from "./Chat";
import { Button } from "@/components/ui/button";
import { WorldEmblem } from "@/components/WorldEmblem";
import banner from "@/assets/banner.jpg";
import hero from "@/assets/hero.jpg";
import cover from "@/assets/world.jpg";

export function Us({ onReplay }: { onReplay: () => void }) {
  const { s, go } = useStore();
  const [settings, setSettings] = useState(false);
  const [lib, setLib] = useState(false);
  const days = diffDays(s.profile.together, ymd(new Date())) + 1;
  const worldN = Object.values(s.world).reduce((a, l) => a + l.length, 0);
  return <div className="compact-page">
    <div className="overview-shell mx-auto max-w-xl px-5 pb-20">
      <Eyebrow className="mt-4" left="PROFILE / 01" right={pad(days).padStart(3, "0")} />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0"><div className="eyebrow">THE AUTHORS</div><h1 className="serif mt-2 text-[26px] font-light leading-tight">你是我的<br />丝路与远方<span className="text-faint">。</span></h1></div>
        <Button variant="ghost" aria-label="世界" title="世界档案" className="h-20 w-20 rounded-none border border-border p-2" onClick={() => go("world")}><WorldEmblem /></Button>
      </div>
      <p className="serif mt-4 border-y border-border py-3 text-sm leading-6">{s.profile.bio}</p>
      <EImg slot="us-banner" fallback={banner} className="us-moments-cover mt-3 w-full grayscale" label="BANNER" />
      <div className="mt-4 flex items-center justify-center gap-5">
        <div className="flex min-w-0 flex-col items-center"><Avatar who="me" size={54} /><span className="serif mt-1 max-w-28 truncate text-sm">{s.profile.me}</span></div>
        <div className="text-center"><span className="eyebrow">TOGETHER</span><div className="display mt-1 text-3xl">{days}</div><span className="text-[10px] text-muted-foreground">天</span></div>
        <div className="flex min-w-0 flex-col items-center"><Avatar who="him" size={54} /><span className="serif mt-1 max-w-28 truncate text-sm">{s.profile.him}</span></div>
      </div>
      <div className="mt-4 grid grid-cols-3 border-y border-border py-3 text-center">
        {[['字句', s.posts.length], ['档案', worldN], ['传讯', s.msgs.length]].map(([label,n]) => <div key={label} className="border-r border-border last:border-0"><div className="display text-2xl">{n}</div><span className="text-[10px] text-muted-foreground">{label}</span></div>)}
      </div>
      <Button variant="ghost" className="mt-2 grid h-auto w-full grid-cols-[minmax(0,1fr)_auto] rounded-none px-0 py-3 text-left" onClick={() => setLib(true)}><span><span className="eyebrow block">CARD LIBRARY</span><span className="serif text-lg">字卡库</span></span><span className="flex items-center gap-3 text-xs text-muted-foreground">{s.cards.length}<ArrowUpRight /></span></Button>
      <Button variant="ghost" className="grid h-auto w-full grid-cols-[minmax(0,1fr)_auto] rounded-none border-y border-border px-0 py-4 text-left" onClick={() => setSettings(true)}><span className="flex items-center gap-3"><Settings2 className="h-4 w-4" /><span className="serif text-base">设置</span></span><ArrowUpRight className="h-4 w-4" /></Button>
    </div>
    {settings && <Settings onClose={() => setSettings(false)} onReplay={onReplay} />}
    {lib && <Library onClose={() => setLib(false)} />}
  </div>;
}

const SLOTS: { slot: string; label: string; fb?: string }[] = [
  { slot: "home-hero", label: "首页 · 主图", fb: hero },
  { slot: "world-cover", label: "世界 · 封面", fb: cover },
  { slot: "us-banner", label: "我们 · 横幅", fb: banner },
  { slot: "us-lib-icon", label: "我们 · 字卡库图标" },
  { slot: "cal-cover", label: "日历 · 同行图" },
  { slot: "page-bg", label: "全站背景" },
  { slot: "chat-bg", label: "聊天背景" },
  { slot: "world-banner-timeline", label: "时间线 · 横幅" },
  { slot: "setting-photo-him", label: "设定 · 他的照片" },
  { slot: "setting-photo-me", label: "设定 · 我的照片" },
  { slot: "music-label", label: "留声机 · 唱片封面" },
];

function Settings({ onClose, onReplay }: { onClose: () => void; onReplay: () => void }) {
  const { s, up } = useStore();
  const [notificationMessage, setNotificationMessage] = useState("");
  const setNotifications = async (enabled: boolean) => {
    if (!enabled) { up(d => { d.playback.notifications = false; }); return; }
    if (!("Notification" in window)) { setNotificationMessage("此浏览器不支持本机通知。"); return; }
    if (window.top !== window.self) { setNotificationMessage("请在独立标签页打开网站，再开启消息通知。"); return; }
    try {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      up(d => { d.playback.notifications = permission === "granted"; });
      setNotificationMessage(permission === "granted" ? "已允许本机通知；手机锁屏推送仍需连接 Firebase。" : "请在浏览器的网站设置中允许通知。");
    } catch { setNotificationMessage("无法申请通知权限，请检查浏览器的网站设置。"); }
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const P = s.profile;
  const setP = (k: keyof typeof P, v: string) => up((d) => { d.profile[k] = v; });
  return (
    <Sheet open onClose={onClose} title="设置" sub="SETTINGS & ATELIER">
      <div className="settings-compact">
      <Block no="01" en="PROFILE" zh="资料">
        {([["me", "我的称呼"], ["him", "他的称呼"], ["bio", "简介"], ["motto", "题词"]] as const).map(([k, l]) => (
          <div key={k} className="border-b border-border py-3"><div className="text-xs text-muted-foreground">{l}</div><input className="field" value={P[k]} onChange={(e) => setP(k, e.target.value)} /></div>
        ))}
        <div className="border-b border-border py-3"><div className="text-xs text-muted-foreground">在一起的日子</div><input type="date" className="field" value={P.together} onChange={(e) => setP("together", e.target.value)} /></div>

      </Block>

      <Block no="02" en="AVATARS" zh="头像">
        <div className="flex justify-around py-4">
          <div className="text-center"><Avatar who="me" size={64} editable /><div className="mt-2 text-sm">我</div></div>
          <div className="text-center"><Avatar who="him" size={64} editable /><div className="mt-2 text-sm">他</div></div>
        </div>
      </Block>

      <Block no="03" en="BEAUTIFY" zh="美化">
        <div className="py-4"><div className="mb-2 text-sm">全站背景图</div><EImg slot="page-bg" className="aspect-[3/4] w-36" label="背景" /></div>
        <Slider label="背景浓度" value={s.theme.pageBgOpacity} min={0} max={100} unit="%" onChange={(v) => up((d) => { d.theme.pageBgOpacity = v; })} />
        <Slider label="全站字号" value={s.theme.baseFont} min={75} max={115} unit="%" onChange={(v) => up((d) => { d.theme.baseFont = v; })} />
        <div className="py-4"><div className="mb-2 text-sm">聊天背景图</div><EImg slot="chat-bg" className="aspect-[3/4] w-36" label="聊天背景" /></div>
        <div className="pt-2 text-sm">气泡 CSS</div>
        <BubbleCss />
      </Block>

      <Block no="09" en="TYPEFACE" zh="字体">
        <FontRow />
      </Block>

      <Block no="04" en="IMAGES" zh="所有图片">
        <div className="grid grid-cols-3 gap-3">
          {SLOTS.map((x) => (
            <div key={x.slot}>
              <EImg slot={x.slot} fallback={x.fb} className="aspect-square w-full" label="+" />
              <div className="mt-1 truncate text-[10px] text-muted-foreground">{x.label}</div>
              {s.images[x.slot] && <button className="text-[10px] underline" onClick={() => up((d) => { delete d.images[x.slot]; })}>还原</button>}
            </div>
          ))}
        </div>
      </Block>

      <Block no="05" en="SOUND" zh="声音">
        {([["ring", "来电铃声"], ["msg", "消息提示音"]] as const).map(([k, label]) => (
          <SoundRow key={k} k={k} label={label} />
        ))}
        <p className="py-3 text-xs text-muted-foreground">支持 mp3 等音频文件，只保存在这台设备上。浏览器可能在首次互动后才允许播放声音。</p>
      </Block>

      <Block no="06" en="OPENING" zh="开屏">
        <Row label="每次打开都播放开屏" hint="关闭后仅首次打开时播放"><Switch on={s.splashEvery} onChange={(v) => up((d) => { d.splashEvery = v; })} /></Row>
        <button className="btn-line mt-4 w-full" onClick={() => { onClose(); onReplay(); }}>重新播放开屏</button>
      </Block>

      <Block no="08" en="BACKGROUND & NOTICES" zh="后台与通知">
        <Row label="跨页面播放" hint="关闭后离开传讯即暂停。"><Switch label="跨页面播放" on={s.playback.crossPage} onChange={v => up(d => { d.playback.crossPage = v; })} /></Row>
        <Row label="手机播放控制" hint="由支持的浏览器显示暂停与切歌。"><Switch label="手机播放控制" on={s.playback.mediaControls} onChange={v => up(d => { d.playback.mediaControls = v; })} /></Row>
        <Row label="消息通知" hint="本机新消息提醒；需要浏览器允许。"><Switch label="消息通知" on={s.playback.notifications} onChange={v => { void setNotifications(v); }} /></Row>
        {notificationMessage && <p role="status" className="py-2 text-xs text-muted-foreground">{notificationMessage}</p>}
        <Row label="后台辅助音频" hint="循环轻声音频，可能耗电；不能保证保活。"><Switch label="后台辅助音频" on={s.playback.backgroundAudio} onChange={v => up(d => { d.playback.backgroundAudio = v; })} /></Row>
        <Row label="锁屏推送通知" hint="Firebase 网页推送尚未连接。"><Switch label="锁屏推送通知" disabled on={false} onChange={() => {}} /></Row>
        <p className="py-3 text-xs leading-6 text-muted-foreground">手机系统仍可能暂停网页；后台音频不能保证消息持续产生。锁屏推送需要另外完成云端通知配置。</p>
      </Block>

      <Block no="07" en="DATA" zh="数据">
        <p className="py-3 text-xs text-muted-foreground">所有内容只保存在这台设备的浏览器中。换设备前请先导出备份。</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn" onClick={() => download(`previa-backup-${ymd(new Date())}.json`, JSON.stringify(s))}>导出备份</button>
          <button className="btn-line" onClick={() => fileRef.current?.click()}>导入备份</button>
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          try { const v = JSON.parse(await f.text()); if (!v.profile) throw 0; const base = initialState(); up(() => ({ ...base, ...v, chat: { ...base.chat, ...v.chat }, theme: { ...base.theme, ...v.theme }, cards: withNewDefaultCards(v.cards ?? base.cards), tasks: (v.tasks ?? []).filter((t: { kind: string }) => t.kind !== "pat"), sched: { ...base.sched, ...v.sched }, playback: { ...base.playback, ...v.playback }, music: { ...base.music, ...v.music, listening: false, shared: false } }) as never); alert("已恢复备份"); } catch { alert("这不是 PREVIA 的备份文件"); }
        }} />
        <button className="mt-6 w-full text-xs text-muted-foreground underline" onClick={() => confirm("清空全部内容并重置？此操作不可撤销。") && up(() => initialState() as never)}>重置全部</button>
      </Block>
      </div>
    </Sheet>
  );
}

function FontRow() {
  const { s, up } = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  return (
    <div className="py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><div className="text-[15px]">全站字体</div><div className="truncate text-xs text-muted-foreground">{s.theme.fontName || "默认字体"}</div></div>
        <div className="flex shrink-0 gap-2">
          <button className="btn-line" onClick={() => ref.current?.click()}>上传 TTF</button>
          {s.theme.font && <button className="btn-line" onClick={() => up((d) => { d.theme.font = ""; d.theme.fontName = ""; })}>还原</button>}
        </div>
      </div>
      <p className="mt-3 text-lg" style={{ fontFamily: s.theme.font ? "PreviaCustom" : undefined }}>星光替我走完那段路。</p>
      {msg && <p role="status" className="mt-2 text-xs">{msg}</p>}
      <input ref={ref} type="file" accept=".ttf,.otf,.woff,.woff2,font/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return; e.target.value = "";
        if (f.size > 25_000_000) { setMsg("字体文件请小于 25MB"); return; }
        try { const url = await readFile(f); await new FontFace("PreviaCheck", `url(${url})`).load(); up((d) => { d.theme.font = url; d.theme.fontName = f.name.replace(/\.\w+$/, ""); }); setMsg("已应用到全站"); } catch { setMsg("无法读取这个字体文件"); }
      }} />
    </div>
  );
}

function SoundRow({ k, label }: { k: "ring" | "msg"; label: string }) {
  const { s, up } = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const has = !!s.sounds[k];
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-4">
      <div className="flex min-w-0 items-center gap-3">
        <Music className="h-4 w-4 shrink-0" strokeWidth={1.3} />
        <div className="min-w-0"><div className="text-[15px]">{label}</div><div className="text-xs text-muted-foreground">{has ? "已设置自定义音频" : "未设置"}</div></div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {has && <button className="btn-line !px-3" onClick={() => { stopSound(); playSound(s.sounds[k]); }} aria-label="试听"><Play className="h-3.5 w-3.5" /></button>}
        <button className="btn-line" onClick={() => ref.current?.click()}>{has ? "更换" : "选择文件"}</button>
        {has && <button onClick={() => up((d) => { d.sounds[k] = ""; })} aria-label="移除"><Trash2 className="h-4 w-4 text-faint" /></button>}
      </div>
      <input ref={ref} type="file" accept="audio/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return; e.target.value = "";
        if (f.size > 4_000_000) { alert("音频请小于 4MB"); return; }
        const url = await readFile(f);
        up((d) => { d.sounds[k] = url; });
      }} />
    </div>
  );
}

function Library({ onClose }: { onClose: () => void }) {
  const { s, up } = useStore();
  const [use, setUse] = useState<Use>("chat");
  const [grp, setGrp] = useState<string>("全部");
  const [txt, setTxt] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [msg, setMsg] = useState("");
  const jsonRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const meta = USES.find((u) => u.key === use) ?? { en: "CARDS", label: "字卡", desc: "" };
  const cards = s.cards.filter((c) => c.use === use);
  const groups = useMemo(() => ["全部", ...new Set(cards.map((c) => c.group))], [cards]);
  const shown = grp === "全部" ? cards : cards.filter((c) => c.group === grp);
  const gName = newGroup.trim() || (grp !== "全部" ? grp : "默认");
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const addCards = (list: { text: string; group?: string }[], group: string) => {
    let removed = 0, added = 0;
    up((d) => {
      const before = d.cards.length;
      const r = dedupe([...d.cards, ...list.map((x) => ({ id: Math.random().toString(36).slice(2), text: x.text, group: x.group || group || "导入", use }))]);
      d.cards = r.cards; removed = r.removed; added = d.cards.length - before;
    });
    setTimeout(() => flash(`已加入 ${added} 张${removed ? `，自动去除 ${removed} 张重复` : ""}`), 50);
  };

  return (
    <Sheet open onClose={onClose} title="字卡库" sub="CARD LIBRARY">
      <Eyebrow left={`CARDS / ${s.cards.length}`} />
      <div className="no-scrollbar mt-4 flex gap-6 overflow-x-auto border-b border-border">
        {USES.map((u) => <button key={u.key} onClick={() => { setUse(u.key); setGrp("全部"); }} className={cn("tab text-sm", use === u.key && "tab-on")}>{u.label}</button>)}
      </div>
      <div className="mt-6 flex items-baseline justify-between"><div><div className="eyebrow">{meta.en}</div><div className="serif mt-1 text-2xl font-bold">{meta.label}</div></div><span className="display text-4xl">{cards.length}</span></div>
      <p className="mt-2 text-xs text-muted-foreground">{meta.desc}。可用 {"{me}"} {"{him}"} {"{nick}"} 代指名字。</p>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">{groups.map((g) => <button key={g} className={cn("chip", grp === g && "chip-on")} onClick={() => setGrp(g)}>{g}</button>)}</div>

      <div className="mt-6 card-box p-4">
        <div className="eyebrow">ADD</div>
        <input className="field mt-2 text-sm" placeholder={`分组名（留空则放入「${grp !== "全部" ? grp : "默认"}」）`} value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
        {use === "sticker" ? (
          <>
            <textarea className="area mt-3 min-h-20 text-xs" placeholder="粘贴图片链接，每行一个" value={txt} onChange={(e) => setTxt(e.target.value)} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn" disabled={!txt.trim()} onClick={() => { addCards(txt.split("\n").map((t) => ({ text: t.trim() })).filter((x) => x.text), gName); setTxt(""); }}>加入链接</button>
              <button className="btn-line" onClick={() => imgRef.current?.click()}>上传图片</button>
            </div>
            <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={async (e) => { const fs = [...(e.target.files || [])]; const r = await Promise.all(fs.map((f) => compressImage(f, 400, 0.85))); addCards(r.map((t) => ({ text: t })), gName); e.target.value = ""; }} />
          </>
        ) : (
          <>
            <textarea className="area mt-3 min-h-24" placeholder={use === "quiz" ? "每行一题：问题||选项1|选项2（末尾加 ||多选 即为多选题）" : use === "russian" ? "每行一张：Дорогой【亲爱的】" : "每行一张字卡"} value={txt} onChange={(e) => setTxt(e.target.value)} />
            <button className="btn mt-3 w-full" disabled={!txt.trim()} onClick={() => { addCards(txt.split("\n").map((t) => ({ text: t.trim() })).filter((x) => x.text), gName); setTxt(""); }}>加入字卡</button>
          </>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="btn-line" onClick={() => jsonRef.current?.click()}>导入 JSON</button>
          <button className="btn-line" onClick={() => { let n = 0; up((d) => { const r = dedupe(d.cards); d.cards = r.cards; n = r.removed; }); setTimeout(() => flash(n ? `已去除 ${n} 张重复字卡` : "没有重复的字卡"), 50); }}>一键去重</button>
        </div>
        <input ref={jsonRef} type="file" accept=".json,application/json,text/plain" hidden onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return; e.target.value = "";
          try { const data = JSON.parse(await f.text()); const list = parseAnyJson(data, use, newGroup.trim() || f.name.replace(/\.\w+$/, "")); if (!list.length) return flash("文件里没有找到可用的内容"); addCards(list, ""); } catch { flash("无法读取：请确认是 JSON 文件"); }
        }} />
        <p className="mt-2 text-[11px] text-muted-foreground">任意结构的 JSON 都可导入：数组、对象、嵌套皆可，对象的键名会成为分组。导入时自动去重。</p>
        {msg && <p className="mt-2 text-sm fade-up">{msg}</p>}
      </div>

      <div className="mt-6">
        {use === "sticker" ? (
          <div className="grid grid-cols-4 gap-2">{shown.map((c) => (
            <div key={c.id} className="relative aspect-square border border-border"><img src={c.text} alt="" className="h-full w-full object-contain" />
              <button className="absolute right-0 top-0 bg-background p-0.5" onClick={() => up((d) => { d.cards = d.cards.filter((x) => x.id !== c.id); })}><Trash2 className="h-3 w-3" /></button></div>
          ))}</div>
        ) : shown.map((c, i) => (
          <div key={c.id} className="flex items-start gap-3 border-b border-border py-4">
            <span className="display w-7 shrink-0 text-lg text-faint">{pad(i + 1)}</span>
            <div className="min-w-0 flex-1"><p className="text-[15px] leading-7">{c.text}</p>
              <button className="mt-1 text-[11px] text-muted-foreground" onClick={() => { const g = prompt("移动到分组", c.group); if (g?.trim()) up((d) => { const x = d.cards.find((y) => y.id === c.id); if (x) x.group = g.trim(); }); }}># {c.group}</button></div>
            <button onClick={() => up((d) => { d.cards = d.cards.filter((x) => x.id !== c.id); })} aria-label="删除"><Trash2 className="h-4 w-4 text-faint" /></button>
          </div>
        ))}
        {grp !== "全部" && shown.length > 0 && <button className="mt-4 text-xs text-muted-foreground underline" onClick={() => confirm(`删除分组「${grp}」中的全部字卡？`) && up((d) => { d.cards = d.cards.filter((c) => !(c.use === use && c.group === grp)); })}>删除此分组</button>}
      </div>

      <div className="mt-16"><SectionTitle zh="频率" en="RHYTHM" ink /></div>
      <p className="mt-3 text-xs text-muted-foreground">所有字卡共用同一套节奏，每次时间都在区间内随机。</p>

      <div className="mt-6 border border-border p-4">
        <div className="eyebrow">ZONE A · 评论</div>
        <p className="mt-1 text-xs text-muted-foreground">你写下文字或留言后，他多久来页边评论（1–60 分钟）</p>
        <Slider label="最短" value={s.freq.commentMin} min={1} max={60} unit="分钟" onChange={(v) => up((d) => { d.freq.commentMin = Math.min(v, d.freq.commentMax); })} />
        <Slider label="最长" value={s.freq.commentMax} min={1} max={60} unit="分钟" onChange={(v) => up((d) => { d.freq.commentMax = Math.max(v, d.freq.commentMin); })} />
      </div>
      <div className="mt-4 border border-foreground p-4">
        <div className="eyebrow">ZONE B · 回信</div>
        <p className="mt-1 text-xs text-muted-foreground">「想对你说」寄出后，他多久回信（6–24 小时）</p>
        <Slider label="最短" value={s.freq.letterMin} min={6} max={24} unit="小时" onChange={(v) => up((d) => { d.freq.letterMin = Math.min(v, d.freq.letterMax); })} />
        <Slider label="最长" value={s.freq.letterMax} min={6} max={24} unit="小时" onChange={(v) => up((d) => { d.freq.letterMax = Math.max(v, d.freq.letterMin); })} />
      </div>
      <div className="mt-4 border border-border bg-muted/50 p-4">
        <div className="eyebrow">ZONE C · 主动消息</div>
        <Row label="允许他主动发消息"><Switch on={s.chat.proactive} onChange={(v) => up((d) => { d.chat.proactive = v; })} /></Row>
        {s.chat.proactive && <Slider label="冷却时间" value={s.chat.cooldown} min={1} max={60} unit="分钟" onChange={(v) => up((d) => { d.chat.cooldown = v; })} hint="冷却结束后才有可能发生，不一定每次都会" />}
      </div>
    </Sheet>
  );
}
