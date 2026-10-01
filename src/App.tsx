import { useCallback, useEffect, useRef, type ReactNode } from "react";
import type { TabId } from "./types";
import { useStore } from "./state/AppStore";
import { useHashTab } from "./state/useHashTab";
import { studyQueue } from "./state/selectors";
import { prefersReducedMotion } from "./lib/utils";
import { IconSprite } from "./components/Icon";
import { Header } from "./components/Header";
import { Tabs } from "./components/Tabs";
import { DataTools } from "./components/DataTools";
import { ReminderSettings } from "./components/ReminderSettings";
import { SyncSettings } from "./components/SyncSettings";
import { maybeRemind, setBadge } from "./lib/pwa";
import { MethodsPanel } from "./features/methods/MethodsPanel";
import { FeynmanPanel } from "./features/feynman/FeynmanPanel";
import { CardsPanel } from "./features/cards/CardsPanel";
import { PomodoroPanel } from "./features/pomodoro/PomodoroPanel";
import { PalacePanel } from "./features/palace/PalacePanel";
import { StatsPanel } from "./features/stats/StatsPanel";

export default function App() {
  const { data } = useStore();
  const [tab, setTab] = useHashTab();
  const mainRef = useRef<HTMLElement>(null);
  const due = studyQueue(data).total;

  // App-icon badge + daily reminder check (every minute while open).
  useEffect(() => {
    setBadge(due);
    void maybeRemind(data.prefs.reminder, due);
    const t = setInterval(() => void maybeRemind(data.prefs.reminder, studyQueue(data).total), 60_000);
    return () => clearInterval(t);
  }, [due, data]);

  // Switch tab and, if the user has scrolled past the panels, bring them back into view.
  const go = useCallback(
    (next: TabId) => {
      setTab(next);
      const main = mainRef.current;
      if (!main) return;
      const desktop = window.matchMedia("(min-width:720px)").matches;
      const nav = document.querySelector<HTMLElement>("nav.tabs");
      const top = main.getBoundingClientRect().top + window.scrollY - (desktop && nav ? nav.offsetHeight : 0) - 8;
      if (window.scrollY > top) window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    },
    [setTab],
  );

  // Panels stay mounted (just hidden) so drafts and a running Pomodoro survive tab switches.
  const panel = (id: TabId, children: ReactNode) => (
    <section className="panel" id={`p-${id}`} role="tabpanel" aria-labelledby={id === "stats" ? undefined : `tab-${id}`} aria-label={id === "stats" ? "Thống kê" : undefined} hidden={tab !== id}>
      {children}
    </section>
  );

  return (
    <>
      <IconSprite />
      <Header onGo={go} />
      <Tabs active={tab} onChange={go} badges={{ cards: due }} />
      <main className="wrap" ref={mainRef}>
        {panel("methods", <MethodsPanel onGo={go} />)}
        {panel("feynman", <FeynmanPanel />)}
        {panel("cards", <CardsPanel />)}
        {panel("pomo", <PomodoroPanel />)}
        {panel("palace", <PalacePanel />)}
        {panel("stats", <StatsPanel />)}
      </main>
      <footer>
        <div className="wrap footer-tools">
          <DataTools />
          <ReminderSettings />
          <SyncSettings />
        </div>
      </footer>
    </>
  );
}
