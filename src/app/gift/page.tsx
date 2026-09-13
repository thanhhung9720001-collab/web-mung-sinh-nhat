import type { Metadata } from "next";
import { connection } from "next/server";
import { hasValidGiftSession } from "@/lib/gift-session.server";
import {
  hasConfiguredGiftAsset,
  listGiftApprovedWishes,
  type GiftApprovedWish,
} from "@/lib/supabase-admin.server";
import {
  formatAppDateTime,
  getAppSchedule,
  getCurrentScheduleState,
} from "@/lib/time";
import { logoutGift } from "./actions";
import { GiftCountdown } from "./gift-countdown";
import { GiftExperience } from "./gift-experience";
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
      <main className={`${styles.page} ${styles.unlockPage}`}>
        <div className={styles.paperGrain} aria-hidden="true" />
        <div className={styles.cornerDoodles} aria-hidden="true">
          <span>☆</span><span>♡</span><span>✦</span>
        </div>
        <section className={`${styles.card} ${styles.unlockCard}`}>
          <span className={styles.tape} aria-hidden="true" />
          <span className={styles.eyebrow}>17 · 09 · 2026</span>
          <span className={styles.inkHeart} aria-hidden="true">♡</span>
          <h1>Bé Heo ơi, có một món quà nhỏ...</h1>
          <p className={styles.description}>
            Mọi người đã lén gom vài điều muốn nói với em vào đây. Nhập mật
            khẩu rồi mở thử nha.
          </p>
          <GiftLoginForm />
        </section>
      </main>
    );
  }

  const schedule = getAppSchedule();

  if (getCurrentScheduleState(schedule) !== "gift-open") {
    return (
      <main className={`${styles.page} ${styles.nightPage}`}>
        <div className={styles.paperGrain} aria-hidden="true" />
        <div className={styles.constellation} aria-hidden="true">
          <span>✦</span><span>☆</span><span>·</span><span>✧</span>
          <span>·</span><span>☆</span><span>✦</span><span>·</span>
        </div>
        <section className={`${styles.card} ${styles.countdownCard} ${styles.nightCard}`}>
          <span className={styles.eyebrow}>Đã nhận ra Bé Heo rồi</span>
          <div className={styles.paperTitle}>
            <span className={styles.tape} aria-hidden="true" />
            <h1>Chờ thêm một chút xíu thôi</h1>
          </div>
          <p className={styles.description}>
            Tụi mình biết là em đang nóng ruột, nhưng đúng sinh nhật thì món
            quà mới chịu mở cơ.
          </p>
          <GiftCountdown
            opensAt={schedule.giftOpensAt.toISOString()}
            initialNow={new Date().toISOString()}
            opensAtLabel={formatAppDateTime(schedule.giftOpensAt)}
          />
          <form className={styles.logoutForm} action={logoutGift}>
            <button type="submit">Thoát ra ngoài</button>
          </form>
        </section>
      </main>
    );
  }

  let wishes: GiftApprovedWish[] = [];
  let hasSkyError = false;

  try {
    wishes = await listGiftApprovedWishes();
  } catch {
    hasSkyError = true;
  }

  return (
    <main className={`${styles.page} ${styles.nightPage} ${styles.skyPage}`}>
      <div className={styles.paperGrain} aria-hidden="true" />
      <div className={styles.skyConstellations} aria-hidden="true" />
      <section className={styles.skyShell} aria-labelledby="gift-sky-title">
        <header className={styles.skyHeader}>
          <span className={styles.eyebrow}>Đúng 0 giờ rồi đó</span>
          <div className={styles.paperTitle}>
            <span className={styles.tape} aria-hidden="true" />
            <h1 id="gift-sky-title">Chúc mừng sinh nhật Bé Heo!</h1>
          </div>
          <p className={styles.description}>
            Mỗi ngôi sao dưới đây là một điều mà ai đó đã lén để dành cho em.
          </p>
          {!hasSkyError ? (
            <p className={styles.starCount}>{wishes.length} ngôi sao đang sáng</p>
          ) : null}
        </header>

        {hasSkyError ? (
          <div className={styles.skyError} role="alert">
            <span aria-hidden="true">☁</span>
            <p>Mây vừa che mất bầu trời. Em tải lại trang sau một chút nha.</p>
          </div>
        ) : (
          <GiftExperience
            wishes={wishes}
            hasFinalVideo={hasConfiguredGiftAsset("finale-video")}
            hasMusic={hasConfiguredGiftAsset("music")}
          />
        )}

        <form className={styles.logoutForm} action={logoutGift}>
          <button type="submit">Thoát ra ngoài</button>
        </form>
      </section>
    </main>
  );
}
