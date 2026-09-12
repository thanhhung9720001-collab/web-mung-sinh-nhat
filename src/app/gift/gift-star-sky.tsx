import type { CSSProperties } from "react";
import styles from "./page.module.css";

type GiftStarSkyProps = {
  stars: Array<{ id: string }>;
};

const STAR_GLYPHS = ["✦", "★", "✧", "☆"] as const;

export function GiftStarSky({ stars }: GiftStarSkyProps) {
  if (stars.length === 0) {
    return (
      <div className={styles.emptySky} role="status">
        <span aria-hidden="true">☆</span>
        <p>Bầu trời đang chờ ngôi sao đầu tiên được duyệt.</p>
      </div>
    );
  }

  return (
    <ol className={styles.starField} aria-label={`${stars.length} lời chúc đã được duyệt`}>
      {stars.map((star, index) => {
        const seed = hashStarId(star.id);
        const style = {
          "--star-shift-x": `${(seed % 23) - 11}px`,
          "--star-shift-y": `${((seed >>> 5) % 25) - 12}px`,
          "--star-rotation": `${((seed >>> 10) % 31) - 15}deg`,
          "--star-scale": String(0.82 + ((seed >>> 15) % 35) / 100),
          "--star-delay": `${-((seed >>> 20) % 45) / 10}s`,
        } as CSSProperties;

        return (
          <li
            className={styles.starSlot}
            key={star.id}
            style={style}
            aria-label={`Lời chúc số ${index + 1}, chưa mở`}
          >
            <span className={styles.wishStar} aria-hidden="true">
              {STAR_GLYPHS[seed % STAR_GLYPHS.length]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function hashStarId(id: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}
