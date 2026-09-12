# IMPLEMENTATION PLAN — Ngân Hà Của Bé Heo

## 1. Mục tiêu triển khai

Hoàn thành website quà sinh nhật trước ngày 17/09/2026 theo phạm vi trong `PRODUCT_BRIEF.md`, ưu tiên an toàn dữ liệu, trải nghiệm mobile-first và một luồng hoạt động hoàn chỉnh trước khi bổ sung hiệu ứng.

## 2. Quy ước trạng thái

- `[ ]` Chưa bắt đầu
- `[~]` Đang thực hiện
- `[x]` Hoàn thành
- `[!]` Bị chặn hoặc cần quyết định

Một giai đoạn chỉ được coi là hoàn thành khi đạt tiêu chí nghiệm thu của giai đoạn đó.

## 3. Kế hoạch theo giai đoạn

### Giai đoạn 1 — Chốt yêu cầu và phạm vi

**Thời gian:** 08/09/2026  
**Trạng thái:** Hoàn thành

- [x] Đọc và đối chiếu `BIRTHDAY_WEBSITE_PLAN.md`.
- [x] Chốt người nhận: Nguyễn Thị Thanh Ngân (bé Heo).
- [x] Chốt cách xưng hô: “bé iu”.
- [x] Chốt giọng điệu: lãng mạn, dễ thương và vui vẻ.
- [x] Chọn tên làm việc: “Ngân Hà Của Bé Heo”.
- [x] Chốt ngôn ngữ giao diện: hoàn toàn tiếng Việt.
- [x] Ghi nhận video cuối, lá thư, nhạc, ảnh mặc định và tên miền sẽ bổ sung sau.
- [x] Chốt nguyên tắc không lưu mật khẩu thật trong tài liệu hoặc Git.
- [x] Hoàn thành `PRODUCT_BRIEF.md` và `IMPLEMENTATION_PLAN.md`.

**Tiêu chí nghiệm thu:** Phạm vi phiên bản đầu, nhóm người dùng, luồng chính, yêu cầu riêng tư, nội dung còn thiếu và tiêu chí thành công đều được ghi lại; các mục `TBD` không cản trở việc lập trình.

### Giai đoạn 2 — Dựng nền tảng kỹ thuật

**Thời gian:** 08–09/09/2026  
**Phụ thuộc:** Giai đoạn 1
**Trạng thái:** Hoàn thành

- [x] Khởi tạo Next.js với TypeScript, App Router, lint và cấu trúc thư mục rõ ràng.
- [x] Thiết lập hệ thống style và các design token mobile-first.
- [x] Tạo dự án Supabase hoặc kết nối dự án đã có.
- [x] Thiết kế schema dữ liệu và migration cho lời chúc.
- [x] Tạo private bucket cho avatar và video.
- [x] Thiết lập biến môi trường mẫu trong `.env.example`, không chứa bí mật thật.
- [x] Thiết lập helper thời gian dùng `Asia/Ho_Chi_Minh`.
- [x] Thêm metadata `noindex`.
- [x] Tạo bản triển khai thử trên Vercel.

**Tiêu chí nghiệm thu:** Ứng dụng chạy được cục bộ và trên bản deploy thử; kết nối cơ sở dữ liệu thành công; bucket không cho truy cập công khai; không có secret trong Git.

### Giai đoạn 3 — Luồng gửi lời chúc

**Thời gian:** 09–10/09/2026  
**Phụ thuộc:** Giai đoạn 2
**Trạng thái:** Hoàn thành

- [x] Tạo route `/contribute/[secret]` và kiểm tra secret phía máy chủ.
- [x] Xây form tên, avatar tùy chọn, lựa chọn văn bản/video và đồng ý sử dụng nội dung.
- [x] Hiển thị ảnh mặc định khi không có avatar.
- [x] Kiểm tra trường bắt buộc ở cả client và server.
- [x] Kiểm tra MIME, giới hạn video 60 giây và 30 MB.
- [x] Upload vào private Storage và tạo bản ghi `pending`.
- [x] Thêm honeypot và giới hạn tần suất cơ bản.
- [x] Xử lý trạng thái đang gửi, thành công, lỗi mạng và gửi lại an toàn.
- [x] Khóa form đúng 23:59 ngày 15/09/2026.

**Tiêu chí nghiệm thu:** Gửi được lời chúc văn bản và video hợp lệ; dữ liệu luôn ở trạng thái `pending`; file sai định dạng/quá dung lượng và form thiếu dữ liệu bị từ chối rõ ràng.

### Giai đoạn 4 — Quản trị và kiểm duyệt

**Thời gian:** 10–11/09/2026  
**Phụ thuộc:** Giai đoạn 2, dữ liệu mẫu từ giai đoạn 3
**Trạng thái:** Hoàn thành

