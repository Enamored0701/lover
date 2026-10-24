import { useRef, useState } from "react";
import { FileUp, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { dedupe, parseAnyJson } from "@/lib/cards";
import { uid } from "@/lib/util";
import { Button } from "@/components/ui/button";

export function PatCards() {
  const { s, up } = useStore();
  const [text, setText] = useState("");
  const [group, setGroup] = useState("默认");
  const [message, setMessage] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const cards = s.cards.filter(c => c.use === "pat");
  return <div className="mt-3">
    <div className="flex items-center justify-between"><span className="text-xs">他的拍一拍字卡 · {cards.length}</span><Button variant="ghost" size="sm" onClick={() => file.current?.click()}><FileUp />导入 JSON</Button></div>
    <input ref={file} hidden type="file" accept=".json,application/json" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; e.target.value = ""; try { const added = parseAnyJson(JSON.parse(await f.text()), "pat", group); up(d => { d.cards = dedupe([...d.cards, ...added]).cards; }); setMessage(`已读取 ${added.length} 张字卡，重复内容已合并`); } catch { setMessage("无法读取这份 JSON 文件"); } }} />
    <input aria-label="拍一拍字卡分组" className="field text-xs" value={group} onChange={e => setGroup(e.target.value)} placeholder="分组" />
    <div className="flex gap-2"><input aria-label="新增拍一拍字卡" className="field text-xs" value={text} onChange={e => setText(e.target.value)} placeholder="动作后缀，例如：，递来一颗星星" /><Button variant="ghost" size="icon" aria-label="添加拍一拍字卡" disabled={!text.trim()} onClick={() => { up(d => { d.cards = dedupe([...d.cards, { id: uid(), use: "pat", group: group || "默认", text: text.trim() }]).cards; }); setText(""); }}><Plus /></Button></div>
    {message && <p role="status" className="my-2 text-xs">{message}</p>}
    <div className="mt-2 max-h-52 overflow-y-auto">{cards.map(c => <div key={c.id} className="flex items-center gap-2 border-b border-border py-2"><span className="min-w-0 flex-1"><span className="block text-[10px] text-muted-foreground">{c.group}</span><input aria-label="拍一拍字卡内容" className="w-full bg-transparent text-xs outline-none" value={c.text} onChange={e => up(d => { const row = d.cards.find(x => x.id === c.id); if (row) row.text = e.target.value; })} /></span><Button variant="ghost" size="icon" aria-label="删除拍一拍字卡" onClick={() => up(d => { d.cards = d.cards.filter(x => x.id !== c.id); })}><Trash2 /></Button></div>)}</div>
  </div>;
}