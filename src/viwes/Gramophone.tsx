import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, FileUp, Music2, Pause, Play, SkipBack, SkipForward, Trash2, Upload, Repeat, Repeat1, Shuffle, UserPlus, LogOut, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, EImg, Sheet, Row, Switch } from "@/components/kit";
import { useStore } from "@/lib/store";
import { parseTracks } from "@/lib/music";
import { readFile, uid } from "@/lib/util";
import { pauseForNavigation } from "@/lib/playback";
import { useServerFn } from "@tanstack/react-start";
import { neteaseLyrics } from "@/lib/netease.functions";
import { parseLyrics, lyricIndex, neteaseSongId, type LyricLine } from "@/lib/lyrics";
import { neteaseFetch } from "@/lib/netease.functions";
import type { Track } from "@/lib/types";
import { advanceTrack } from "@/lib/listening";

export function Gramophone() {
  const { s, up, view } = useStore();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [entry, setEntry] = useState<HTMLElement | null>(null);
  const [partnerText, setPartnerText] = useState("");
  const [pending, setPending] = useState(false);
  const [musicU, setMusicU] = useState("");
  const [lyricLines, setLyricLines] = useState<LyricLine[]>([]);
  const [lyricMessage, setLyricMessage] = useState("");
  const fetchLyrics = useServerFn(neteaseLyrics);
  const playlist = useRef<HTMLDivElement>(null);
  const session = s.music.shared;
  const mode = s.music.mode;
  const commandSeen = useRef(0);
  const audio = useRef<HTMLAudioElement>(null);
  const files = useRef<HTMLInputElement>(null);
  const json = useRef<HTMLInputElement>(null);
  const tracks = s.music.tracks;
  const track = tracks[index];
  const link = s.music.playlistLink;
  const validLink = /^https:\/\/(music\.163\.com|y\.music\.163\.com)\//.test(link);
  useEffect(() => { setEntry(document.getElementById("gramophone-entry")); if (view !== "chat") setOpen(false); }, [view]);
  useEffect(() => { up(d => { d.music.listening = playing; }); }, [playing, up]);
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => { setPending(false); if (Math.random() < 0.8) { up(d => { d.music.shared = true; delete d.music.invite; }); setPartnerText("已加入一起听"); } else setPartnerText("暂时未接受邀请"); }, 2000 + Math.random() * 4000);
    return () => clearTimeout(timer);
  }, [pending, up]);
  useEffect(() => { if (pauseForNavigation(s.playback.crossPage, view)) { audio.current?.pause(); setPlaying(false); } }, [s.playback.crossPage, view]);
  useEffect(() => {
    const command = s.music.command;
    if (!command || command.at === commandSeen.current) return;
    commandSeen.current = command.at;
    if (!playing) return;
    setPartnerText(command.text);
    if (command.kind === "pause") { audio.current?.pause(); setPlaying(false); }
    else if (tracks.length > 1) setIndex(i => advanceTrack(i, tracks.length, mode));
  }, [s.music.command, playing, tracks.length, mode]);
  useEffect(() => {
    if (!("mediaSession" in navigator) || !("MediaMetadata" in window)) return;
    if (!s.playback.mediaControls || !track || !session) { navigator.mediaSession.metadata = null; return; }
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist || "PREVIA" });
    navigator.mediaSession.setActionHandler("play", () => { void audio.current?.play().catch(() => setError("请回到留声机继续播放。")); });
    navigator.mediaSession.setActionHandler("pause", () => audio.current?.pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => { if (tracks.length) setIndex(i => advanceTrack(i, tracks.length, mode)); });
    navigator.mediaSession.setActionHandler("previoustrack", () => { if (tracks.length) setIndex(i => (i - 1 + tracks.length) % tracks.length); });
    return () => { for (const action of ["play", "pause", "nexttrack", "previoustrack"] as const) navigator.mediaSession.setActionHandler(action, null); navigator.mediaSession.metadata = null; };
  }, [track, tracks.length, s.playback.mediaControls, mode, session]);
  useEffect(() => { if (index >= tracks.length) setIndex(0); }, [tracks.length, index]);
  useEffect(() => {
    setProgress(0); setDuration(0);
    if (playing && track) audio.current?.play().catch(() => { setPlaying(false); setError("这首歌暂时无法播放，请检查音频链接或更换文件。"); });
  }, [track?.id]);
  useEffect(() => {
    const id = track ? neteaseSongId(track.src) : null;
    setLyricLines([]); setLyricMessage("");
    if (!id || !open) return;
    let cancelled = false;
    setLyricMessage("正在读取歌词…");
    void fetchLyrics({ data: { id, musicU: musicU.trim().replace(/^.*MUSIC_U=/, "").replace(/;.*$/, "") } }).then(r => { if (cancelled) return; const lines = parseLyrics(r.lyric); setLyricLines(lines); setLyricMessage(r.ok ? lines.length ? "" : "纯音乐或暂无歌词" : r.error); }).catch(() => { if (!cancelled) setLyricMessage("歌词未能读取，请稍后重试。"); });
    return () => { cancelled = true; };
  }, [track?.src, musicU, open, fetchLyrics]);
  const toggle = async () => {
    if (!session) { setPartnerText("请先邀请对方一起听"); return; }
    if (!track || !audio.current) return;
    if (playing) { audio.current.pause(); setPlaying(false); return; }
    try { await audio.current.play(); setPlaying(true); setError(""); } catch { setError("这首歌暂时无法播放，请检查音频链接或更换文件。"); }
  };
  const next = (step: number) => { if (tracks.length) setIndex(i => step > 0 ? advanceTrack(i, tracks.length, mode) : (i - 1 + tracks.length) % tracks.length); };
  const leave = () => { audio.current?.pause(); setPlaying(false); setPending(false); setPartnerText(""); up(d => { d.music.shared = false; d.music.listening = false; delete d.music.command; }); };
  const finishTrack = () => { const nextIndex = advanceTrack(index, tracks.length, mode, true); if (nextIndex === index && audio.current) { audio.current.currentTime = 0; void audio.current.play().catch(() => setPlaying(false)); } else setIndex(nextIndex); };
  const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  return <>
    <audio ref={audio} src={track?.src} onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={finishTrack} onError={() => { setPlaying(false); setError("音频无法读取，请更换文件或链接。"); }} />
    {entry && createPortal(<Button variant="ghost" onClick={() => setOpen(true)} className="my-3 grid h-auto w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-none border-y border-border px-0 py-4 text-left">
      <span className="record-mini"><RecordIcon spinning={playing} className="h-10! w-10!" /></span>
      <span className="min-w-0"><span className="block serif text-base">留声机</span><span className="block truncate text-xs font-normal text-muted-foreground">{track ? `${playing ? "正在听 · " : ""}${track.title}` : "一起收听"}</span></span>
      <span className="eyebrow">{String(tracks.length).padStart(2, "0")} <Music2 className="ml-1 inline" /></span>
    </Button>, entry)}
    {s.music.invite && <div className="listening-invite fixed inset-x-4 bottom-20 z-[55] mx-auto max-w-sm border border-border bg-background p-4"><p className="text-xs text-muted-foreground">{s.profile.him} · 一起听</p><p className="serif my-2 text-sm">{s.music.invite.text}</p><div className="flex gap-2"><Button size="sm" onClick={() => { const selected = tracks.findIndex(t => t.id === s.music.invite?.trackId); if (selected >= 0) setIndex(selected); setPending(false); setOpen(true); up(d => { d.music.shared = true; delete d.music.invite; }); }}>接受邀请 <Play /></Button><Button size="sm" variant="ghost" onClick={() => up(d => { delete d.music.invite; })}>稍后</Button></div></div>}
    {playing && view !== "chat" && !open && <div className="fixed bottom-20 right-4 z-30 flex max-w-[80%] items-center border border-border bg-background"><Button variant="ghost" className="min-w-0" onClick={() => setOpen(true)}><RecordIcon spinning className="h-5 w-5" /><span className="truncate">{track?.title}</span></Button><Button variant="ghost" size="icon" aria-label="暂停一起听" onClick={() => { audio.current?.pause(); setPlaying(false); }}><Pause /></Button></div>}
    {open && <Sheet open onClose={() => setOpen(false)} title="一起听" right={session && <Button variant="ghost" size="icon" title="结束一起听" aria-label="结束一起听" onClick={leave}><LogOut /></Button>}>
      <div className="listening-stage"><div className="listening-people"><div><div className="listener-avatar"><Avatar who="me" size={44} /></div>{s.profile.me}</div><span className="display text-xl">{session ? "♡" : "· · ·"}</span><div className={session ? "" : "opacity-40"}><div className="listener-avatar"><Avatar who="him" size={44} /></div>{s.profile.him}</div></div>
      <div className="gramophone-deck">
        <div className={`vinyl-record ${playing ? "record-spinning" : ""}`}><EImg slot="music-label" className="vinyl-label rounded-full" label="" /></div>
        <div className="record-tonearm" />
      </div>
      <div className="flex justify-center">{session ? <span className="text-[11px]">正在与 {s.profile.him} 一起听</span> : <Button variant="outline" size="sm" disabled={pending || !tracks.length} onClick={() => { setPending(true); setPartnerText(""); }}><UserPlus />{pending ? "等待他接受…" : `邀请${s.profile.him}一起听`}</Button>}</div></div>
      <h2 className="serif text-center text-xl">{track?.title || "为今夜留一首歌"}</h2><p className="mt-1 text-center text-xs text-muted-foreground">{track?.artist || "SIDE A · PREVIA"}</p>
      <div className="mt-4"><input aria-label="播放进度" type="range" className="range" min={0} max={Number.isFinite(duration) ? duration : 0} value={progress} disabled={!duration} onChange={(e) => { if (audio.current) audio.current.currentTime = Number(e.target.value); setProgress(Number(e.target.value)); }} /><div className="flex justify-between text-[10px] text-faint"><span>{clock(progress)}</span><span>{clock(Number.isFinite(duration) ? duration : 0)}</span></div></div>
      <div className="my-4 grid grid-cols-[32px_32px_48px_32px_32px] items-center justify-center gap-3"><Button variant="ghost" size="icon" title={mode === "loop" ? "列表循环" : mode === "shuffle" ? "随机播放" : "单曲循环"} aria-label={mode === "loop" ? "列表循环" : mode === "shuffle" ? "随机播放" : "单曲循环"} onClick={() => up(d => { d.music.mode = mode === "loop" ? "shuffle" : mode === "shuffle" ? "single" : "loop"; })}>{mode === "loop" ? <Repeat /> : mode === "shuffle" ? <Shuffle /> : <Repeat1 />}</Button><Button variant="ghost" size="icon" aria-label="上一首" disabled={!track || !session} onClick={() => next(-1)}><SkipBack /></Button><Button size="icon" className="h-12 w-12 rounded-full" aria-label={playing ? "暂停" : "播放"} disabled={!track || !session} onClick={toggle}>{playing ? <Pause /> : <Play />}</Button><Button variant="ghost" size="icon" aria-label="下一首" disabled={!track || !session} onClick={() => next(1)}><SkipForward /></Button><Button variant="ghost" size="icon" className="h-8 w-8" title="播放列表" aria-label="播放列表" onClick={() => playlist.current?.scrollIntoView({ behavior: "smooth", block: "start" })}><ListMusic /></Button></div>
      {(lyricLines.length > 0 || lyricMessage) && <section aria-label="网易云歌词" className="my-4 min-h-20 border-y border-border py-3 text-center">{lyricLines.length ? lyricLines.slice(Math.max(0, lyricIndex(lyricLines, progress) - 1), Math.max(0, lyricIndex(lyricLines, progress) - 1) + 3).map((l, i) => <p key={`${l.at}-${i}`} className={l.at === lyricLines[lyricIndex(lyricLines, progress)]?.at ? "serif py-1 text-sm text-foreground" : "py-1 text-xs text-muted-foreground"}>{l.text}</p>) : <p role="status" className="text-xs text-muted-foreground">{lyricMessage}</p>}</section>}
      {error && <p role="alert" className="my-3 text-xs text-destructive">{error}</p>}
      {partnerText && <p className="serif my-3 border-l border-foreground pl-3 text-sm">{s.profile.him}：{partnerText}</p>}
      <Row label="允许他邀请、暂停与切歌"><Switch on={s.music.partner} onChange={v => up(d => { d.music.partner = v; })} /></Row>
      <div ref={playlist} className="flex scroll-mt-16 items-center justify-between border-b border-foreground py-3"><h3 className="serif text-lg">我们的唱片</h3><div className="flex gap-1"><Button variant="ghost" size="icon" title="添加音频" aria-label="添加音频" onClick={() => files.current?.click()}><Upload /></Button><Button variant="ghost" size="icon" title="导入歌单文件" aria-label="导入歌单文件" onClick={() => json.current?.click()}><FileUp /></Button></div></div>
      {tracks.map((t, i) => <div key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-border"><Button variant="ghost" className="h-auto min-w-0 justify-start rounded-none px-0 py-3" onClick={() => { setIndex(i); if (!session) return; if (i === index) void toggle(); else setPlaying(true); }}><span className="display w-6 shrink-0 text-faint">{String(i + 1).padStart(2, "0")}</span><span className="min-w-0 truncate">{t.title}</span>{index === i && playing && <Music2 />}</Button><Button variant="ghost" size="icon" aria-label={`移除 ${t.title}`} onClick={() => { if (index === i) { audio.current?.pause(); setPlaying(false); } up((d) => { d.music.tracks = d.music.tracks.filter((x) => x.id !== t.id); }); }}><Trash2 /></Button></div>)}
      <input ref={files} hidden type="file" accept="audio/*" multiple onChange={async (e) => { const fs = Array.from(e.target.files || []); e.target.value = ""; try { const added = await Promise.all(fs.map(async (f) => ({ id: uid(), title: f.name.replace(/\.[^.]+$/, ""), artist: "", src: await readFile(f) }))); up((d) => { d.music.tracks.push(...added); }); } catch { setError("音频未能导入，请重试。"); } }} />
      <input ref={json} hidden type="file" accept=".json" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; e.target.value = ""; try { const added = parseTracks(JSON.parse(await f.text())); if (!added.length) { setError("歌单中没有找到可播放的 HTTPS 音频地址。"); return; } up((d) => { d.music.tracks.push(...added); }); setError(""); } catch { setError("无法读取这份歌单文件。"); } }} />
      <NeteaseImport musicU={musicU} onMusicU={setMusicU} link={link} validLink={validLink} onLink={(v) => up((d) => { d.music.playlistLink = v; })} onAdd={(added) => up((d) => { const have = new Set(d.music.tracks.map(t => t.src)); d.music.tracks.push(...added.filter(t => !have.has(t.src))); })} />
    </Sheet>}
  </>;
}

