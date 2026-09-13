# Báo cáo kiểm thử Giai đoạn 6

**Ngày chạy:** 13/09/2026  
**Phạm vi:** luồng gửi lời chúc, xác thực, media riêng tư, lịch đóng/mở, trải nghiệm mở quà, mobile và khả năng truy cập cơ bản.

## Kết quả tự động

- `pnpm test`: 26/26 ca kiểm thử đạt.
- `pnpm lint`: đạt.
- `pnpm build`: đạt với Next.js 16.3.4.
- `pnpm audit:client-secrets`: đạt; không phát hiện tên hoặc giá trị secret trong 17 bundle trình duyệt.
- Route media của trang quà và quản trị trả `404` khi không có phiên hợp lệ.

Các ca tự động bao phủ:

- lời chúc văn bản/video hợp lệ;
- thiếu tên, thiếu nội dung, thiếu đồng ý sử dụng;
- MIME không hỗ trợ, chữ ký file giả, avatar quá 5 MB, video quá 30 MB hoặc 60 giây;
- mốc đóng form, giờ mở quà, countdown và timestamp thiếu UTC offset;
- công thức `ceil(total × 70%)` với tổng bằng 0, nhỏ và lẻ;
- tiến độ bị hỏng, ID trùng, lời chúc không còn `approved` và ngưỡng thay đổi sau khi duyệt thêm;
- mật khẩu đúng/sai, hash sai định dạng;
- phiên hợp lệ, token bị sửa, sai phiên bản, quá thời hạn hoặc thời gian sống vượt giới hạn;
- signed URL mặc định 5 phút và luôn bị chặn trong khoảng 1–15 phút;
- các cặp màu chữ chính đạt tối thiểu WCAG AA 4.5:1.

## Kết quả kiểm thử trình duyệt

Đã chạy luồng mở quà ở viewport 360×640:

- bố cục không tràn ngang và điều khiển chính vẫn thao tác được;
- mở ngôi sao bằng `Enter`;
- focus tự chuyển vào hộp thoại, `Tab`/`Shift+Tab` được giữ trong hộp thoại;
- tiết lộ người gửi bằng bàn phím, nội dung mới có vùng thông báo cho trình đọc màn hình;
- `Escape` đóng hộp thoại và trả focus về đúng ngôi sao;
- autoplay bị chặn hiển thị hướng dẫn bật nhạc thủ công;
- đạt ngưỡng sẽ chạy hoạt ảnh trái tim rồi mở phần kết;
- không có lỗi JavaScript trong console.

Một lỗi biên đã được phát hiện và sửa: trạng thái phần kết cũ trong `localStorage` không còn có thể bỏ qua ngưỡng 70% mới khi quản trị viên duyệt thêm lời chúc.

## Tối ưu hiệu năng

- Avatar mới và avatar thay thế được tự xoay đúng EXIF, thu về tối đa 1024×1024 và chuyển WebP chất lượng 82 trước khi upload private.
- Avatar chỉ được tải sau khi người nhận chủ động tiết lộ người gửi; có kích thước cố định, lazy loading và giải mã bất đồng bộ.
- Video dùng `preload="metadata"`; media vẫn qua route xác thực, signed URL ngắn hạn và `no-store`.
- Hiệu ứng tôn trọng `prefers-reduced-motion`; ngưỡng chạm ngôi sao lớn hơn 44 px.

## Việc cần xác nhận bằng thiết bị/người thật

Đã xác nhận tên miền production và luồng vào trang quà trên thiết bị iOS thực tế sau khi sửa trang placeholder. Kiểm thử Chromium 360×640, fallback autoplay và xử lý video cũng đã đạt. Nhạc/video chính thức sẽ được phát lại khi được thêm ở Giai đoạn 7.

Còn một việc cần người thật: nhờ ít nhất một người không phải quản trị viên mở link bí mật, gửi lời chúc thật và báo lại cảm nhận. Việc này không thể được tự chứng nhận thay cho người dùng.
