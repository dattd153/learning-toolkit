import { useEffect, useState } from "react";
import { useStore } from "../../state/AppStore";
import { useToast } from "../../state/Toast";
import { ensureDeck } from "../../state/cardActions";
import { studyQueue } from "../../state/selectors";
import { DEFAULT_DECK_ID } from "../../lib/storage";
import { Icon } from "../../components/Icon";
import { ConfirmButton } from "../../components/ConfirmButton";

/** List decks with due/total counts; create, rename, delete (cards move to "Chung"). */
export function DeckManager() {
  const { data, update } = useStore();
  const toast = useToast();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const now = Date.now();

  const create = () => {
    const n = name.trim();
    if (!n) return;
    if (data.decks.some((d) => d.name.toLowerCase() === n.toLowerCase())) return toast("Đã có bộ thẻ tên này.");
    update((d) => ({ ...d, decks: ensureDeck(d.decks, n).decks }));
    setName("");
  };

  const rename = (id: string) => {
    const n = draft.trim();
    setEditing(null);
    if (!n) return;
    if (data.decks.some((d) => d.id !== id && d.name.toLowerCase() === n.toLowerCase())) return toast("Đã có bộ thẻ tên này.");
    update((d) => ({ ...d, decks: d.decks.map((x) => (x.id === id ? { ...x, name: n } : x)) }));
  };

  const remove = (id: string) => {
    update((d) => ({
      ...d,
      decks: d.decks.filter((x) => x.id !== id),
      cards: d.cards.map((c) => (c.deckId === id ? { ...c, deckId: DEFAULT_DECK_ID } : c)),
    }));
    toast("Đã xoá bộ thẻ. Các thẻ trong bộ chuyển về \"Chung\".");
  };

  return (
    <div className="card">
      <h3>Bộ thẻ</h3>
      <ul className="decks">
        {data.decks.map((d) => {
          const cards = data.cards.filter((c) => c.deckId === d.id);
          const q = studyQueue(data, d.id, now);
          return (
            <li key={d.id}>
              {editing === d.id ? (
                <form
                  className="row grow"
                  style={{ flexWrap: "nowrap" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    rename(d.id);
                  }}
                >
                  <label className="sr" htmlFor={`deck-${d.id}`}>Tên bộ thẻ</label>
                  <input id={`deck-${d.id}`} type="text" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => rename(d.id)} />
                </form>
              ) : (
                <button type="button" className="deck-name" onClick={() => { setEditing(d.id); setDraft(d.name); }} aria-label={`Đổi tên bộ ${d.name}`}>
                  {d.name}
                  <small>
                    {cards.length} thẻ{q.total ? ` · hôm nay ${q.review.length} ôn + ${q.fresh.length} mới` : ""}
                  </small>
                </button>
              )}
              {editing !== d.id && (
                <NewPerDayInput
                  deckName={d.name}
                  value={d.newPerDay}
                  onCommit={(v) => update((x) => ({ ...x, decks: x.decks.map((k) => (k.id === d.id ? { ...k, newPerDay: v } : k)) }))}
                />
              )}
              {d.id !== DEFAULT_DECK_ID && editing !== d.id && (
                <ConfirmButton ariaLabel={`Xoá bộ ${d.name}`} onConfirm={() => remove(d.id)}>
                  <Icon name="x" />
                </ConfirmButton>
              )}
            </li>
          );
        })}
      </ul>
      <form
        className="row"
        style={{ marginTop: 12, flexWrap: "nowrap" }}
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <label className="sr" htmlFor="newDeck">Tên bộ thẻ mới</label>
        <input id="newDeck" type="text" placeholder="Bộ thẻ mới, ví dụ: Sinh học" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="btn ghost">
          <Icon name="plus" />Tạo
        </button>
      </form>
      <p className="hint" style={{ marginBottom: 0 }}>
        Bấm vào tên để đổi tên. "Mới/ngày" là số thẻ mới tối đa được đưa vào mỗi ngày (thẻ ôn lại không bị giới hạn). Xoá
        bộ thẻ thì thẻ bên trong chuyển về "Chung".
      </p>
    </div>
  );
}

/** Max new cards per day for one deck; commits on blur/Enter, clamped to 0–999. */
function NewPerDayInput({ deckName, value, onCommit }: { deckName: string; value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Math.min(999, Math.max(0, parseInt(draft, 10)));
    if (Number.isNaN(n)) return setDraft(String(value));
    setDraft(String(n));
    if (n !== value) onCommit(n);
  };
  return (
    <label className="deck-limit">
      <input
        type="number"
        min={0}
        max={999}
        inputMode="numeric"
        value={draft}
        aria-label={`Số thẻ mới mỗi ngày của bộ ${deckName}`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
      />
      mới/ngày
    </label>
  );
}
