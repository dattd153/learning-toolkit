import { useStore } from "../../state/AppStore";

const LABELS = ["Hằng ngày", "3 ngày", "1 tuần", "2 tuần", "1 tháng"];

export function BoxChart() {
  const { data } = useStore();
  const counts = [1, 2, 3, 4, 5].map((b) => data.cards.filter((c) => c.box === b).length);
  const max = Math.max(1, ...counts);

  return (
    <div className="boxes">
      {counts.map((n, i) => (
        <div className="boxcol" key={i}>
          <div className="boxbar">
            <span style={{ height: `${Math.round((n / max) * 100)}%` }} />
          </div>
          <b>{n}</b>
          Hộp {i + 1}
          <br />
          {LABELS[i]}
        </div>
      ))}
    </div>
  );
}
