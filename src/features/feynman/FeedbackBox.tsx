import type { Feedback } from "../../types";

function List({ items }: { items?: string[] }) {
  if (!Array.isArray(items) || !items.length) return <p className="muted" style={{ margin: 0 }}>Không có.</p>;
  return (
    <ul>
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

/** Claude's student-style review, or a plain status/error string. */
export function FeedbackBox({ feedback: f }: { feedback: Feedback | string }) {
  if (typeof f === "string") return <div className="fb">{f}</div>;
  return (
    <div className="fb">
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <span className="score">{f.diem}/10</span>
        <span>{f.nhan_xet}</span>
      </div>
      <h4>Chỗ em chưa hiểu</h4>
      <List items={f.cho_chua_ro} />
      <h4>Em muốn hỏi thêm</h4>
      <List items={f.cau_hoi} />
      {f.vi_du_goi_y && (
        <>
          <h4>Gợi ý một ví dụ</h4>
          <p style={{ margin: 0 }}>{f.vi_du_goi_y}</p>
        </>
      )}
    </div>
  );
}
