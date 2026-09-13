# Ngân Hà Của Bé Heo

Website quà sinh nhật riêng tư dành cho Nguyễn Thị Thanh Ngân (bé Heo). Bạn bè
và người thân gửi lời chúc qua một liên kết bí mật; nội dung được kiểm duyệt
trước khi trở thành những ngôi sao trong trải nghiệm mở quà.

## Tiến độ

- Giai đoạn 1 — Chốt yêu cầu và phạm vi: hoàn thành.
- Giai đoạn 2 — Dựng nền tảng kỹ thuật: hoàn thành.
- Giai đoạn 3 — Luồng gửi lời chúc: hoàn thành.
- Giai đoạn 4 — Quản trị và kiểm duyệt: hoàn thành.
- Bổ sung sau giai đoạn 4 — Người gửi tự chỉnh sửa: hoàn thành.
- Giai đoạn 5 — Trải nghiệm mở quà: hoàn thành.
- Giai đoạn 6 — Hoàn thiện và kiểm thử: hoàn thành.
- Giai đoạn 7 — Chuẩn bị ra mắt và vận hành: 2/11 mục hoàn thành.

Chi tiết và tiêu chí nghiệm thu nằm trong `IMPLEMENTATION_PLAN.md`.

Production: [ngan-ha-cua-be-heo.vercel.app](https://ngan-ha-cua-be-heo.vercel.app)

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
- Avatar hợp lệ được xoay đúng chiều, thu về tối đa 1024×1024 và chuyển WebP trước khi lưu private.
- Video hỗ trợ MP4, WebM, QuickTime; tối đa 30 MB và 60 giây.
- Media được upload bằng backend vào bucket private; database chỉ lưu object
  path, không lưu URL công khai.
- Mọi lời chúc mới luôn có trạng thái `pending`.
- Honeypot loại bỏ bot; rate limit mặc định cho phép 5 lần gửi trong 15 phút
  trên mỗi HMAC của địa chỉ mạng. IP thô không được lưu.
- UUID ổn định giúp gửi lại an toàn khi mất phản hồi mạng mà không tạo bản ghi
  trùng.
- Sau khi gửi thành công, người gửi nhận một link chỉnh sửa bí mật ký HMAC.
  Link cho phép thay tên, avatar hoặc nội dung đến lúc đóng form; mỗi lần sửa
  đều đưa lời chúc về `pending` để được duyệt lại và dọn media cũ theo cơ chế
  best-effort.
- Form tự đóng và Server Action từ chối request kể từ `23:59 15/09/2026`
  theo `Asia/Ho_Chi_Minh`.

## Quản trị và kiểm duyệt

Trang `/admin` sử dụng mật khẩu băm `scrypt` và phiên ký HMAC-SHA256. Cookie
quản trị là `HttpOnly`, `SameSite=Lax`, bật `Secure` trên production và hết hạn
mặc định sau 8 giờ.

- Lọc lời chúc theo `pending`, `approved` và `rejected`.
- Xem toàn bộ nội dung văn bản, avatar hoặc video trước khi xử lý.
- Duyệt, từ chối và xóa với hộp xác nhận; thao tác xóa dọn cả media liên quan.
- Nhập vị trí hiển thị cho lời chúc đã duyệt; vị trí nhỏ hơn xuất hiện trước.
- Media quản trị được mở bằng signed URL sống mặc định 5 phút, tối đa 15 phút.
- `/admin/preview` chỉ hiển thị lời chúc đã duyệt theo đúng thứ tự để kiểm tra
  món quà trước giờ mở.
- Sau khi đăng nhập, nút “Mở form người gửi” mở đúng link đóng góp bí mật để
  quản trị viên sao chép gửi riêng cho người thử.

Mọi truy vấn và Server Action quản trị đều xác thực lại phiên ở phía máy chủ.
Người không có phiên không thể xem dữ liệu, tạo signed URL hoặc thực hiện thao
tác kiểm duyệt.

## Trải nghiệm mở quà

Trang `/gift` có mật khẩu và cookie phiên riêng, chỉ mở đúng thời điểm cấu hình
theo `Asia/Ho_Chi_Minh`. Sau khi mở:

- Tên miền gốc `/` tự chuyển vào `/gift`, vì vậy người nhận không cần nhớ thêm
  đường dẫn và không còn thấy trang placeholder kỹ thuật cũ.

- Mỗi lời chúc `approved` trở thành một ngôi sao; `pending` và `rejected` không
  được tải vào trải nghiệm.
- Chạm một ngôi sao để xem nội dung, sau đó chủ động tiết lộ tên và avatar của
  người gửi.
- Tiến độ được lưu trên chính trình duyệt bằng ID lời chúc, không lưu thông tin
  định danh bổ sung lên máy chủ.
- Phần kết mở tại `ceil(tổng lời chúc đã duyệt × 70%)`; các sao còn lại tiếp tục
  hoạt động sau đó.
- Khi đạt ngưỡng, các sao kết thành trái tim rồi mở video và lá thư cuối. Nếu
  nội dung chính thức chưa có, giao diện hiển thị placeholder an toàn.
- Nhạc chỉ được phát sau thao tác đầu tiên, có nút bật/tắt và tự tạm dừng khi
  video chạy. Trường hợp autoplay bị chặn có hướng dẫn thử lại.
- Chuyển động được giản lược khi thiết bị bật `prefers-reduced-motion`.

Ảnh/video của lời chúc và media phần kết đều đi qua route `/gift` đã xác thực,
kiểm tra trạng thái `approved` và chuyển hướng đến signed URL sống ngắn.

## Kiểm thử và hardening

Chạy các lệnh sau trước khi deploy:

```bash
pnpm test
pnpm lint
pnpm build
pnpm audit:client-secrets
```

Bộ kiểm thử hiện có 26 ca cho validation, chữ ký file, lịch đóng/mở, công thức
70%, tiến độ, mật khẩu, phiên, signed URL và độ tương phản. Báo cáo kiểm thử
trình duyệt mobile, khả năng truy cập và các bước cần người thật xác nhận nằm
trong `STAGE_6_TEST_REPORT.md`.

Lượt thử nghiệm thật bởi người gửi ngoài quản trị đã hoàn tất trên điện thoại:
form báo gửi thành công, bản ghi chuyển sang chờ duyệt và link chỉnh sửa bí mật
được trả về đúng như thiết kế.

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
http://localhost:3000/admin
http://localhost:3000/admin/preview
```

Không commit `.env.local` hoặc bất kỳ secret thật nào.

## Biến môi trường

Sao chép `.env.example` để xem toàn bộ giá trị mẫu. Các nhóm chính:

- Lịch: `APP_TIME_ZONE`, `CONTRIBUTIONS_CLOSE_AT`, `GIFT_OPENS_AT`.
- Supabase server-only: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.
- Truy cập riêng: `CONTRIBUTION_LINK_SECRET`, `ADMIN_PASSWORD_HASH`,
  `SESSION_SECRET`, `WISH_EDIT_SECRET` và `ADMIN_SESSION_TTL_SECONDS`.
- Media: tên bucket và giới hạn avatar/video.
- Media phần kết: `GIFT_ASSETS_BUCKET`, `GIFT_MUSIC_PATH` và
  `GIFT_FINALE_VIDEO_PATH`; hai object path có thể để trống cho tới khi có file
  chính thức.
- Signed URL: `SIGNED_URL_TTL_SECONDS`.
- Chống spam: `CONTRIBUTION_RATE_LIMIT_MAX` và
  `CONTRIBUTION_RATE_LIMIT_WINDOW_SECONDS`.

Trên Vercel, các giá trị nhạy cảm phải được lưu dưới dạng Secret cho từng môi
trường cần sử dụng.

## Supabase

Migration nằm trong `supabase/migrations/` và đã được áp dụng lên project liên
liên kết. Ba bucket `wish-avatars`, `wish-videos` và `gift-assets` đều private. Các bảng không cấp
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
pnpm audit:client-secrets
```

Lệnh audit phải chạy sau build và sẽ thất bại nếu tên biến hoặc giá trị secret
được phát hiện trong `.next/static`.

Các phép kiểm tra mốc đóng form dùng timestamp tuyệt đối có UTC offset. Không
so sánh thời gian bằng chuỗi đã định dạng.

## Riêng tư và bảo mật

- Toàn site có metadata `noindex`.
- Supabase server key, secret đường dẫn và mật khẩu không được đưa xuống bundle
  trình duyệt hoặc ghi vào Git.
- File được kiểm tra lại phía máy chủ, bao gồm MIME, chữ ký định dạng, dung
  lượng và thời lượng video.
- Chế độ xem thử chỉ đọc nội dung `approved`; `pending` và `rejected` không xuất
  hiện.
- Signed URL cho media quản trị chỉ được tạo sau khi xác minh lại phiên và có
  thời gian sống ngắn.
- Media trang quà chỉ được ký sau khi xác minh phiên người nhận; media lời chúc
  còn yêu cầu bản ghi đang ở trạng thái `approved`.
- Link chỉnh sửa không chứa khóa Supabase hoặc mật khẩu; chữ ký được tạo bằng
  `WISH_EDIT_SECRET` server-only, hết hạn đúng lúc đóng form và có thể thu hồi
  đồng loạt bằng cách xoay secret này.
