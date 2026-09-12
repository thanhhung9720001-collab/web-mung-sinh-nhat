import styles from "./page.module.css";

export default function ContributionNotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.shell}>
        <section className={styles.intro}>
          <span className={styles.eyebrow}>404</span>
          <div className={styles.star} aria-hidden="true">
            ✦
          </div>
          <h1>Không tìm thấy trang</h1>
          <p>Đường dẫn này không tồn tại hoặc không còn khả dụng.</p>
        </section>
      </div>
    </main>
  );
}
