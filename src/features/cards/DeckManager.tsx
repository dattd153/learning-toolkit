import { useState } from "react";
import { useStore } from "../../state/AppStore";
import { useToast } from "../../state/Toast";
import { ensureDeck } from "../../state/cardActions";
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
          const due = cards.filter((c) => c.due <= now).length;
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
                  <small>{cards.length} thẻ{due ? ` · ${due} đến hạn` : ""}</small>
                </button>
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
      <p className="hint" style={{ marginBottom: 0 }}>Bấm vào tên để đổi tên. Xoá bộ thẻ thì thẻ bên trong chuyển về "Chung".</p>
    </div>
  );
}
