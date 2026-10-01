import { useState } from "react";
import { useStore } from "../state/AppStore";
import { useToast } from "../state/Toast";
import { notificationsSupported, requestNotificationPermission } from "../lib/pwa";
import { Icon } from "./Icon";

/** Daily review reminder (Notification API). */
export function ReminderSettings() {
  const { data, update } = useStore();
  const toast = useToast();
  const [time, setTime] = useState(data.prefs.reminder || "19:30");
  const on = !!data.prefs.reminder;
  const supported = notificationsSupported();
  const denied = supported && Notification.permission === "denied";

  const enable = async () => {
    const perm = await requestNotificationPermission();
    if (perm !== "granted") return toast("Trình duyệt chưa cho phép thông báo. Hãy bật trong cài đặt trang.");
    update((d) => ({ ...d, prefs: { ...d.prefs, reminder: time } }));
    toast(`Sẽ nhắc ôn lúc ${time} mỗi ngày khi có thẻ đến hạn.`);
  };

  return (
    <section className="tool-block" aria-labelledby="remTitle">
      <h3 id="remTitle"><Icon name="bell" />Nhắc ôn hằng ngày</h3>
      {!supported ? (
        <p className="hint">Trình duyệt này không hỗ trợ thông báo.</p>
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
                <button type="button" className="btn ghost small" onClick={() => update((d) => ({ ...d, prefs: { ...d.prefs, reminder: "" } }))}>
                  Tắt nhắc
                </button>
              </>
            ) : (
              <button type="button" className="btn small" onClick={enable} disabled={denied}>Bật nhắc</button>
            )}
          </div>
          <p className="hint" style={{ marginBottom: 0 }}>
            {denied
              ? "Thông báo đang bị chặn cho trang này. Hãy cho phép trong cài đặt trình duyệt. "
              : on
                ? `Đang bật: ${data.prefs.reminder} mỗi ngày. `
                : ""}
            Thông báo chỉ hiện khi app hoặc tab còn mở (kể cả chạy nền). Cài app lên màn hình chính để tiện hơn.
          </p>
        </>
      )}
    </section>
  );
}
