import parse from "css-tree/parser";
import generate from "css-tree/generator";
import walk from "css-tree/walker";

export const BUBBLE_TEMPLATE = `.bubble-me {
  background: var(--foreground);
  color: var(--background);
  border-radius: 16px 3px 16px 16px;
}
.bubble-him {
  background: var(--card);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: 3px 16px 16px 16px;
}`;

const allowed = /^(background(-color|-image)?|color|border(-radius|-color|-style|-width|-(top|bottom|left|right)(-left-radius|-right-radius|-color|-style|-width)?)?|box-shadow|padding(-(top|bottom|left|right))?|font-(family|size|weight|style)|line-height|letter-spacing|text-shadow|opacity)$/;
const aliases: Record<string, string> = {
  ".bubble-me": ".bub-me", ".bubble-him": ".bub-him", ".bub-me": ".bub-me", ".bub-him": ".bub-him",
  ".outgoing .bubble": ".bub-me", ".incoming .bubble": ".bub-him",
  ".message-sent .bubble": ".bub-me", ".message-received .bubble": ".bub-him",
};

/** User CSS is limited to bubble appearance; layout stays owned by the chat. */
export function compileBubbleCss(css: string, scope = "live"): { css: string; error: string } {
  if (!css.trim()) return { css: "", error: "" };
  try {
    const ast = parse(css, { parseValue: true, onParseError: () => { throw new Error("格式不完整，请检查花括号与分号。"); } });
    const output: string[] = [];
    walk(ast, (node) => { if (node.type === "Atrule") throw new Error("只支持气泡样式，请移除 @ 规则。"); });
    if (ast.type !== "StyleSheet") throw new Error("请使用两组完整的气泡样式。");
    ast.children.forEach((rule) => {
      if (rule.type !== "Rule" || !rule.prelude || rule.prelude.type !== "SelectorList") throw new Error("请使用 .bubble-me 和 .bubble-him 格式。");
      const selectors: string[] = [];
      rule.prelude.children.forEach((sel) => {
        const name = generate(sel).replace(/\s+/g, " ").trim();
        const mapped = aliases[name];
        if (!mapped) throw new Error(`不支持 ${name}，请改为 .bubble-me 或 .bubble-him。`);
        selectors.push(`[data-bubble-scope="${scope}"] ${mapped}`);
      });
      const declarations: string[] = [];
      rule.block.children.forEach((decl) => {
        if (decl.type !== "Declaration" || !allowed.test(decl.property)) return;
        const value = generate(decl.value);
        if (/url\s*\(|expression\s*\(/i.test(value)) throw new Error("气泡样式不支持外部链接。");
        declarations.push(`${decl.property}:${value} !important`);
      });
      output.push(`${selectors.join(",")}{${declarations.join(";")}}`);
    });
    return { css: output.join("\n"), error: "" };
  } catch (e) { return { css: "", error: e instanceof Error ? e.message : "请检查气泡格式。" }; }
}