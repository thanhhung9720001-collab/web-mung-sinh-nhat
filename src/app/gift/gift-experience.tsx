"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

export type GiftExperienceWish = {
  id: string;
  senderName: string;
  hasAvatar: boolean;
  contentType: "text" | "video";
  messageText: string | null;
  videoDurationSeconds: number | null;
};

type GiftExperienceProps = {
  wishes: GiftExperienceWish[];
  hasFinalVideo: boolean;
  hasMusic: boolean;
};

type MusicState = "idle" | "playing" | "paused" | "blocked" | "unavailable";

const STORAGE_KEY = "be-heo-gift-progress-v1";
const STAR_GLYPHS = ["✦", "★", "✧", "☆"] as const;
const HEART_POINTS = [
  [50, 82], [42, 74], [34, 66], [27, 56], [23, 44], [25, 32],
  [32, 24], [41, 24], [50, 34], [59, 24], [68, 24], [75, 32],
  [77, 44], [73, 56], [66, 66], [58, 74], [50, 68], [43, 58],
  [36, 47], [36, 36], [44, 38], [50, 46], [56, 38], [64, 36],
] as const;

export function GiftExperience({
  wishes,
  hasFinalVideo,
  hasMusic,
}: GiftExperienceProps) {
  const [openedIds, setOpenedIds] = useState<Set<string>>(() => new Set());
  const [progressReady, setProgressReady] = useState(false);
  const [selectedWishId, setSelectedWishId] = useState<string | null>(null);
  const [senderRevealed, setSenderRevealed] = useState(false);
  const [finaleUnlocked, setFinaleUnlocked] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicState, setMusicState] = useState<MusicState>(hasMusic ? "idle" : "unavailable");
  const audioRef = useRef<HTMLAudioElement>(null);
  const heartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const musicAttemptedRef = useRef(false);
  const resumeMusicAfterVideoRef = useRef(false);

  const threshold = Math.ceil(wishes.length * 0.7);
  const selectedWish = useMemo(
    () => wishes.find((wish) => wish.id === selectedWishId) ?? null,
    [selectedWishId, wishes],
  );
  const thresholdMet = wishes.length > 0 && openedIds.size >= threshold;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const validIds = new Set(wishes.map((wish) => wish.id));
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      try {
        const rawProgress = window.localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = rawProgress ? JSON.parse(rawProgress) : null;

        if (isStoredProgress(parsed)) {
          const restoredIds = new Set(
            parsed.openedIds.filter((id) => validIds.has(id)),
          );
          setOpenedIds(restoredIds);
          setFinaleUnlocked(
            parsed.finaleUnlocked ||
              (wishes.length > 0 &&
                restoredIds.size >= Math.ceil(wishes.length * 0.7)),
          );
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setProgressReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [wishes]);

  useEffect(() => {
    if (!progressReady) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          openedIds: Array.from(openedIds),
          finaleUnlocked,
        }),
      );
    } catch {
      // The experience still works when storage is unavailable or full.
    }
  }, [finaleUnlocked, openedIds, progressReady]);

  useEffect(() => {
    return () => {
      if (heartTimerRef.current) {
        clearTimeout(heartTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedWishId) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeWish();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  });

  const startMusic = useCallback(async () => {
    const audio = audioRef.current;

    if (!hasMusic || !musicEnabled || !audio || musicState === "playing") {
      return;
    }

    musicAttemptedRef.current = true;
    audio.volume = 0.42;

    try {
      await audio.play();
      setMusicState("playing");
    } catch {
      setMusicState("blocked");
    }
  }, [hasMusic, musicEnabled, musicState]);

  function handleFirstInteraction() {
    if (!musicAttemptedRef.current) {
      void startMusic();
    }
  }

  function openWish(wishId: string) {
    handleFirstInteraction();
    setSelectedWishId(wishId);
    setSenderRevealed(false);
    setOpenedIds((current) => {
      if (current.has(wishId)) {
        return current;
      }

      const next = new Set(current);
      next.add(wishId);
      return next;
    });
  }

  function closeWish() {
    setSelectedWishId(null);
    setSenderRevealed(false);

    if (thresholdMet && !finaleUnlocked && !heartAnimating) {
      startFinale();
    }
  }

  function startFinale() {
    if (reducedMotion) {
      setFinaleUnlocked(true);
      requestAnimationFrame(() => {
        document.getElementById("gift-finale")?.scrollIntoView({ block: "start" });
      });
      return;
    }

    setHeartAnimating(true);
    heartTimerRef.current = setTimeout(() => {
      setHeartAnimating(false);
      setFinaleUnlocked(true);
      requestAnimationFrame(() => {
        document.getElementById("gift-finale")?.scrollIntoView({ behavior: "smooth" });
      });
    }, 2_800);
  }

  async function toggleMusic() {
    const audio = audioRef.current;

    if (!audio || !hasMusic) {
      return;
    }

    if (musicEnabled && !audio.paused) {
      audio.pause();
      setMusicEnabled(false);
      setMusicState("paused");
      return;
    }

    setMusicEnabled(true);
    musicAttemptedRef.current = true;
    audio.volume = 0.42;

    try {
      await audio.play();
      setMusicState("playing");
    } catch {
      setMusicState("blocked");
    }
  }

  function pauseMusicForVideo() {
    const audio = audioRef.current;
    resumeMusicAfterVideoRef.current = Boolean(audio && !audio.paused && musicEnabled);
    audio?.pause();

    if (resumeMusicAfterVideoRef.current) {
      setMusicState("paused");
    }
  }

  function resumeMusicAfterVideo() {
    if (!resumeMusicAfterVideoRef.current || !musicEnabled) {
      return;
    }

    resumeMusicAfterVideoRef.current = false;
    void startMusic();
  }

  return (
    <div
      className={styles.experience}
      onPointerDownCapture={handleFirstInteraction}
      onKeyDownCapture={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          handleFirstInteraction();
        }
      }}
    >
      {hasMusic ? (
        <>
          <audio
            ref={audioRef}
            src="/gift/assets/music"
            loop
            preload="none"
            onError={() => setMusicState("unavailable")}
          />
          <button
            className={styles.musicToggle}
            type="button"
            onClick={() => void toggleMusic()}
            aria-pressed={musicState === "playing"}
          >
            <span aria-hidden="true">{musicState === "playing" ? "♫" : "♪"}</span>
            {musicState === "playing" ? "Tắt nhạc" : "Bật nhạc"}
          </button>
          {musicState === "blocked" ? (
            <p className={styles.audioFallback} role="status">
              Trình duyệt chưa cho phát nhạc. Chạm “Bật nhạc” để thử lại nhé.
            </p>
          ) : musicState === "unavailable" ? (
            <p className={styles.audioFallback} role="status">
              File nhạc nền chưa sẵn sàng. Những phần còn lại vẫn hoạt động bình thường.
            </p>
          ) : null}
        </>
      ) : null}

      <div className={styles.progressNote} aria-live="polite">
        <span>{openedIds.size}/{wishes.length} lời chúc đã mở</span>
        {wishes.length > 0 && !finaleUnlocked ? (
          <span>Mở {Math.max(0, threshold - openedIds.size)} ngôi sao nữa để gặp điều bất ngờ</span>
        ) : null}
      </div>

      {wishes.length === 0 ? (
        <div className={styles.emptySky} role="status">
          <span aria-hidden="true">☆</span>
          <p>Bầu trời đang chờ ngôi sao đầu tiên được duyệt.</p>
        </div>
      ) : (
        <ol className={styles.starField} aria-label={`${wishes.length} lời chúc đã được duyệt`}>
          {wishes.map((wish, index) => {
            const seed = hashStarId(wish.id);
            const isOpened = openedIds.has(wish.id);
            const style = createStarStyle(seed);

            return (
              <li className={styles.starSlot} key={wish.id} style={style}>
                <button
                  className={`${styles.wishStar} ${isOpened ? styles.openedStar : ""}`}
                  type="button"
                  onClick={() => openWish(wish.id)}
                  aria-label={`Lời chúc số ${index + 1}${isOpened ? ", đã mở" : ", chưa mở"}`}
                >
                  <span aria-hidden="true">{STAR_GLYPHS[seed % STAR_GLYPHS.length]}</span>
                  {isOpened ? <span className={styles.openedMark} aria-hidden="true">✓</span> : null}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {selectedWish ? (
        <div className={styles.wishOverlay} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeWish();
        }}>
          <article
            className={styles.wishPaper}
            role="dialog"
            aria-modal="true"
            aria-labelledby="opened-wish-title"
          >
            <span className={styles.wishTape} aria-hidden="true" />
            <button className={styles.closeWish} type="button" onClick={closeWish} aria-label="Đóng lời chúc">×</button>
            <span className={styles.wishNumber}>Ngôi sao {wishes.indexOf(selectedWish) + 1}</span>
            <h2 id="opened-wish-title">Một điều dành riêng cho Bé Heo</h2>

            {selectedWish.contentType === "text" ? (
              <p className={styles.wishMessage}>{selectedWish.messageText}</p>
            ) : (
              <div className={styles.wishVideoWrap}>
                <video
                  controls
                  playsInline
                  preload="metadata"
                  src={`/gift/media/${selectedWish.id}/video`}
                  onPlay={pauseMusicForVideo}
                  onPause={resumeMusicAfterVideo}
                  onEnded={resumeMusicAfterVideo}
                >
                  Trình duyệt không hỗ trợ video này.
                </video>
                <span>
                  {selectedWish.videoDurationSeconds === null
                    ? "Video lời chúc"
                    : `Video khoảng ${Math.round(selectedWish.videoDurationSeconds)} giây`}
                </span>
              </div>
            )}

            {!senderRevealed ? (
              <button className={styles.revealSender} type="button" onClick={() => setSenderRevealed(true)}>
                Ai gửi vậy ta?
              </button>
            ) : (
              <div className={styles.senderReveal}>
                {selectedWish.hasAvatar ? (
                  // This authenticated route only signs media for an approved wish.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/gift/media/${selectedWish.id}/avatar`} alt={`Ảnh của ${selectedWish.senderName}`} />
                ) : (
                  <span className={styles.defaultSenderAvatar} aria-hidden="true">♡</span>
                )}
                <p>Thương gửi từ <strong>{selectedWish.senderName}</strong></p>
              </div>
            )}

            {thresholdMet && !finaleUnlocked ? (
              <p className={styles.finaleHint}>Hình như cả bầu trời đang muốn nói thêm điều gì đó…</p>
            ) : null}
          </article>
        </div>
      ) : null}

      {heartAnimating ? <HeartGathering /> : null}

      {finaleUnlocked ? (
        <section className={styles.finale} id="gift-finale" aria-labelledby="finale-title">
          <span className={styles.finaleEyebrow}>Phần cuối của món quà</span>
          <h2 id="finale-title">Bé Heo à, vẫn còn một điều nữa…</h2>

          {hasFinalVideo ? (
            <video
              className={styles.finaleVideo}
              controls
              playsInline
              preload="metadata"
              src="/gift/assets/finale-video"
              onPlay={pauseMusicForVideo}
              onPause={resumeMusicAfterVideo}
              onEnded={resumeMusicAfterVideo}
            >
              Trình duyệt không hỗ trợ video này.
            </video>
          ) : (
            <div className={styles.finalePlaceholder}>
              <span aria-hidden="true">▶</span>
              <p>Đoạn video cuối đang được tụi mình giữ bí mật để thêm vào trước sinh nhật.</p>
            </div>
          )}

          <div className={styles.letter}>
            <span className={styles.wishTape} aria-hidden="true" />
            <p>Bé Heo thân mến,</p>
            <p>
              Nếu em đã đi đến tận đây thì chắc em cũng biết mình được thương nhiều đến mức nào rồi ha.
              Từng ngôi sao là một người đã dành thời gian để nhớ về em và viết lại một điều thật lòng.
            </p>
            <p>
              Lá thư riêng vẫn đang được viết nốt. Tụi mình sẽ đặt bản cuối cùng vào đây trước ngày sinh nhật.
            </p>
            <p className={styles.letterSignature}>— Những người thương Bé Heo ♡</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function HeartGathering() {
  return (
    <div className={styles.heartOverlay} role="status" aria-label="Các ngôi sao đang kết thành hình trái tim">
      <div className={styles.heartStars} aria-hidden="true">
        {HEART_POINTS.map(([x, y], index) => {
          const style = {
            "--heart-x": `${x}%`,
            "--heart-y": `${y}%`,
            "--heart-from-x": `${(index * 37) % 100}%`,
            "--heart-from-y": `${(index * 61) % 100}%`,
            "--heart-delay": `${(index % 8) * 45}ms`,
          } as CSSProperties;
          return <span key={`${x}-${y}-${index}`} style={style}>✦</span>;
        })}
      </div>
      <p>Cả bầu trời đang ghép lại một điều cho em…</p>
    </div>
  );
}

function createStarStyle(seed: number): CSSProperties {
  return {
    "--star-shift-x": `${(seed % 23) - 11}px`,
    "--star-shift-y": `${((seed >>> 5) % 25) - 12}px`,
    "--star-rotation": `${((seed >>> 10) % 31) - 15}deg`,
    "--star-scale": String(0.82 + ((seed >>> 15) % 35) / 100),
    "--star-delay": `${-((seed >>> 20) % 45) / 10}s`,
  } as CSSProperties;
}

function hashStarId(id: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

function isStoredProgress(value: unknown): value is {
  version: 1;
  openedIds: string[];
  finaleUnlocked: boolean;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const progress = value as Record<string, unknown>;
  return (
    progress.version === 1 &&
    Array.isArray(progress.openedIds) &&
    progress.openedIds.every((id) => typeof id === "string") &&
    typeof progress.finaleUnlocked === "boolean"
  );
}
