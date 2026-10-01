import { useRef, useState } from "react";
import { useStore } from "../../state/AppStore";
import { studyQueue } from "../../state/selectors";
import { grantBonusNew } from "../../state/cardActions";
import { dayKey, formatDate, shuffle } from "../../lib/utils";
import { Icon } from "../../components/Icon";
import { FocusReview } from "./FocusReview";

const BONUS = 10;

/** Pick a deck, see what's due today (reviews + limited new cards), and launch focus mode. */
export function ReviewSession() {
  const { data, update } = useStore();
  const [deckId, setDeckId] = useState("all");
  const [session, setSession] = useState<{ queue: string[]; title: string } | null>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const typeAnswer = data.prefs.typeAnswer;

  const now = Date.now();
  const target = data.decks.some((d) => d.id === deckId) ? deckId : "all";
  const q = studyQueue(data, target, now);
  const deckName = target === "all" ? "Tất cả bộ thẻ" : data.decks.find((d) => d.id === target)!.name;

  const start = () => {
    setSession({ queue: [...shuffle(q.review), ...shuffle(q.fresh)].map((c) => c.id), title: deckName });
  };

  const close = () => {
    setSession(null);
    requestAnimationFrame(() => startRef.current?.focus());
  };

  const learnMore = () => {
    const waiting: Record<string, number> = {};
    for (const deck of data.decks) waiting[deck.id] = studyQueue(data, deck.id, now).moreNew;
    update((d) => grantBonusNew(d, target, BONUS, waiting, dayKey(now)));
  };

  if (!data.cards.length)
    return (
      <div className="empty">
        <Icon name="layers" />
        <span>Chưa có thẻ nào. Thêm vài thẻ ở bên dưới để bắt đầu ôn.</span>
      </div>
    );

  let status;
  if (q.total > 0)
    status = (
      <div className="review-head">
        <span className="big">{q.total}</span>
        <div className="grow">
          <h3 style={{ margin: 0 }}>thẻ cần học hôm nay</h3>
          <span className="hint">
            {q.review.length} thẻ ôn lại · {q.fresh.length} thẻ mới
            {q.moreNew > 0 ? ` · còn ${q.moreNew} thẻ mới chờ những ngày sau` : ""}
          </span>
        </div>
        <button ref={startRef} type="button" className="btn accent" onClick={start}>
          <Icon name="play" />Bắt đầu ôn
        </button>
      </div>
    );
  else {
    const pool = (target === "all" ? data.cards : data.cards.filter((c) => c.deckId === target)).filter((c) => c.srs.state !== 0);
    status = (
      <div className="done">
        <Icon name="check" />
        <b>Hôm nay đã học xong</b>
        {pool.length > 0 && (
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Lần ôn tiếp theo: {formatDate(Math.min(...pool.map((c) => c.due)))}.
          </p>
        )}
        {q.moreNew > 0 && (
          <>
            <p className="muted" style={{ margin: "4px 0 10px" }}>
              Còn {q.moreNew} thẻ mới chưa học. Mỗi ngày học vừa đủ giúp không bị dồn thẻ về sau.
            </p>
            <button ref={startRef} type="button" className="btn ghost small" onClick={learnMore}>
              <Icon name="plus" />Học thêm {Math.min(BONUS, q.moreNew)} thẻ mới hôm nay
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {data.decks.length > 1 && (
        <div className="deck-pick">
          <label className="f" htmlFor="reviewDeck">Ôn bộ thẻ</label>
          <select id="reviewDeck" value={target} onChange={(e) => setDeckId(e.target.value)}>
            <option value="all">Tất cả bộ thẻ ({studyQueue(data, "all", now).total} cần học)</option>
            {data.decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({studyQueue(data, d.id, now).total} cần học)
              </option>
            ))}
          </select>
        </div>
      )}
      {status}
      <p className="hint" style={{ margin: "10px 0 0" }}>
        Phím tắt khi ôn: <span className="kbd">{typeAnswer ? "Enter" : "Space"}</span> {typeAnswer ? "kiểm tra" : "lật thẻ"} ·{" "}
        <span className="kbd">1</span>–<span className="kbd">4</span> chấm điểm · <span className="kbd">Esc</span> thoát
      </p>
      <label className="switch">
        <input
          type="checkbox"
          checked={typeAnswer}
          onChange={(e) => {
            const on = e.target.checked;
            update((d) => ({ ...d, prefs: { ...d.prefs, typeAnswer: on } }));
          }}
        />
        <span>
          <b>Gõ đáp án trước khi lật</b>
          <small>Viết ra câu trả lời giúp nhớ chắc hơn và tự chấm trung thực hơn.</small>
        </span>
      </label>
      {session && <FocusReview initialQueue={session.queue} title={session.title} onClose={close} />}
    </>
  );
}
