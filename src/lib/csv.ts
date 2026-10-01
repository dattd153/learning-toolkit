/**
 * Minimal RFC 4180 parser. Delimiter comes from an Anki "#separator:" header
 * if present, else is guessed from the first data line (tab, comma, semicolon).
 */
export function parseDelimited(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const lines = src.split(/\r?\n/);
  // Anki plain-text exports declare "#separator:tab|comma|semicolon|pipe" in a header comment.
  const declared = lines.find((l) => /^#separator:/i.test(l))?.split(":")[1]?.trim().toLowerCase() ?? "";
  const sample = lines.find((l) => l.trim() && !l.startsWith("#")) ?? "";
  const named: Record<string, string> = { tab: "\t", comma: ",", semicolon: ";", pipe: "|" };
  const delim = named[declared] ?? (sample.includes("\t") ? "\t" : sample.includes(",") ? "," : sample.includes(";") ? ";" : ",");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  // Anki exports start with "#separator:tab"-style comment lines.
  return rows.filter((r) => !(r.length === 1 && (r[0].trim() === "" || r[0].startsWith("#"))));
}

const escapeCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export const toCsv = (rows: string[][]) => "\uFEFF" + rows.map((r) => r.map(escapeCell).join(",")).join("\r\n");
