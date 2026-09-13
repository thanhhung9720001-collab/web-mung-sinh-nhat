import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { hasValidAdminSession } from "@/lib/admin-session.server";
import { getContributionInvitePath } from "@/lib/contribution-access";
import {
  listAdminWishes,
  type AdminWishSummary,
  type WishStatus,
  type WishStatusFilter,
} from "@/lib/supabase-admin.server";
import { logoutAdmin } from "./actions";
import { AdminLoginForm } from "./login-form";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Quản trị | Ngân Hà Của Bé Heo",
};

const STATUS_OPTIONS: Array<{
  value: WishStatusFilter;
  label: string;
}> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Đã từ chối" },
];

const STATUS_LABELS: Record<WishStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

type AdminPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    notice?: string | string[];
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await connection();
  const isAuthenticated = await hasValidAdminSession();

  if (!isAuthenticated) {
    return (
      <main className={styles.page}>
        <div className={styles.glow} aria-hidden="true" />
        <section className={styles.card}>
          <span className={styles.eyebrow}>Khu vực riêng tư</span>
          <span className={styles.star} aria-hidden="true">
            ✦
          </span>
          <h1>Mở phòng điều khiển</h1>
          <p className={styles.description}>
            Nhập mật khẩu quản trị để xem và kiểm duyệt những vì sao đang chờ.
          </p>
          <AdminLoginForm />
        </section>
      </main>
    );
  }

  const query = await searchParams;
  const statusFilter = parseStatusFilter(query.status);
  const notice = parseListNotice(query.notice);
  const contributionInvitePath = getContributionInvitePath();
  let wishes: AdminWishSummary[] = [];
  let loadFailed = false;

  try {
    wishes = await listAdminWishes(statusFilter);
  } catch {
    loadFailed = true;
  }

  return (
    <main className={styles.dashboardPage}>
      <div className={styles.glow} aria-hidden="true" />
      <section className={styles.dashboard}>
        <header className={styles.dashboardHeader}>
          <div>
            <span className={styles.eyebrow}>Phòng điều khiển</span>
            <h1>Những vì sao gửi đến bé Heo</h1>
            <p className={styles.description}>
              Theo dõi toàn bộ lời chúc và lọc nhanh theo trạng thái kiểm duyệt.
            </p>
          </div>
          <form action={logoutAdmin}>
            {contributionInvitePath ? (
              <a
                className={styles.contributionLink}
                href={contributionInvitePath}
                target="_blank"
                rel="noreferrer"
              >
                Mở form người gửi
              </a>
            ) : null}
            <Link className={styles.previewGiftLink} href="/admin/preview">
              Xem thử món quà
            </Link>
            <button className={styles.secondaryButton} type="submit">Đăng xuất</button>
          </form>
        </header>

        <nav className={styles.filters} aria-label="Lọc lời chúc theo trạng thái">
          {STATUS_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={
                option.value === "all"
                  ? "/admin"
                  : `/admin?status=${option.value}`
              }
              className={
                option.value === statusFilter
                  ? `${styles.filterLink} ${styles.filterLinkActive}`
                  : styles.filterLink
              }
              aria-current={option.value === statusFilter ? "page" : undefined}
            >
              {option.label}
            </Link>
          ))}
        </nav>

        {notice ? (
          <div className={styles.successNotice} role="status">
            {notice}
          </div>
        ) : null}

        {loadFailed ? (
          <div className={styles.notice} role="alert">
            Chưa thể tải danh sách lời chúc. Vui lòng thử lại sau ít phút.
          </div>
        ) : wishes.length === 0 ? (
          <div className={styles.emptyState}>
            <span aria-hidden="true">✦</span>
            <h2>Chưa có lời chúc phù hợp</h2>
            <p>Hãy thử một trạng thái khác hoặc quay lại khi có lời chúc mới.</p>
          </div>
        ) : (
          <>
            <p className={styles.resultCount}>
              {wishes.length} lời chúc
              {wishes.length === 200 ? " gần nhất" : ""}
            </p>
            <ul className={styles.wishList}>
              {wishes.map((wish) => (
                <WishSummaryCard key={wish.id} wish={wish} />
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}

function WishSummaryCard({ wish }: { wish: AdminWishSummary }) {
  return (
    <li className={styles.wishCard}>
      <div className={styles.wishCardHeader}>
        <div>
          <h2>{wish.senderName}</h2>
          <p>{DATE_FORMATTER.format(new Date(wish.createdAt))}</p>
        </div>
        <span
          className={`${styles.statusBadge} ${styles[`status_${wish.status}`]}`}
        >
          {STATUS_LABELS[wish.status]}
        </span>
      </div>

      <p className={styles.contentType}>
        {wish.contentType === "text" ? "Lời chúc văn bản" : "Lời chúc video"}
        {wish.hasAvatar ? " · Có ảnh đại diện" : " · Ảnh mặc định"}
      </p>

      {wish.messagePreview ? (
        <p className={styles.messagePreview}>{wish.messagePreview}</p>
      ) : (
        <p className={styles.videoMeta}>
          Video {formatDuration(wish.videoDurationSeconds)} · {formatFileSize(wish.videoSizeBytes)}
        </p>
      )}

      {wish.displayOrder !== null ? (
        <p className={styles.displayOrder}>
          Vị trí hiển thị: {wish.displayOrder + 1}
        </p>
      ) : null}

      <Link className={styles.previewLink} href={`/admin/wishes/${wish.id}`}>
        Xem đầy đủ
      </Link>

      {wish.hasAvatar || wish.contentType === "video" ? (
        <div className={styles.mediaLinks}>
          {wish.hasAvatar ? (
            <a
              href={`/admin/media/${wish.id}/avatar`}
              target="_blank"
              rel="noreferrer"
            >
              Mở ảnh đại diện
            </a>
          ) : null}
          {wish.contentType === "video" ? (
            <a
              href={`/admin/media/${wish.id}/video`}
              target="_blank"
              rel="noreferrer"
            >
              Mở video
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function parseStatusFilter(value: string | string[] | undefined): WishStatusFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "pending" ||
    candidate === "approved" ||
    candidate === "rejected"
    ? candidate
    : "all";
}

function formatDuration(seconds: number | null): string {
  return seconds === null ? "chưa rõ thời lượng" : `${Math.round(seconds)} giây`;
}

function formatFileSize(bytes: number | null): string {
  return bytes === null ? "chưa rõ dung lượng" : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function parseListNotice(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate === "deleted") {
    return "Đã xóa lời chúc và media liên quan.";
  }

  if (candidate === "deleted-media-warning") {
    return "Đã xóa lời chúc, nhưng một số media chưa dọn được. Hãy kiểm tra Storage.";
  }

  if (candidate === "not-found") {
    return "Lời chúc không còn tồn tại hoặc đã được xử lý.";
  }

  return null;
}