- [x] Xây đăng nhập `/admin` và cookie phiên an toàn.
- [x] Không để khóa quản trị hoặc mật khẩu xuất hiện trong mã trình duyệt.
- [x] Hiển thị danh sách và lọc theo trạng thái.
- [x] Tạo URL ký có thời hạn để xem media trong phiên quản trị.
- [x] Xem trước đầy đủ nội dung trước khi duyệt.
- [x] Thực hiện duyệt, từ chối và xóa có xác nhận.
- [x] Thực hiện sắp xếp thứ tự hiển thị.
- [x] Thêm chế độ xem thử món quà trước giờ mở.

**Mốc kiểm soát bắt buộc:** Hoàn thành một vòng gửi → chờ duyệt → duyệt → xuất hiện trong dữ liệu trang quà trước khi tập trung vào hiệu ứng.

**Tiêu chí nghiệm thu:** Quản trị viên xử lý được toàn bộ vòng đời lời chúc; người không có phiên quản trị không truy cập được thao tác hoặc media quản trị.

### Bổ sung sau Giai đoạn 4 — Người gửi tự chỉnh sửa

**Trạng thái:** Hoàn thành

- [x] Cấp link chỉnh sửa bí mật sau khi gửi; cho phép cập nhật trước hạn đóng, đưa nội dung về `pending` và dọn media cũ an toàn.

**Tiêu chí nghiệm thu:** Người có link chỉnh sửa hợp lệ sửa được tên, avatar và nội dung trước hạn đóng; link giả hoặc hết hạn bị từ chối; nội dung đã sửa phải được duyệt lại.

### Giai đoạn 5 — Trải nghiệm mở quà

**Thời gian:** 12–13/09/2026  
**Phụ thuộc:** Giai đoạn 4
**Trạng thái:** Đang thực hiện (2/11 mục hoàn thành)

- [x] Xây đăng nhập `/gift` với mật khẩu riêng và cookie phiên.
- [x] Xây màn hình đếm ngược theo `Asia/Ho_Chi_Minh`.
- [ ] Tạo bầu trời sao từ các lời chúc `approved`.
- [ ] Tạo luồng mở nội dung rồi tiết lộ ảnh và tên người gửi.
- [ ] Ghi nhận tiến độ khám phá theo phiên/trình duyệt.
- [ ] Tính ngưỡng mở phần kết bằng `ceil(approvedTotal × 70%)`.
- [ ] Tạo hoạt ảnh các sao kết thành trái tim.
- [ ] Tạo phần video và lá thư cuối với nội dung tạm nếu bản chính chưa có.
- [ ] Thêm nhạc nền sau lần chạm đầu tiên và nút bật/tắt.
- [ ] Giảm âm hoặc tạm dừng nhạc khi video phát.
- [ ] Thêm chế độ giảm chuyển động và trạng thái dự phòng khi autoplay bị chặn.

**Tiêu chí nghiệm thu:** Người nhận có thể đăng nhập, mở sao, xem nội dung, tiết lộ danh tính và mở đúng phần kết; các sao còn lại vẫn hoạt động sau đó.

### Giai đoạn 6 — Hoàn thiện và kiểm thử

**Thời gian:** 14–15/09/2026  
**Phụ thuộc:** Giai đoạn 3–5

- [ ] Kiểm thử lời chúc văn bản và video hợp lệ.
- [ ] Kiểm thử file quá 30 MB, sai định dạng, thiếu tên, mất mạng và gửi trùng.
- [ ] Xác nhận nội dung `pending`/`rejected` không xuất hiện trên trang quà.
- [ ] Kiểm thử signed URL hết hạn và quyền truy cập media.
- [ ] Kiểm thử cookie hết hạn, đăng xuất và mật khẩu sai.
- [ ] Kiểm thử mốc đóng form, đếm ngược và giờ mở quà.
- [ ] Kiểm thử các trường hợp tổng lời chúc nhỏ/lẻ cho công thức 70%.
- [ ] Kiểm thử Safari và Chrome trên điện thoại, màn hình nhỏ và mạng chậm.
- [ ] Kiểm thử reduced motion, độ tương phản, bàn phím và trình đọc màn hình ở mức cơ bản.
- [ ] Kiểm thử nhạc, video và trường hợp trình duyệt chặn autoplay.
- [ ] Tối ưu ảnh, tải media và hiệu ứng để nội dung đầu tiên hiển thị nhanh trên 4G.
- [ ] Chạy một lượt thử nghiệm thật với ít nhất một người gửi ngoài quản trị viên.

