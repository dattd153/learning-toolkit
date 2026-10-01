export type AnswerVerdict = "match" | "close" | "diff" | "empty";

/**
 * Lowercase, drop punctuation/symbols and collapse spaces. Vietnamese
 * diacritics are kept on purpose: "ma", "má", "mà" are different words.
 */
export const normalizeAnswer = (s: string) =>
  s.normalize("NFC").toLowerCase().replace(/[\p{P}\p{S}]/gu, " ").replace(/\s+/g, " ").trim();

export function levenshtein(a: string, b: string) {
  const A = [...a], B = [...b];
  let prev = Array.from({ length: B.length + 1 }, (_, j) => j);
  for (let i = 1; i <= A.length; i++) {
    const cur = [i];
    for (let j = 1; j <= B.length; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[B.length];
}

/** "close" = edit distance within 20% of the expected answer's length. */
export function compareAnswer(given: string, expected: string): AnswerVerdict {
  const g = normalizeAnswer(given), e = normalizeAnswer(expected);
  if (!g) return "empty";
  if (g === e) return "match";
  return levenshtein(g, e) <= Math.max(1, Math.floor([...e].length * 0.2)) ? "close" : "diff";
}
