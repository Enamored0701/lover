import { predict } from "./period";
import { addDays, diffDays } from "./util";
import type { State } from "./types";

export const RARE_CHANCE = 0.05;
/** A fresh, higher probability is drawn for each ordinary eligible window. */
export const ordinaryChance = () => Math.random() < 0.4 + Math.random() * 0.5;
export function careTargets(period: State["period"], today: string): { date: string; group: string }[] {
  const p = predict(period.days, period.cycle, period.len, Math.max(3, Math.ceil(Math.max(0, pAge(period.days, today)) / Math.max(1, period.cycle)) + 2));
  const targets: { date: string; group: string }[] = [];
  const actual = period.days.includes(today);
  if (actual) targets.push({ date: today, group: "经期中" });
  else if (p.periodDays.has(today)) targets.push({ date: today, group: "预测经期" });
  else {
    for (let i = 1; i <= 3; i++) {
      const date = addDays(today, i);
      if (p.periodDays.has(date)) { targets.push({ date, group: "预测经期" }); break; }
    }
  }
  if (!actual) {
    if (p.ovuDays.has(today)) targets.push({ date: today, group: "预测排卵期" });
    else if (p.ovuDays.has(addDays(today, 1))) targets.push({ date: addDays(today, 1), group: "预测排卵期" });
    if (p.fertileDays.has(today)) targets.push({ date: today, group: "易孕期" });
  }
  return targets;
}
function pAge(days: string[], today: string) {
  const last = [...days].sort().at(-1);
  return last ? diffDays(last, today) : 0;
}