**Tiêu chí nghiệm thu:** Không còn lỗi nghiêm trọng trong các luồng chính; không có media riêng tư bị lộ; trải nghiệm chấp nhận được trên các thiết bị mục tiêu.

### Giai đoạn 7 — Chuẩn bị ra mắt và vận hành

**Thời gian:** 15–17/09/2026  
**Phụ thuộc:** Giai đoạn 6

- [ ] Tạo và lưu an toàn mật khẩu trang quà cùng mật khẩu quản trị.
- [ ] Chọn tên miền hoặc xác nhận dùng tên miền phụ Vercel.
- [ ] Khóa nhận lời chúc lúc 23:59 ngày 15/09.
- [ ] Duyệt và sắp xếp nội dung lần cuối.
- [ ] Thay video, lá thư, nhạc và ảnh mặc định bằng nội dung chính thức.
- [ ] Xuất danh sách lời chúc và tải bản sao toàn bộ media.
- [ ] Diễn tập từ thiết bị chưa đăng nhập vào ngày 16/09.
- [ ] Xác nhận production environment, thời gian hệ thống và phiên bản triển khai.
- [ ] Mở quà chính thức lúc 00:00 ngày 17/09.
- [ ] Theo dõi lỗi trong ngày mở quà và giữ bản triển khai ổn định để rollback.
- [ ] Đặt lịch nhắc lưu trữ hoặc xóa dữ liệu thủ công sau 90 ngày.

**Tiêu chí nghiệm thu:** Nội dung chính thức đã được sao lưu và diễn tập; trang quà mở đúng giờ; có phương án khôi phục nếu bản triển khai cuối gặp lỗi.

## 4. Thứ tự ưu tiên

### Bắt buộc trước ngày mở quà

1. Riêng tư và xác thực.
2. Luồng gửi → duyệt → hiển thị.
3. Đếm ngược và thời điểm mở quà.
4. Mở lời chúc, tiết lộ danh tính và ngưỡng 70%.
5. Video/lá thư cuối và sao lưu dữ liệu.
6. Hoạt động ổn định trên điện thoại.

### Có thể giản lược nếu thiếu thời gian

- Mức độ phức tạp của parallax và hoạt ảnh trái tim.
- Kéo-thả sắp xếp; có thể thay bằng nhập số thứ tự.
- Phụ đề video tự động; phiên bản đầu chỉ dùng phụ đề do người gửi cung cấp.
- Hiệu ứng chuyển cảnh phụ không ảnh hưởng đến nội dung.

## 5. Quyết định kỹ thuật cần chốt ở đầu giai đoạn 2

- Phiên bản Node.js và package manager.
- Thư viện UI/CSS và animation.
- Cơ chế tạo, lưu và thu hồi phiên đăng nhập.
- Thuật toán băm mật khẩu.
- Chính sách signed URL và thời hạn URL.
- Các MIME video chính thức hỗ trợ trên Safari/Chrome.
- Cách lưu tiến độ các ngôi sao đã mở.
- Cách giới hạn tần suất trong phạm vi ngân sách miễn phí.

## 6. Quản lý thay đổi

- Mọi yêu cầu mới phải được đối chiếu với mục tiêu ra mắt ngày 17/09/2026.
- Thay đổi phạm vi được ghi vào phần nhật ký dưới đây trước khi triển khai.
- Không đánh đổi riêng tư, khả năng sao lưu hoặc luồng chính để thêm hiệu ứng.

## 7. Nhật ký quyết định

