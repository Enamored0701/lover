import { addDays, diffDays } from "./util";

/** Group marked days into consecutive blocks. */
export function blocks(days: string[]): string[][] {
  const s = [...new Set(days)].sort();
  const out: string[][] = [];
  for (const d of s) {
    const last = out[out.length - 1];
    if (last && diffDays(last[last.length - 1]!, d) <= 2) last.push(d);
    else out.push([d]);
  }
  return out;
}

export interface Prediction {
  cycle: number; len: number; lastStart: string | null; next: string | null;
  ovulation: string | null; periodDays: Set<string>; fertileDays: Set<string>; ovuDays: Set<string>;
}

export function predict(days: string[], defCycle = 28, defLen = 5, cyclesAhead = 3): Prediction {
  const b = blocks(days);
  const starts = b.map((x) => x[0]);
  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const g = diffDays(starts[i - 1]!, starts[i]!);
    if (g >= 15 && g <= 60) gaps.push(g);
  }
  const cycle = gaps.length ? Math.round(gaps.reduce((a, c) => a + c, 0) / gaps.length) : defCycle;
  const lens = b.map((x) => diffDays(x[0]!, x[x.length - 1]!) + 1).filter((l) => l <= 10);
  const len = lens.length ? Math.round(lens.reduce((a, c) => a + c, 0) / lens.length) : defLen;
  const res: Prediction = { cycle, len, lastStart: null, next: null, ovulation: null, periodDays: new Set(), fertileDays: new Set(), ovuDays: new Set() };
  if (!starts.length) return res;
  const lastStart = starts[starts.length - 1]!;
  res.lastStart = lastStart;
  for (let k = 0; k <= cyclesAhead; k++) {
    const st = addDays(lastStart, cycle * k);
    const ov = addDays(st, cycle - 14);
    res.ovuDays.add(ov);
    for (let i = -5; i <= 1; i++) res.fertileDays.add(addDays(ov, i));
    if (k > 0) {
      for (let i = 0; i < len; i++) res.periodDays.add(addDays(st, i));
      if (k === 1) res.next = st;
    }
    if (k === 0) res.ovulation = ov;
  }
  return res;
}
