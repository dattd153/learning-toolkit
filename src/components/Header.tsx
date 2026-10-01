import type { TabId } from "../types";
import { useStore } from "../state/AppStore";
import { dueCards, pomoToday } from "../state/selectors";
import { streaks } from "../lib/stats";
import { Icon } from "./Icon";

export function Header({ onGo }: { onGo: (tab: TabId) => void }) {
  const { data } = useStore();
  const due = dueCards(data.cards).length;
  const streak = streaks(data.days);

  const tiles: { go: TabId; value: number; label: string; hot?: boolean }[] = [
    { go: "cards", value: due, label: "Thẻ cần ôn hôm nay", hot: due > 0 },
    { go: "pomo", value: pomoToday(data), label: "Phiên tập trung hôm nay" },
    { go: "stats", value: streak.current, label: streak.activeToday || !streak.current ? "Chuỗi ngày học" : "Chuỗi ngày học · học hôm nay để giữ" },
    { go: "cards", value: data.cards.length, label: "Tổng số thẻ" },
  ];

  return (
    <header className="top">
      <div className="wrap">
        <div className="brand">
          <div className="logo">
            <Icon name="layers" />
          </div>
          <div>
            <h1>Hộp công cụ ghi nhớ</h1>
            <p>Học ít hơn, nhớ lâu hơn.</p>
          </div>
          <button type="button" className="btn ghost small top-links" onClick={() => onGo("stats")}>
            <Icon name="chart" />Thống kê
          </button>
        </div>
        <p className="intro">
          Những phương pháp học có cơ sở khoa học, gom lại một chỗ, kèm công cụ để dùng ngay: giải thích kiểu Feynman,
          thẻ nhớ ôn ngắt quãng, đồng hồ Pomodoro và cung điện ký ức.
        </p>
        <div className="stats" aria-label="Tổng quan hôm nay">
          {tiles.map((t) => (
            <button key={t.label} type="button" className={`stat${t.hot ? " hot" : ""}`} onClick={() => onGo(t.go)}>
              <span className="v">{t.value}</span>
              <span className="k">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
