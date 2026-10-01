import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import Anthropic from "@anthropic-ai/sdk";
import { MAX_TEXT } from "../shared/prompts.ts";
import { isSyncCode, type SyncStore } from "./store.ts";
import { RefusedError, type AiService } from "./ai.ts";
import { rateLimiter } from "./rateLimit.ts";

const MAX_SYNC_BYTES = 2 * 1024 * 1024;
const MINUTE = 60_000;

export interface AppDeps {
  store: SyncStore;
  ai: AiService | null;
  /** Client IP for rate limiting (depends on how the server is deployed). */
  clientIp?: (c: Context) => string;
}

export function createApp({ store, ai, clientIp = () => "local" }: AppDeps) {
  const app = new Hono();
  const aiLimit = rateLimiter(20, 10 * MINUTE);
  const createLimit = rateLimiter(10, 60 * MINUTE);
  const syncLimit = rateLimiter(240, 10 * MINUTE);

  const tooMany = (c: Context) => c.json({ error: "rate_limited" }, 429);

  app.use(
    "/api/*",
    bodyLimit({ maxSize: MAX_SYNC_BYTES + 64 * 1024, onError: (c) => c.json({ error: "too_long" }, 413) }),
  );

  app.get("/api/health", (c) => c.json({ ok: true, ai: !!ai, sync: true }));

  // ---------- Sync ----------
  const readData = async (c: Context): Promise<{ data: string; baseRev?: number } | null> => {
    const body = (await c.req.json().catch(() => null)) as { data?: unknown; baseRev?: unknown } | null;
    if (!body || typeof body.data !== "object" || body.data === null || Array.isArray(body.data)) return null;
    const data = JSON.stringify(body.data);
    return { data, baseRev: typeof body.baseRev === "number" ? body.baseRev : undefined };
  };

  app.post("/api/sync", async (c) => {
    if (!createLimit(clientIp(c))) return tooMany(c);
    const body = await readData(c);
    if (!body) return c.json({ error: "bad_request" }, 400);
    if (body.data.length > MAX_SYNC_BYTES) return c.json({ error: "too_long" }, 413);
    return c.json(store.create(body.data), 201);
  });

  app.get("/api/sync/:code", (c) => {
    if (!syncLimit(clientIp(c))) return tooMany(c);
    const code = c.req.param("code");
    const row = isSyncCode(code) ? store.get(code) : null;
    if (!row) return c.json({ error: "not_found" }, 404);
    c.header("cache-control", "no-store");
    return c.json({ rev: row.rev, data: JSON.parse(row.data) });
  });

  app.put("/api/sync/:code", async (c) => {
    if (!syncLimit(clientIp(c))) return tooMany(c);
    const code = c.req.param("code");
    if (!isSyncCode(code)) return c.json({ error: "not_found" }, 404);
    const body = await readData(c);
    if (!body || body.baseRev === undefined) return c.json({ error: "bad_request" }, 400);
    if (body.data.length > MAX_SYNC_BYTES) return c.json({ error: "too_long" }, 413);
    const res = store.put(code, body.data, body.baseRev);
    if (!res) return c.json({ error: "not_found" }, 404);
    if ("conflict" in res) return c.json({ error: "conflict", rev: res.conflict }, 409);
    return c.json(res);
  });

  // ---------- AI ----------
  const runAi = async (c: Context, fn: (ai: AiService) => Promise<unknown>) => {
    if (!ai) return c.json({ error: "ai_disabled" }, 404);
    if (!aiLimit(clientIp(c))) return tooMany(c);
    try {
      return c.json((await fn(ai)) as object);
    } catch (e) {
      if (e instanceof RefusedError) return c.json({ error: "refused" }, 422);
      if (e instanceof Anthropic.RateLimitError) return c.json({ error: "rate_limited" }, 429);
      if (e instanceof Anthropic.APIError) console.error(`Claude API error ${e.status}:`, e.message);
      else console.error("AI request failed:", e);
      return c.json({ error: "ai_failed" }, 502);
    }
  };

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  app.post("/api/ai/feynman", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const concept = str(body.concept), text = str(body.text);
    if (!concept || !text) return c.json({ error: "bad_request" }, 400);
    if (concept.length > 200 || text.length > MAX_TEXT) return c.json({ error: "too_long" }, 413);
    return runAi(c, (a) => a.feynman(concept, text));
  });

  app.post("/api/ai/cards", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const notes = str(body.notes);
    if (!notes) return c.json({ error: "bad_request" }, 400);
    if (notes.length > MAX_TEXT) return c.json({ error: "too_long" }, 413);
    return runAi(c, async (a) => ({ the: await a.cards(notes) }));
  });

  app.all("/api/*", (c) => c.json({ error: "not_found" }, 404));
  return app;
}
