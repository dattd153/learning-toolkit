import type { Card } from "../../types";
import { clozeParts } from "../../lib/cloze";

/** Question (and answer once revealed) for basic and cloze cards. */
export function CardFace({ card, revealed }: { card: Card; revealed: boolean }) {
  if (card.kind === "cloze") {
    const parts = clozeParts(card.front, card.clozeIndex ?? 0, revealed);
    return (
      <>
        <div className="face">
          {parts.map((p, i) =>
            p.kind === "plain" ? (
              <span key={i}>{p.text}</span>
            ) : p.kind === "hidden" ? (
              <span key={i} className="cloze-gap" aria-label="chỗ trống">
                […]
              </span>
            ) : (
              <mark key={i} className="cloze-answer">{p.text}</mark>
            ),
          )}
        </div>
        {revealed && card.back && <div className="back">{card.back}</div>}
      </>
    );
  }
  return (
    <>
      <div className="face">{card.front}</div>
      {revealed && <div className="back">{card.back}</div>}
    </>
  );
}
