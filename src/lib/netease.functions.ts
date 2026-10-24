import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  musicU: z.string().trim().max(4000).regex(/^[A-Za-z0-9_\-.%=+/]*$/, "MUSIC_U 格式不正确"),
  action: z.enum(["playlists", "playlist"]),
  id: z.string().regex(/^\d{1,20}$/).optional(),
});

async function call(path: string, musicU: string, body?: Record<string, string>) {
  const res = await fetch(`https://music.163.com${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Referer: "https://music.163.com/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      Cookie: `os=pc; appver=2.10.13${musicU ? `; MUSIC_U=${musicU}` : ""}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(body ? { body: new URLSearchParams(body).toString() } : {}),
  });
  if (!res.ok) throw new Error(`网易云返回 ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

/** Uses the pasted MUSIC_U only for this request; it is never stored on the server. */
export const neteaseFetch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    if (data.action === "playlists") {
      const acc = await call("/api/nuser/account/get", data.musicU) as { account?: { id?: number }; profile?: { nickname?: string } };
      const uid = acc.account?.id;
      if (!uid) return { ok: false as const, error: "MUSIC_U 无效或已过期，请重新复制。", playlists: [], tracks: [] };
      const pl = await call(`/api/user/playlist?uid=${uid}&limit=100&offset=0`, data.musicU) as { playlist?: { id: number; name: string; trackCount: number }[] };
      return { ok: true as const, nickname: acc.profile?.nickname ?? "", playlists: (pl.playlist ?? []).map((p) => ({ id: String(p.id), name: p.name, count: p.trackCount })), tracks: [] };
    }
    if (!data.id) return { ok: false as const, error: "缺少歌单编号", playlists: [], tracks: [] };
    const detail = await call("/api/v6/playlist/detail", data.musicU, { id: data.id, n: "1000" }) as { code?: number; playlist?: { name?: string; trackIds?: { id: number }[] } };
    if (detail.code !== 200 || !detail.playlist) return { ok: false as const, error: "没有读到这个歌单（可能是私密歌单，需要有效的 MUSIC_U）。", playlists: [], tracks: [] };
    const ids = (detail.playlist.trackIds ?? []).map((t) => t.id).slice(0, 1000);
    const tracks: { id: string; title: string; artist: string }[] = [];
    for (let i = 0; i < ids.length; i += 400) {
      const c = JSON.stringify(ids.slice(i, i + 400).map((id) => ({ id })));
      const r = await call("/api/v3/song/detail", data.musicU, { c }) as { songs?: { id: number; name: string; ar?: { name: string }[] }[] };
      for (const s of r.songs ?? []) tracks.push({ id: String(s.id), title: s.name, artist: (s.ar ?? []).map((a) => a.name).join(" / ") });
    }
    return { ok: true as const, name: detail.playlist.name ?? "", playlists: [], tracks };
  });

export const neteaseLyrics = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.pick({ musicU: true, id: true }).parse(data))
  .handler(async ({ data }) => {
    if (!data.id) return { ok: false, lyric: "", translation: "", error: "缺少歌曲编号" };
    try {
      const result = await call(`/api/song/lyric?id=${data.id}&lv=-1&tv=-1&kv=-1`, data.musicU) as { code?: number; lrc?: { lyric?: string }; tlyric?: { lyric?: string }; nolyric?: boolean };
      if (result.code !== 200) return { ok: false, lyric: "", translation: "", error: "暂时无法读取歌词，请重试或重新粘贴 MUSIC_U。" };
      return { ok: true, lyric: result.lrc?.lyric ?? "", translation: result.tlyric?.lyric ?? "", error: "" };
    } catch { return { ok: false, lyric: "", translation: "", error: "暂时连不上网易云，请稍后再试。" }; }
  });
