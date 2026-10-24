import { EImg } from "@/components/kit";
import { useStore } from "@/lib/store";
import { ymd } from "@/lib/util";

export function SettingDossier() {
  const { s, up } = useStore();
  const record = s.world.lore.find(e => e.id === "pair-dossier");
  const update = (key: string, value: string) => up(d => {
    let entry = d.world.lore.find(e => e.id === "pair-dossier");
    if (!entry) { entry = { id: "pair-dossier", title: "两个人的设定", text: "", tag: "", date: ymd(new Date()), at: Date.now(), fields: {} }; d.world.lore.unshift(entry); }
    entry.fields = { ...entry.fields, [key]: value };
  });
  return <section className="dossier-paper mt-4">
    <div className="dossier-portraits">
      <span className="dossier-star">✧</span>
      {(["him", "me"] as const).map(who => <div key={who} className={`dossier-photo dossier-photo-${who}`}><EImg slot={`setting-photo-${who}`} fallback={s.images[`avatar-${who}`]} className="aspect-[3/4] w-full grayscale" label="" /></div>)}
    </div>
    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-8">
      {(["him", "me"] as const).map(who => <div key={who} className="min-w-0 text-center">
        <h2 className="serif border-y border-border py-3 text-lg tracking-wide">{who === "me" ? s.profile.me : s.profile.him}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3"><input aria-label={`${who === "me" ? "我的" : "他的"}年龄`} className="field min-w-0 text-center text-xs" placeholder="年龄" value={record?.fields?.[`${who}-age`] || ""} onChange={e => update(`${who}-age`, e.target.value)} /><input aria-label={`${who === "me" ? "我的" : "他的"}身高`} className="field min-w-0 text-center text-xs" placeholder="身高" value={record?.fields?.[`${who}-height`] || ""} onChange={e => update(`${who}-height`, e.target.value)} /></div>
        <input aria-label={`${who === "me" ? "我的" : "他的"}身份`} className="field mt-3 text-center text-xs" placeholder="身份 / 标签" value={record?.fields?.[`${who}-role`] || ""} onChange={e => update(`${who}-role`, e.target.value)} />
        <textarea aria-label={`${who === "me" ? "我的" : "他的"}设定`} className="dossier-text mt-5 min-h-32 w-full resize-y border-y border-border bg-transparent px-1 py-3 text-center text-xs leading-7 outline-none" placeholder="写下他/她的样子…" value={record?.fields?.[`${who}-bio`] || ""} onChange={e => update(`${who}-bio`, e.target.value)} />
        <textarea aria-label={`${who === "me" ? "我的" : "他的"}一句话`} className="mt-4 min-h-14 w-full resize-none bg-transparent text-center font-serif text-xs italic leading-6 outline-none" placeholder="一句话留白…" value={record?.fields?.[`${who}-quote`] || ""} onChange={e => update(`${who}-quote`, e.target.value)} />
      </div>)}
    </div>
    <div className="mt-8 border-t border-foreground pt-4"><span className="eyebrow">BETWEEN US</span><textarea aria-label="共同设定" className="mt-3 min-h-28 leading-7 w-full resize-y bg-transparent text-xs leading-6 outline-none" placeholder="像海与岸，一次次相遇…" value={record?.fields?.["together"] || ""} onChange={e => update("together", e.target.value)} /></div>
  </section>;
}