| Ngày | Quyết định | Lý do |
|---|---|---|
| 08/09/2026 | Chia dự án thành 7 giai đoạn | Dễ kiểm soát tiến độ và có tiêu chí nghiệm thu rõ ràng |
| 08/09/2026 | Dùng tên làm việc “Ngân Hà Của Bé Heo” | Gắn tên Ngân với chủ đề bầu trời sao và giữ sắc thái dễ thương |
| 08/09/2026 | Toàn bộ giao diện dùng tiếng Việt | Phù hợp người nhận và nhóm người gửi |
| 08/09/2026 | Nội dung chưa có được đánh dấu TBD | Cho phép bắt đầu kỹ thuật mà không khóa lựa chọn sáng tạo |
| 08/09/2026 | Không lưu mật khẩu thật trong Markdown hoặc Git | Giảm nguy cơ lộ quyền truy cập |
| 11/09/2026 | Upload media qua backend bằng Supabase secret key, chỉ lưu object path và tự dọn file nếu ghi database thất bại | Giữ bucket riêng tư, không đưa khóa lên trình duyệt và tránh media mồ côi |
| 11/09/2026 | Lưu cấu hình Supabase và mã đường dẫn đóng góp dưới dạng Vercel Secret cho Production, Preview và Development | Cho phép backend hoạt động ở mọi môi trường mà không ghi bí mật vào mã nguồn hoặc Git |
| 12/09/2026 | Dùng UUID ổn định của từng lượt soạn làm ID lời chúc và kiểm tra bản ghi trước khi gửi lại | Giữ nguyên nội dung khi lỗi mạng và ngăn tạo bản ghi trùng nếu phản hồi thành công trước đó bị thất lạc |
| 11/09/2026 | Giới hạn mỗi địa chỉ mạng ở 5 lần gửi trong 15 phút bằng bộ đếm nguyên tử trên Supabase; chỉ lưu HMAC của địa chỉ | Hoạt động nhất quán giữa các serverless instance, giảm spam và không lưu IP thô |
| 12/09/2026 | Kiểm tra hạn nhận lời chúc ở cả Server Component, trình duyệt và Server Action | Giao diện tự đóng đúng giờ và request trực tiếp không thể vượt qua mốc 23:59 ngày 15/09/2026 |
| 12/09/2026 | Xác thực quản trị bằng mật khẩu băm scrypt và phiên không trạng thái ký HMAC-SHA256, lưu trong cookie `HttpOnly`, `SameSite=Lax`, `Secure` trên production và hết hạn mặc định sau 8 giờ | Không lưu mật khẩu thật hoặc trạng thái phiên phía trình duyệt; token giả mạo, quá hạn hoặc có thời gian bất hợp lệ đều bị từ chối |
| 12/09/2026 | Giữ toàn bộ bí mật xác thực trong module `server-only` và quét `.next/static` bằng lệnh `pnpm audit:client-secrets` sau khi build | Chặn lỗi hồi quy làm tên biến hoặc giá trị khóa quản trị xuất hiện trong bundle gửi xuống trình duyệt |
| 12/09/2026 | Tải tối đa 200 lời chúc gần nhất qua DAL phía máy chủ, xác thực lại phiên quản trị và lọc bằng query `status` đã kiểm tra | Giữ khóa Supabase ngoài trình duyệt, tránh tin dữ liệu URL và cung cấp danh sách quản trị dễ theo dõi trên điện thoại |
| 12/09/2026 | Chỉ tạo signed URL cho avatar/video sau khi xác thực lại phiên quản trị; mặc định sống 5 phút, giới hạn tối đa 15 phút và chuyển hướng qua route `no-store` | Media vẫn ở bucket riêng tư, object path không xuất hiện trong danh sách và liên kết bị giới hạn thời gian sử dụng |
| 12/09/2026 | Mỗi lời chúc có trang chi tiết quản trị riêng, chỉ trả DTO tối thiểu và tải avatar/video qua route signed URL | Quản trị viên xem được toàn bộ nội dung cùng metadata trước khi ra quyết định mà không đưa object path riêng tư vào HTML |
| 12/09/2026 | Duyệt, từ chối và xóa bằng Server Action xác thực lại phiên; mọi thao tác đều có hộp xác nhận và xóa bản ghi trước khi dọn media bằng cơ chế best-effort | Ngăn request trái phép, giảm thao tác nhầm và tránh để bản ghi trỏ đến media đã bị xóa nếu Storage gặp lỗi |
| 12/09/2026 | Nhập vị trí hiển thị dạng 1-based trong giao diện, lưu 0-based trong dữ liệu và chỉ cho phép cập nhật lời chúc đã duyệt | Dễ thao tác trên điện thoại, đúng schema hiện tại và giữ các mục chưa xếp ở cuối danh sách đã duyệt |
| 12/09/2026 | Dùng `/admin/preview` làm chế độ xem thử riêng, chỉ tải lời chúc `approved` theo thứ tự và vẫn yêu cầu phiên quản trị | Cho phép kiểm tra nội dung trước giờ mở mà không mở quyền truy cập trang quà cho người nhận |
| 12/09/2026 | Bổ sung link chỉnh sửa bí mật ký HMAC cho từng lời chúc, chỉ có hiệu lực đến lúc đóng cổng | Cho người gửi tự sửa mà không cần tài khoản và không công khai ID hoặc quyền truy cập lời chúc khác |
| 12/09/2026 | Tách đăng nhập `/gift` bằng mật khẩu băm scrypt, khóa ký và cookie phiên riêng giới hạn trong đường dẫn `/gift` | Phiên người nhận không thể dùng thay phiên quản trị; mật khẩu thật và khóa ký không đi vào mã nguồn hoặc trình duyệt |
| 12/09/2026 | Render mốc mở quà từ server và chạy đồng hồ đếm ngược phía trình duyệt bằng timestamp tuyệt đối, tự refresh khi về 0 | Tránh lệch hydration, giữ đúng múi giờ Việt Nam và chuyển trạng thái mà không cần người nhận tải lại trang |
