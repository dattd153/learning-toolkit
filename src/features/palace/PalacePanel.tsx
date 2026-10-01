import { useRef, useState } from "react";
import { useStore } from "../../state/AppStore";
import { useToast } from "../../state/Toast";
import { uid } from "../../lib/utils";
import { Icon } from "../../components/Icon";
import { ConfirmButton } from "../../components/ConfirmButton";

export function PalacePanel() {
  const { data, update } = useStore();
  const toast = useToast();
  const [place, setPlace] = useState("");
  const [item, setItem] = useState("");
  const [image, setImage] = useState("");
  const [practice, setPractice] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const placeRef = useRef<HTMLInputElement>(null);
  const stops = data.palace;

  const add = () => {
    const p = place.trim(), it = item.trim();
    if (!p || !it) return toast("Cần có điểm dừng và thứ cần nhớ.");
    update((d) => ({ ...d, palace: [...d.palace, { id: uid(), place: p, item: it, image: image.trim() }] }));
    setPlace("");
    setItem("");
    setImage("");
    placeRef.current?.focus();
  };

  const move = (i: number, j: number) =>
    update((d) => {
      if (j < 0 || j >= d.palace.length) return d;
      const palace = [...d.palace];
      [palace[i], palace[j]] = [palace[j], palace[i]];
      return { ...d, palace };
    });

  const togglePractice = () => {
    setPractice((p) => !p);
    setRevealed(new Set());
  };

  return (
    <>
      <div className="panel-head">
        <h2>Cung điện ký ức</h2>
        <p className="lede">
          Chọn một lộ trình bạn thuộc lòng (từ cổng nhà vào bếp chẳng hạn). Đặt mỗi thứ cần nhớ vào một điểm dừng, kèm
          một hình ảnh thật kỳ quặc, sống động. Khi cần nhớ, chỉ việc "đi dạo" lại trong đầu.
        </p>
      </div>
      <div className="cols">
        <div className="card">
          {stops.length === 0 ? (
            <div className="empty">
              <Icon name="pin" />
              <span>Lộ trình đang trống. Thêm điểm dừng đầu tiên, ví dụ "Cổng nhà".</span>
            </div>
          ) : (
            <>
              <h3>
                Lộ trình của bạn <span className="muted">({stops.length} điểm)</span>
              </h3>
              <ol className="route">
                {stops.map((s, i) => {
                  const hidden = practice && !revealed.has(s.id);
                  return (
                    <li key={s.id}>
                      <span className="no" aria-hidden="true">{i + 1}</span>
                      <div>
                        <div className="place">{s.place}</div>
                        {hidden ? (
                          <button type="button" className="item hidden" style={{ border: 0 }} onClick={() => setRevealed((r) => new Set(r).add(s.id))}>
                            <Icon name="eye" />Chạm để xem
                          </button>
                        ) : (
                          <>
                            <span className="item">{s.item}</span>
                            {s.image && !practice && <div className="img">{s.image}</div>}
                          </>
                        )}
                      </div>
                      <div className="ctrls">
                        {!practice && (
                          <>
                            <button type="button" className="iconbtn" aria-label="Chuyển lên" disabled={i === 0} onClick={() => move(i, i - 1)}>
                              <Icon name="up" />
                            </button>
                            <button type="button" className="iconbtn" aria-label="Chuyển xuống" disabled={i === stops.length - 1} onClick={() => move(i, i + 1)}>
                              <Icon name="down" />
                            </button>
                            <ConfirmButton ariaLabel="Xoá điểm dừng" onConfirm={() => update((d) => ({ ...d, palace: d.palace.filter((x) => x.id !== s.id) }))}>
                              <Icon name="x" />
                            </ConfirmButton>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>

        <div className="card">
          <h3>Thêm điểm dừng</h3>
          <label className="f" htmlFor="lPlace">Điểm dừng</label>
          <input ref={placeRef} type="text" id="lPlace" placeholder="Cửa chính" value={place} onChange={(e) => setPlace(e.target.value)} />
          <div className="spacer" />
          <label className="f" htmlFor="lItem">Thứ cần nhớ</label>
          <input type="text" id="lItem" placeholder="Kali (K)" value={item} onChange={(e) => setItem(e.target.value)} />
          <div className="spacer" />
          <label className="f" htmlFor="lImg">Hình ảnh liên tưởng</label>
          <input type="text" id="lImg" placeholder="Một quả chuối khổng lồ (giàu kali) chặn ngang cửa" value={image} onChange={(e) => setImage(e.target.value)} />
          <div className="row" style={{ marginTop: 16 }}>
            <button type="button" className="btn" onClick={add}>
              <Icon name="plus" />Thêm
            </button>
            <button type="button" className="btn ghost" aria-pressed={practice} onClick={togglePractice}>
              <Icon name={practice ? "x" : "eye"} />
              {practice ? "Thoát luyện tập" : "Luyện tập"}
            </button>
          </div>
          {stops.length > 0 && (
            <div className="row" style={{ marginTop: 10 }}>
              <ConfirmButton className="btn danger small" armedLabel="Xoá hết?" onConfirm={() => update((d) => ({ ...d, palace: [] }))}>
                <Icon name="trash" />Xoá lộ trình
              </ConfirmButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
