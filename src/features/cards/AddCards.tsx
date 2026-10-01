import { useRef, useState, type ChangeEvent } from "react";
import type { CardProposal } from "../../../shared/prompts";
import { useStore } from "../../state/AppStore";
import { useToast } from "../../state/Toast";
import { addCardsToNamedDecks, type NewCard } from "../../state/cardActions";
import { aiErrorMessage } from "../../lib/platform";
import { parseDelimited } from "../../lib/csv";
import { clozeCount, hasCloze } from "../../lib/cloze";
import { DEFAULT_DECK_ID } from "../../lib/storage";
import { Icon } from "../../components/Icon";

const HEADER = /^(front|question|mặt trước|câu hỏi)/i;

export function AddCards() {
  const { data, update, ai } = useStore();
  const toast = useToast();
  const [deckId, setDeckId] = useState(DEFAULT_DECK_ID);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [bulk, setBulk] = useState("");
  const [notes, setNotes] = useState("");
  const [proposals, setProposals] = useState<CardProposal[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const frontRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fall back to "Chung" if the selected deck was deleted.
  const targetDeck = data.decks.some((d) => d.id === deckId) ? deckId : DEFAULT_DECK_ID;
  const isCloze = hasCloze(front);

  /** Adds cards (into the selected deck unless a deck name is given), skipping duplicates. */
  const addMany = (items: (NewCard & { deckName?: string })[]) => {
    const withDeck = items.map((it) => (it.deckName ? it : { ...it, deckId: targetDeck }));
    const { added } = addCardsToNamedDecks(data, withDeck);
    if (added) update((d) => addCardsToNamedDecks(d, withDeck).data);
    return added;
  };

  const report = (added: number, total: number, verb = "thêm") =>
    toast(added === total ? `Đã ${verb} ${added} thẻ.` : `Đã ${verb} ${added} thẻ, bỏ qua ${total - added} thẻ trùng.`);

  const addOne = () => {
    const f = front.trim(), b = back.trim();
    if (!f || (!isCloze && !b)) return toast(isCloze ? "Cần có mặt trước." : "Cần điền cả hai mặt thẻ.");
    const n = addMany([{ front: f, back: b }]);
    if (!n) return toast("Thẻ này đã có trong bộ thẻ.");
    setFront("");
    setBack("");
    frontRef.current?.focus();
    toast(isCloze ? `Đã tạo ${n} thẻ điền chỗ trống.` : "Đã thêm thẻ.");
  };

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const rows = parseDelimited(await file.text());
    if (rows.length && HEADER.test(rows[0][0]?.trim() ?? "")) rows.shift();
    const items = rows
      .filter((r) => r[0]?.trim() && (r[1]?.trim() || hasCloze(r[0])))
      .map((r) => ({ front: r[0].trim(), back: (r[1] ?? "").trim(), deckName: r[2]?.trim() || undefined }));
    if (!items.length) return toast("Không đọc được thẻ nào. Cần ít nhất 2 cột: mặt trước, mặt sau.");
    report(addMany(items), expectedCount(items), "nhập");
  };

  const addBulk = () => {
    const items = bulk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [f, ...rest] = l.split("|");
        return { front: f.trim(), back: rest.join("|").trim() };
      })
      .filter((it) => it.front && (it.back || hasCloze(it.front)));
    if (!items.length) return toast("Không tìm thấy dòng nào có dấu | hoặc {{...}}");
    const n = addMany(items);
    setBulk("");
    report(n, expectedCount(items));
  };

  const generate = async () => {
    if (!ai || !notes.trim()) return toast("Hãy dán ghi chú trước.");
    setProposals(null);
    setGenerating(true);
    setGenStatus("Đang soạn thẻ...");
    try {
      const list = await ai.cards(notes.trim());
      setProposals(list);
      setPicked(new Set(list.map((_, i) => i)));
      setGenStatus(list.length ? "" : "Không soạn được thẻ nào từ đoạn này.");
    } catch (e) {
      setGenStatus(aiErrorMessage(e));
    } finally {
      setGenerating(false);
    }
  };

  const addPicked = () => {
    if (!proposals) return;
    const n = addMany(proposals.filter((_, i) => picked.has(i)).map((p) => ({ front: p.truoc, back: p.sau })));
    setProposals(null);
    setNotes("");
    toast(`Đã thêm ${n} thẻ.`);
  };

  const togglePick = (i: number) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className="card">
      <h3>Thêm thẻ</h3>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div className="grow">
          <label className="f" htmlFor="cFront">Mặt trước (câu hỏi)</label>
          <textarea ref={frontRef} id="cFront" rows={2} style={{ minHeight: 72 }} value={front} onChange={(e) => setFront(e.target.value)} />
        </div>
        <div className="grow">
          <label className="f" htmlFor="cBack">
            Mặt sau {isCloze ? <span className="hint">(ghi chú thêm, không bắt buộc)</span> : "(đáp án)"}
          </label>
          <textarea id="cBack" rows={2} style={{ minHeight: 72 }} value={back} onChange={(e) => setBack(e.target.value)} />
        </div>
      </div>
      <p className="hint" style={{ margin: "6px 0 0" }}>
        {isCloze ? (
          <>Thẻ điền chỗ trống: sẽ tạo {clozeCount(front)} thẻ, mỗi thẻ ẩn một chỗ <b>{"{{...}}"}</b>.</>
        ) : (
          <>Mẹo: viết <b>{"{{...}}"}</b> ở mặt trước để tạo thẻ điền chỗ trống, ví dụ <i>Thủ đô của Úc là {"{{Canberra}}"}</i>.</>
        )}
      </p>
      <div className="row" style={{ marginTop: 10 }}>
        <div className="grow">
          <label className="sr" htmlFor="cDeck">Bộ thẻ</label>
          <select id="cDeck" value={targetDeck} onChange={(e) => setDeckId(e.target.value)}>
            {data.decks.map((d) => (
              <option key={d.id} value={d.id}>Bộ thẻ: {d.name}</option>
            ))}
          </select>
        </div>
        <button type="button" className="btn" onClick={addOne}>
          <Icon name="plus" />Thêm thẻ
        </button>
      </div>

      <details className="more">
        <summary><Icon name="chev" className="chev" />Thêm nhiều thẻ một lúc</summary>
        <p className="hint" style={{ marginTop: 0 }}>
          Mỗi dòng một thẻ, ngăn cách mặt trước và mặt sau bằng dấu <b>|</b> (ví dụ: <i>Thủ đô Úc | Canberra</i>), hoặc một
          câu có <b>{"{{...}}"}</b>.
        </p>
        <label className="sr" htmlFor="cBulk">Danh sách thẻ</label>
        <textarea id="cBulk" rows={5} value={bulk} onChange={(e) => setBulk(e.target.value)} />
        <div className="row" style={{ marginTop: 10 }}>
          <button type="button" className="btn ghost" onClick={addBulk}>Nhập các thẻ</button>
          <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" />Nhập từ file CSV/TSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" hidden onChange={importFile} />
        </div>
        <p className="hint" style={{ marginBottom: 0 }}>
          File CSV/TSV: cột 1 mặt trước, cột 2 mặt sau, cột 3 tên bộ thẻ (không bắt buộc, tự tạo nếu chưa có). Dùng được
          file xuất từ Anki (Notes in Plain Text).
        </p>
      </details>

      {ai && (
        <details className="more">
          <summary><Icon name="chev" className="chev" />Tạo thẻ từ ghi chú bằng Claude</summary>
          <p className="hint" style={{ marginTop: 0 }}>
            Dán đoạn ghi chú hoặc bài học, Claude sẽ đề xuất các câu hỏi gợi nhớ. Bạn duyệt lại trước khi thêm.
          </p>
          <label className="sr" htmlFor="cNotes">Ghi chú</label>
          <textarea id="cNotes" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="row" style={{ marginTop: 10 }}>
            <button type="button" className="btn ghost" onClick={generate} disabled={generating}>
              <Icon name="spark" />Đề xuất thẻ
            </button>
          </div>
          {genStatus && <p className="hint">{genStatus}</p>}
          {proposals && proposals.length > 0 && (
            <>
              <ul className="cardlist pick">
                {proposals.map((p, i) => (
                  <li key={i}>
                    <input type="checkbox" checked={picked.has(i)} onChange={() => togglePick(i)} aria-label={`Chọn thẻ ${i + 1}`} />
                    <span className="front-col">{p.truoc}</span>
                    <span className="back-col">{p.sau}</span>
                  </li>
                ))}
              </ul>
              <div className="row" style={{ marginTop: 10 }}>
                <button type="button" className="btn" onClick={addPicked}>Thêm các thẻ đã chọn</button>
              </div>
            </>
          )}
        </details>
      )}
    </div>
  );
}

/** Cards a list of items would create (cloze text expands to one card per {{...}}). */
const expectedCount = (items: NewCard[]) => items.reduce((n, it) => n + (hasCloze(it.front) ? clozeCount(it.front) : 1), 0);
