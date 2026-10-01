import { useEffect, useRef, useState } from "react";
import type { Settings } from "../../types";
import { useStore } from "../../state/AppStore";
import { useToast } from "../../state/Toast";
import { pomoToday } from "../../state/selectors";
import { formatClock, todayKey } from "../../lib/utils";
import { Icon } from "../../components/Icon";
import { beep, unlockAudio } from "./beep";

type Mode = keyof Settings;
const MODE_LABEL: Record<Mode, string> = { focus: "Tập trung", short: "Nghỉ ngắn", long: "Nghỉ dài" };
const CIRC = 2 * Math.PI * 52;
const MAX: Record<Mode, number> = { focus: 120, short: 60, long: 60 };

export function PomodoroPanel() {
  const { data, update } = useStore();
  const toast = useToast();
  const { settings } = data;
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(settings.focus * 60);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [task, setTask] = useState("");
  const dataRef = useRef(data);
  dataRef.current = data;

  const running = endAt !== null;
  const total = settings[mode] * 60;
  const today = pomoToday(data);

  const switchMode = (m: Mode) => {
    setEndAt(null);
    setMode(m);
    setRemaining(dataRef.current.settings[m] * 60);
  };

  useEffect(() => {
    if (endAt === null) return;
    const id = setInterval(() => {
      const r = (endAt - Date.now()) / 1000;
      if (r > 0) return setRemaining(r);
      clearInterval(id);
      beep();
      if (mode === "focus") {
        const count = pomoToday(dataRef.current) + 1;
        update((d) => ({ ...d, pomo: { date: todayKey(), count } }));
        toast("Hết phiên tập trung. Nghỉ chút nhé!");
        switchMode(count % 4 === 0 ? "long" : "short");
      } else {
        toast("Hết giờ nghỉ. Sẵn sàng phiên tiếp theo.");
        switchMode("focus");
      }
    }, 250);
    return () => clearInterval(id);
    // Only restart the interval when the timer (endAt) or mode changes; other values are read fresh via refs/updaters.
  }, [endAt, mode]);

  useEffect(() => {
    document.title = running ? `${formatClock(remaining)} · ${MODE_LABEL[mode]}` : "Hộp công cụ ghi nhớ";
  }, [running, remaining, mode]);
  useEffect(() => () => void (document.title = "Hộp công cụ ghi nhớ"), []);

  const toggle = () => {
    unlockAudio();
    if (running) {
      setEndAt(null);
      return;
    }
    setEndAt(Date.now() + remaining * 1000);
  };

  const setSetting = (k: Mode, v: number) => {
    update((d) => ({ ...d, settings: { ...d.settings, [k]: v } }));
    if (!running && mode === k) setRemaining(v * 60);
  };

  const startLabel = running ? "Tạm dừng" : remaining < total ? "Tiếp tục" : "Bắt đầu";
  const dots = Math.min(today, 16);

  return (
    <>
      <div className="panel-head">
        <h2>Đồng hồ Pomodoro</h2>
        <p className="lede">
          Tập trung trọn vẹn một khoảng ngắn, rồi nghỉ thật sự. Sau bốn phiên, nghỉ dài hơn. Trong lúc nghỉ, thử nhắm
          mắt nhớ lại những gì vừa học.
        </p>
      </div>
      <div className="card pomo">
        <div className={`ring${mode !== "focus" ? " rest" : ""}`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-2)" strokeWidth="9" />
            <circle
              cx="60" cy="60" r="52" fill="none" strokeWidth="9" strokeLinecap="round"
              stroke={mode === "focus" ? "var(--primary)" : "var(--success)"}
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - remaining / total)}
            />
          </svg>
          <div className="time">
            <b aria-live="polite">{formatClock(remaining)}</b>
            <span>{MODE_LABEL[mode]}</span>
          </div>
        </div>
        <div>
          <div className="seg modes" role="group" aria-label="Chế độ">
            {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
              <button key={m} type="button" className="chip" aria-pressed={m === mode} onClick={() => switchMode(m)}>
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>
          <label className="f" htmlFor="pTask">Đang làm gì?</label>
          <input type="text" id="pTask" placeholder="Ví dụ: Ôn chương 3 Sinh học" value={task} onChange={(e) => setTask(e.target.value)} />
          <div className="row" style={{ marginTop: 14 }}>
            <button type="button" className="btn accent" style={{ minWidth: 140 }} onClick={toggle}>
              <Icon name={running ? "pause" : "play"} />
              {startLabel}
            </button>
            <button type="button" className="btn ghost" onClick={() => switchMode(mode)}>
              <Icon name="reset" />Đặt lại
            </button>
          </div>
          <p style={{ margin: "20px 0 6px", fontWeight: 600 }}>Phiên tập trung hôm nay</p>
          <div className="sessions">
            {today ? (
              <>
                {Array.from({ length: dots }, (_, i) => (
                  <i key={i} className={(i + 1) % 4 === 0 && i + 1 < dots ? "set" : undefined} />
                ))}
                <span className="hint" style={{ marginLeft: 6 }}>{today} phiên</span>
              </>
            ) : (
              <span className="hint">Chưa có phiên nào.</span>
            )}
          </div>
          <div className="settings">
            <MinutesInput id="sFocus" label="Tập trung (phút)" value={settings.focus} max={MAX.focus} onCommit={(v) => setSetting("focus", v)} />
            <MinutesInput id="sShort" label="Nghỉ ngắn" value={settings.short} max={MAX.short} onCommit={(v) => setSetting("short", v)} />
            <MinutesInput id="sLong" label="Nghỉ dài" value={settings.long} max={MAX.long} onCommit={(v) => setSetting("long", v)} />
          </div>
        </div>
      </div>
    </>
  );
}

function MinutesInput({ id, label, value, max, onCommit }: { id: string; label: string; value: number; max: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const onChange = (v: string) => {
    setDraft(v);
    const n = parseInt(v, 10);
    if (n >= 1 && n <= max && n !== value) onCommit(n);
  };
  const onBlur = () => {
    const n = Math.min(max, Math.max(1, parseInt(draft, 10) || value));
    setDraft(String(n));
    if (n !== value) onCommit(n);
  };

  return (
    <div>
      <label className="f" htmlFor={id}>{label}</label>
      <input type="number" id={id} min={1} max={max} inputMode="numeric" value={draft} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
    </div>
  );
}
