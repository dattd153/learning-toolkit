# Hộp công cụ ghi nhớ

Ứng dụng học tập: thư viện phương pháp học có cơ sở khoa học, bàn Feynman, thẻ nhớ ôn ngắt quãng (FSRS, bộ thẻ, thẻ điền chỗ trống), đồng hồ Pomodoro, cung điện ký ức, thống kê. Cài được như app (PWA), chạy offline, đồng bộ giữa các thiết bị qua máy chủ tuỳ chọn.

## Chạy

```bash
npm install
npm run dev           # giao diện: http://localhost:5173 (gọi /api qua proxy tới :8787)
npm run dev:server    # máy chủ API (đồng bộ + AI): http://localhost:8787
npm test              # Vitest
npm run build         # kiểm tra kiểu + build ra dist/
npm start             # máy chủ phục vụ cả dist/ lẫn /api (production)
```

Cần Node ≥ 23.6 (máy chủ chạy TypeScript trực tiếp, dùng `node:sqlite` có sẵn).

### Biến môi trường máy chủ

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `8787` | Cổng |
| `DB_PATH` | `./data/hop-cong-cu-ghi-nho.db` | File SQLite lưu dữ liệu đồng bộ |
| `ANTHROPIC_API_KEY` | – | Bật tính năng AI (Claude). Không có thì AI tự ẩn |
| `AI_ENABLED` | – | `1` để bật AI khi dùng profile `ant auth login`; `0` để tắt hẳn |
| `AI_MODEL` | `claude-opus-5-5` | Model Claude |
| `AI_EFFORT` | `medium` | Mức effort (`low`/`medium`/`high`) |
| `TRUST_PROXY` | – | `1` nếu chạy sau reverse proxy (lấy IP từ `X-Forwarded-For` để giới hạn tần suất) |

Chỉ deploy frontend tĩnh (không có máy chủ) vẫn chạy đầy đủ, trừ đồng bộ và AI. Đặt `VITE_API_URL` khi build nếu API ở domain khác.

## Cấu trúc

```
src/
  main.tsx, App.tsx          điểm vào, khung trang, chuyển tab (#hash)
  styles/global.css          design tokens (sáng/tối) + toàn bộ CSS
  data/methods.ts            dữ liệu phương pháp
  types.ts                   kiểu dữ liệu (AppData v2)
  lib/                       storage (normalize + chuyển dữ liệu v1→v2), srs (FSRS), cloze, stats,
                             backup, csv, answer, pwa, platform (Claude Artifact), server (client API)
  state/                     AppStore (Context + đồng bộ), Toast, useHashTab, selectors, cardActions
  components/                Icon, Header, Tabs, ConfirmButton, DataTools, ReminderSettings, SyncSettings
  features/                  methods, feynman, cards, pomodoro, palace, stats
shared/prompts.ts            prompt AI dùng chung cho trình duyệt và máy chủ
server/                      Hono: /api/health, /api/sync, /api/ai/*  (+ test)
public/                      manifest, service worker, icon
plan/                        lộ trình và đặc tả từng tính năng
```

## Dữ liệu
- Lưu trong `localStorage` (khoá `mtk-state`). Dữ liệu từ bản HTML cũ (hộp Leitner) tự chuyển sang FSRS + bộ thẻ khi mở.
- Sao lưu/khôi phục JSON và xuất CSV ở cuối trang.
- Đồng bộ: máy chủ chỉ lưu băm SHA-256 của mã đồng bộ; xung đột (hai máy cùng sửa) được hỏi lại người dùng, không tự ghi đè.
