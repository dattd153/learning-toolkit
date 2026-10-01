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
| 9 | Sửa thẻ và điểm dừng (giữ lịch ôn) | Cốt lõi | Xong | [09-sua-the.md](09-sua-the.md) |
| 10 | Giới hạn thẻ mới mỗi ngày (theo bộ thẻ) | Phương pháp học | Xong | [10-gioi-han-the-moi.md](10-gioi-han-the-moi.md) |
| 11 | Chế độ ôn tập trung (toàn màn hình) | Giao diện | Xong | [11-che-do-on-tap-trung.md](11-che-do-on-tap-trung.md) |
| 12 | Gọn phần đầu trang | Giao diện | Chưa làm | [12-gon-phan-dau-trang.md](12-gon-phan-dau-trang.md) |
| 13 | Trang Cài đặt + chọn giao diện Sáng/Tối | Giao diện | Chưa làm | [13-trang-cai-dat.md](13-trang-cai-dat.md) |
| 14 | Thống kê dễ tìm trên điện thoại | Giao diện | Chưa làm | [14-thong-ke-tren-dien-thoai.md](14-thong-ke-tren-dien-thoai.md) |
| 15 | Hướng dẫn lần đầu + bộ thẻ mẫu | Giao diện | Chưa làm | [15-huong-dan-lan-dau.md](15-huong-dan-lan-dau.md) |
| 16 | Hoàn tác thay cho xác nhận hai bước | Giao diện | Chưa làm | [16-hoan-tac.md](16-hoan-tac.md) |
| 17 | Công thức Toán/Lý/Hoá (KaTeX) + định dạng | Nội dung thẻ | Chưa làm | [17-cong-thuc-toan.md](17-cong-thuc-toan.md) |
| 18 | Thẻ hai chiều + phát âm | Nội dung thẻ | Chưa làm | [18-the-hai-chieu-phat-am.md](18-the-hai-chieu-phat-am.md) |
| 19 | Ảnh trong thẻ | Nội dung thẻ | Chưa làm (cần lưu trữ) | [19-anh-trong-the.md](19-anh-trong-the.md) |

## Lỗi đã biết
- **Đồng bộ (mục 8)** — đã tìm ra và có bản sửa nhưng chưa áp dụng (để làm cùng backend sau):
  1. Mở/tải lại trang bị coi là "có thay đổi" → báo xung đột giả, không nhận dữ liệu mới từ máy khác.
  2. Hai lần đẩy dữ liệu chồng nhau xoá mất cờ "có thay đổi" của lần sửa sau → thay đổi không lên máy chủ.
  3. Trang đang mở chỉ kiểm tra máy chủ 2 phút/lần.
- **Deploy Vercel**: chỉ có giao diện tĩnh, không có API → không đồng bộ / không AI. Cần backend chạy được trên Vercel (Functions + lưu trữ như Vercel Blob) hoặc host Node riêng.

## Nguyên tắc chung
- Không phá dữ liệu cũ: mọi thay đổi kiểu dữ liệu phải đi qua `normalize()` trong `src/lib/storage.ts`, dữ liệu thiếu trường mới thì lấy giá trị mặc định.
- Giữ design system hiện tại (`src/styles/global.css`): Flat Design, teal + cam, nút ≥ 44px, có trạng thái focus, tôn trọng `prefers-reduced-motion`.
- Không dùng `window.confirm/alert/prompt`; xác nhận ngay trên giao diện (xem `ConfirmButton`).

## Nhật ký
- **2026-10-01** — Xong 1, 2, 3. Kiểm thử end-to-end trên Chromium: 25/25 tiêu chí đạt (nhập CSV có ngoặc kép/xuống dòng, sao lưu → xoá → khôi phục, gộp không trùng, file hỏng không làm mất dữ liệu, gõ đáp án Khớp/Gần đúng/Khác, chỗ bí → thẻ, lộ trình → thẻ, gợi nhớ sau Pomodoro).
- **2026-10-01** — Xong 4–8 và Vitest. 54 unit test (chuyển dữ liệu v1→v2, FSRS, cloze, CSV, thống kê, nhắc ôn, API đồng bộ/AI) chạy đúng ở các múi giờ UTC+7, UTC, UTC−7/−4. Kiểm thử end-to-end trên máy chủ thật: 24/24 (chuyển dữ liệu cũ, 4 mức chấm FSRS, bộ thẻ, cloze, thống kê, offline qua service worker, đồng bộ 2 thiết bị, xử lý xung đột).
  - Chưa kiểm thử với Claude API thật (máy dev không có khoá); phần AI máy chủ đã test bằng dịch vụ giả.
  - Headless Chromium luôn chặn thông báo nên nhắc ôn chỉ kiểm thử bằng unit test + giao diện khi bị chặn.
- **2026-10-01** — Xong 9, 10, 11. 62 unit test (thêm: hàng đợi có giới hạn thẻ mới theo bộ, học thêm thẻ mới, sửa thẻ thường/cloze giữ lịch ôn). Kiểm thử trên Chromium: 21/21 (giới hạn 20 → 5 thẻ mới, huy hiệu/ô đầu trang dùng chung hàng đợi, lớp phủ ôn che thanh tab + khoá cuộn + Esc trả focus, tổng kết phiên, học thêm 10 thẻ, sửa thẻ/cloze 2→3 chỗ/điểm dừng); màn hình 390px không tràn ngang, nút chấm nằm cuối màn hình.
