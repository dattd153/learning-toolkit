import { useRef, type KeyboardEvent } from "react";
import type { TabId } from "../types";
import { Icon, type IconName } from "./Icon";

export const TABS: { id: TabId; icon: IconName; label: string; short: string }[] = [
  { id: "methods", icon: "book", label: "Phương pháp", short: "Phương pháp" },
  { id: "feynman", icon: "bulb", label: "Bàn Feynman", short: "Feynman" },
  { id: "cards", icon: "layers", label: "Thẻ nhớ", short: "Thẻ nhớ" },
  { id: "pomo", icon: "timer", label: "Pomodoro", short: "Pomodoro" },
  { id: "palace", icon: "pin", label: "Cung điện ký ức", short: "Cung điện" },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  badges?: Partial<Record<TabId, number>>;
}

export function Tabs({ active, onChange, badges = {} }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Roving focus per WAI-ARIA tabs pattern.
  const onKeyDown = (e: KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === active);
    const n = TABS.length;
    const j =
      e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (j < 0) return;
    e.preventDefault();
    refs.current[j]?.focus();
    onChange(TABS[j].id);
  };

  return (
    <nav className="tabs" aria-label="Công cụ">
      <div className="wrap tablist" role="tablist" onKeyDown={onKeyDown}>
        {TABS.map((t, i) => {
          const selected = t.id === active;
          const badge = badges[t.id] ?? 0;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              className="tab"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`p-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(t.id)}
            >
              <Icon name={t.icon} />
              <span className="l-long">{t.label}</span>
              <span className="l-short">{t.short}</span>
              {badge > 0 && <span className="badge">{badge}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
