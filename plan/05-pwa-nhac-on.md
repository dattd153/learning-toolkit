# 5. PWA và nhắc ôn

**Trạng thái:** Xong (2026-10-01).

## Phạm vi
- **Cài đặt được** (manifest + icon + service worker): mở như app riêng, chạy offline sau lần mở đầu.
- **Chiến lược cache**: trang HTML network-first (luôn lấy bản mới khi có mạng), file build `/assets/*` cache-first (tên file đã có hash), Google Fonts stale-while-revalidate.
- **Huy hiệu số thẻ cần ôn** trên icon app (Badging API, nơi trình duyệt hỗ trợ).
- **Nhắc ôn hằng ngày**: người dùng chọn giờ; đến giờ mà có thẻ đến hạn thì hiện thông báo (Notification API qua service worker).

## Giới hạn (nói rõ với người dùng)
Không có máy chủ gửi push nên thông báo chỉ hiện khi app/tab còn đang mở (kể cả chạy nền). Nhắc khi app đã đóng hẳn cần Web Push qua backend (mục 8) — ghi lại làm bước sau.
