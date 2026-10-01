# Lộ trình phát triển

Thứ tự ưu tiên dựa trên: giá trị cho người học so với công sức, và rủi ro hiện tại của app.

| # | Tính năng | Nhóm | Trạng thái | Đặc tả |
|---|---|---|---|---|
| 1 | Sao lưu / khôi phục dữ liệu, nhập thẻ CSV | Nền tảng | Xong | [01-sao-luu-du-lieu.md](01-sao-luu-du-lieu.md) |
| 2 | Kết nối các công cụ với nhau | Phương pháp học | Xong | [02-ket-noi-cong-cu.md](02-ket-noi-cong-cu.md) |
| 3 | Gõ đáp án trước khi lật thẻ | Phương pháp học | Xong | [03-go-dap-an.md](03-go-dap-an.md) |
| 4 | Thống kê, chuỗi ngày học, dự báo thẻ cần ôn 7 ngày | Động lực | Chưa làm | |
| 5 | PWA (cài lên điện thoại, offline) + nhắc ôn | Động lực | Chưa làm | |
| 6 | Thuật toán FSRS thay hộp Leitner | Nâng cấp lớn | Chưa làm | Cần test (Vitest) trước |
| 7 | Bộ thẻ theo môn, thẻ điền chỗ trống (cloze) | Nâng cấp lớn | Chưa làm | |
| 8 | Backend: đồng bộ tài khoản, AI trên web thường | Nâng cấp lớn | Chưa làm | Chỉ làm khi có người dùng thật |
| — | Test logic bằng Vitest | Kỹ thuật | Chưa làm | Làm trước mục 6 |

## Nguyên tắc chung
- Không phá dữ liệu cũ: mọi thay đổi kiểu dữ liệu phải đi qua `normalize()` trong `src/lib/storage.ts`, dữ liệu thiếu trường mới thì lấy giá trị mặc định.
- Giữ design system hiện tại (`src/styles/global.css`): Flat Design, teal + cam, nút ≥ 44px, có trạng thái focus, tôn trọng `prefers-reduced-motion`.
- Không dùng `window.confirm/alert/prompt`; xác nhận ngay trên giao diện (xem `ConfirmButton`).

## Nhật ký
- **2026-10-01** — Xong 1, 2, 3. Kiểm thử end-to-end trên Chromium: 25/25 tiêu chí đạt (nhập CSV có ngoặc kép/xuống dòng, sao lưu → xoá → khôi phục, gộp không trùng, file hỏng không làm mất dữ liệu, gõ đáp án Khớp/Gần đúng/Khác, chỗ bí → thẻ, lộ trình → thẻ, gợi nhớ sau Pomodoro).
