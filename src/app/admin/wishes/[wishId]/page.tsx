import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-session.server";
import {
  getAdminWish,
  type AdminWishDetail,
  type WishStatus,
} from "@/lib/supabase-admin.server";
import { ModerationControls } from "../../moderation-controls";
import styles from "../../page.module.css";

export const metadata: Metadata = {
  title: "Xem lời chúc | Quản trị",
};

const STATUS_LABELS: Record<WishStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

type AdminWishPageProps = {
  params: Promise<{ wishId: string }>;
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function AdminWishPage({
  params,
  searchParams,
}: AdminWishPageProps) {
  if (!(await hasValidAdminSession())) {
    redirect("/admin");
  }

  const { wishId } = await params;
  const wish = await getAdminWish(wishId);

  if (!wish) {
    notFound();
  }

  const notice = parseDetailNotice((await searchParams).notice);

  return (
    <main className={styles.detailPage}>
      <div className={styles.glow} aria-hidden="true" />
      <article className={styles.detailCard}>
        <Link className={styles.backLink} href={`/admin?status=${wish.status}`}>
          ← Quay lại danh sách
        </Link>

        <header className={styles.detailHeader}>
          <div>
            <span className={styles.eyebrow}>Xem trước lời chúc</span>
            <h1>{wish.senderName}</h1>
          </div>
          <span
            className={`${styles.statusBadge} ${styles[`status_${wish.status}`]}`}
          >
            {STATUS_LABELS[wish.status]}
          </span>
        </header>

        {notice ? (
          <div className={styles.successNotice} role="status">
            {notice}
          </div>
        ) : null}

        {wish.hasAvatar ? (
          // This authenticated route proxies private images through the app origin.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.avatarPreview}
            src={`/admin/media/${wish.id}/avatar`}
            alt={`Ảnh đại diện của ${wish.senderName}`}
          />
        ) : (
          <div className={styles.defaultAvatar} aria-label="Ảnh đại diện mặc định">
            ✦
          </div>
        )}

        {wish.contentType === "text" && wish.messageText ? (
          <section className={styles.fullMessage} aria-labelledby="wish-content-title">
            <h2 id="wish-content-title">Lời chúc</h2>
            <p>{wish.messageText}</p>
          </section>
        ) : wish.contentType === "video" ? (
          <section className={styles.videoPreview} aria-labelledby="wish-content-title">
            <h2 id="wish-content-title">Video lời chúc</h2>
            <video
              controls
              preload="metadata"
              src={`/admin/media/${wish.id}/video`}
            >
              Trình duyệt không hỗ trợ phát video này.
            </video>
            <p>
              {formatDuration(wish.videoDurationSeconds)} · {formatFileSize(wish.videoSizeBytes)}
            </p>
          </section>
        ) : null}

        <WishMetadata wish={wish} />
        <ModerationControls
          wishId={wish.id}
          status={wish.status}
          displayOrder={wish.displayOrder}
        />
      </article>
    </main>
  );
}

function WishMetadata({ wish }: { wish: AdminWishDetail }) {
  return (
    <dl className={styles.metadataList}>
      <div>
        <dt>Loại nội dung</dt>
        <dd>{wish.contentType === "text" ? "Văn bản" : "Video"}</dd>
      </div>
      <div>
        <dt>Đã đồng ý sử dụng</dt>
        <dd>{DATE_FORMATTER.format(new Date(wish.consentGivenAt))}</dd>
      </div>
      <div>
        <dt>Đã gửi</dt>
        <dd>{DATE_FORMATTER.format(new Date(wish.createdAt))}</dd>
      </div>
      <div>
        <dt>Đã kiểm duyệt</dt>
        <dd>
          {wish.reviewedAt
            ? DATE_FORMATTER.format(new Date(wish.reviewedAt))
            : "Chưa kiểm duyệt"}
        </dd>
      </div>
      <div>
        <dt>Thứ tự hiển thị</dt>
        <dd>
          {wish.displayOrder === null
            ? "Tự động theo thời gian gửi"
            : `Ưu tiên vị trí ${wish.displayOrder + 1}`}
        </dd>
      </div>
    </dl>
  );
}

function formatDuration(seconds: number | null): string {
  return seconds === null ? "Chưa rõ thời lượng" : `${Math.round(seconds)} giây`;
}

function formatFileSize(bytes: number | null): string {
  return bytes === null ? "Chưa rõ dung lượng" : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function parseDetailNotice(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate === "approved") {
    return "Đã duyệt lời chúc.";
  }

  if (candidate === "rejected") {
    return "Đã từ chối lời chúc.";
  }

  if (candidate === "order-updated") {
    return "Đã cập nhật vị trí hiển thị.";
  }

  if (candidate === "order-invalid") {
    return "Vị trí phải là số nguyên từ 1 đến 10000 hoặc để trống.";
  }

  return candidate === "invalid" ? "Yêu cầu kiểm duyệt không hợp lệ." : null;
}
