# AI Nail Studio

Tải lên 1 ảnh móng → nhận 4 ảnh gợi ý (Gemini "Nano Banana") và video chân thực (Veo 3.1).

## Chạy

```bash
npm install
npm run dev
```

Mở http://localhost:3000. Chưa có key thì app chạy **chế độ demo** (chỉ xem giao diện).

## Lấy Gemini API key

1. Vào https://aistudio.google.com/apikey → **Create API key**.
2. Veo yêu cầu bật thanh toán (billing) cho project Google Cloud gắn với key.
3. Dán key vào `.env.local`: `GEMINI_API_KEY=...` rồi khởi động lại `npm run dev`.

Giá: xem https://ai.google.dev/gemini-api/docs/pricing — video tốn hơn ảnh nhiều, nên app chỉ tạo video khi bấm nút.

## Tuỳ chỉnh

- Phong cách ảnh / kiểu chuyển động video: `src/lib/presets.ts`
- Đổi model (trong `.env.local`): `GEMINI_IMAGE_MODEL`, `VEO_MODEL`
  (mặc định `veo-3.1-lite-generate-preview` — rẻ nhất; nâng cấp: `veo-3.1-fast-generate-preview` hoặc `veo-3.1-generate-preview`)
- Gọi API: `src/lib/gemini.ts`, route: `src/app/api/*`
