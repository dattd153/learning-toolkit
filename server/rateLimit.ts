/** Fixed-window counter per key (IP). In-memory: fine for a single process. */
export function rateLimiter(limit: number, windowMs: number, now = () => Date.now()) {
  const hits = new Map<string, { count: number; reset: number }>();
  return (key: string): boolean => {
    const t = now();
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset <= t) hits.delete(k);
    const h = hits.get(key);
    if (!h || h.reset <= t) {
      hits.set(key, { count: 1, reset: t + windowMs });
      return true;
    }
    h.count++;
    return h.count <= limit;
  };
}
