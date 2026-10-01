# 8. Backend: đồng bộ thiết bị và AI trên web thường

**Trạng thái:** Xong (2026-10-01).

## Phạm vi
Thư mục `server/` (Node + Hono + SQLite có sẵn trong Node), một tiến trình phục vụ cả API và bản build `dist/`.

### Đồng bộ bằng "mã đồng bộ" (không cần tài khoản)
- Tạo mã: `POST /api/sync` → mã ngẫu nhiên 128-bit. Nhập mã này trên thiết bị khác để dùng chung dữ liệu.
- `GET /api/sync/:code`, `PUT /api/sync/:code` (gửi kèm `baseUpdatedAt`; máy chủ có bản mới hơn → 409, app tải bản mới về).
- Máy chủ chỉ lưu **băm SHA-256 của mã**, giới hạn 2 MB/bản.
- Ai có mã là đọc/ghi được: mã là bí mật, cảnh báo người dùng không chia sẻ.

### AI qua máy chủ
- `POST /api/ai/feynman`, `POST /api/ai/cards`: prompt nằm trên máy chủ (không làm proxy tuỳ ý), giới hạn độ dài đầu vào, giới hạn tần suất theo IP.
- Khoá `ANTHROPIC_API_KEY` chỉ nằm trên máy chủ.
- App tự chọn: chạy trong Claude Artifact → dùng `window.claude`; có máy chủ → dùng API; không có → ẩn tính năng AI.

## Chưa làm (ghi lại)
Web Push để nhắc ôn khi app đã đóng; tài khoản đăng nhập thật.
