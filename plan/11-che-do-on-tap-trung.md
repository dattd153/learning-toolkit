# 11. Chế độ ôn tập trung

**Trạng thái:** Xong (2026-10-01).

## Vấn đề
Tab Thẻ nhớ dồn phiên ôn, form thêm thẻ, bộ thẻ, danh sách thẻ vào một trang. Ôn bài là việc chính nhưng bị lẫn giữa các phần quản lý, trên điện thoại phải cuộn.

## Thiết kế
- Bấm "Bắt đầu ôn" → **lớp phủ toàn màn hình** (`role="dialog"`, `aria-modal`), ẩn thanh tab, khoá cuộn trang.
  - Trên: thanh tiến độ, tên bộ thẻ, số thẻ còn lại, nút **Thoát** (`Esc`).
  - Giữa: thẻ, cỡ chữ lớn.
  - Dưới: nút lật / 4 nút chấm (gần ngón cái trên điện thoại), có khoảng an toàn cho tai thỏ/thanh home.
- Hết thẻ → **màn hình tổng kết** ngay trong lớp phủ: số lượt ôn, tỉ lệ nhớ phiên này, số thẻ mới đã học; nút "Xong".
- Đóng lớp phủ → focus trở lại nút "Bắt đầu ôn".
- Giữ mọi phím tắt hiện có (Space, 1–4, Enter khi gõ đáp án).

## Tiêu chí hoàn thành
- [x] Bắt đầu ôn → lớp phủ phủ kín, trang phía sau không cuộn, thanh tab bị che.
- [x] `Esc` / nút Thoát kết thúc phiên, focus về nút "Bắt đầu ôn".
- [x] Màn hình tổng kết hiện đúng số liệu.
- [x] Màn hình 390px: nút chấm nằm cuối màn hình, không tràn ngang.
