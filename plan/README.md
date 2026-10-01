# Lộ trình phát triển

Thứ tự ưu tiên dựa trên: giá trị cho người học so với công sức, và rủi ro hiện tại của app.

| # | Tính năng | Nhóm | Trạng thái | Đặc tả |
|---|---|---|---|---|
| 1 | Sao lưu / khôi phục dữ liệu, nhập thẻ CSV | Nền tảng | Xong | [01-sao-luu-du-lieu.md](01-sao-luu-du-lieu.md) |
| 2 | Kết nối các công cụ với nhau | Phương pháp học | Xong | [02-ket-noi-cong-cu.md](02-ket-noi-cong-cu.md) |
| 3 | Gõ đáp án trước khi lật thẻ | Phương pháp học | Xong | [03-go-dap-an.md](03-go-dap-an.md) |
| 4 | Thống kê, chuỗi ngày học, dự báo thẻ cần ôn 7 ngày | Động lực | Xong | [04-thong-ke.md](04-thong-ke.md) |
| 5 | PWA (cài lên điện thoại, offline) + nhắc ôn | Động lực | Xong | [05-pwa-nhac-on.md](05-pwa-nhac-on.md) |
| 6 | Thuật toán FSRS thay hộp Leitner | Nâng cấp lớn | Xong | [06-fsrs.md](06-fsrs.md) |
| 7 | Bộ thẻ theo môn, thẻ điền chỗ trống (cloze) | Nâng cấp lớn | Xong | [07-bo-the-cloze.md](07-bo-the-cloze.md) |
| 8 | Backend: đồng bộ tài khoản, AI trên web thường | Nâng cấp lớn | Xong | [08-backend.md](08-backend.md) |
| — | Test logic bằng Vitest | Kỹ thuật | Xong | `npm test` |

## Nguyên tắc chung
- Không phá dữ liệu cũ: mọi thay đổi kiểu dữ liệu phải đi qua `normalize()` trong `src/lib/storage.ts`, dữ liệu thiếu trường mới thì lấy giá trị mặc định.
- Giữ design system hiện tại (`src/styles/global.css`): Flat Design, teal + cam, nút ≥ 44px, có trạng thái focus, tôn trọng `prefers-reduced-motion`.
- Không dùng `window.confirm/alert/prompt`; xác nhận ngay trên giao diện (xem `ConfirmButton`).

## Nhật ký
- **2026-10-01** — Xong 1, 2, 3. Kiểm thử end-to-end trên Chromium: 25/25 tiêu chí đạt (nhập CSV có ngoặc kép/xuống dòng, sao lưu → xoá → khôi phục, gộp không trùng, file hỏng không làm mất dữ liệu, gõ đáp án Khớp/Gần đúng/Khác, chỗ bí → thẻ, lộ trình → thẻ, gợi nhớ sau Pomodoro).
- **2026-10-01** — Xong 4–8 và Vitest. 54 unit test (chuyển dữ liệu v1→v2, FSRS, cloze, CSV, thống kê, nhắc ôn, API đồng bộ/AI) chạy đúng ở các múi giờ UTC+7, UTC, UTC−7/−4. Kiểm thử end-to-end trên máy chủ thật: 24/24 (chuyển dữ liệu cũ, 4 mức chấm FSRS, bộ thẻ, cloze, thống kê, offline qua service worker, đồng bộ 2 thiết bị, xử lý xung đột).
  - Chưa kiểm thử với Claude API thật (máy dev không có khoá); phần AI máy chủ đã test bằng dịch vụ giả.
  - Headless Chromium luôn chặn thông báo nên nhắc ôn chỉ kiểm thử bằng unit test + giao diện khi bị chặn.