/** Engraved gramophone emblem with a scalloped record and botanical horn. */
export function RecordIcon({ spinning, className }: { spinning?: boolean; className?: string }) {
  return <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth=".8" aria-hidden="true">
    <path d="M12 49h40l3 6H9zM15 55v3m34-3v3" />
    <ellipse cx="31" cy="47" rx="17" ry="3.5" />
    <g className={spinning ? "record-emblem-spinning" : ""}>
      <circle cx="28" cy="34" r="13" /><circle cx="28" cy="34" r="10.5" strokeDasharray=".5 1.5" /><circle cx="28" cy="34" r="7.5" /><circle cx="28" cy="34" r="2" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d="M28 20c-2-2-2-3 0-4 2 1 2 2 0 4" transform={`rotate(${i * 45} 28 34)`} />)}
    </g>
    <path d="M39 45V30c0-5 4-7 7-10M45 21c-4-1-7-3-8-6l-4-8c8-3 18-2 23 4l-5 7c-2 3-4 4-6 3z" />
    <path d="M33 7c5 5 13 7 23 4M39 9l5 11m1-10 3 10m-10-4c5 2 10 3 15 1" strokeWidth=".5" />
    <path d="M6 23h5m-2-2v4M55 34h4m-2-2v4" /><path d="M9 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
  </svg>;
}

