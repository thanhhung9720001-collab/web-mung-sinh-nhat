# Tiện ích dùng chung

## `time.ts`

Đây là nguồn quy ước thời gian duy nhất của ứng dụng:

- Múi giờ cố định: `Asia/Ho_Chi_Minh`.
- Locale hiển thị: `vi-VN`.
- Chuỗi thời gian cấu hình phải là ISO 8601 có offset rõ ràng.
- Có helper định dạng, tách phần ngày giờ, tính countdown và xác định trạng thái lịch.

Không so sánh ngày giờ bằng chuỗi đã định dạng. Hãy parse thành `Date` rồi so sánh instant bằng timestamp thông qua các helper trong file này.
