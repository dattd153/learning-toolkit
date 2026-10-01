/**
 * Optional Claude Artifact runtime (window.claude). When the app runs as a
 * normal website these are all null and the AI / account-sync features hide.
 */
export interface Sampler {
  json(prompt: string): Promise<unknown>;
}

export interface DocRef {
  get(): Promise<{ exists: boolean; data(): unknown }>;
  set(data: unknown): Promise<void>;
}

interface ClaudeRuntime {
  use(name: "db" | "user" | "sample"): Promise<any>;
}

declare global {
  interface Window {
    claude?: ClaudeRuntime;
  }
}

export async function connectPlatform(): Promise<{ sampler: Sampler | null; doc: DocRef | null }> {
  const rt = window.claude;
  if (!rt || typeof rt.use !== "function") return { sampler: null, doc: null };
  try {
    const [db, user, sample] = await Promise.all([rt.use("db"), rt.use("user"), rt.use("sample")]);
    let doc: DocRef | null = null;
    if (db && user) {
      const id = await user.id();
      if (id) doc = db.collection("data/users/" + id).doc("toolkit");
    }
    return { sampler: sample ?? null, doc };
  } catch {
    return { sampler: null, doc: null };
  }
}

export function aiErrorMessage(e: unknown) {
  const code = (e as { code?: string } | null)?.code;
  if (code === "not_granted") return "Bạn chưa cho phép trang này hỏi Claude.";
  if (code === "rate_limited") return "Đang có nhiều yêu cầu quá, thử lại sau ít phút.";
  if (code === "cancelled") return "Đã dừng.";
  return "Không nhận được phản hồi từ Claude. Thử lại sau.";
}
