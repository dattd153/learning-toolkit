import { useState } from "react";
import type { TabId } from "../../types";
import { EV, GOALS, METHODS, TOOL_NAME, inGoal, type GoalFilter, type Method } from "../../data/methods";
import { Icon } from "../../components/Icon";

export function MethodsPanel({ onGo }: { onGo: (tab: TabId) => void }) {
  const [goal, setGoal] = useState<GoalFilter>("all");
  const list = METHODS.filter((m) => inGoal(m, goal));

  return (
    <>
      <div className="panel-head">
        <h2>Thư viện phương pháp</h2>
        <p className="lede">
          Chọn mục tiêu để lọc. Mức bằng chứng dựa trên các tổng quan nghiên cứu về kỹ thuật học tập (nổi bật là tổng
          quan của Dunlosky và cộng sự, 2013). Mục "Nên tránh" liệt kê những cách học rất phổ biến nhưng hiệu quả thấp,
          kèm cách làm thay thế.
        </p>
      </div>

      <div className="seg" role="group" aria-label="Lọc theo mục tiêu">
        {(Object.keys(GOALS) as GoalFilter[]).map((g) => (
          <button
            key={g}
            type="button"
            className={`chip${g === "tranh" ? " avoid" : ""}`}
            aria-pressed={g === goal}
            onClick={() => setGoal(g)}
          >
            {GOALS[g]}
            <span className="n">{METHODS.filter((m) => inGoal(m, g)).length}</span>
          </button>
        ))}
      </div>

      <div className="methods">
        {list.map((m) => (
          <MethodCard key={m.en} method={m} onGo={onGo} />
        ))}
      </div>
    </>
  );
}

function MethodCard({ method: m, onGo }: { method: Method; onGo: (tab: TabId) => void }) {
  const avoid = m.goal.includes("tranh");
  return (
    <details className="m">
      <summary>
        <span className="m-name">
          {m.name}
          <small>{m.en}</small>
        </span>
        <Icon name="chev" className="chev" />
        <span className="m-what">{m.what}</span>
        <span className="m-foot">
          <span className={`ev ${m.ev}`}>
            <span className="bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {EV[m.ev]}
          </span>
        </span>
      </summary>
      <div className="m-body">
        {avoid && <p className="instead">Thay vào đó, hãy:</p>}
        <ol>
          {m.steps.map((s) => (
            <li key={s}>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <div className="m-tip">
          <Icon name="bulb" />
          <span>{m.tip}</span>
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          {m.tool && (
            <button type="button" className="btn small" onClick={() => onGo(m.tool!)}>
              {TOOL_NAME[m.tool]}
              <Icon name="arrow" />
            </button>
          )}
          {!avoid && <span className="tags">Mục tiêu: {m.goal.map((g) => GOALS[g]).join(", ")}</span>}
        </div>
      </div>
    </details>
  );
}
