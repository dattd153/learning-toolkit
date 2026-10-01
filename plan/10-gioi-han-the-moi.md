# 10. Giới hạn thẻ mới mỗi ngày

**Trạng thái:** Xong (2026-10-01).

## Vấn đề
Nhập 200 thẻ từ CSV thì cả 200 đến hạn ngay hôm đó: người học ngợp, bỏ cuộc; vài ngày sau còn bị dồn thẻ vì lịch ôn của chúng chồng lên nhau. Anki mặc định 20 thẻ mới/ngày vì lý do này.

## Thiết kế
- Mỗi bộ thẻ có `newPerDay` (mặc định **20**, 0–9999), chỉnh trong "Bộ thẻ".
- Thẻ được tính là "đã giới thiệu" ở lần chấm đầu tiên: lưu `Card.introduced` (thời điểm).
- **Hàng đợi hôm nay** của một bộ = thẻ ôn lại đến hạn (đã học ít nhất một lần) + tối đa `newPerDay − số thẻ đã giới thiệu hôm nay` thẻ mới (theo thứ tự tạo).
- Nút **"Học thêm 10 thẻ mới"** khi đã hết lượt hôm nay mà bộ vẫn còn thẻ mới (`Deck.bonusNew = { date, count }`, chỉ có hiệu lực trong ngày).
- Mọi chỗ hiện "thẻ cần ôn" (ô đầu trang, huy hiệu tab, huy hiệu icon app, nhắc ôn, thống kê, dự báo) dùng chung hàng đợi này.
- Dự báo 7 ngày: ngày hôm nay = hàng đợi hôm nay; các ngày sau = thẻ đã học đến hạn hôm đó.

## Dữ liệu
`Deck.newPerDay`, `Deck.bonusNew?`, `Card.introduced?` — thêm vào `normalize()` với giá trị mặc định; dữ liệu cũ chạy bình thường.

## Tiêu chí hoàn thành
- [x] 50 thẻ mới, giới hạn 20 → hôm nay 20 thẻ; chấm hết → "Học thêm 10 thẻ mới" xuất hiện.
- [x] Ngày hôm sau có thêm 20 thẻ mới.
- [x] Thẻ ôn lại không bị giới hạn.
- [x] Giới hạn riêng từng bộ; ôn "Tất cả bộ thẻ" tôn trọng giới hạn của từng bộ.
