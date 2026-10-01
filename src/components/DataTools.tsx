import { useRef, useState, type ChangeEvent } from "react";
import type { AppData } from "../types";
import { useStore } from "../state/AppStore";
import { useToast } from "../state/Toast";
import { backupFileName, downloadText, mergeData, parseBackup, toBackup } from "../lib/backup";
import { toCsv } from "../lib/csv";
import { Icon } from "./Icon";
import { ConfirmButton } from "./ConfirmButton";

/** Footer tools: backup to JSON, restore (merge or replace), export cards as CSV. */
export function DataTools() {
  const { data, update, syncStatus } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; data: AppData } | null>(null);
  const [error, setError] = useState("");

  const backup = () => {
    downloadText(backupFileName(), JSON.stringify(toBackup(data), null, 2), "application/json");
    toast("Đã tải file sao lưu.");
  };

  const exportCsv = () => {
    if (!data.cards.length) return toast("Chưa có thẻ nào để xuất.");
    const rows = [["Mặt trước", "Mặt sau", "Chủ đề"], ...data.cards.map((c) => [c.front, c.back, c.topic])];
    downloadText(backupFileName().replace(".json", "-the-nho.csv"), toCsv(rows), "text/csv;charset=utf-8");
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setPending(null);
    try {
      setPending({ name: file.name, data: parseBackup(await file.text()) });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const apply = (mode: "merge" | "replace") => {
    if (!pending) return;
    const incoming = pending.data;
    update((d) => (mode === "merge" ? mergeData(d, incoming) : { ...incoming }));
    setPending(null);
    toast(mode === "merge" ? "Đã gộp dữ liệu từ file." : "Đã khôi phục toàn bộ dữ liệu từ file.");
  };

  return (
    <section className="data-tools tool-block" aria-label="Dữ liệu của bạn">
      <div className="sync">
        <span className="dot" aria-hidden="true" />
        <span>{syncStatus}</span>
      </div>
      <div className="row">
        <button type="button" className="btn ghost small" onClick={backup}>
          <Icon name="download" />Sao lưu
        </button>
        <button type="button" className="btn ghost small" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" />Khôi phục
        </button>
        <button type="button" className="btn ghost small" onClick={exportCsv}>
          <Icon name="file" />Xuất thẻ CSV
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
      </div>

      {error && (
        <p className="data-error" role="alert">
          {error} Dữ liệu hiện tại không bị thay đổi.
        </p>
      )}

      {pending && (
        <div className="import-preview" role="region" aria-label="Xem trước dữ liệu khôi phục">
          <p style={{ margin: 0 }}>
            <b>{pending.name}</b> có {pending.data.cards.length} thẻ, {pending.data.notes.length} bài giải thích,{" "}
            {pending.data.palace.length} điểm dừng.
          </p>
          <p className="hint" style={{ margin: "4px 0 12px" }}>
            Gộp: chỉ thêm những mục chưa có. Thay thế: xoá dữ liệu hiện tại ({data.cards.length} thẻ, {data.notes.length}{" "}
            bài, {data.palace.length} điểm dừng) và dùng dữ liệu trong file.
          </p>
          <div className="row">
            <button type="button" className="btn small" onClick={() => apply("merge")}>
              Gộp vào dữ liệu hiện tại
            </button>
            <ConfirmButton className="btn danger small" armedLabel="Chắc chắn thay thế?" onConfirm={() => apply("replace")}>
              Thay thế toàn bộ
            </ConfirmButton>
            <button type="button" className="btn ghost small" onClick={() => setPending(null)}>
              Huỷ
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
