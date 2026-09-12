# Website sinh nhật “Bầu trời lời chúc”



## Tóm tắt



Xây dựng website mobile-first mang phong cách bầu trời đêm màu hồng pastel. Mỗi lời chúc đã được duyệt là một ngôi sao; cô ấy mở từng ngôi sao để đọc văn bản hoặc xem video, sau đó mới tiết lộ ảnh và tên người gửi. Khi đã khám phá 70% lời chúc, các ngôi sao kết thành trái tim và mở khóa video cùng lá thư cuối của bạn.



- Ngày sinh nhật: 17/09/2026.

- Khóa nhận lời chúc: 23:59 ngày 15/09/2026, múi giờ Việt Nam.

- Quy mô: 10–30 người.

- Triển khai bằng tên miền phụ miễn phí.

- Ngân sách tối đa: 500.000₫.

- Lưu `PRODUCT_BRIEF.md` và `IMPLEMENTATION_PLAN.md` ngay khi bắt đầu triển khai để giữ toàn bộ quyết định và tiến độ.



## Trải nghiệm và chức năng



- Trang đóng góp dùng một link chung, gồm hướng dẫn ngắn, tên người gửi, ảnh đại diện và lựa chọn lời chúc văn bản hoặc video.

- Video tối đa 60 giây và 30 MB; kiểm tra định dạng, dung lượng trước khi tải lên. Cho phép ảnh mặc định nếu người gửi không muốn cung cấp ảnh.

- Sau khi gửi, nội dung ở trạng thái chờ duyệt và người gửi nhận xác nhận thành công; không được tự động xuất bản.

- Trang quản trị có mật khẩu riêng, cho phép xem trước, duyệt, từ chối, sắp xếp và xóa lời chúc; có chế độ xem trước toàn bộ món quà trước ngày mở.

- Trang quà có mật khẩu riêng và chỉ hiển thị nội dung đã duyệt. Trước 00:00 ngày 17/09, khách truy cập thấy màn hình đếm ngược; quản trị viên vẫn có thể xem thử.

- Khi mở ngôi sao, nội dung xuất hiện trước; ảnh và tên người gửi được tiết lộ bằng thao tác tiếp theo hoặc sau khi video kết thúc.

- Nhạc nền bắt đầu sau lần chạm đầu tiên, có nút bật/tắt; tự giảm âm hoặc tạm dừng khi video phát.

- Tôn trọng chế độ giảm chuyển động, có phụ đề cho video khi được cung cấp và đảm bảo chữ dễ đọc trên nền pastel.

- Sau khi mở khóa phần kết, cô ấy vẫn có thể tiếp tục khám phá các ngôi sao còn lại.



## Kiến trúc và dữ liệu



- Dùng Next.js + TypeScript cho giao diện và logic phía máy chủ, triển khai trên Vercel; dùng Supabase Postgres và private Storage cho dữ liệu, ảnh và video.

- Supabase Free hiện có 1 GB Storage và giới hạn 50 MB/file, nên giới hạn ứng dụng ở 30 MB/video để chứa tối đa 30 video cùng ảnh trong phạm vi miễn phí. [Supabase Pricing](https://supabase.com/pricing)

- Mật khẩu người nhận và mật khẩu quản trị được lưu dưới dạng biến môi trường; xác thực phía máy chủ và cấp cookie phiên `HttpOnly`, `Secure`, có thời hạn. Không dựa vào tính năng Password Protection trả phí của Vercel. [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)

- Các tuyến chính:

&#x20; - `/contribute/[secret]`: form gửi lời chúc.

&#x20; - `/gift`: màn hình mật khẩu, đếm ngược và trải nghiệm bầu trời sao.

&#x20; - `/admin`: đăng nhập quản trị, kiểm duyệt và xem trước.

- Bản ghi lời chúc gồm: ID, tên, đường dẫn ảnh, loại nội dung, văn bản hoặc đường dẫn video, trạng thái `pending/approved/rejected`, thứ tự, thời điểm tạo và thời điểm duyệt.

- File nằm trong bucket riêng tư; chỉ cấp URL có thời hạn cho nội dung được phép xem. Khóa quản trị không bao giờ xuất hiện trong mã phía trình duyệt.

- Backend xác thực loại MIME, kích thước, trường bắt buộc và chống gửi lặp cơ bản bằng honeypot cùng giới hạn tần suất.

- Thêm `noindex`, link đóng góp khó đoán và thông báo đồng ý cho phép sử dụng ảnh/video trong món quà riêng tư này.

- Trước ngày ra mắt, xuất danh sách lời chúc và tải bản sao toàn bộ media. Sau 90 ngày, thực hiện bước lưu trữ hoặc xóa dữ liệu thủ công theo checklist trong tài liệu.



## Thiết kế và tiến độ



- Bảng màu: hồng pastel, tím hồng nhạt, xanh đêm dịu và ánh sao vàng kem.

- Chuyển động nhẹ: sao lấp lánh, nền parallax chậm, phong thư mở mềm và chòm sao trái tim; tránh hiệu ứng nặng làm nóng điện thoại.

- 08–11/09: khởi tạo dự án, dữ liệu, upload, form đóng góp và quản trị.

- 12–13/09: xây trải nghiệm bầu trời sao, tiết lộ danh tính, nhạc và phần kết.

- 14/09: kiểm thử điện thoại, hiệu năng, bảo mật và luồng gửi thật.

- 15/09: nhận nội dung cuối, khóa form lúc 23:59.

- 16/09: duyệt lần cuối, thay nội dung chính thức, sao lưu và diễn tập mở quà.

- 17/09: mở trang quà chính thức.



## Kiểm thử và tiêu chí hoàn thành



- Kiểm thử gửi lời chúc văn bản, video hợp lệ và các lỗi: quá 30 MB, sai định dạng, thiếu tên, mất mạng hoặc gửi trùng.

- Xác nhận nội dung chờ duyệt không xuất hiện trên trang quà; duyệt, từ chối, sắp xếp và xóa hoạt động đúng.

- Xác nhận người không có mật khẩu không xem được media; link hết hạn và cookie phiên hoạt động đúng.

- Kiểm thử mốc đóng form, đếm ngược và mở quà theo múi giờ `Asia/Ho_Chi_Minh`.

- Xác nhận phần kết mở đúng khi đạt ngưỡng `ceil(tổng lời chúc đã duyệt × 70%)`.

- Kiểm thử Safari và Chrome trên điện thoại, màn hình nhỏ, mạng chậm, chế độ giảm chuyển động và âm thanh bị trình duyệt chặn.

- Mục tiêu: nội dung đầu tiên hiển thị nhanh trên 4G, thao tác chạm mượt, video không làm nhạc phát chồng và không có file riêng tư nào truy cập được bằng URL công khai cố định.



## Giả định và nội dung cần cung cấp



- Bạn sẽ cung cấp: tên cô ấy, lời mở đầu, video và thư cuối, file nhạc, mật khẩu người nhận, mật khẩu quản trị và ảnh mặc định.

- Giao diện sử dụng tiếng Việt; ưu tiên điện thoại nhưng vẫn dùng được trên máy tính.

- Tên miền phụ Vercel được dùng cho bản đầu; không mua tên miền riêng.

- Nếu tổng media gần chạm 1 GB, ưu tiên yêu cầu người gửi nén/thay video thay vì nâng cấp dịch vụ.



