import { cardsPrompt, cleanProposals, feynmanPrompt, type CardProposal, type FeedbackJson } from "../../shared/prompts";

/** AI features, whichever backend provides them. */
export interface Ai {
  feynman(concept: string, text: string): Promise<FeedbackJson>;
  cards(notes: string): Promise<CardProposal[]>;
}

/** Remote copy of AppData (Artifact account storage or the sync server). */
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

/** Optional Claude Artifact runtime (window.claude): AI via `sample`, account storage via `db`. */
export async function connectArtifact(): Promise<{ ai: Ai | null; doc: DocRef | null } | null> {
  const rt = window.claude;
  if (!rt || typeof rt.use !== "function") return null;
  try {
    const [db, user, sample] = await Promise.all([rt.use("db"), rt.use("user"), rt.use("sample")]);
    let doc: DocRef | null = null;
    if (db && user) {
      const id = await user.id();
      if (id) doc = db.collection("data/users/" + id).doc("toolkit");
    }
    const ai: Ai | null = sample
      ? {
          feynman: async (c, t) => (await sample.json(feynmanPrompt(c, t))) as FeedbackJson,
          cards: async (n) => cleanProposals(await sample.json(cardsPrompt(n))),
        }
      : null;
    return { ai, doc };
  } catch {
    return { ai: null, doc: null };
  }
}

export function aiErrorMessage(e: unknown) {
  const code = (e as { code?: string } | null)?.code;
  if (code === "not_granted") return "Bạn chưa cho phép trang này hỏi Claude.";
  if (code === "rate_limited") return "Đang có nhiều yêu cầu quá, thử lại sau ít phút.";
  if (code === "cancelled") return "Đã dừng.";
  if (code === "too_long") return "Nội dung quá dài, hãy rút gọn bớt.";
  if (code === "refused") return "Claude không trả lời được nội dung này. Hãy thử diễn đạt khác.";
  if (code === "offline") return "Không có kết nối mạng.";
  return "Không nhận được phản hồi từ Claude. Thử lại sau.";
}
