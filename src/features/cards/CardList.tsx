import { useState } from "react";
import { useStore } from "../../state/AppStore";
import { Icon } from "../../components/Icon";
import { ConfirmButton } from "../../components/ConfirmButton";

export function CardList() {
  const { data, update } = useStore();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const list = data.cards.filter((c) => !q || `${c.front} ${c.back} ${c.topic}`.toLowerCase().includes(q));

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="row">
        <h3 className="grow" style={{ margin: 0 }}>
          Tất cả thẻ <span className="muted">({data.cards.length})</span>
        </h3>
        <div className="grow search">
          <Icon name="search" />
          <label className="sr" htmlFor="cSearch">Tìm thẻ</label>
          <input type="search" id="cSearch" placeholder="Tìm thẻ" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <ul className="cardlist">
        {list.length === 0 ? (
          <li className="muted" style={{ display: "block", padding: "12px 0" }}>
            {data.cards.length ? "Không có thẻ nào khớp." : "Chưa có thẻ nào."}
          </li>
        ) : (
          list.map((c) => (
            <li key={c.id}>
              <span className="front-col">{c.front}</span>
              <span className="back-col">{c.back}</span>
              <span className="bx">Hộp {c.box}</span>
              <ConfirmButton
                ariaLabel="Xoá thẻ"
                onConfirm={() => update((d) => ({ ...d, cards: d.cards.filter((x) => x.id !== c.id) }))}
              >
                <Icon name="x" />
              </ConfirmButton>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
