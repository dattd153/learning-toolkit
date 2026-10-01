import { useRef, useState, type ChangeEvent } from "react";
import { useStore } from "../../state/AppStore";
import { useToast } from "../../state/Toast";
import { aiErrorMessage } from "../../lib/platform";
import { appendCards } from "../../state/cardActions";
import { parseDelimited } from "../../lib/csv";
import { Icon } from "../../components/Icon";

const cardsPrompt = (notes: string) =>
  `Từ ghi chú học tập dưới đây, hãy soạn từ 5 đến 12 thẻ nhớ theo kiểu gợi nhớ chủ động: mặt trước là một câu hỏi ngắn, cụ thể; mặt sau là đáp án ngắn gọn. Mỗi thẻ chỉ kiểm tra một ý. Viết bằng ngôn ngữ của ghi chú.
Ghi chú:
"""
${notes.slice(0, 8000)}
"""
Chỉ trả về JSON, không thêm gì khác: {"the":[{"truoc":"...","sau":"..."}]}`;

type Proposal = { truoc: string; sau: string };

const HEADER = /^(front|question|mặt trước|câu hỏi)/i;

export function AddCards() {
  const { data, update, sampler } = useStore();
  const toast = useToast();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [topic, setTopic] = useState("");
  const [bulk, setBulk] = useState("");
  const [notes, setNotes] = useState("");
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [genStatus, setGenStatus] = useState("");
  const frontRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Adds cards, skipping duplicates. Returns how many were added. */
  const addMany = (pairs: [string, string, string?][]) => {
    const items = pairs.map(([front, back, tp]) => ({ front, back, topic: tp || topic }));
    const { added } = appendCards(data.cards, items);
    if (added) update((d) => ({ ...d, cards: appendCards(d.cards, items).cards }));
    return added;
  };

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const rows = parseDelimited(await file.text());
    if (rows.length && HEADER.test(rows[0][0]?.trim() ?? "")) rows.shift();
    const pairs = rows
      .filter((r) => r[0]?.trim() && r[1]?.trim())
      .map((r) => [r[0].trim(), r[1].trim(), r[2]?.trim()] as [string, string, string?]);
    if (!pairs.length) return toast("Không đọc được thẻ nào. Cần ít nhất 2 cột: mặt trước, mặt sau.");
    const n = addMany(pairs);
    toast(n === pairs.length ? `Đã nhập ${n} thẻ.` : `Đã nhập ${n} thẻ, bỏ qua ${pairs.length - n} thẻ trùng.`);
  };

  const addOne = () => {
    const f = front.trim(), b = back.trim();
    if (!f || !b) return toast("Cần điền cả hai mặt thẻ.");
    if (!addMany([[f, b]])) return toast("Thẻ này đã có trong bộ thẻ.");
    setFront("");
    setBack("");
    frontRef.current?.focus();
    toast("Đã thêm thẻ.");
  };

  const addBulk = () => {
    const pairs = bulk
      .split("\n")
      .map((l) => l.split("|"))
      .filter((p) => p.length >= 2 && p[0].trim() && p.slice(1).join("|").trim())
      .map((p) => [p[0].trim(), p.slice(1).join("|").trim()] as [string, string]);
    if (!pairs.length) return toast("Không tìm thấy dòng nào có dấu |");
    const n = addMany(pairs);
    setBulk("");
    toast(n === pairs.length ? `Đã thêm ${n} thẻ.` : `Đã thêm ${n} thẻ, bỏ qua ${pairs.length - n} thẻ trùng.`);
  };

  const generate = async () => {
    if (!sampler || !notes.trim()) return toast("Hãy dán ghi chú trước.");
    setProposals(null);
    setGenStatus("Đang soạn thẻ...");
    try {
      const r = (await sampler.json(cardsPrompt(notes.trim()))) as { the?: Proposal[] } | null;
      const list = (Array.isArray(r?.the) ? r!.the : []).filter((x) => x && x.truoc && x.sau);
      setProposals(list);
      setPicked(new Set(list.map((_, i) => i)));
      setGenStatus(list.length ? "" : "Không soạn được thẻ nào từ đoạn này.");
    } catch (e) {
      setGenStatus(aiErrorMessage(e));
    }
  };

  const addPicked = () => {
    if (!proposals) return;
    const chosen = proposals.filter((_, i) => picked.has(i));
    const n = addMany(chosen.map((p) => [String(p.truoc), String(p.sau)] as [string, string]));
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
          <label className="f" htmlFor="cBack">Mặt sau (đáp án)</label>
          <textarea id="cBack" rows={2} style={{ minHeight: 72 }} value={back} onChange={(e) => setBack(e.target.value)} />
        </div>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <div className="grow">
          <label className="sr" htmlFor="cTopic">Chủ đề</label>
          <input type="text" id="cTopic" placeholder="Chủ đề (không bắt buộc)" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
        <button type="button" className="btn" onClick={addOne}>
          <Icon name="plus" />Thêm thẻ
        </button>
      </div>

      <details className="more">
        <summary><Icon name="chev" className="chev" />Thêm nhiều thẻ một lúc</summary>
        <p className="hint" style={{ marginTop: 0 }}>
          Mỗi dòng một thẻ, ngăn cách mặt trước và mặt sau bằng dấu <b>|</b>. Ví dụ: <i>Thủ đô Úc | Canberra</i>
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
          File CSV/TSV: cột 1 mặt trước, cột 2 mặt sau, cột 3 chủ đề (không bắt buộc). Dùng được file xuất từ Anki (Notes in Plain Text).
        </p>
      </details>

      {sampler && (
        <details className="more">
          <summary><Icon name="chev" className="chev" />Tạo thẻ từ ghi chú bằng Claude</summary>
          <p className="hint" style={{ marginTop: 0 }}>
            Dán đoạn ghi chú hoặc bài học, Claude sẽ đề xuất các câu hỏi gợi nhớ. Bạn duyệt lại trước khi thêm.
          </p>
          <label className="sr" htmlFor="cNotes">Ghi chú</label>
          <textarea id="cNotes" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="row" style={{ marginTop: 10 }}>
            <button type="button" className="btn ghost" onClick={generate} disabled={genStatus === "Đang soạn thẻ..."}>
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
