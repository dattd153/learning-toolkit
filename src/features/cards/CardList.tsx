import { useState } from "react";
import { useStore } from "../../state/AppStore";
import { STATE_LABEL } from "../../lib/srs";
import { clozeAnswer, clozePlain } from "../../lib/cloze";
import { formatDate } from "../../lib/utils";
import { Icon } from "../../components/Icon";
import { ConfirmButton } from "../../components/ConfirmButton";
import { CardEditForm } from "./CardEditForm";

export function CardList() {
  const { data, update } = useStore();
  const [query, setQuery] = useState("");
  const [deckId, setDeckId] = useState("all");
  const [editing, setEditing] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const deckName = new Map(data.decks.map((d) => [d.id, d.name]));
  const list = data.cards.filter(
    (c) => (deckId === "all" || c.deckId === deckId) && (!q || `${c.front} ${c.back} ${c.topic}`.toLowerCase().includes(q)),
  );

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="row">
        <h3 className="grow" style={{ margin: 0 }}>
          Tất cả thẻ <span className="muted">({list.length === data.cards.length ? data.cards.length : `${list.length}/${data.cards.length}`})</span>
        </h3>
        {data.decks.length > 1 && (
          <div className="grow">
            <label className="sr" htmlFor="cListDeck">Lọc theo bộ thẻ</label>
            <select id="cListDeck" value={deckId} onChange={(e) => setDeckId(e.target.value)}>
              <option value="all">Mọi bộ thẻ</option>
              {data.decks.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
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
          list.map((c) => {
            const cloze = c.kind === "cloze";
            if (editing === c.id)
              return (
                <li key={c.id} className="editing">
                  <CardEditForm card={c} onDone={() => setEditing(null)} />
                </li>
              );
            return (
              <li key={c.id}>
                <span className="front-col">{cloze ? clozePlain(c.front, c.clozeIndex) : c.front}</span>
                <span className="back-col">{cloze ? clozeAnswer(c.front, c.clozeIndex ?? 0) : c.back}</span>
                <span className="bx" title={`Bộ ${deckName.get(c.deckId) ?? ""} · ôn tiếp: ${formatDate(c.due)}`}>
                  {STATE_LABEL[c.srs.state]}
                </span>
                <button type="button" className="iconbtn" aria-label="Sửa thẻ" onClick={() => setEditing(c.id)}>
                  <Icon name="edit" />
                </button>
                <ConfirmButton ariaLabel="Xoá thẻ" onConfirm={() => update((d) => ({ ...d, cards: d.cards.filter((x) => x.id !== c.id) }))}>
                  <Icon name="x" />
                </ConfirmButton>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
