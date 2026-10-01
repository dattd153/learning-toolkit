const CLOZE = /\{\{(.+?)\}\}/g;

export const hasCloze = (text: string) => /\{\{.+?\}\}/.test(text);

export const clozeCount = (text: string) => [...text.matchAll(CLOZE)].length;

/** The text hidden by cloze `index`. */
export const clozeAnswer = (text: string, index: number) => [...text.matchAll(CLOZE)][index]?.[1] ?? "";

export type ClozePart = { text: string; kind: "plain" | "hidden" | "answer" };

/**
 * Split cloze text for rendering: the active cloze is "hidden" (or "answer"
 * once revealed); other clozes show as plain text.
 */
export function clozeParts(text: string, index: number, revealed: boolean): ClozePart[] {
  const parts: ClozePart[] = [];
  let last = 0, i = 0;
  for (const m of text.matchAll(CLOZE)) {
    if (m.index! > last) parts.push({ text: text.slice(last, m.index), kind: "plain" });
    parts.push({ text: m[1], kind: i === index ? (revealed ? "answer" : "hidden") : "plain" });
    last = m.index! + m[0].length;
    i++;
  }
  if (last < text.length) parts.push({ text: text.slice(last), kind: "plain" });
  return parts;
}

/** Plain-text rendering, e.g. for card lists and CSV: "Thủ đô Úc là [...]". */
export const clozePlain = (text: string, index?: number) =>
  clozeParts(text, index ?? -1, false).map((p) => (p.kind === "hidden" ? "[…]" : p.text)).join("");
