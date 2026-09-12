# PRODUCT BRIEF — Ngân Hà Của Bé Heo

## 1. Tổng quan sản phẩm

**Tên làm việc:** Ngân Hà Của Bé Heo  
**Thông điệp phụ đề đề xuất:** Mỗi vì sao là một lời yêu thương dành cho bé iu.  
**Người nhận:** Nguyễn Thị Thanh Ngân (bé Heo)  
**Ngày mở quà:** 00:00 ngày 17/09/2026, múi giờ `Asia/Ho_Chi_Minh`  
**Hạn nhận lời chúc:** 23:59 ngày 15/09/2026, múi giờ `Asia/Ho_Chi_Minh`

Website là một món quà sinh nhật riêng tư, ưu tiên trải nghiệm trên điện thoại. Mỗi lời chúc đã được duyệt xuất hiện dưới dạng một ngôi sao trên bầu trời đêm pastel. Bé iu mở từng ngôi sao để đọc lời nhắn hoặc xem video, sau đó mới khám phá ảnh và tên người gửi. Khi đã mở ít nhất 70% số lời chúc, các ngôi sao kết thành trái tim và mở khóa phần quà cuối.

## 2. Mục tiêu

- Tạo một món quà sinh nhật cá nhân, bất ngờ và giàu cảm xúc cho bé Heo.
- Giúp 10–30 người thân, bạn bè gửi lời chúc bằng văn bản hoặc video qua một liên kết chung.
- Bảo đảm chỉ nội dung đã được quản trị viên duyệt mới xuất hiện trong món quà.
- Giữ ảnh, video và lời chúc ở chế độ riêng tư, không để công cụ tìm kiếm lập chỉ mục.
- Mang lại trải nghiệm mượt trên điện thoại phổ biến và mạng 4G.
- Hoàn thành trong ngân sách tối đa 500.000₫, ưu tiên các gói miễn phí.

## 3. Người dùng

### Bé Heo — người nhận quà

- Truy cập trang quà bằng mật khẩu riêng.
- Trước giờ mở quà: thấy màn hình đếm ngược.
- Từ giờ mở quà: khám phá từng ngôi sao, nội dung và danh tính người gửi.
- Mở khóa phần kết khi đạt ngưỡng khám phá.
- Vẫn có thể tiếp tục mở các lời chúc còn lại sau phần kết.

### Người gửi lời chúc

- Truy cập bằng liên kết đóng góp khó đoán.
- Nhập tên, ảnh đại diện tùy chọn và chọn lời chúc văn bản hoặc video.
- Đồng ý cho phép sử dụng nội dung trong món quà riêng tư này.
- Nhận xác nhận sau khi gửi; nội dung ở trạng thái chờ duyệt và không tự động xuất bản.

### Quản trị viên

- Đăng nhập bằng mật khẩu quản trị riêng.
- Xem trước, duyệt, từ chối, sắp xếp và xóa lời chúc.
- Xem thử toàn bộ trải nghiệm trước ngày mở quà.
- Xuất danh sách lời chúc và sao lưu media trước ngày ra mắt.

## 4. Phạm vi phiên bản ra mắt

### Trang đóng góp — `/contribute/[secret]`

- Hướng dẫn ngắn bằng tiếng Việt.
- Các trường: tên người gửi, ảnh đại diện tùy chọn, loại lời chúc và nội dung tương ứng.
- Lời chúc văn bản là trường bắt buộc khi chọn loại văn bản.
- Video tối đa 60 giây và 30 MB; kiểm tra định dạng MIME và dung lượng trước khi tải lên.
- Dùng ảnh mặc định khi người gửi không cung cấp ảnh.
- Có checkbox đồng ý sử dụng ảnh/video/lời chúc trong món quà riêng tư.
- Có honeypot và giới hạn tần suất cơ bản để chống gửi rác hoặc gửi lặp.
- Sau 23:59 ngày 15/09/2026, form chuyển sang trạng thái đã đóng.

### Trang quà — `/gift`

- Màn hình nhập mật khẩu và phiên đăng nhập có thời hạn.
- Đếm ngược đến 00:00 ngày 17/09/2026.
- Bầu trời sao chỉ chứa lời chúc ở trạng thái `approved`.
- Lần tương tác đầu tiên mới bắt đầu phát nhạc nền.
- Mở ngôi sao để xem văn bản hoặc video; thao tác tiếp theo mới tiết lộ ảnh và tên người gửi.
- Với video, danh tính có thể xuất hiện sau khi video kết thúc.
- Nhạc nền tự giảm âm hoặc tạm dừng trong lúc phát video.
- Nút bật/tắt nhạc luôn dễ tìm.
- Phần kết mở khi số lời chúc đã khám phá đạt `ceil(tổng lời chúc đã duyệt × 70%)`.
- Tôn trọng cài đặt giảm chuyển động của thiết bị.

### Trang quản trị — `/admin`

- Đăng nhập bằng mật khẩu riêng với trang quà.
- Danh sách và bộ lọc theo trạng thái `pending`, `approved`, `rejected`.
- Xem trước đầy đủ văn bản, ảnh và video trước khi duyệt.
- Duyệt, từ chối, sắp xếp và xóa có bước xác nhận phù hợp.
- Chế độ xem trước trang quà bỏ qua mốc thời gian nhưng không làm thay đổi trạng thái công khai.

## 5. Trải nghiệm và phong cách

