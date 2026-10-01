/**
 * Prompts shared by the browser (Claude Artifact runtime) and the server, so
 * both paths ask Claude the same thing and parse the same JSON shape.
 */

export const MAX_TEXT = 8000;

export const feynmanPrompt = (concept: string, text: string) =>
  `Bạn đóng vai một học sinh 12 tuổi thông minh, tò mò, đang nghe một người giải thích khái niệm "${concept}". Đây là lời giải thích:
"""
${text.slice(0, MAX_TEXT)}
"""
Hãy đánh giá xem lời giải thích có đủ đơn giản, chính xác và dễ hiểu với bạn không. Chỉ ra chỗ dùng từ khó chưa được giải thích, chỗ nhảy cóc, chỗ có thể sai kiến thức. Trả lời bằng tiếng Việt, xưng "em", giọng thân thiện.
Chỉ trả về JSON, không thêm gì khác, theo dạng:
{"diem": số nguyên 1-10, "nhan_xet": "một câu nhận xét chung", "cho_chua_ro": ["..."], "cau_hoi": ["2-3 câu hỏi em muốn hỏi thêm"], "vi_du_goi_y": "một ví dụ hoặc phép so sánh đời thường giúp giải thích dễ hơn"}`;

export const cardsPrompt = (notes: string) =>
  `Từ ghi chú học tập dưới đây, hãy soạn từ 5 đến 12 thẻ nhớ theo kiểu gợi nhớ chủ động: mặt trước là một câu hỏi ngắn, cụ thể; mặt sau là đáp án ngắn gọn. Mỗi thẻ chỉ kiểm tra một ý. Viết bằng ngôn ngữ của ghi chú.
Ghi chú:
"""
${notes.slice(0, MAX_TEXT)}
"""
Chỉ trả về JSON, không thêm gì khác: {"the":[{"truoc":"...","sau":"..."}]}`;

export interface FeedbackJson {
  diem: number | string;
  nhan_xet: string;
  cho_chua_ro?: string[];
  cau_hoi?: string[];
  vi_du_goi_y?: string;
}

export interface CardProposal {
  truoc: string;
  sau: string;
}

/** Keep only well-formed proposals. */
export const cleanProposals = (r: unknown): CardProposal[] => {
  const list = (r as { the?: unknown } | null)?.the;
  return Array.isArray(list)
    ? list
        .filter((x): x is CardProposal => !!x && typeof x.truoc === "string" && typeof x.sau === "string" && !!x.truoc.trim() && !!x.sau.trim())
        .slice(0, 30)
    : [];
};
