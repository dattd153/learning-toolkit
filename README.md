# Hộp công cụ ghi nhớ

Ứng dụng học tập: thư viện phương pháp học có cơ sở khoa học, bàn Feynman, thẻ nhớ ôn ngắt quãng (Leitner), đồng hồ Pomodoro và cung điện ký ức.

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # kiểm tra kiểu + build ra dist/
npm run preview    # xem bản build
```

## Cấu trúc

```
src/
  main.tsx, App.tsx          điểm vào, khung trang, chuyển tab
  styles/global.css          design tokens (sáng/tối) + toàn bộ CSS
  data/methods.ts            dữ liệu phương pháp, mục tiêu, mức bằng chứng
  types.ts                   kiểu dữ liệu chung
  lib/                       storage (localStorage), platform (Claude runtime), utils
  state/                     AppStore (Context), Toast, useHashTab, selectors
  components/                Icon, Header, Tabs, ConfirmButton
  features/
    methods/  feynman/  cards/  pomodoro/  palace/
```

- Dữ liệu lưu trong `localStorage` với khoá `mtk-state`, dùng chung với bản HTML cũ.
- Tính năng AI (Claude đóng vai học sinh, tạo thẻ từ ghi chú) và đồng bộ tài khoản chỉ bật khi chạy trong Claude Artifact (`window.claude`). Chạy như web thường thì các nút này tự ẩn.
- Tab được gắn vào URL (`#cards`, `#pomo`…), có thể chia sẻ link thẳng tới công cụ.
