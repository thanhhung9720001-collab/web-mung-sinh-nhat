import styles from "./contribution-closed.module.css";

type ContributionClosedProps = {
  closeAtLabel: string;
};

export function ContributionClosed({ closeAtLabel }: ContributionClosedProps) {
  return (
    <section className={styles.panel} aria-labelledby="contributions-closed-title">
      <span className={styles.icon} aria-hidden="true">
        ✦
      </span>
      <h2 id="contributions-closed-title">Cánh cửa nhận lời chúc đã khép lại</h2>
      <p>
        Cảm ơn bạn đã ghé qua. Những vì sao đã gửi đang được chuẩn bị thật
        cẩn thận cho món quà của bé Heo.
      </p>
      <p className={styles.time}>Đã đóng lúc {closeAtLabel} (giờ Việt Nam).</p>
    </section>
  );
}
