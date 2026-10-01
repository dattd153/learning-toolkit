import { dayKey } from "./utils";

/** Register the service worker in production builds only (dev uses Vite's HMR). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline support is best-effort */
    });
  });
}

/** Number of due cards on the installed app icon (Badging API; no-op elsewhere). */
export function setBadge(count: number) {
  const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
  try {
    if (count > 0) void nav.setAppBadge?.(count).catch(() => {});
    else void nav.clearAppBadge?.().catch(() => {});
  } catch {
    /* unsupported */
  }
}

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

/** Why notifications can't work here (null = they can, permission aside). */
export type NotifyBlocker = "unsupported" | "insecure" | "embedded" | "denied" | null;

export function notificationBlocker(): NotifyBlocker {
  if (!notificationsSupported()) return "unsupported";
  // Browsers auto-deny over plain http (except localhost), e.g. http://192.168.x.x from a phone.
  if (!window.isSecureContext) return "insecure";
  if (Notification.permission === "denied") {
    // Embedded views (VS Code Simple Browser, iframes) deny without ever asking.
    try {
      if (window.self !== window.top) return "embedded";
    } catch {
      return "embedded";
    }
    return "denied";
  }
  return null;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/**
 * Show a notification via the service worker when there is one (required on
 * Android, where `new Notification()` throws), else the page-level API.
 * Throws if the browser refuses.
 */
export async function showNotification(body: string, url = "/#cards") {
  const opts = { body, tag: "daily-review", icon: "/icons/icon-192.png" };
  const reg = await navigator.serviceWorker?.getRegistration?.().catch(() => undefined);
  if (reg) return reg.showNotification("Hộp công cụ ghi nhớ", { ...opts, data: { url } });
  const n = new Notification("Hộp công cụ ghi nhớ", opts);
  n.onclick = () => {
    window.focus();
    location.hash = url.split("#")[1] ?? "";
    n.close();
  };
}

const REMINDED = "mtk-reminded";

/**
 * True once per day after the reminder time, when there is something to review.
 * Pure aside from the "already reminded today" marker, so it is easy to test.
 */
export function reminderDue(reminder: string, due: number, now = new Date(), lastReminded: string | null = null) {
  if (!reminder || due <= 0) return false;
  const [h, m] = reminder.split(":").map(Number);
  const at = new Date(now);
  at.setHours(h, m, 0, 0);
  return now >= at && lastReminded !== dayKey(now.getTime());
}

/** Show the daily reminder if it is time. Works while the app/tab is open (incl. background). */
export async function maybeRemind(reminder: string, due: number) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  let last: string | null = null;
  try {
    last = localStorage.getItem(REMINDED);
  } catch {
    /* ignore */
  }
  if (!reminderDue(reminder, due, new Date(), last)) return;
  try {
    await showNotification(`Hôm nay có ${due} thẻ cần ôn. Chỉ vài phút là xong!`);
    // Mark only after it actually showed, so a failure is retried next minute.
    localStorage.setItem(REMINDED, dayKey());
  } catch {
    /* retried on the next check */
  }
}
