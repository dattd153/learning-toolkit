import { useEffect, useRef, useState } from "react";
import { useStore } from "../../state/AppStore";
import { dueCards } from "../../state/selectors";
import { DAY, INTERVALS, formatDate, shuffle } from "../../lib/utils";
import { Icon } from "../../components/Icon";
import { compareAnswer, type AnswerVerdict } from "../../lib/answer";

const VERDICT: Record<AnswerVerdict, string> = { match: "Khớp", close: "Gần đúng", diff: "Khác đáp án", empty: "Bạn chưa trả lời" };

/**
 * Leitner review. A forgotten card goes back to box 1 and to the end of the
 * queue, so a session only ends once every card has been recalled once.
 */
export function ReviewSession({ active }: { active: boolean }) {
  const { data, update } = useStore();
  const [queue, setQueue] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const rememberRef = useRef<HTMLButtonElement>(null);
  const forgotRef = useRef<HTMLButtonElement>(null);
  const typeAnswer = data.prefs.typeAnswer;

  const inSession = qi < queue.length;
  const current = inSession ? data.cards.find((c) => c.id === queue[qi]) : undefined;

  // Skip cards deleted mid-session.
  useEffect(() => {
    if (inSession && !current) setQueue((q) => q.filter((_, i) => i !== qi));
  }, [inSession, current, qi]);

  // After flipping, pre-focus the likely grade: Quên when the typed answer was off.
  useEffect(() => {
    if (!flipped) return;
    const ref = verdict === "diff" || verdict === "empty" ? forgotRef : rememberRef;
    ref.current?.focus({ preventScroll: true });
  }, [flipped, verdict]);

  const flip = () => {
    if (typeAnswer && current) setVerdict(compareAnswer(typed, current.back));
    setFlipped(true);
  };

  const start = () => {
    setQueue(shuffle(dueCards(data.cards).map((c) => c.id)));
    setQi(0);
    setFlipped(false);
    setDone(0);
  };

  const grade = (ok: boolean) => {
    if (!current) return;
    const id = current.id;
    update((d) => ({
      ...d,
      cards: d.cards.map((c) => {
        if (c.id !== id) return c;
        const box = ok ? Math.min(5, c.box + 1) : 1;
        return { ...c, box, due: ok ? Date.now() + INTERVALS[box] * DAY : Date.now() };
      }),
    }));
    if (!ok) setQueue((q) => [...q, id]);
    setDone((n) => n + 1);
    setQi((i) => i + 1);
    setFlipped(false);
    setTyped("");
    setVerdict(null);
  };

  useEffect(() => {
    if (!active || !inSession) return;
    const onKey = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA/.test((document.activeElement as HTMLElement | null)?.tagName ?? "")) return;
      if (e.code === "Space" && !flipped) {
        e.preventDefault();
        flip();
      } else if (flipped && e.key === "1") grade(false);
      else if (flipped && e.key === "2") grade(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (!inSession) {
    const due = dueCards(data.cards).length;
    const toggle = (
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
    );

    let status;
    if (!data.cards.length)
      return (
        <div className="empty">
          <Icon name="layers" />
          <span>Chưa có thẻ nào. Thêm vài thẻ ở bên dưới để bắt đầu ôn.</span>
        </div>
      );
    else if (done > 0 && due === 0)
      status = (
        <div className="done">
          <Icon name="check" />
          <b>Xong rồi!</b>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Bạn đã ôn {done} lượt. Hẹn gặp lại các thẻ vào ngày ôn tiếp theo.
          </p>
        </div>
      );
    else if (!due)
      status = (
        <div className="done">
          <Icon name="check" />
          <b>Không có thẻ nào đến hạn</b>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Lần ôn tiếp theo: {formatDate(Math.min(...data.cards.map((c) => c.due || 0)))}.
          </p>
        </div>
      );
    else
      status = (
        <div className="review-head">
          <span className="big">{due}</span>
          <div className="grow">
            <h3 style={{ margin: 0 }}>thẻ đến hạn ôn</h3>
            <span className="hint">
              Phím tắt: <span className="kbd">{typeAnswer ? "Enter" : "Space"}</span> {typeAnswer ? "kiểm tra" : "lật"} ·{" "}
              <span className="kbd">1</span> Quên · <span className="kbd">2</span> Nhớ
            </span>
          </div>
          <button type="button" className="btn accent" onClick={start}>
            <Icon name="play" />Bắt đầu ôn
          </button>
        </div>
      );

    return (
      <>
        {status}
        {toggle}
      </>
    );
  }

  if (!current) return null;
  return (
    <>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${Math.round((qi / queue.length) * 100)}%` }} />
      </div>
      <div className="flash" aria-live="polite">
        <div className="meta">
          <span className="pill">{qi + 1} / {queue.length}</span>
          {current.topic && <span className="pill">{current.topic}</span>}
          <span className="pill">Hộp {current.box}</span>
        </div>
        <div className="face">{current.front}</div>
        {flipped && <div className="back">{current.back}</div>}
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
      <div className="review-actions">
        {flipped ? (
          <>
            <button ref={forgotRef} type="button" className="btn danger" onClick={() => grade(false)}>
              Quên <span className="kbd">1</span>
            </button>
            <button ref={rememberRef} type="button" className="btn success" onClick={() => grade(true)}>
              Nhớ <span className="kbd">2</span>
            </button>
          </>
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
