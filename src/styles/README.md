# Hệ thống style

## Nguyên tắc

- `tokens.css` chứa giá trị thiết kế gốc và token ngữ nghĩa. Component nên dùng token ngữ nghĩa như `--color-text-primary`, không dùng mã màu trực tiếp.
- `globals.css` chứa reset, style nền và một số utility thực sự dùng chung.
- Style riêng của component hoặc route dùng CSS Module đặt cạnh component.
- Mobile là mặc định. Chỉ mở rộng bố cục bằng media query `min-width`.

## Breakpoint quy ước

CSS custom property không dùng ổn định trong điều kiện media query, vì vậy breakpoint được ghi thành quy ước thay vì token:

- `40rem` (640px): điện thoại ngang hoặc tablet nhỏ.
- `64rem` (1024px): tablet ngang hoặc desktop nhỏ.
- `80rem` (1280px): desktop rộng.

## Accessibility

- Vùng chạm tối thiểu dùng `--tap-target` là 44px.
- Focus bàn phím dùng `--color-focus` và không được tắt nếu chưa có thay thế tương đương.
- Chuyển động phải dùng các token duration/easing và có hành vi phù hợp với `prefers-reduced-motion`.
- Nội dung chính dùng các token text semantic đã được chọn để dễ đọc trên nền xanh đêm.
