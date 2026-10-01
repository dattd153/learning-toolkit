import { useMemo, useRef, useState } from "react";
import type { Feedback, Note } from "../../types";
import { useStore } from "../../state/AppStore";
import { useToast } from "../../state/Toast";
import { aiErrorMessage } from "../../lib/platform";
import { formatDate, prefersReducedMotion, uid } from "../../lib/utils";
import { Icon } from "../../components/Icon";
import { ConfirmButton } from "../../components/ConfirmButton";
import { FeedbackBox } from "./FeedbackBox";
import { studentPrompt } from "./prompt";
import { GapsToCards } from "./GapsToCards";

const STEPS = [
  ["Chọn khái niệm", "Ghi tên chủ đề lên đầu trang."],
  ["Giải thích đơn giản", "Không dùng thuật ngữ mà không giải thích."],
  ["Tìm chỗ bí", "Ghi lại, mở tài liệu ra học tiếp."],
  ["Rút gọn, ví dụ", "Thêm phép so sánh đời thường."],
];

function measure(text: string, gaps: string) {
  const t = text.trim();
  const words = t ? t.split(/\s+/).length : 0;
  const sentences = t ? t.split(/[.!?…]+/).filter((s) => s.trim()).length : 0;
  const avg = sentences ? Math.round(words / sentences) : 0;
  const gapCount = gaps.split("\n").filter((s) => s.trim()).length;
  const advice =
    avg > 25 ? "Câu hơi dài, thử tách nhỏ." : words > 0 && words < 40 ? "Còn ngắn, thử thêm một ví dụ." : words > 0 ? "Độ dài câu dễ theo dõi." : "";
  return { words, sentences, avg, gapCount, advice };
}

export function FeynmanPanel() {
  const { data, update, sampler } = useStore();
  const toast = useToast();
  const [noteId, setNoteId] = useState<string | null>(null);
  const [concept, setConcept] = useState("");
  const [text, setText] = useState("");
  const [gaps, setGaps] = useState("");
  const [feedback, setFeedback] = useState<Feedback | string | null>(null);
  const [asking, setAsking] = useState(false);
  const conceptRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => measure(text, gaps), [text, gaps]);

  const load = (n: Note | null) => {
    setNoteId(n?.id ?? null);
    setConcept(n?.concept ?? "");
    setText(n?.text ?? "");
    setGaps(n?.gaps ?? "");
    setFeedback(n?.feedback ?? null);
  };

  const save = () => {
    const c = concept.trim(), t = text.trim();
    if (!c || !t) return toast("Cần có khái niệm và lời giải thích.");
    const id = noteId ?? uid();
    update((d) => {
      const exists = d.notes.some((n) => n.id === id);
      const patch = { concept: c, text: t, gaps, updated: Date.now() };
      return {
        ...d,
        notes: exists ? d.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) : [{ id, ...patch }, ...d.notes],
      };
    });
    setNoteId(id);
    toast("Đã lưu bài giải thích.");
  };

  const ask = async () => {
    const c = concept.trim(), t = text.trim();
    if (!sampler) return;
    if (!c || !t) return toast("Cần có khái niệm và lời giải thích.");
    setAsking(true);
    setFeedback("Đang đọc bài của bạn...");
    try {
      const f = (await sampler.json(studentPrompt(c, t))) as Feedback;
      setFeedback(f);
      if (noteId) update((d) => ({ ...d, notes: d.notes.map((n) => (n.id === noteId ? { ...n, feedback: f } : n)) }));
    } catch (e) {
      setFeedback(aiErrorMessage(e));
    } finally {
      setAsking(false);
    }
  };

  const remove = (id: string) => {
    update((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) }));
    if (noteId === id) load(null);
  };

  return (
    <>
      <div className="panel-head">
        <h2>Bàn Feynman</h2>
        <p className="lede">
          Viết lời giải thích như đang dạy một bạn nhỏ 12 tuổi. Chỗ nào bạn phải viết vòng vo hoặc chép nguyên văn sách,
          đó là chỗ cần học lại.
        </p>
      </div>

      <div className="steps4">
        {STEPS.map(([title, desc], i) => (
          <div className="step" key={title}>
            <span className="num">{i + 1}</span>
            <div>
              <b>{title}</b>
              {desc}
            </div>
          </div>
        ))}
      </div>

      <div className="cols">
        <div className="card">
          <label className="f" htmlFor="fConcept">Khái niệm</label>
          <input ref={conceptRef} type="text" id="fConcept" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ví dụ: Lãi kép, Quang hợp, Định luật Ohm" />
          <div className="spacer" />
          <label className="f" htmlFor="fText">Lời giải thích của bạn</label>
          <textarea id="fText" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Hãy tưởng tượng bạn đang nói với em họ học lớp 6..." />
          <div className="meter" aria-live="polite">
            <span><b>{stats.words}</b> từ</span>
            <span><b>{stats.sentences}</b> câu</span>
            <span><b>{stats.avg}</b> từ/câu</span>
            <span><b>{stats.gapCount}</b> chỗ bí</span>
            {stats.advice && <span className="advice">{stats.advice}</span>}
          </div>
          <label className="f" htmlFor="fGaps">
            Chỗ bí cần học lại <span className="hint">(mỗi dòng một ý)</span>
          </label>
          <textarea id="fGaps" rows={3} style={{ minHeight: 88 }} value={gaps} onChange={(e) => setGaps(e.target.value)} placeholder="Vì sao lãi được nhập vào gốc?" />
          <GapsToCards gaps={gaps} concept={concept.trim()} />
          <div className="row" style={{ marginTop: 16 }}>
            <button type="button" className="btn" onClick={save}>
              <Icon name="save" />Lưu bài
            </button>
            {sampler && (
              <button type="button" className="btn ghost" onClick={ask} disabled={asking}>
                <Icon name="spark" />Nhờ Claude đóng vai học sinh
              </button>
            )}
            <button type="button" className="btn ghost" onClick={() => { load(null); conceptRef.current?.focus(); }}>
              <Icon name="plus" />Bài mới
            </button>
          </div>
          <div aria-live="polite">{feedback && <FeedbackBox feedback={feedback} />}</div>
        </div>

        <div className="card">
          <h3>Bài đã lưu</h3>
          <ul className="notelist">
            {data.notes.length === 0 ? (
              <li style={{ border: 0 }}>
                <div className="empty" style={{ width: "100%" }}>
                  <Icon name="file" />
                  Chưa có bài nào. Viết lời giải thích đầu tiên rồi bấm Lưu.
                </div>
              </li>
            ) : (
              data.notes.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className="link"
                    onClick={() => {
                      load(n);
                      conceptRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
                    }}
                  >
                    {n.concept}
                    <small>{formatDate(n.updated)}</small>
                  </button>
                  <ConfirmButton ariaLabel={`Xoá bài ${n.concept}`} onConfirm={() => remove(n.id)}>
                    <Icon name="x" />
                  </ConfirmButton>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
