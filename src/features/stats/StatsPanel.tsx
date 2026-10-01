import { useMemo, useRef, useState, type MouseEvent, type FocusEvent } from "react";
import { useStore } from "../../state/AppStore";
import { STATE_LABEL } from "../../lib/srs";
import { accuracy, forecast, heatmap, level, stateCounts, streaks, type HeatCell } from "../../lib/stats";
import { formatDate } from "../../lib/utils";

const WEEKS = 20;
const WEEKDAY = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const dayLabel = (ms: number, i: number) =>
  i === 0 ? "Hôm nay" : i === 1 ? "Mai" : WEEKDAY[(new Date(ms).getDay() + 6) % 7];
const cellText = (c: HeatCell) =>
  `${formatDate(c.date)}: ${c.reviews} lượt ôn, ${c.focus} phiên tập trung`;

/** One tooltip shared by a chart; follows the hovered/focused mark. */
function useTooltip() {
  const wrap = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const show = (text: string) => (e: MouseEvent<Element> | FocusEvent<Element>) => {
    const box = wrap.current?.getBoundingClientRect();
    const r = (e.currentTarget as Element).getBoundingClientRect();
    if (box) setTip({ x: r.left + r.width / 2 - box.left, y: r.top - box.top, text });
  };
  const hide = () => setTip(null);
  const node = tip && (
    <div className="chart-tip" style={{ left: tip.x, top: tip.y }} role="presentation">
      {tip.text}
    </div>
  );
  return { wrap, show, hide, node };
}

export function StatsPanel() {
  const { data } = useStore();
  const now = Date.now();
  const s = streaks(data.days, now);
  const acc = accuracy(data.days, 30, now);
  const states = stateCounts(data.cards);
  const fc = useMemo(() => forecast(data.cards, 7, now), [data.cards, now]);
  const heat = useMemo(() => heatmap(data.days, WEEKS, now), [data.days, now]);
  const heatMax = Math.max(1, ...heat.flat().map((c) => c.value));
  const fcMax = Math.max(1, ...fc.map((d) => d.count));
  const heatTip = useTooltip();
  const fcTip = useTooltip();

  // Month label above the first column whose Monday starts a new month.
  const months = heat.map((w, i) => {
    const m = new Date(w[0].date).getMonth();
    return i === 0 || m !== new Date(heat[i - 1][0].date).getMonth() ? `Th${m + 1}` : "";
  });

  return (
    <>
      <div className="panel-head">
        <h2>Thống kê</h2>
        <p className="lede">Học đều mỗi ngày quan trọng hơn học dồn. Chuỗi ngày tính cả ôn thẻ lẫn phiên Pomodoro.</p>
      </div>

      <div className="stats stats-page">
        <div className="stat static">
          <span className="v">{s.current}</span>
          <span className="k">Chuỗi ngày học{!s.activeToday && s.current > 0 ? " (học hôm nay để giữ chuỗi)" : ""}</span>
        </div>
        <div className="stat static">
          <span className="v">{s.best}</span>
          <span className="k">Chuỗi dài nhất</span>
        </div>
        <div className="stat static">
          <span className="v">{acc.rate === null ? "–" : `${Math.round(acc.rate * 100)}%`}</span>
          <span className="k">Tỉ lệ nhớ 30 ngày ({acc.reviews} lượt ôn)</span>
        </div>
        <div className="stat static">
          <span className="v">{fc[0].count}</span>
          <span className="k">Thẻ cần ôn hôm nay</span>
        </div>
      </div>

      <div className="cols" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Lịch học {WEEKS} tuần</h3>
          <div className="heat-wrap" ref={heatTip.wrap}>
            <div className="heat" aria-hidden="true">
              <div className="heat-months">
                <span />
                {months.map((m, i) => (
                  <span key={i}>{m}</span>
                ))}
              </div>
              <div className="heat-grid">
                <div className="heat-days">
                  {WEEKDAY.map((d, i) => (
                    <span key={d}>{i % 2 === 0 ? d : ""}</span>
                  ))}
                </div>
                {heat.map((week, w) => (
                  <div className="heat-col" key={w}>
                    {week.map((c) => (
                      <i
                        key={c.key}
                        className={c.future ? "future" : `l${level(c.value, heatMax)}`}
                        onMouseEnter={c.future ? undefined : heatTip.show(cellText(c))}
                        onMouseLeave={heatTip.hide}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {heatTip.node}
          </div>
          <div className="heat-legend" aria-hidden="true">
            Ít <i className="l0" /><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /> Nhiều
          </div>
          <details className="more">
            <summary>Xem dạng bảng (các ngày có học)</summary>
            <table className="data-table">
              <thead>
                <tr><th scope="col">Ngày</th><th scope="col">Lượt ôn</th><th scope="col">Nhớ được</th><th scope="col">Phiên tập trung</th></tr>
              </thead>
              <tbody>
                {heat.flat().filter((c) => c.value > 0).reverse().map((c) => (
                  <tr key={c.key}>
                    <td>{formatDate(c.date)}</td><td>{c.reviews}</td><td>{data.days[c.key]?.correct ?? 0}</td><td>{c.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>

        <div className="card">
          <h3>Dự báo 7 ngày tới</h3>
          <div className="fc-wrap" ref={fcTip.wrap}>
            <div className="fc" role="list" aria-label="Số thẻ đến hạn mỗi ngày">
              {fc.map((d, i) => {
                const text = `${dayLabel(d.date, i)} (${formatDate(d.date)}): ${d.count} thẻ${i === 0 ? ", gồm cả thẻ quá hạn" : ""}`;
                return (
                  <div
                    key={d.date}
                    className="fc-col"
                    role="listitem"
                    tabIndex={0}
                    aria-label={text}
                    onMouseEnter={fcTip.show(text)}
                    onMouseLeave={fcTip.hide}
                    onFocus={fcTip.show(text)}
                    onBlur={fcTip.hide}
                  >
                    <div className="fc-bar">
                      <b>{d.count}</b>
                      <span style={{ height: `${(d.count / fcMax) * 100}%` }} />
                    </div>
                    <small>{dayLabel(d.date, i)}</small>
                  </div>
                );
              })}
            </div>
            {fcTip.node}
          </div>
          <p className="hint" style={{ marginBottom: 0 }}>Cột "Hôm nay" gồm cả thẻ quá hạn. Ngày nào quá cao, hãy ôn bớt từ hôm trước.</p>

          <h3 style={{ marginTop: 20 }}>Trạng thái thẻ</h3>
          <dl className="state-grid">
            {([0, 1, 2, 3] as const).map((st) => (
              <div key={st}>
                <dt>{STATE_LABEL[st]}</dt>
                <dd>{states[st]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </>
  );
}
