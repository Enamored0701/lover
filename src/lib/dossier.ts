export const DOSSIER_PRESETS = {
  sentinel: { title: "哨向档案", tag: "哨兵 / 向导", labels: ["感知", "精神力", "耐力", "共鸣", "控制", "协调"], values: [72, 84, 60, 90, 65, 78], fields: { 身份: "向导", 所属: "白塔", 精神体: "白鹿", 等级: "A级" } },
  campus: { title: "青春校园", tag: "同窗 / 青春", labels: ["专注", "表达", "运动", "创造", "亲和", "勇气"], values: [80, 65, 72, 86, 90, 68], fields: { 身份: "学生", 所属: "高二三班", 社团: "文学社", 心愿: "一起走过夏天" } },
  personality: { title: "性格侧写", tag: "性格 / 关系", labels: ["外向", "理性", "敏感", "自律", "好奇", "独立"], values: [45, 80, 76, 68, 90, 72], fields: { 性格类型: "", 核心信念: "", 安全感来源: "", 表达方式: "" } },
  ancient: { title: "古代线", tag: "古代 / 人物志", labels: ["谋略", "武艺", "学识", "声望", "胆识", "仁心"], values: [82, 60, 88, 65, 73, 90], fields: { 朝代: "", 身份: "", 门派: "", 字号: "", 生平: "" } },
};
export type DossierPreset = keyof typeof DOSSIER_PRESETS;
const SECONDARY: Record<DossierPreset, { title: string; labels: string[]; values: number[]; checks: string[] }> = {
  sentinel: { title: "联结与精神域", labels: ["信任", "契合", "屏障", "安抚", "稳定", "联结"], values: [88, 75, 62, 94, 70, 82], checks: ["已觉醒", "精神体可见", "建立联结", "可独立出勤"] },
  campus: { title: "校园生活", labels: ["友情", "社团", "学业", "行动", "感性", "梦想"], values: [90, 60, 82, 70, 88, 95], checks: ["住校", "参与社团", "担任班委", "有未寄出的信"] },
  personality: { title: "亲密关系", labels: ["信任", "依恋", "共情", "坦诚", "边界", "包容"], values: [60, 88, 90, 55, 75, 85], checks: ["慢热", "喜欢独处", "习惯主动", "重视承诺"] },
  ancient: { title: "江湖与朝堂", labels: ["权谋", "医术", "骑射", "琴艺", "忠义", "机缘"], values: [70, 48, 85, 92, 80, 65], checks: ["入仕", "习武", "行医", "隐居"] },
};
export function clampStat(value: number) { return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0)); }
export function dossierFields(preset: DossierPreset): Record<string, string> {
  const p = DOSSIER_PRESETS[preset];
  const secondary = SECONDARY[preset];
  return { ...p.fields, "meta-preset": preset, "meta-groups": "2", "group-0-title": p.title, "group-1-title": secondary.title,
    ...Object.fromEntries(p.labels.flatMap((label, i) => [[`label-${i}`, label], [`stat-${i}`, String(p.values[i])]])),
    ...Object.fromEntries(secondary.labels.flatMap((label, i) => [[`g1-label-${i}`, label], [`g1-stat-${i}`, String(secondary.values[i])]])),
    ...Object.fromEntries(secondary.checks.map((label, i) => [`check-${i}-label`, label])), "meta-checks": String(secondary.checks.length) };
}
export function statKey(group: number, kind: "label" | "stat", i: number) { return `${group ? `g${group}-` : ""}${kind}-${i}`; }
export function isDossierMeta(key: string) { return /^(meta-|group-|g\d+-(label|stat)-|label-|stat-|check-)/.test(key); }