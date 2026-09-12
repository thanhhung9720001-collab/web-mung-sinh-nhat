import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isContributionSecretValid } from "@/lib/contribution-access";
import {
  getAvatarConstraints,
  getVideoConstraints,
} from "@/lib/media-constraints.server";
import {
  formatAppDateTime,
  getAppSchedule,
  getCurrentScheduleState,
} from "@/lib/time";
import { ContributionClosed } from "./contribution-closed";
import { ContributionForm } from "./contribution-form";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Gửi lời chúc | Ngân Hà Của Bé Heo",
};

type ContributePageProps = {
  params: Promise<{ secret: string }>;
};

export default async function ContributePage({ params }: ContributePageProps) {
  await connection();

  const { secret } = await params;

  if (!isContributionSecretValid(secret)) {
    notFound();
  }

  const schedule = getAppSchedule();
  const closeAtIso = schedule.contributionsCloseAt.toISOString();
  const closeAtLabel = formatAppDateTime(schedule.contributionsCloseAt);
  const isAcceptingContributions =
    getCurrentScheduleState(schedule) === "accepting-contributions";

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.shell}>
        <header className={styles.intro}>
          <span className={styles.eyebrow}>Cánh cửa bí mật đã mở</span>
          <div className={styles.star} aria-hidden="true">
            ✦
          </div>
          <h1>Gửi một vì sao cho bé Heo</h1>
          <p>
            Mỗi lời chúc sẽ trở thành một ngôi sao nhỏ trong món quà sinh nhật
            dành riêng cho bé Heo.
          </p>
        </header>

        {isAcceptingContributions ? (
          <ContributionForm
            secret={secret}
            initialSubmissionId={randomUUID()}
            contributionsCloseAt={closeAtIso}
            contributionsCloseAtLabel={closeAtLabel}
            avatarConstraints={getAvatarConstraints()}
            videoConstraints={getVideoConstraints()}
          />
        ) : (
          <ContributionClosed closeAtLabel={closeAtLabel} />
        )}
      </div>
    </main>
  );
}