function NeteaseImport({ musicU, onMusicU, link, validLink, onLink, onAdd }: { musicU: string; onMusicU: (v: string) => void; link: string; validLink: boolean; onLink: (v: string) => void; onAdd: (t: Track[]) => void }) {
  const callNetease = useServerFn(neteaseFetch);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [lists, setLists] = useState<{ id: string; name: string; count: number }[]>([]);
  const clean = (v: string) => v.trim().replace(/^.*MUSIC_U=/, "").replace(/;.*$/, "");
  const importId = async (id: string) => {
    setBusy(true); setMsg("正在读取歌单…");
    try {
      const r = await callNetease({ data: { musicU: clean(musicU), action: "playlist", id } });
      if (!r.ok) { setMsg(r.error); return; }
      onAdd(r.tracks.map(t => ({ id: uid(), title: t.title, artist: t.artist, src: `https://music.163.com/song/media/outer/url?id=${t.id}.mp3` })));
      setMsg(`已导入「${"name" in r ? r.name : ""}」${r.tracks.length} 首。会员专属歌曲可能无法播放。`);
    } catch { setMsg("暂时连不上网易云，请稍后再试。"); } finally { setBusy(false); }
  };
  const loadMine = async () => {
    setBusy(true); setMsg("正在登录网易云…");
    try {
      const r = await callNetease({ data: { musicU: clean(musicU), action: "playlists" } });
      if (!r.ok) { setMsg(r.error); return; }
      setLists(r.playlists); setMsg(`${"nickname" in r ? r.nickname : ""}，选一张歌单导入吧。`);
    } catch { setMsg("暂时连不上网易云，请稍后再试。"); } finally { setBusy(false); }
  };
  const linkId = link.match(/[?&]id=(\d+)/)?.[1] ?? link.match(/playlist\/(\d+)/)?.[1];
  return (
    <div className="mt-5 border-t border-border pt-4">
      <span className="eyebrow">网易云音乐</span>
      <input aria-label="MUSIC_U" type="password" autoComplete="off" className="field mt-2 text-sm" placeholder="粘贴 MUSIC_U" value={musicU} onChange={(e) => onMusicU(e.target.value)} />
      <Button className="mt-2 w-full" disabled={busy || !clean(musicU)} onClick={loadMine}>登录并读取我的歌单</Button>
      {lists.length > 0 && <div className="mt-2 max-h-56 overflow-y-auto border-y border-border">{lists.map(l => <Button key={l.id} variant="ghost" disabled={busy} className="h-auto w-full justify-between rounded-none border-b border-border px-0 py-3 last:border-0" onClick={() => importId(l.id)}><span className="truncate">{l.name}</span><span className="text-xs text-muted-foreground">{l.count}</span></Button>)}</div>}
      <input aria-label="网易云歌单链接" className="field mt-4 text-sm" placeholder="或粘贴歌单链接 https://music.163.com/…" value={link} onChange={(e) => onLink(e.target.value)} />
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="px-0" disabled={busy || !linkId} onClick={() => linkId && importId(linkId)}>导入这个歌单 <FileUp /></Button>
        {validLink && <Button variant="link" asChild className="px-0"><a href={link} target="_blank" rel="noopener noreferrer">在网易云打开 <ExternalLink /></a></Button>}
      </div>
      {msg && <p role="status" className="mt-1 text-xs leading-5 text-muted-foreground">{msg}</p>}
      <p className="mt-2 text-[11px] leading-5 text-faint">MUSIC_U 只在这次读取时使用，不会被保存。</p>
    </div>
  );
}