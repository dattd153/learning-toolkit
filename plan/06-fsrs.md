# 6. Thuật toán FSRS

**Trạng thái:** Xong (2026-10-01).

## Vì sao
Hộp Leitner dùng khoảng cách cố định (1, 3, 7, 14, 30 ngày) cho mọi thẻ. FSRS (Free Spaced Repetition Scheduler, dùng trong Anki) ước lượng **độ ổn định** và **độ khó** riêng của từng thẻ, lên lịch đúng lúc xác suất nhớ giảm về ~90%: cùng mức nhớ, ít lượt ôn hơn.

## Thiết kế
- Thư viện `ts-fsrs` (MIT), tham số mặc định, `enable_fuzz` bật (tránh dồn thẻ cùng ngày), learning steps 1m/10m.
- Bốn mức chấm: **Quên (1) · Khó (2) · Nhớ (3) · Dễ (4)**; mỗi nút hiện khoảng thời gian tới lần ôn sau.
- Trong phiên: thẻ có hạn mới < 20 phút (Quên, bước đang học) được xếp lại cuối hàng đợi.
- `Card.srs = { state, stability, difficulty, scheduledDays, learningSteps, reps, lapses, lastReview }`, `Card.due` giữ nguyên ý nghĩa.

## Chuyển dữ liệu cũ (Leitner → FSRS)
- Hộp 1: thẻ mới (giữ hạn ôn).
- Hộp n ≥ 2: trạng thái Ôn tập, độ ổn định = khoảng cách của hộp (3/7/14/30 ngày), độ khó 5, `lastReview = due − khoảng cách`.
- Có test Vitest cho việc chuyển đổi và lên lịch.
