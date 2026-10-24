import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ImagePlus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { compressImage } from "@/lib/util";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Every picture in PREVIA goes through this: tap to replace with your own image. */
export function EImg({ slot, fallback, className, label, round, children, editable = true }: { slot: string; fallback?: string | undefined; className?: string; label?: string | undefined; round?: boolean; children?: ReactNode; editable?: boolean }) {
  const { s, up } = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const src = s.images[slot] || fallback;
  return (
    <div
      className={cn("relative overflow-hidden bg-muted", round && "rounded-full", editable && "cursor-pointer", className)}
      onClick={(e) => { if (!editable) return; e.stopPropagation(); ref.current?.click(); }}
    >
      {src ? <img src={src} alt={label ?? ""} className="h-full w-full object-cover" /> : (
        <div className="ph flex h-full w-full items-center justify-center">
          <span className="eyebrow flex items-center gap-1"><ImagePlus className="h-3 w-3" />{label ?? "IMAGE"}</span>
        </div>
      )}
      {children}
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const url = await compressImage(f);
        up((d) => { d.images[slot] = url; });
        e.target.value = "";
      }} />
    </div>
  );
}

export function Avatar({ who, size = 44, className, editable = false }: { who: "me" | "him"; size?: number; className?: string; editable?: boolean }) {
  const { s } = useStore();
  const name = who === "me" ? s.profile.me : s.profile.him;
  return (
    <div style={{ width: size, height: size }} className={cn("shrink-0", className)}>
      <EImg slot={`avatar-${who}`} editable={editable} round className="h-full w-full border border-border" label="">
        {!s.images[`avatar-${who}`] && <span className="serif absolute inset-0 flex items-center justify-center bg-foreground text-background" style={{ fontSize: size * 0.4 }}>{name.slice(0, 1)}</span>}
      </EImg>
    </div>
  );
}

export function Header({ title, sub, onBack, right }: { title: string; sub?: string | undefined; onBack?: (() => void) | undefined; right?: ReactNode }) {
  return null;
}

export function Eyebrow({ left, right, className }: { left: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <span className="eyebrow">{left}</span>
      {right && <span className="eyebrow-i">{right}</span>}
    </div>
  );
}

export function SectionTitle({ zh, en: _en, ink }: { zh: string; en: string; ink?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between pb-3", ink ? "border-b border-foreground" : "border-b border-border")}>
      <h2 className="serif text-base font-semibold">{zh}</h2>
    </div>
  );
}

export function Sheet({ open, onClose, title, sub, children, right }: { open: boolean; onClose: () => void; title: string; sub?: string | undefined; children: ReactNode; right?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background fade-up">
      <div className="sheet-content flex-1 overflow-y-auto"><div className="mx-auto max-w-xl px-5 pb-10 pt-5"><div className="mb-5 flex items-center gap-3"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="返回"><ChevronLeft className="h-4 w-4" /></Button><h1 className="serif min-w-0 flex-1 text-base">{title}</h1>{right}</div>{children}</div></div>
    </div>
  );
}

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/30 sm:items-center" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto bg-background p-5 fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <span className="serif text-lg font-semibold">{title}</span>
          <button onClick={onClose} aria-label="关闭"><X className="h-5 w-5" strokeWidth={1.4} /></button>
        </div>
        {children}
      </div>
    </div>, document.body
  );
}

export function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <Button type="button" variant="ghost" disabled={disabled} aria-label={label} onClick={() => onChange(!on)} className={cn("relative h-6 w-11 shrink-0 rounded-none border p-0 transition-colors", on ? "border-foreground bg-foreground" : "border-input bg-transparent")} aria-pressed={on}>
      <span className={cn("absolute top-0.5 h-4 w-4 transition-all", on ? "left-[22px] bg-background" : "left-0.5 bg-faint")} />
    </Button>
  );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3">
      <div className="min-w-0"><div className="text-[13px]">{label}</div>{hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, unit, onChange, hint }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="border-b border-border py-3">
      <div className="flex items-baseline justify-between"><span className="text-[13px]">{label}</span><span className="display text-xl">{value}<span className="ml-1 text-xs text-muted-foreground">{unit}</span></span></div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      <input type="range" className="range mt-3" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="flex justify-between text-[10px] text-faint"><span>{min}{unit}</span><span>{max}{unit}</span></div>
    </div>
  );
}

export function Block({ no: _no, en: _en, zh, children }: { no: string; en: string; zh: string; children: ReactNode }) {
  return (
    <section className="mb-4">
      <h2 className="serif text-sm font-medium">{zh}</h2>
      <div className="mt-3 rule-ink" />
      <div>{children}</div>
    </section>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="py-14 text-center"><div className="display text-4xl text-faint">—</div><p className="mt-2 text-sm text-muted-foreground">{text}</p></div>;
}
