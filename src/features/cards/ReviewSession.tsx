import { useEffect, useMemo, useRef, useState } from "react";
import type { Grade } from "../../types";
import { useStore } from "../../state/AppStore";
import { bumpDay, dueCards } from "../../state/selectors";
import { MINUTE, formatDate, shuffle } from "../../lib/utils";
import { GRADE_LABEL, STATE_LABEL, formatInterval, preview, review } from "../../lib/srs";
import { clozeAnswer } from "../../lib/cloze";
import { compareAnswer, type AnswerVerdict } from "../../lib/answer";
import { Icon } from "../../components/Icon";
import { CardFace } from "./CardFace";

const VERDICT: Record<AnswerVerdict, string> = { match: "Khớp", close: "Gần đúng", diff: "Khác đáp án", empty: "Bạn chưa trả lời" };
/** Grade the typed-answer verdict suggests (focused after flipping). */
const SUGGEST: Record<AnswerVerdict, Grade> = { match: 3, close: 2, diff: 1, empty: 1 };
const GRADE_CLASS: Record<Grade, string> = { 1: "danger", 2: "ghost", 3: "success", 4: "ghost" };
/** Cards rescheduled sooner than this come back later in the same session. */
const REQUEUE_WITHIN = 20 * MINUTE;

/**
 * FSRS review session. Grades: 1 Quên · 2 Khó · 3 Nhớ · 4 Dễ. A card graded
 * Quên (or still in a short learning step) is shown again before the session ends.
 */
