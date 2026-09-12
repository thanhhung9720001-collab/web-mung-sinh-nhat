# Dữ liệu Supabase

## Quy trình thay đổi schema

- Mọi thay đổi database phải đi qua file trong `migrations/`.
- Không sửa schema production trực tiếp bằng Table Editor hoặc SQL Editor.
- Luôn review migration và chạy dry-run trước khi `db push`.
- Migration đã áp dụng chỉ tiến về phía trước; nếu cần hoàn tác, tạo migration mới.

## Bảng `public.wishes`

Mỗi bản ghi là một lời chúc văn bản hoặc video. Database tự kiểm tra:

- Tên người gửi dài 1–80 ký tự.
- Lời chúc văn bản dài 1–5.000 ký tự và không có trường video.
- Lời chúc video có path riêng tư, MIME, dung lượng tối đa 30 MB và thời lượng tối đa 60 giây.
- Trạng thái `pending` không có thời điểm duyệt; `approved`/`rejected` bắt buộc có thời điểm duyệt.
- Thứ tự hiển thị là số nguyên không âm hoặc `null`.
- Thời điểm cập nhật được trigger duy trì tự động.

## Mô hình truy cập

RLS được bật nhưng không có policy cho `anon` hoặc `authenticated`; quyền trên bảng cũng bị thu hồi khỏi hai role này. Form đóng góp, trang quà và trang quản trị phải gọi logic phía máy chủ. Chỉ mã server đáng tin cậy mới được dùng `service_role`.

Không bao giờ đưa `service_role` key vào biến môi trường có tiền tố `NEXT_PUBLIC_`, bundle phía trình duyệt, log hoặc tài liệu được commit.

## Private Storage buckets

| Bucket | Giới hạn | MIME được phép | Mục đích |
|---|---:|---|---|
| `wish-avatars` | 5 MB | JPEG, PNG, WebP | Ảnh đại diện người gửi |
| `wish-videos` | 30 MB | MP4, WebM, QuickTime | Video lời chúc |

Cả hai bucket có `public = false` và không có policy cho role phía trình duyệt. Backend sẽ upload bằng `service_role` và chỉ tạo signed URL có thời hạn sau khi kiểm tra quyền của phiên người dùng.
