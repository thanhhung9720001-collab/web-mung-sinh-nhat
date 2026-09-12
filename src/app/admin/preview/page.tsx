import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-session.server";
import {
  listAdminApprovedWishesForPreview,
  type AdminGiftPreviewWish,
} from "@/lib/supabase-admin.server";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Xem thử món quà | Quản trị",
};

export default async function AdminGiftPreviewPage() {
  if (!(await hasValidAdminSession())) {
    redirect("/admin");
  }

  let wishes: AdminGiftPreviewWish[] = [];
  let loadFailed = false;

  try {
    wishes = await listAdminApprovedWishesForPreview();
  } catch {
    loadFailed = true;
  }

  return (
    <main className={styles.previewPage}>
      <div className={styles.previewStars} aria-hidden="true" />
      <header className={styles.previewHeader}>
        <div>
          <span className={styles.previewMode}>Chế độ xem thử · Chỉ quản trị viên</span>
          <h1>Ngân Hà Của Bé Heo</h1>
          <p>
            Đây là bản kiểm tra nội dung đã duyệt trước giờ mở quà. Giao diện
            trải nghiệm chính thức sẽ được hoàn thiện ở Giai đoạn 5.
          </p>
        </div>
        <Link href="/admin?status=approved">← Về phòng điều khiển</Link>
      </header>

      {loadFailed ? (
        <div className={styles.previewNotice} role="alert">
          Chưa thể tải dữ liệu xem thử. Vui lòng kiểm tra cấu hình Supabase.
        </div>
      ) : wishes.length === 0 ? (
        <div className={styles.previewEmpty}>
          <span aria-hidden="true">✦</span>
          <h2>Bầu trời đang chờ những vì sao đầu tiên</h2>
          <p>Duyệt ít nhất một lời chúc để xem nội dung tại đây.</p>
        </div>
      ) : (
        <>
          <p className={styles.previewCount}>{wishes.length} vì sao đã sẵn sàng</p>
          <ol className={styles.previewGrid}>
            {wishes.map((wish, index) => (
              <PreviewWishCard key={wish.id} wish={wish} index={index} />
            ))}
          </ol>
        </>
      )}
    </main>
  );
}

function PreviewWishCard({
  wish,
  index,
}: {
  wish: AdminGiftPreviewWish;
  index: number;
}) {
  return (
    <li className={styles.previewWish}>
      <span className={styles.previewIndex} aria-label={`Vị trí ${index + 1}`}>
        ✦ {index + 1}
      </span>

      {wish.hasAvatar ? (
        // The browser follows this authenticated endpoint to short-lived media.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/admin/media/${wish.id}/avatar`}
          alt={`Ảnh đại diện của ${wish.senderName}`}
        />
      ) : (
        <div className={styles.previewDefaultAvatar} aria-label="Ảnh mặc định">
          ✦
        </div>
      )}

      <h2>{wish.senderName}</h2>

      {wish.contentType === "text" ? (
        <p className={styles.previewMessage}>{wish.messageText}</p>
      ) : (
        <div className={styles.previewVideo}>
          <video
            controls
            preload="metadata"
            src={`/admin/media/${wish.id}/video`}
          >
            Trình duyệt không hỗ trợ phát video này.
          </video>
          <span>
            {wish.videoDurationSeconds === null
              ? "Video lời chúc"
              : `Video ${Math.round(wish.videoDurationSeconds)} giây`}
          </span>
        </div>
      )}

      <Link href={`/admin/wishes/${wish.id}`}>Mở trang kiểm duyệt</Link>
    </li>
  );
}
