import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <section className={styles.card}>
        <span className={styles.eyebrow}>Nền tảng giao diện đã sẵn sàng</span>
        <div className={styles.star} aria-hidden="true">
          ✦
        </div>
        <h1>Ngân Hà Của Bé Heo</h1>
        <p>Mỗi vì sao là một lời yêu thương dành cho bé iu.</p>
        <div className={styles.swatches} aria-label="Bảng màu chính">
          <span className={styles.pink} title="Hồng pastel" />
          <span className={styles.violet} title="Tím hồng nhạt" />
          <span className={styles.night} title="Xanh đêm dịu" />
          <span className={styles.cream} title="Vàng kem ánh sao" />
        </div>
      </section>
    </main>
  );
}
