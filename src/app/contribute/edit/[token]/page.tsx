import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  getAvatarConstraints,
  getVideoConstraints,
} from "@/lib/media-constraints.server";
import { getEditableWishByToken } from "@/lib/supabase-admin.server";
import {
  formatAppDateTime,
  getAppSchedule,
  getCurrentScheduleState,
} from "@/lib/time";
import { ContributionClosed } from "../../[secret]/contribution-closed";
import styles from "../../[secret]/page.module.css";
import { WishEditForm } from "./wish-edit-form";

export const metadata: Metadata = {
  title: "Sửa lời chúc | Ngân Hà Của Bé Heo",
};

type WishEditPageProps = {
  params: Promise<{ token: string }>;
};

export default async function WishEditPage({ params }: WishEditPageProps) {
  await connection();

  const { token } = await params;
  const wish = await getEditableWishByToken(token);

  if (!wish) {
    notFound();
  }

  const schedule = getAppSchedule();
  const closeAtLabel = formatAppDateTime(schedule.contributionsCloseAt);
  const isAccepting =
    getCurrentScheduleState(schedule) === "accepting-contributions";

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.shell}>
        <header className={styles.intro}>
          <span className={styles.eyebrow}>Mảnh giấy của riêng bạn</span>
          <div className={styles.star} aria-hidden="true">
            ✦
          </div>
          <h1>Sửa lại lời nhắn cho Bé Heo</h1>
          <p>
            Cứ viết lại cho đúng ý bạn. Sau khi lưu, lời chúc sẽ chờ được duyệt
            lại trước khi xuất hiện trong món quà.
          </p>
        </header>

        {isAccepting ? (
          <WishEditForm
            token={token}
            wish={wish}
            avatarConstraints={getAvatarConstraints()}
            videoConstraints={getVideoConstraints()}
            closeAtLabel={closeAtLabel}
          />
        ) : (
          <ContributionClosed closeAtLabel={closeAtLabel} />
        )}
      </div>
    </main>
  );
}
