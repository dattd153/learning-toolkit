# 3. Gõ đáp án trước khi lật thẻ

## Vấn đề
Lật thẻ rồi tự chấm dễ sinh ảo giác "mình biết rồi". Bắt viết ra câu trả lời trước khi xem làm việc gợi nhớ thật hơn (generation effect) và tự chấm trung thực hơn.

## Phạm vi
- Công tắc "Gõ đáp án trước khi lật" trong khu vực ôn thẻ, lưu vào `prefs.typeAnswer` (mặc định tắt, giữ hành vi cũ).
- Khi bật: thẻ hiện ô nhập. `Enter` hoặc nút "Kiểm tra" → lật thẻ và so sánh:
  - **Khớp**: giống đáp án sau khi bỏ hoa/thường, dấu câu, khoảng trắng thừa.
  - **Gần đúng**: sai khác nhỏ (khoảng cách Levenshtein ≤ 20% độ dài đáp án).
  - **Khác**: hiện câu trả lời của bạn cạnh đáp án.
- Người học vẫn tự bấm Nhớ/Quên (đáp án mở như định nghĩa, công thức khó so máy móc). Gợi ý: khớp → nút Nhớ được focus sẵn; khác → nút Quên được focus.
- Không dùng dấu tiếng Việt để coi là "khớp" (bỏ dấu sẽ làm "ma/má/mà" thành một).

## Dữ liệu
`AppData.prefs = { typeAnswer: boolean }`, thêm vào `normalize()` với mặc định `false`.

## Tiêu chí hoàn thành
- [x] Tắt công tắc: hành vi y như cũ (Space lật, 1/2 chấm).
- [x] Bật: gõ đúng → "Khớp"; gõ thiếu một chữ → "Gần đúng"; sai → "Khác".
- [x] Phím 1/2 không bị kích hoạt khi đang gõ trong ô.