export function ReviewSession({ active }: { active: boolean }) {
  const { data, update } = useStore();
  const [deckId, setDeckId] = useState("all");
  const [queue, setQueue] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const gradeRefs = useRef<Partial<Record<Grade, HTMLButtonElement | null>>>({});
  const typeAnswer = data.prefs.typeAnswer;

  const inSession = qi < queue.length;
  const current = inSession ? data.cards.find((c) => c.id === queue[qi]) : undefined;
  const intervals = useMemo(() => {
    if (!current || !flipped) return null;
    const now = Date.now();
    const p = preview(current, now);
    return ([1, 2, 3, 4] as Grade[]).map((g) => formatInterval(p[g] - now));
  }, [current, flipped]);

  // Skip cards deleted mid-session.
  useEffect(() => {
    if (inSession && !current) setQueue((q) => q.filter((_, i) => i !== qi));
  }, [inSession, current, qi]);

  // After flipping, pre-focus the grade the typed answer suggests (Nhớ by default).
  useEffect(() => {
    if (flipped) gradeRefs.current[verdict ? SUGGEST[verdict] : 3]?.focus({ preventScroll: true });
  }, [flipped, verdict]);

  const expected = current ? (current.kind === "cloze" ? clozeAnswer(current.front, current.clozeIndex ?? 0) : current.back) : "";

  const flip = () => {
    if (typeAnswer && current) setVerdict(compareAnswer(typed, expected));
    setFlipped(true);
  };

  const start = () => {
    setQueue(shuffle(dueCards(data.cards, Date.now(), deckId).map((c) => c.id)));
    setQi(0);
    setFlipped(false);
    setDone(0);
  };

  const grade = (g: Grade) => {
    if (!current) return;
    const now = Date.now();
    const next = review(current, g, now);
    update((d) => ({
      ...d,
      cards: d.cards.map((c) => (c.id === next.id ? next : c)),
      days: bumpDay(d.days, { reviews: 1, correct: g >= 2 ? 1 : 0 }),
    }));
    if (next.due - now < REQUEUE_WITHIN) setQueue((q) => [...q, next.id]);
    setDone((n) => n + 1);
    setQi((i) => i + 1);
    setFlipped(false);
    setTyped("");
    setVerdict(null);
  };

  useEffect(() => {
    if (!active || !inSession) return;
    const onKey = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement | null)?.tagName ?? "")) return;
      if (e.code === "Space" && !flipped) {
        e.preventDefault();
        flip();
      } else if (flipped && /^[1-4]$/.test(e.key)) grade(Number(e.key) as Grade);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (!inSession) {
    const now = Date.now();
    const dueAll = dueCards(data.cards, now).length;
    const due = dueCards(data.cards, now, deckId).length;
    const decksWithDue = data.decks.map((d) => ({ ...d, due: dueCards(data.cards, now, d.id).length }));

    if (!data.cards.length)
      return (
        <div className="empty">
          <Icon name="layers" />
          <span>Chưa có thẻ nào. Thêm vài thẻ ở bên dưới để bắt đầu ôn.</span>
        </div>
      );

    let status;
    if (done > 0 && due === 0)
      status = (
        <div className="done">
          <Icon name="check" />
          <b>Xong rồi!</b>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Bạn đã ôn {done} lượt. Hẹn gặp lại các thẻ vào ngày ôn tiếp theo.
          </p>
        </div>
      );
    else if (!due) {
      const pool = deckId === "all" ? data.cards : data.cards.filter((c) => c.deckId === deckId);
      status = (
        <div className="done">
          <Icon name="check" />
          <b>Không có thẻ nào đến hạn</b>
          {pool.length > 0 && (
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Lần ôn tiếp theo: {formatDate(Math.min(...pool.map((c) => c.due)))}.
            </p>
          )}
        </div>
      );
    } else
      status = (
        <div className="review-head">
          <span className="big">{due}</span>
          <div className="grow">
            <h3 style={{ margin: 0 }}>thẻ đến hạn ôn</h3>
            <span className="hint">
              Phím tắt: <span className="kbd">{typeAnswer ? "Enter" : "Space"}</span> {typeAnswer ? "kiểm tra" : "lật"} ·{" "}
              <span className="kbd">1</span>–<span className="kbd">4</span> chấm điểm
            </span>
          </div>
          <button type="button" className="btn accent" onClick={start}>
            <Icon name="play" />Bắt đầu ôn
          </button>
        </div>
      );

    return (
      <>
        {data.decks.length > 1 && (
          <div className="deck-pick">
            <label className="f" htmlFor="reviewDeck">Ôn bộ thẻ</label>
            <select id="reviewDeck" value={deckId} onChange={(e) => setDeckId(e.target.value)}>
              <option value="all">Tất cả bộ thẻ ({dueAll} đến hạn)</option>
              {decksWithDue.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.due} đến hạn)
                </option>
              ))}
            </select>
          </div>
        )}
        {status}
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
      </>
    );
  }

  if (!current) return null;
  const deckName = data.decks.find((d) => d.id === current.deckId)?.name;
  return (
    <>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${Math.round((qi / queue.length) * 100)}%` }} />
      </div>
      <div className="flash" aria-live="polite">
        <div className="meta">
          <span className="pill">{qi + 1} / {queue.length}</span>
          {deckName && <span className="pill">{deckName}</span>}
          {current.topic && current.topic !== deckName && <span className="pill">{current.topic}</span>}
          <span className="pill">{STATE_LABEL[current.srs.state]}</span>
        </div>
        <CardFace card={current} revealed={flipped} />
        {flipped && verdict && (
          <div className={`verdict ${verdict}`}>
            <span className="pill">{VERDICT[verdict]}</span>
            {typed.trim() && <span>Bạn trả lời: {typed.trim()}</span>}
          </div>
        )}
      </div>
      {typeAnswer && !flipped && (
        <form
          className="answer-row"
          onSubmit={(e) => {
            e.preventDefault();
            flip();
          }}
        >
          <label className="sr" htmlFor="typedAnswer">Câu trả lời của bạn</label>
          <input id="typedAnswer" type="text" autoFocus autoComplete="off" placeholder="Gõ câu trả lời rồi nhấn Enter" value={typed} onChange={(e) => setTyped(e.target.value)} />
          <button type="submit" className="btn">Kiểm tra</button>
        </form>
      )}
      <div className={`review-actions${flipped ? " grades" : ""}`}>
        {flipped ? (
          ([1, 2, 3, 4] as Grade[]).map((g) => (
            <button
              key={g}
              ref={(el) => {
                gradeRefs.current[g] = el;
              }}
              type="button"
              className={`btn grade ${GRADE_CLASS[g]}`}
              onClick={() => grade(g)}
            >
              <span>
                {GRADE_LABEL[g]} <span className="kbd">{g}</span>
              </span>
              {intervals && <small>{intervals[g - 1]}</small>}
            </button>
          ))
        ) : (
          <button type="button" className={`btn full${typeAnswer ? " ghost" : ""}`} onClick={flip}>
            <Icon name="eye" />
            {typeAnswer ? "Không nhớ, lật thẻ" : "Lật thẻ"}
          </button>
        )}
        <button type="button" className="btn ghost small stop" onClick={() => setQueue([])}>
          Dừng phiên ôn
        </button>
      </div>
    </>
  );
}
