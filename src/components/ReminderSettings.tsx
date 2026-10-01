import { useEffect, useState } from "react";
import { useStore } from "../state/AppStore";
import { useToast } from "../state/Toast";
import { notificationBlocker, requestNotificationPermission, showNotification, type NotifyBlocker } from "../lib/pwa";
import { Icon } from "./Icon";

const BLOCKER_TEXT: Record<Exclude<NotifyBlocker, null>, string> = {
  unsupported: "Trình duyệt này không hỗ trợ thông báo.",
  insecure:
    "Trình duyệt chỉ cho phép thông báo trên trang https hoặc localhost. Bạn đang mở qua http với địa chỉ IP, nên thông báo bị chặn tự động.",
  embedded:
    "Trang đang mở trong khung nhúng (ví dụ Simple Browser của VS Code), nơi thông báo bị chặn sẵn. Hãy mở trang trong Chrome, Edge hoặc Firefox.",
  denied:
    "Bạn đã chặn thông báo cho trang này. Bấm biểu tượng ổ khoá (hoặc ⓘ) cạnh thanh địa chỉ → Thông báo → Cho phép, rồi tải lại trang.",
};

/** Daily review reminder (Notification API). */
export function ReminderSettings() {
  const { data, update } = useStore();
  const toast = useToast();
  const [time, setTime] = useState(data.prefs.reminder || "19:30");
  const [blocker, setBlocker] = useState<NotifyBlocker>(notificationBlocker);
  const [error, setError] = useState("");
  const on = !!data.prefs.reminder;

  // Re-check when the user changes the permission in site settings.
  useEffect(() => {
    let status: PermissionStatus | undefined;
    const refresh = () => setBlocker(notificationBlocker());
    navigator.permissions
      ?.query({ name: "notifications" as PermissionName })
      .then((s) => {
        status = s;
        s.onchange = refresh;
      })
      .catch(() => {});
    window.addEventListener("focus", refresh);
    return () => {
      if (status) status.onchange = null;
      window.removeEventListener("focus", refresh);
    };
  }, []);

  /** Send a test notification so the user sees it works (and OS-level blocks surface now, not at 19:30). */
  const test = async (body: string) => {
    try {
      await showNotification(body);
      setError("");
      return true;
    } catch (e) {
      setError(
        `Trình duyệt không hiện được thông báo (${(e as Error)?.message || "lỗi không rõ"}). ` +
          "Kiểm tra thêm cài đặt thông báo của hệ điều hành cho trình duyệt (Windows: Cài đặt → Hệ thống → Thông báo).",
      );
      return false;
    }
  };

  const enable = async () => {
    setError("");
    let perm: NotificationPermission;
    try {
      perm = await requestNotificationPermission();
    } catch {
      perm = "denied";
    }
    setBlocker(notificationBlocker());
    if (perm === "default")
      return setError("Bạn đã đóng hộp thoại xin quyền mà chưa chọn. Bấm \"Bật nhắc\" lần nữa và chọn \"Cho phép\".");
    if (perm !== "granted") return; // blocker message explains why
    update((d) => ({ ...d, prefs: { ...d.prefs, reminder: time } }));
    if (await test(`Đã bật nhắc ôn lúc ${time} mỗi ngày. Thông báo sẽ trông như thế này.`))
      toast(`Sẽ nhắc ôn lúc ${time} mỗi ngày khi có thẻ đến hạn.`);
  };

  const hardBlocked = blocker === "unsupported" || blocker === "insecure" || blocker === "embedded";

  return (
    <section className="tool-block" aria-labelledby="remTitle">
      <h3 id="remTitle"><Icon name="bell" />Nhắc ôn hằng ngày</h3>
      {blocker === "unsupported" ? (
        <p className="hint">{BLOCKER_TEXT.unsupported}</p>
      ) : (
        <>
          <div className="row">
            <label className="sr" htmlFor="remTime">Giờ nhắc</label>
            <input id="remTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: 140 }} />
            {on ? (
              <>
                {time !== data.prefs.reminder && (
                  <button type="button" className="btn small" onClick={enable}>Lưu giờ mới</button>
                )}
                <button type="button" className="btn ghost small" onClick={() => void test("Thông báo thử từ Hộp công cụ ghi nhớ.")} disabled={!!blocker}>
                  Gửi thử
                </button>
                <button type="button" className="btn ghost small" onClick={() => update((d) => ({ ...d, prefs: { ...d.prefs, reminder: "" } }))}>
                  Tắt nhắc
                </button>
              </>
            ) : (
              // Still clickable when merely "denied": the click re-checks after the user unblocks in site settings.
              <button type="button" className="btn small" onClick={enable} disabled={hardBlocked}>Bật nhắc</button>
            )}
          </div>
          {(blocker || error) && (
            <p className="data-error" role="alert" style={{ marginTop: 10 }}>
              {error || BLOCKER_TEXT[blocker!]}
            </p>
          )}
          <p className="hint" style={{ marginBottom: 0 }}>
            {on && !blocker ? `Đang bật: ${data.prefs.reminder} mỗi ngày. ` : ""}
            Thông báo chỉ hiện khi app hoặc tab còn mở (kể cả chạy nền). Cài app lên màn hình chính để tiện hơn.
          </p>
        </>
      )}
    </section>
  );
}
