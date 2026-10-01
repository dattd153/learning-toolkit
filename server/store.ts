import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** 128-bit random secret as 26 base32 chars (what users copy between devices). */
export function newSyncCode(): string {
  const bytes = randomBytes(17); // 136 bits; we take 26×5 = 130 of them
  let bits = 0, value = 0, out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5 && out.length < 26) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return out;
}

export const isSyncCode = (s: string) => /^[A-Z2-7]{26}$/.test(s);

/** Only the hash of a code is stored, so a leaked database does not leak access. */
const hash = (code: string) => createHash("sha256").update(code).digest("hex");

export interface SyncStore {
  create(data: string): { code: string; rev: number };
  get(code: string): { rev: number; data: string } | null;
  /** Returns the new rev, or { conflict: currentRev } if baseRev is stale, or null if unknown. */
  put(code: string, data: string, baseRev: number): { rev: number } | { conflict: number } | null;
}

export function sqliteStore(path: string): SyncStore {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`CREATE TABLE IF NOT EXISTS sync (
    code_hash TEXT PRIMARY KEY,
    rev INTEGER NOT NULL,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
  const ins = db.prepare("INSERT INTO sync (code_hash, rev, data, updated_at) VALUES (?, 1, ?, ?)");
  const sel = db.prepare("SELECT rev, data FROM sync WHERE code_hash = ?");
  // Compare-and-swap on rev so two devices can't both win.
  const upd = db.prepare("UPDATE sync SET rev = rev + 1, data = ?, updated_at = ? WHERE code_hash = ? AND rev = ?");

  return {
    create(data) {
      const code = newSyncCode();
      ins.run(hash(code), data, Date.now());
      return { code, rev: 1 };
    },
    get(code) {
      const row = sel.get(hash(code)) as { rev: number; data: string } | undefined;
      return row ? { rev: row.rev, data: row.data } : null;
    },
    put(code, data, baseRev) {
      const h = hash(code);
      const res = upd.run(data, Date.now(), h, baseRev);
      if (res.changes === 1) return { rev: baseRev + 1 };
      const row = sel.get(h) as { rev: number } | undefined;
      return row ? { conflict: row.rev } : null;
    },
  };
}
