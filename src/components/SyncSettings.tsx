import { useState } from "react";
import { useStore } from "../state/AppStore";
import { useToast } from "../state/Toast";
import { ApiError } from "../lib/server";
import { Icon } from "./Icon";
import { ConfirmButton } from "./ConfirmButton";

const LABEL = { idle: "Đã đồng bộ", syncing: "Đang đồng bộ…", offline: "Mất mạng, sẽ đồng bộ lại sau", error: "Lỗi đồng bộ, sẽ thử lại" } as const;
const group = (code: string) => code.match(/.{1,4}/g)?.join("-") ?? code;

/** Device sync through the backend using a secret sync code. Hidden when no backend is reachable. */
export function SyncSettings() {
  const { sync } = useStore();
  const toast = useToast();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState(false);
  if (!sync) return null;
  const s = sync.state;

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast(ok);
      setInput("");
    } catch (e) {
      toast(e instanceof ApiError && e.code === "not_found" ? "Không tìm thấy mã đồng bộ này." : "Chưa kết nối được máy chủ, thử lại sau.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="tool-block" aria-labelledby="syncTitle">
      <h3 id="syncTitle"><Icon name="cloud" />Đồng bộ giữa các thiết bị</h3>
      {s.kind === "off" ? (
        <>
          <p className="hint" style={{ marginTop: 0 }}>
            Tạo mã đồng bộ ở thiết bị này, rồi nhập mã đó ở điện thoại hoặc máy khác để dùng chung dữ liệu. Không cần tài khoản.
          </p>
          <div className="row">
            <button type="button" className="btn small" disabled={busy} onClick={() => run(sync.create, "Đã tạo mã đồng bộ.")}>
              Tạo mã đồng bộ
            </button>
          </div>
          <form
            className="row"
            style={{ marginTop: 10 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) void run(() => sync.connect(input), "Đã kết nối. Dữ liệu hai bên đã được gộp.");
            }}
          >
            <label className="sr" htmlFor="syncCode">Mã đồng bộ</label>
            <input id="syncCode" type="text" autoComplete="off" spellCheck={false} placeholder="Nhập mã từ thiết bị khác" value={input} onChange={(e) => setInput(e.target.value)} style={{ flex: "1 1 220px" }} />
            <button type="submit" className="btn ghost small" disabled={busy || !input.trim()}>Kết nối</button>
          </form>
        </>
      ) : (
        <>
          <p style={{ margin: "0 0 8px" }}>
            <span className={`sync-pill ${s.kind}`}>{s.kind === "conflict" ? "Cần chọn bản dữ liệu" : LABEL[s.kind]}</span>
          </p>
          {s.kind === "conflict" && (
            <div className="import-preview" style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 4px" }}>
                <b>Dữ liệu trên máy chủ đã thay đổi</b> trong khi máy này cũng có thay đổi chưa đồng bộ.
              </p>
              <p className="hint" style={{ margin: "0 0 10px" }}>
                Máy chủ: {s.remote.cards.length} thẻ, {s.remote.notes.length} bài. Máy này: chọn cách xử lý bên dưới.
              </p>
              <div className="row">
                <button type="button" className="btn small" onClick={() => sync.resolve("merge")}>Gộp cả hai</button>
                <button type="button" className="btn ghost small" onClick={() => sync.resolve("remote")}>Dùng bản trên máy chủ</button>
                <ConfirmButton className="btn danger small" armedLabel="Ghi đè máy chủ?" onConfirm={() => sync.resolve("local")}>
                  Giữ bản máy này
                </ConfirmButton>
              </div>
            </div>
          )}
          <div className="row">
            <code className="sync-code" aria-label="Mã đồng bộ">{reveal ? group(s.code) : "••••-••••-••••-••••"}</code>
            <button type="button" className="btn ghost small" onClick={() => setReveal((r) => !r)}>
              <Icon name="eye" />{reveal ? "Ẩn mã" : "Hiện mã"}
            </button>
            <ConfirmButton className="btn ghost small" armedLabel="Ngắt kết nối?" onConfirm={sync.disconnect}>
              Ngắt đồng bộ
            </ConfirmButton>
          </div>
          <p className="hint" style={{ marginBottom: 0 }}>
            Ai có mã này đều xem và sửa được dữ liệu của bạn. Đừng chia sẻ mã cho người khác.
          </p>
        </>
      )}
    </section>
  );
}
