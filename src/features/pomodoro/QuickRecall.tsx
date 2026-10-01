import { useState } from "react";
import { useStore } from "../../state/AppStore";
import { useToast } from "../../state/Toast";
import { formatDate, uid } from "../../lib/utils";
import { Icon } from "../../components/Icon";

/**
 * Shown after a focus session: a closed-book brain dump (active recall).
 * Saving reuses the Feynman notes list so nothing new is added to the data model.
 */
export function QuickRecall({ task, onClose }: { task: string; onClose: () => void }) {
  const { update } = useStore();
  const toast = useToast();
  const [text, setText] = useState("");

  const save = () => {
    const t = text.trim();
    if (!t) return toast("Hãy viết vài ý trước khi lưu.");
    const concept = task || `Gợi nhớ sau Pomodoro ${formatDate(Date.now())}`;
    update((d) => ({ ...d, notes: [{ id: uid(), concept, text: t, gaps: "", updated: Date.now() }, ...d.notes] }));
    toast("Đã lưu vào Bàn Feynman.");
    onClose();
  };

  return (
    <div className="card recall" role="region" aria-label="Gợi nhớ nhanh">
      <h3>Gợi nhớ nhanh{task ? `: ${task}` : ""}</h3>
      <p className="hint" style={{ marginTop: -6 }}>
        Không mở sách. Viết ra mọi thứ bạn vừa học trong phiên, càng nhiều càng tốt. Chỗ nào không nhớ ra, đó là chỗ cần
        ôn lại.
      </p>
      <label className="sr" htmlFor="recallText">Những gì bạn vừa học</label>
      <textarea id="recallText" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ý chính, công thức, ví dụ..." />
      <div className="row" style={{ marginTop: 12 }}>
        <button type="button" className="btn" onClick={save}>
          <Icon name="save" />Lưu vào Bàn Feynman
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          Bỏ qua
        </button>
      </div>
    </div>
  );
}
