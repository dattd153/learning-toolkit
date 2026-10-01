import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Grade } from "../../types";
import { useStore } from "../../state/AppStore";
import { bumpDay } from "../../state/selectors";
import { MINUTE } from "../../lib/utils";
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

interface Props {
  /** Card ids to study, already shuffled. */
  initialQueue: string[];
  title: string;
  onClose: () => void;
}

/**
 * Full-screen study mode: only the card and the grade buttons. Grades:
 * 1 Quên · 2 Khó · 3 Nhớ · 4 Dễ. A card graded Quên (or still in a short
 * learning step) comes back before the session ends. Ends on a summary screen.
 */
export function FocusReview({ initialQueue, title, onClose }: Props) {
  const { data, update } = useStore();
  const [queue, setQueue] = useState(initialQueue);
  const [qi, setQi] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const [tally, setTally] = useState({ reviews: 0, correct: 0, learned: 0 });
  const gradeRefs = useRef<Partial<Record<Grade, HTMLButtonElement | null>>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const typeAnswer = data.prefs.typeAnswer;

  const finished = qi >= queue.length;
  const current = finished ? undefined : data.cards.find((c) => c.id === queue[qi]);
  const deckName = current && data.decks.find((d) => d.id === current.deckId)?.name;

  const intervals = useMemo(() => {
    if (!current || !flipped) return null;
    const now = Date.now();
    const p = preview(current, now);
    return ([1, 2, 3, 4] as Grade[]).map((g) => formatInterval(p[g] - now));
  }, [current, flipped]);

  // Lock page scroll and move focus into the dialog while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Skip cards deleted mid-session.
  useEffect(() => {
    if (!finished && !current) setQueue((q) => q.filter((_, i) => i !== qi));
  }, [finished, current, qi]);

  // After flipping, pre-focus the grade the typed answer suggests (Nhớ by default).
  useEffect(() => {
    if (flipped) gradeRefs.current[verdict ? SUGGEST[verdict] : 3]?.focus({ preventScroll: true });
  }, [flipped, verdict]);

  const expected = current ? (current.kind === "cloze" ? clozeAnswer(current.front, current.clozeIndex ?? 0) : current.back) : "";

  const flip = () => {
    if (typeAnswer && current) setVerdict(compareAnswer(typed, expected));
    setFlipped(true);
  };

  const grade = (g: Grade) => {
    if (!current) return;
    const now = Date.now();
    const wasNew = current.srs.state === 0;
    const next = { ...review(current, g, now), introduced: current.introduced ?? now };
    update((d) => ({
      ...d,
      cards: d.cards.map((c) => (c.id === next.id ? next : c)),
      days: bumpDay(d.days, { reviews: 1, correct: g >= 2 ? 1 : 0 }),
    }));
    if (next.due - now < REQUEUE_WITHIN) setQueue((q) => [...q, next.id]);
    setTally((t) => ({ reviews: t.reviews + 1, correct: t.correct + (g >= 2 ? 1 : 0), learned: t.learned + (wasNew ? 1 : 0) }));
    setQi((i) => i + 1);
    setFlipped(false);
    setTyped("");
    setVerdict(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        return onClose();
      }
      if (finished) return;
      if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement | null)?.tagName ?? "")) return;
      if (e.code === "Space" && !flipped) {
        e.preventDefault();
        flip();
      } else if (flipped && /^[1-4]$/.test(e.key)) grade(Number(e.key) as Grade);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const progress = queue.length ? Math.round((Math.min(qi, queue.length) / queue.length) * 100) : 100;

  return createPortal(
    <div className="focus-review" role="dialog" aria-modal="true" aria-label={`Ôn thẻ: ${title}`} ref={dialogRef} tabIndex={-1}>
      <div className="fr-top">
        <div className="fr-title">
          <b>{title}</b>
          <span className="hint">{finished ? "Đã xong" : `Còn ${queue.length - qi} thẻ`}</span>
        </div>
        <button type="button" className="btn ghost small" onClick={onClose}>
          <Icon name="x" />Thoát
        </button>
      </div>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      {finished ? (
        <div className="fr-body">
          <div className="fr-summary">
            <Icon name="check" />
            <h2>Xong phiên ôn!</h2>
            <dl className="state-grid fr-stats">
              <div><dt>Lượt ôn</dt><dd>{tally.reviews}</dd></div>
              <div><dt>Tỉ lệ nhớ</dt><dd>{tally.reviews ? Math.round((tally.correct / tally.reviews) * 100) : 0}%</dd></div>
              <div><dt>Thẻ mới đã học</dt><dd>{tally.learned}</dd></div>
            </dl>
            <p className="muted">Hẹn gặp lại các thẻ vào ngày ôn tiếp theo. Học đều mỗi ngày quan trọng hơn học dồn.</p>
            <button type="button" className="btn" autoFocus onClick={onClose}>Xong</button>
          </div>
        </div>
      ) : current ? (
        <>
          <div className="fr-body">
            <div className="flash fr-card" aria-live="polite">
              <div className="meta">
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
          </div>
          <div className="fr-bottom">
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
                  {!typeAnswer && <span className="kbd">Space</span>}
                </button>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
