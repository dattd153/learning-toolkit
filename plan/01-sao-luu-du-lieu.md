# 1. Sao lưu và khôi phục dữ liệu

## Vấn đề
Toàn bộ dữ liệu nằm trong `localStorage` của một trình duyệt. Xoá dữ liệu duyệt web, đổi máy hoặc đổi trình duyệt là mất hết thẻ, bài giải thích, lộ trình.

## Phạm vi
1. **Sao lưu**: tải về file `hop-cong-cu-ghi-nho-YYYY-MM-DD.json` chứa toàn bộ dữ liệu.
2. **Khôi phục**: chọn file JSON → xem trước số lượng (thẻ, bài, điểm dừng) → chọn:
   - **Gộp**: thêm những mục chưa có (so theo `id`), giữ nguyên dữ liệu hiện tại.
   - **Thay thế**: ghi đè toàn bộ dữ liệu hiện tại (xác nhận hai bước).
3. **Nhập thẻ từ file CSV/TSV** (gồm file xuất "Notes in Plain Text" của Anki): cột 1 = mặt trước, cột 2 = mặt sau, cột 3 (tuỳ chọn) = chủ đề.
4. **Xuất thẻ ra CSV** để mở bằng Excel/Google Sheets hoặc nhập vào Anki.

## Định dạng file sao lưu
```json
{ "app": "hop-cong-cu-ghi-nho", "version": 1, "exportedAt": "2026-10-01T12:00:00.000Z", "data": { ...AppData } }
```
Khi nhập, chấp nhận cả `AppData` trần (dữ liệu từ bản HTML cũ).

## An toàn dữ liệu
- Mọi dữ liệu đọc vào (localStorage, file, tài khoản) đều qua `normalize()`: lọc bỏ mục hỏng, điền giá trị mặc định, giới hạn `box` trong 1–5.
- File không hợp lệ → báo lỗi rõ ràng, không đụng tới dữ liệu hiện tại.

## Giao diện
Mục "Dữ liệu của bạn" ở cuối trang (footer): nút Sao lưu, Khôi phục, Xuất thẻ CSV. Nhập CSV nằm trong phần "Thêm nhiều thẻ một lúc" ở tab Thẻ nhớ.

## Tiêu chí hoàn thành
- [x] Sao lưu → xoá localStorage → khôi phục: dữ liệu giống hệt.
- [x] Gộp không tạo bản trùng khi nhập lại cùng một file.
- [x] File sai định dạng không làm hỏng dữ liệu.
- [x] CSV có dấu phẩy/xuống dòng trong ô có ngoặc kép được đọc đúng.
