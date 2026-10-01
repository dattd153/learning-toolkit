# 4. Thống kê, chuỗi ngày học, dự báo

## Phạm vi
Trang **Thống kê** (`#stats`), mở từ nút "Thống kê" ở đầu trang và ô "Chuỗi ngày học":
- **Chuỗi ngày học**: số ngày liên tiếp có ôn thẻ hoặc hoàn thành phiên Pomodoro (hiện tại và dài nhất). Hôm nay chưa học thì chuỗi vẫn tính đến hôm qua.
- **Lịch học 20 tuần** (heatmap): mỗi ô một ngày, đậm theo số lượt ôn + phiên tập trung.
- **Tỉ lệ nhớ 30 ngày**: số lượt chấm Khó/Nhớ/Dễ ÷ tổng lượt ôn.
- **Dự báo 7 ngày**: số thẻ đến hạn mỗi ngày (thẻ quá hạn tính vào hôm nay) để tránh dồn thẻ.
- **Trạng thái thẻ**: Mới / Đang học / Ôn tập / Học lại.

## Dữ liệu
`AppData.days: Record<"YYYY-MM-DD", { reviews, correct, focus }>`; thay cho `pomo` (dữ liệu cũ được gộp vào `days`).
