# 7. Bộ thẻ và thẻ điền chỗ trống

**Trạng thái:** Xong (2026-10-01).

## Bộ thẻ
- `AppData.decks: { id, name, created }[]`, `Card.deckId`. Luôn có bộ "Chung" (`id = "chung"`, không xoá được).
- Chuyển dữ liệu cũ: mỗi "chủ đề" khác rỗng thành một bộ thẻ; thẻ không có chủ đề vào "Chung".
- Quản lý: tạo, đổi tên, xoá (thẻ trong bộ bị xoá chuyển về "Chung").
- Ôn theo bộ: chọn "Tất cả" hoặc một bộ trước khi bắt đầu.
- Nhập CSV: cột 3 là tên bộ thẻ (tự tạo nếu chưa có).
- Thẻ từ Feynman vào bộ "Chung" (chủ đề = khái niệm); thẻ từ lộ trình vào bộ "Cung điện ký ức".

## Thẻ điền chỗ trống (cloze)
- Mặt trước chứa `{{...}}`, ví dụ `Thủ đô của Úc là {{Canberra}}, dân số khoảng {{460 nghìn}}.`
- Mỗi `{{...}}` sinh một thẻ riêng (`kind: "cloze"`, `clozeIndex`), ẩn chỗ đó, các chỗ khác hiện bình thường.
- Mặt sau không bắt buộc (ghi chú thêm).
- Chế độ gõ đáp án: so với nội dung trong `{{...}}` đang ẩn.
