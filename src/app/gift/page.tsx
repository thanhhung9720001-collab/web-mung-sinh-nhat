import type { Metadata } from "next";
import { connection } from "next/server";
import { hasValidGiftSession } from "@/lib/gift-session.server";
import {
  formatAppDateTime,
  getAppSchedule,
  getCurrentScheduleState,
} from "@/lib/time";
import { logoutGift } from "./actions";
import { GiftCountdown } from "./gift-countdown";
import { GiftLoginForm } from "./login-form";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Mở quà | Ngân Hà Của Bé Heo",
};

export default async function GiftPage() {
  await connection();
  const isAuthenticated = await hasValidGiftSession();

  if (!isAuthenticated) {
    return (
      <main className={styles.page}>
        <div className={styles.glow} aria-hidden="true" />
        <section className={styles.card}>
          <span className={styles.eyebrow}>Một món quà chỉ dành cho em</span>
          <span className={styles.star} aria-hidden="true">
            ✦
          </span>
          <h1>Mở cánh cửa ngân hà</h1>
          <p className={styles.description}>
            Nhập mật khẩu bí mật để bước vào món quà sinh nhật của bé Heo.
          </p>
          <GiftLoginForm />
        </section>
      </main>
    );
  }

  const schedule = getAppSchedule();

  if (getCurrentScheduleState(schedule) !== "gift-open") {
    return (
      <main className={styles.page}>
        <div className={styles.glow} aria-hidden="true" />
        <section className={`${styles.card} ${styles.countdownCard}`}>
          <span className={styles.eyebrow}>Cánh cửa đã nhận ra em</span>
          <span className={styles.star} aria-hidden="true">
            ✦
          </span>
          <h1>Ngân hà sắp thức giấc</h1>
          <p className={styles.description}>
            Món quà sẽ mở đúng thời khắc sinh nhật. Cứ để trang này ở đây nhé.
          </p>
          <GiftCountdown
            opensAt={schedule.giftOpensAt.toISOString()}
            initialNow={new Date().toISOString()}
            opensAtLabel={formatAppDateTime(schedule.giftOpensAt)}
          />
          <form className={styles.logoutForm} action={logoutGift}>
            <button type="submit">Đăng xuất</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <section className={styles.card}>
        <span className={styles.eyebrow}>Đã mở khóa món quà</span>
        <span className={styles.star} aria-hidden="true">
          ✦
        </span>
        <h1>Chào mừng bé Heo</h1>
        <p className={styles.description}>
          Khoảnh khắc đã đến. Bầu trời sao đang được chuẩn bị ở bước tiếp theo.
        </p>
        <form className={styles.logoutForm} action={logoutGift}>
          <button type="submit">Đăng xuất</button>
        </form>
      </section>
    </main>
  );
}
