import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { getConnInfo } from "@hono/node-server/conninfo";
import { createApp } from "./app.ts";
import { sqliteStore } from "./store.ts";
import { createAi } from "./ai.ts";

const env = process.env;
const port = Number(env.PORT ?? 8787);
const trustProxy = env.TRUST_PROXY === "1";

// AI needs Claude credentials. ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN enable it;
// set AI_ENABLED=1 when using an `ant auth login` profile or workload identity instead.
const aiEnabled = env.AI_ENABLED === "1" || !!env.ANTHROPIC_API_KEY || !!env.ANTHROPIC_AUTH_TOKEN;
const ai = aiEnabled && env.AI_ENABLED !== "0"
  ? createAi({ model: env.AI_MODEL, effort: env.AI_EFFORT as "low" | "medium" | "high" | undefined })
  : null;

const app = createApp({
  store: sqliteStore(env.DB_PATH ?? "./data/hop-cong-cu-ghi-nho.db"),
  ai,
  clientIp: (c) => {
    if (trustProxy) {
      const fwd = c.req.header("x-forwarded-for");
      if (fwd) return fwd.split(",")[0].trim();
    }
    try {
      return getConnInfo(c).remote.address ?? "unknown";
    } catch {
      return "unknown";
    }
  },
});

// Serve the built frontend (npm run build) from the same origin.
app.use("/assets/*", async (c, next) => {
  await next();
  c.header("cache-control", "public, max-age=31536000, immutable");
});
app.use("*", async (c, next) => {
  await next();
  if (!c.req.path.startsWith("/assets/") && !c.req.path.startsWith("/api/")) c.header("cache-control", "no-cache");
});
app.use("*", serveStatic({ root: "./dist" }));
app.get("*", serveStatic({ path: "./dist/index.html" })); // SPA fallback

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Hộp công cụ ghi nhớ: http://localhost:${info.port}  (AI: ${ai ? "bật" : "tắt"})`);
});
