# 2. Kết nối các công cụ

## Vấn đề
Bốn công cụ đang hoạt động riêng lẻ. Giá trị thật của các phương pháp nằm ở việc dùng **nối tiếp**: hiểu (Feynman) → ghi nhớ (thẻ) → ôn đúng lúc.

## Phạm vi
### 2a. Feynman → Thẻ nhớ
Mỗi dòng trong "Chỗ bí cần học lại" hiện thành một hàng: câu hỏi + ô nhập đáp án + nút "Tạo thẻ".
- Bắt nhập đáp án trước khi tạo: buộc người học tra lại tài liệu (chính là bước 3 của kỹ thuật Feynman).
- Chủ đề thẻ = tên khái niệm.

### 2b. Pomodoro → Gợi nhớ nhanh
Hết một phiên tập trung, hiện ô "Viết nhanh những gì bạn vừa học" (brain dump, một dạng gợi nhớ chủ động).
- "Lưu vào Bàn Feynman": tạo bài mới, khái niệm = nội dung ô "Đang làm gì?" (hoặc "Gợi nhớ sau Pomodoro + ngày").
- "Bỏ qua".
- Không thêm kiểu dữ liệu mới: tái dùng `notes`.

### 2c. Cung điện ký ức → Thẻ nhớ
Nút "Tạo thẻ từ lộ trình": mỗi điểm dừng thành một thẻ
- Mặt trước: `Điểm dừng N (tên điểm dừng) có gì?`
- Mặt sau: thứ cần nhớ + hình ảnh liên tưởng.
- Chủ đề: "Cung điện ký ức". Bỏ qua thẻ đã tồn tại (trùng mặt trước và mặt sau).

## Tiêu chí hoàn thành
- [x] Tạo thẻ từ chỗ bí: thẻ xuất hiện trong tab Thẻ nhớ, đến hạn ngay.
- [x] Hết phiên Pomodoro: ô gợi nhớ hiện ra, lưu xong thấy bài trong Bàn Feynman.
- [x] Bấm "Tạo thẻ từ lộ trình" hai lần không tạo thẻ trùng.
