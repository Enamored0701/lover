import type { Msg, State, Who } from "./types";
import { uid } from "./util";
export function parseRussianCard(text: string): { text: string; translation?: string } {
  const match = text.match(/^([\s\S]*?)【([^【】]+)】\s*$/);
  return match ? { text: (match[1] ?? "").trim(), translation: (match[2] ?? "").trim() } : { text };
}
export function messageBody(m: Msg): string {
  if (m.type === "sticker") return "[表情包]";
  if (m.type === "quiz") return m.quiz?.q || "[快问快答]";
  if (m.type === "answer") return `${m.text || "回答"}：${m.picks?.join("、") || "—"}`;
  return m.translation ? `${m.text}\n${m.translation}` : m.text || "[消息]";
}
export function answerQuiz(d: State, messageId: string, who: Who, picks: string[]) {
  const question = d.msgs.find(m => m.id === messageId);
  if (!question?.quiz) return;
  const valid = [...new Set(picks)].filter(p => question.quiz?.options.includes(p));
  if (!valid.length) return;
  const chosen = question.quiz.multi ? valid : valid.slice(0, 1);
  question.answers = { ...question.answers, [who]: chosen };
  const old = d.msgs.find(m => m.type === "answer" && m.questionId === messageId && m.who === who);
  if (old) old.picks = chosen;
  else d.msgs.push({ id: uid(), who, at: Date.now(), type: "answer", text: question.quiz.q, picks: chosen, questionId: messageId });
}