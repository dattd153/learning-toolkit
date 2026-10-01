# 9. Sửa thẻ và điểm dừng

**Trạng thái:** Xong (2026-10-01).

## Vấn đề
Thẻ chỉ xoá được, không sửa được. Gõ sai một chữ phải xoá rồi tạo lại, mất luôn lịch sử ôn (FSRS). Điểm dừng trong cung điện ký ức cũng vậy.

## Phạm vi
- **Thẻ**: nút sửa (biểu tượng bút) trên mỗi dòng trong "Tất cả thẻ" → dòng mở thành form: mặt trước, mặt sau, bộ thẻ. Lưu / Huỷ. `Esc` để huỷ.
  - **Giữ nguyên lịch ôn** (`srs`, `due`): sửa chữ không làm thẻ thành "mới".
  - **Thẻ điền chỗ trống**: các thẻ sinh từ cùng một câu là "anh em" (cùng mặt trước, cùng bộ). Sửa câu thì sửa cho cả nhóm; nếu số chỗ `{{...}}` giảm thì xoá thẻ thừa, tăng thì thêm thẻ mới cho chỗ mới.
  - Thẻ thường phải có cả hai mặt; thẻ điền chỗ trống phải còn ít nhất một `{{...}}`.
- **Điểm dừng cung điện ký ức**: nút sửa tương tự (điểm dừng, thứ cần nhớ, hình ảnh liên tưởng).

## Tiêu chí hoàn thành
- [x] Sửa thẻ thường: chữ đổi, lịch ôn và trạng thái giữ nguyên.
- [x] Đổi bộ thẻ của một thẻ.
- [x] Sửa câu cloze 2 chỗ thành 3 chỗ: thêm 1 thẻ mới; thành 1 chỗ: xoá 1 thẻ; thẻ còn lại giữ lịch ôn.
- [x] Không lưu được thẻ thường thiếu mặt sau.
- [x] Sửa điểm dừng cung điện ký ức.
