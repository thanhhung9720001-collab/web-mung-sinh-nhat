# Ảnh riêng dùng trong trang quà

Đặt ảnh gốc của Bé Heo vào thư mục này và dùng tên dễ nhận biết, ví dụ:

- `chan-dung-tot-nghiep.jpg`
- `anh-doi-thuong.jpg`
- `anh-ky-niem-nhom.jpg`
- `nhac-nen.mp3`
- `video-ket.mp4`
- `la-thu-cuoi.txt`

Các file ảnh trong thư mục bị Git bỏ qua và không được đưa vào repository.
Không chuyển ảnh sang `public/`. Khi tới mục tích hợp nội dung chính thức, ảnh
sẽ được tối ưu rồi upload vào Supabase Storage private; trang `/gift` chỉ tải
ảnh sau khi xác thực phiên.

Nhạc nền, video kết và lá thư cũng có thể đặt tạm ở đây. Chỉ sử dụng file nhạc
và video mà bạn có quyền chia sẻ. Hai file media chính thức sẽ được upload vào
bucket `gift-assets` private; mã nguồn chỉ lưu object path trong biến môi trường
server-only.