- **Giọng điệu:** kết hợp lãng mạn, dễ thương và vui vẻ.
- **Cách xưng hô chính:** “bé iu”.
- **Ngôn ngữ:** hoàn toàn bằng tiếng Việt.
- **Mỹ thuật:** hồng pastel, tím hồng nhạt, xanh đêm dịu và ánh sao vàng kem.
- **Chuyển động:** sao lấp lánh, parallax chậm, phong thư mở mềm và chòm sao trái tim.
- Hiệu ứng phải nhẹ, không gây nóng máy và có phiên bản giảm chuyển động.
- Chữ phải có độ tương phản tốt và dễ đọc trên nền pastel.

## 6. Nội dung cần chuẩn bị

| Nội dung | Trạng thái | Hạn đề xuất | Ghi chú |
|---|---|---:|---|
| Tiêu đề “Ngân Hà Của Bé Heo” | Đã chọn làm tên làm việc | 08/09 | Có thể đổi trước khi hoàn thiện giao diện |
| Phụ đề | Đã có bản đề xuất | 08/09 | “Mỗi vì sao là một lời yêu thương dành cho bé iu.” |
| Video phần kết | Chưa có | 13/09 | Nên quay ngang hoặc dọc theo bố cục được chọn khi làm giao diện |
| Lá thư cuối | Chưa có | 13/09 | Có thể viết nháp trước, chỉnh lần cuối ngày 16/09 |
| Nhạc nền | Chưa chọn | 13/09 | Cần file hoặc quyền sử dụng phù hợp |
| Ảnh đại diện mặc định | Chuẩn bị sau | 12/09 | Nên đồng bộ phong cách bầu trời sao |
| Mật khẩu trang quà | Chưa tạo | Trước triển khai thật | Không ghi mật khẩu thật vào tài liệu hoặc Git |
| Mật khẩu quản trị | Chưa tạo | Trước triển khai thật | Phải khác mật khẩu trang quà |
| Tên miền | Quyết định sau | 14/09 | Có thể dùng tên miền phụ miễn phí của Vercel |

## 7. Nguyên tắc mật khẩu

- **Trang quà:** dùng một cụm từ riêng, dễ nhập trên điện thoại nhưng khó đoán; đề xuất 4–5 từ không liên quan, dài tối thiểu 16 ký tự.
- **Quản trị:** dùng mật khẩu ngẫu nhiên riêng, dài tối thiểu 20 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
- Hai mật khẩu không được giống nhau hoặc dùng lại từ tài khoản cá nhân.
- Chỉ lưu trong trình quản lý mật khẩu và biến môi trường triển khai như `GIFT_PASSWORD_HASH` và `ADMIN_PASSWORD_HASH`.
- Ứng dụng chỉ so sánh bản băm ở phía máy chủ; không đưa mật khẩu hoặc khóa quản trị xuống trình duyệt.

## 8. Kiến trúc dự kiến

- Next.js + TypeScript cho giao diện và logic phía máy chủ.
- Vercel cho triển khai.
- Supabase Postgres cho dữ liệu và private Storage cho ảnh/video.
- Media chỉ được cung cấp qua URL ký có thời hạn sau khi máy chủ xác nhận quyền truy cập.
- Cookie phiên dùng `HttpOnly`, `Secure`, `SameSite` phù hợp và có thời hạn.
- Thêm `noindex` cho toàn bộ website.

## 9. Dữ liệu lời chúc tối thiểu

- `id`
- `sender_name`
- `avatar_path`
- `content_type`: `text` hoặc `video`
- `message_text` hoặc `video_path`
- `status`: `pending`, `approved`, `rejected`
- `display_order`
- `created_at`
- `reviewed_at`

Chi tiết schema, chính sách truy cập và lịch sử migration sẽ được chốt ở giai đoạn triển khai nền tảng.

## 10. Ngoài phạm vi phiên bản đầu

- Tài khoản riêng cho từng người gửi.
- Bình luận, phản hồi hoặc mạng xã hội công khai.
- Livestream hoặc gọi video.
- Ứng dụng iOS/Android riêng.
- Hệ thống quản trị nhiều vai trò.
- Tự động xóa dữ liệu; phiên bản đầu dùng checklist thủ công sau 90 ngày.

## 11. Tiêu chí thành công

- Có thể hoàn thành một vòng: gửi → chờ duyệt → duyệt → xuất hiện trên trang quà.
- Nội dung chưa duyệt và media riêng tư không thể xem từ trang quà.
- Mốc đóng form, đếm ngược và mở quà đúng theo `Asia/Ho_Chi_Minh`.
- Phần kết chỉ mở khi đạt đúng ngưỡng 70%.
- Trải nghiệm dùng được trên Safari và Chrome điện thoại, kể cả màn hình nhỏ và mạng chậm.
- Âm thanh không phát chồng giữa nhạc nền và video.
- Có bản sao dữ liệu và media trước khi mở quà.

## 12. Các quyết định còn mở

- Nội dung video phần kết.
- Nội dung lá thư cuối.
- Bài/file nhạc nền.
- Ảnh đại diện mặc định.
- Mật khẩu thật cho trang quà và quản trị.
- Tên miền cuối cùng.
- Danh sách định dạng video được chấp nhận sau khi kiểm tra khả năng phát trên Safari/Chrome.

Các mục này được phép để `TBD` và không cản trở việc bắt đầu xây dựng nền tảng.
