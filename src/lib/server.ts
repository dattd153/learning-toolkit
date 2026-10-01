import { cleanProposals, type FeedbackJson } from "../../shared/prompts";
import type { Ai } from "./platform";

/** Base URL of the optional backend (same origin by default; override with VITE_API_URL). */
const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  constructor(public code: string, public status: number, public body?: unknown) {
    super(code);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API + path, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  } catch {
    throw new ApiError("offline", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const code = res.status === 429 ? "rate_limited" : res.status === 413 ? "too_long" : res.status === 409 ? "conflict" : res.status === 404 ? "not_found" : res.status === 422 ? "refused" : "server_error";
    throw new ApiError(code, res.status, body);
  }
  return body as T;
}

export interface ServerInfo {
  ok: boolean;
  ai: boolean;
  sync: boolean;
}

/** Probe the backend; null when there is none (static hosting, offline). */
export async function probeServer(): Promise<ServerInfo | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(API + "/api/health", { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const info = (await res.json()) as ServerInfo;
    return info?.ok ? info : null;
  } catch {
    return null;
  }
}

export const serverAi: Ai = {
  feynman: (concept, text) => call<FeedbackJson>("/api/ai/feynman", { method: "POST", body: JSON.stringify({ concept, text }) }),
  cards: async (notes) => cleanProposals(await call("/api/ai/cards", { method: "POST", body: JSON.stringify({ notes }) })),
};

/** Sync codes are 26-char base32 secrets; normalise what users type or paste. */
export const normalizeSyncCode = (s: string) => s.toUpperCase().replace(/[^A-Z2-7]/g, "");

export interface RemoteCopy {
  rev: number;
  data: unknown;
}

export const sync = {
  create: (data: unknown) => call<{ code: string; rev: number }>("/api/sync", { method: "POST", body: JSON.stringify({ data }) }),
  get: (code: string) => call<RemoteCopy>(`/api/sync/${code}`),
  /** Throws ApiError("conflict") with body {rev} when the server moved past baseRev. */
  put: (code: string, data: unknown, baseRev: number) =>
    call<{ rev: number }>(`/api/sync/${code}`, { method: "PUT", body: JSON.stringify({ data, baseRev }) }),
};
