import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { isSyncCode, newSyncCode, sqliteStore } from "./store.ts";
import { RefusedError, type AiService } from "./ai.ts";
import { rateLimiter } from "./rateLimit.ts";

const json = (method: string, body?: unknown) => ({
  method,
  headers: { "content-type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const fakeAi: AiService = {
  feynman: async (concept) => ({ diem: 8, nhan_xet: `ok ${concept}`, cho_chua_ro: [], cau_hoi: ["?"], vi_du_goi_y: "x" }),
  cards: async () => [{ truoc: "q", sau: "a" }],
};

describe("sync codes", () => {
  it("are 26-char base32 and unique", () => {
    const codes = new Set(Array.from({ length: 500 }, newSyncCode));
    expect(codes.size).toBe(500);
    for (const c of codes) expect(isSyncCode(c)).toBe(true);
  });
});

describe("sync API", () => {
  const app = createApp({ store: sqliteStore(":memory:"), ai: null });

  it("create → get → put with compare-and-swap revisions", async () => {
    const created = await (await app.request("/api/sync", json("POST", { data: { cards: [1] } }))).json();
    expect(isSyncCode(created.code)).toBe(true);
    expect(created.rev).toBe(1);

    const got = await (await app.request(`/api/sync/${created.code}`)).json();
    expect(got).toEqual({ rev: 1, data: { cards: [1] } });

    const ok = await app.request(`/api/sync/${created.code}`, json("PUT", { data: { cards: [1, 2] }, baseRev: 1 }));
    expect(await ok.json()).toEqual({ rev: 2 });

    // A second device still on rev 1 must not overwrite.
    const stale = await app.request(`/api/sync/${created.code}`, json("PUT", { data: { cards: [] }, baseRev: 1 }));
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ rev: 2 });
    expect((await (await app.request(`/api/sync/${created.code}`)).json()).data).toEqual({ cards: [1, 2] });
  });

  it("rejects unknown/malformed codes and bad bodies", async () => {
    expect((await app.request("/api/sync/AAAAAAAAAAAAAAAAAAAAAAAAAA")).status).toBe(404);
    expect((await app.request("/api/sync/../etc")).status).toBe(404);
    expect((await app.request("/api/sync", json("POST", { data: [1] }))).status).toBe(400);
    expect((await app.request("/api/sync", json("POST", "nope"))).status).toBe(400);
  });

  it("enforces the size limit", async () => {
    const big = { blob: "x".repeat(2 * 1024 * 1024 + 10) };
    expect((await app.request("/api/sync", json("POST", { data: big }))).status).toBe(413);
  });

  it("reports health without AI", async () => {
    expect(await (await app.request("/api/health")).json()).toEqual({ ok: true, ai: false, sync: true });
    expect((await app.request("/api/ai/cards", json("POST", { notes: "x" }))).status).toBe(404);
  });
});

describe("AI API", () => {
  it("validates input and returns the service result", async () => {
    const app = createApp({ store: sqliteStore(":memory:"), ai: fakeAi });
    expect((await app.request("/api/ai/feynman", json("POST", { concept: "", text: "x" }))).status).toBe(400);
    expect((await app.request("/api/ai/feynman", json("POST", { concept: "a", text: "x".repeat(8001) }))).status).toBe(413);
    const fb = await (await app.request("/api/ai/feynman", json("POST", { concept: "Lãi kép", text: "..." }))).json();
    expect(fb.nhan_xet).toBe("ok Lãi kép");
    expect(await (await app.request("/api/ai/cards", json("POST", { notes: "ghi chú" }))).json()).toEqual({ the: [{ truoc: "q", sau: "a" }] });
  });

  it("maps a refusal to 422 and other failures to 502", async () => {
    const refusing: AiService = { feynman: async () => { throw new RefusedError(); }, cards: async () => { throw new Error("boom"); } };
    const app = createApp({ store: sqliteStore(":memory:"), ai: refusing });
    expect((await app.request("/api/ai/feynman", json("POST", { concept: "a", text: "b" }))).status).toBe(422);
    const orig = console.error;
    console.error = () => {};
    expect((await app.request("/api/ai/cards", json("POST", { notes: "x" }))).status).toBe(502);
    console.error = orig;
  });

  it("rate-limits AI calls per client", async () => {
    const app = createApp({ store: sqliteStore(":memory:"), ai: fakeAi, clientIp: () => "1.2.3.4" });
    const codes: number[] = [];
    for (let i = 0; i < 22; i++) codes.push((await app.request("/api/ai/cards", json("POST", { notes: "x" }))).status);
    expect(codes.filter((s) => s === 200)).toHaveLength(20);
    expect(codes.at(-1)).toBe(429);
  });
});

describe("rateLimiter", () => {
  it("resets after the window", () => {
    let t = 0;
    const allow = rateLimiter(2, 1000, () => t);
    expect([allow("a"), allow("a"), allow("a"), allow("b")]).toEqual([true, true, false, true]);
    t = 1000;
    expect(allow("a")).toBe(true);
  });
});
