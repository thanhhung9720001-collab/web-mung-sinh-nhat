import type { Metadata } from "next";
import { connection } from "next/server";
import { hasValidGiftSession } from "@/lib/gift-session.server";
import { logoutGift } from "./actions";
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
          Cánh cửa đã nhận ra em. Bầu trời sao đang được chuẩn bị ở bước tiếp
          theo.
        </p>
        <form className={styles.logoutForm} action={logoutGift}>
          <button type="submit">Đăng xuất</button>
        </form>
      </section>
    </main>
  );
}
