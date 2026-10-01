import { useState } from "react";
import type { Card } from "../../types";
import { useStore } from "../../state/AppStore";
import { useToast } from "../../state/Toast";
import { editCard } from "../../state/cardActions";
import { clozeCount } from "../../lib/cloze";

/** Inline editor for one card. Review history is kept; cloze siblings are edited together. */
export function CardEditForm({ card, onDone }: { card: Card; onDone: () => void }) {
  const { data, update } = useStore();
  const toast = useToast();
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [deckId, setDeckId] = useState(card.deckId);
  const [error, setError] = useState("");
  const cloze = card.kind === "cloze";
  const id = `edit-${card.id}`;

  const save = () => {
    const r = editCard(data.cards, card.id, { front, back, deckId });
    if ("error" in r) return setError(r.error);
    update((d) => {
      const again = editCard(d.cards, card.id, { front, back, deckId });
      return "error" in again ? d : { ...d, cards: again.cards };
    });
    toast(cloze && clozeCount(front) !== clozeCount(card.front) ? `Đã lưu. Câu này giờ có ${clozeCount(front)} thẻ.` : "Đã lưu thẻ.");
    onDone();
  };

  return (
    <form
      className="edit-form"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onDone();
        }
      }}
    >
      <label className="f" htmlFor={`${id}-front`}>
        Mặt trước{cloze ? " (câu có {{...}}, sửa cho mọi thẻ của câu này)" : ""}
      </label>
      <textarea id={`${id}-front`} autoFocus value={front} onChange={(e) => setFront(e.target.value)} />
      <label className="f" htmlFor={`${id}-back`}>{cloze ? "Ghi chú (không bắt buộc)" : "Mặt sau"}</label>
      <textarea id={`${id}-back`} value={back} onChange={(e) => setBack(e.target.value)} />
      <label className="sr" htmlFor={`${id}-deck`}>Bộ thẻ</label>
      <select id={`${id}-deck`} value={deckId} onChange={(e) => setDeckId(e.target.value)}>
        {data.decks.map((d) => (
          <option key={d.id} value={d.id}>Bộ thẻ: {d.name}</option>
        ))}
      </select>
      {error && <p className="err" role="alert">{error}</p>}
      <div className="row">
        <button type="submit" className="btn small">Lưu</button>
        <button type="button" className="btn ghost small" onClick={onDone}>Huỷ</button>
        <span className="hint">Lịch ôn của thẻ được giữ nguyên.</span>
      </div>
    </form>
  );
}
