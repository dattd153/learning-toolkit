import { useState } from "react";
import { useStore } from "../../state/AppStore";
import { useToast } from "../../state/Toast";
import { appendCards } from "../../state/cardActions";
import { Icon } from "../../components/Icon";

/**
 * Turns each "chỗ bí" line into a flashcard. The answer must be filled in
 * first, which nudges the learner back to the source material.
 */
export function GapsToCards({ gaps, concept }: { gaps: string; concept: string }) {
  const { data, update } = useStore();
  const toast = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = [...new Set(gaps.split("\n").map((s) => s.trim()).filter(Boolean))];
  if (!questions.length) return null;

  const existing = new Set(data.cards.map((c) => c.front.trim()));

  const create = (q: string) => {
    const back = (answers[q] ?? "").trim();
    if (!back) return toast("Hãy tra lại tài liệu và điền đáp án trước.");
    update((d) => ({ ...d, cards: appendCards(d.cards, [{ front: q, back, topic: concept }]).cards }));
    setAnswers((a) => ({ ...a, [q]: "" }));
    toast("Đã tạo thẻ. Thẻ sẽ có trong lượt ôn hôm nay.");
  };

  return (
    <div className="gaps">
      <h4>Biến chỗ bí thành thẻ nhớ</h4>
      <p className="hint" style={{ margin: "0 0 8px" }}>
        Tra lại tài liệu, điền đáp án ngắn gọn, rồi tạo thẻ để ôn ngắt quãng.
      </p>
      <ul>
        {questions.map((q, i) =>
          existing.has(q) ? (
            <li key={q} className="gap-done">
              <Icon name="check" />
              <span>{q}</span>
              <span className="pill">Đã có thẻ</span>
            </li>
          ) : (
            <li key={q}>
              <label className="gap-q" htmlFor={`gap-${i}`}>{q}</label>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <input
                  id={`gap-${i}`}
                  type="text"
                  placeholder="Đáp án"
                  value={answers[q] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && create(q)}
                />
                <button type="button" className="btn ghost" onClick={() => create(q)}>
                  <Icon name="plus" />Tạo thẻ
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
