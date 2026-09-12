# Cấu trúc mã nguồn

- `app/`: route, layout và các file đặc biệt của Next.js App Router.
- `components/`: thành phần giao diện dùng chung giữa nhiều tính năng.
- `features/`: mã nguồn được nhóm theo nghiệp vụ như đóng góp, quản trị và mở quà.
- `lib/`: tiện ích, cấu hình và lớp tích hợp dùng chung.
- `styles/`: design token, global reset và quy ước style mobile-first.
- `types/`: kiểu TypeScript dùng chung toàn ứng dụng.

Ưu tiên đặt mã theo tính năng trong `features/`. Chỉ chuyển thành phần hoặc tiện ích sang thư mục dùng chung khi có từ hai nơi sử dụng trở lên.
