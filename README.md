# Ngân Hà Của Bé Heo

Website quà sinh nhật riêng tư dành cho Nguyễn Thị Thanh Ngân (bé Heo). Bạn bè
và người thân gửi lời chúc qua một liên kết bí mật; nội dung được kiểm duyệt
trước khi trở thành những ngôi sao trong trải nghiệm mở quà.

## Tiến độ

- Giai đoạn 1 — Chốt yêu cầu và phạm vi: hoàn thành.
- Giai đoạn 2 — Dựng nền tảng kỹ thuật: hoàn thành.
- Giai đoạn 3 — Luồng gửi lời chúc: hoàn thành.
- Giai đoạn 4–7: chưa triển khai.

Chi tiết và tiêu chí nghiệm thu nằm trong `IMPLEMENTATION_PLAN.md`.

## Công nghệ

- Next.js 16 với App Router và TypeScript.
- React 19.
- Supabase Postgres và private Storage.
- Vercel.
- pnpm 11.

## Luồng đóng góp hiện có

Trang `/contribute/[secret]` cung cấp form mobile-first hoàn toàn bằng tiếng
Việt, gồm tên người gửi, avatar tùy chọn, lời chúc văn bản hoặc video và xác
nhận đồng ý sử dụng nội dung.

- Secret của đường dẫn luôn được xác minh phía máy chủ.
- Avatar hỗ trợ JPEG, PNG, WebP và tối đa 5 MB.
- Video hỗ trợ MP4, WebM, QuickTime; tối đa 30 MB và 60 giây.
- Media được upload bằng backend vào bucket private; database chỉ lưu object
  path, không lưu URL công khai.
- Mọi lời chúc mới luôn có trạng thái `pending`.
- Honeypot loại bỏ bot; rate limit mặc định cho phép 5 lần gửi trong 15 phút
  trên mỗi HMAC của địa chỉ mạng. IP thô không được lưu.
- UUID ổn định giúp gửi lại an toàn khi mất phản hồi mạng mà không tạo bản ghi
  trùng.
- Form tự đóng và Server Action từ chối request kể từ `23:59 15/09/2026`
  theo `Asia/Ho_Chi_Minh`.

## Chạy cục bộ

Yêu cầu Node.js tương thích Next.js 16 và pnpm 11.

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Sau khi điền biến môi trường, mở:

```text
http://localhost:3000/contribute/<CONTRIBUTION_LINK_SECRET>
```

Không commit `.env.local` hoặc bất kỳ secret thật nào.

## Biến môi trường

Sao chép `.env.example` để xem toàn bộ giá trị mẫu. Các nhóm chính:

- Lịch: `APP_TIME_ZONE`, `CONTRIBUTIONS_CLOSE_AT`, `GIFT_OPENS_AT`.
- Supabase server-only: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.
- Truy cập riêng: `CONTRIBUTION_LINK_SECRET`; các hash mật khẩu và session
  secret sẽ được dùng trong giai đoạn xác thực.
- Media: tên bucket và giới hạn avatar/video.
- Chống spam: `CONTRIBUTION_RATE_LIMIT_MAX` và
  `CONTRIBUTION_RATE_LIMIT_WINDOW_SECONDS`.

Trên Vercel, các giá trị nhạy cảm phải được lưu dưới dạng Secret cho từng môi
trường cần sử dụng.

## Supabase

Migration nằm trong `supabase/migrations/` và đã được áp dụng lên project liên
kết. Hai bucket `wish-avatars` và `wish-videos` đều private. Các bảng không cấp
quyền cho `anon` hoặc `authenticated`; chỉ backend tin cậy dùng server key mới
được truy cập.

```bash
pnpm exec supabase migration list --linked
pnpm exec supabase db push --linked --dry-run
pnpm exec supabase db push --linked
```

Luôn dry-run và review migration trước khi push.

## Kiểm tra chất lượng

```bash
pnpm lint
pnpm build
```

Các phép kiểm tra mốc đóng form dùng timestamp tuyệt đối có UTC offset. Không
so sánh thời gian bằng chuỗi đã định dạng.

## Riêng tư và bảo mật

- Toàn site có metadata `noindex`.
- Supabase server key, secret đường dẫn và mật khẩu không được đưa xuống bundle
  trình duyệt hoặc ghi vào Git.
- File được kiểm tra lại phía máy chủ, bao gồm MIME, chữ ký định dạng, dung
  lượng và thời lượng video.
- Nội dung `pending` chưa được phép xuất hiện trong món quà.
- Signed URL cho media sẽ chỉ được tạo sau khi xác minh phiên trong các giai
  đoạn quản trị và trang quà.
