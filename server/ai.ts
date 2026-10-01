import Anthropic from "@anthropic-ai/sdk";
import { cardsPrompt, cleanProposals, feynmanPrompt, type CardProposal, type FeedbackJson } from "../shared/prompts.ts";

export interface AiService {
  feynman(concept: string, text: string): Promise<FeedbackJson>;
  cards(notes: string): Promise<CardProposal[]>;
}

/** Claude declined (stop_reason "refusal") even after the server-side fallback. */
export class RefusedError extends Error {}

const FEEDBACK_SCHEMA = {
  type: "object",
  properties: {
    diem: { type: "integer" },
    nhan_xet: { type: "string" },
    cho_chua_ro: { type: "array", items: { type: "string" } },
    cau_hoi: { type: "array", items: { type: "string" } },
    vi_du_goi_y: { type: "string" },
  },
  required: ["diem", "nhan_xet", "cho_chua_ro", "cau_hoi", "vi_du_goi_y"],
  additionalProperties: false,
};

const CARDS_SCHEMA = {
  type: "object",
  properties: {
    the: {
      type: "array",
      items: {
        type: "object",
        properties: { truoc: { type: "string" }, sau: { type: "string" } },
        required: ["truoc", "sau"],
        additionalProperties: false,
      },
    },
  },
  required: ["the"],
  additionalProperties: false,
};

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export function createAi(opts: { client?: Anthropic; model?: string; effort?: Effort } = {}): AiService {
  const client = opts.client ?? new Anthropic();
  const model = opts.model ?? "claude-opus-5-5";
  // Opus 5.5 defaults to "medium"; set it explicitly so behaviour doesn't drift.
  const effort = opts.effort ?? "medium";

  async function ask(prompt: string, schema: Record<string, unknown>): Promise<unknown> {
    const res = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      // On a safety-classifier decline, retry server-side on Anthropic's recommended model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort, format: { type: "json_schema", schema } },
      messages: [{ role: "user", content: prompt }],
    });
    if (res.stop_reason === "refusal") throw new RefusedError("refusal");
    if (res.stop_reason === "max_tokens") throw new Error("Claude response was truncated");
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return JSON.parse(text);
  }

  return {
    feynman: async (concept, text) => (await ask(feynmanPrompt(concept, text), FEEDBACK_SCHEMA)) as FeedbackJson,
    cards: async (notes) => cleanProposals(await ask(cardsPrompt(notes), CARDS_SCHEMA)),
  };
}
