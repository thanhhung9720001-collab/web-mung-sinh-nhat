"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCountdownParts, type CountdownParts } from "@/lib/time";
import styles from "./page.module.css";

type GiftCountdownProps = {
  opensAt: string;
  initialNow: string;
  opensAtLabel: string;
};

const UNITS: Array<{
  key: keyof Pick<CountdownParts, "days" | "hours" | "minutes" | "seconds">;
  label: string;
}> = [
  { key: "days", label: "Ngày" },
  { key: "hours", label: "Giờ" },
  { key: "minutes", label: "Phút" },
  { key: "seconds", label: "Giây" },
];

export function GiftCountdown({
  opensAt,
  initialNow,
  opensAtLabel,
}: GiftCountdownProps) {
  const router = useRouter();
  const refreshedRef = useRef(false);
  const [countdown, setCountdown] = useState(() =>
    getCountdownParts(opensAt, initialNow),
  );

  useEffect(() => {
    function updateCountdown() {
      const nextCountdown = getCountdownParts(opensAt);
      setCountdown(nextCountdown);

      if (nextCountdown.isComplete && !refreshedRef.current) {
        refreshedRef.current = true;
        router.refresh();
      }
    }

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [opensAt, router]);

  return (
    <div className={styles.countdownSection}>
      <div
        className={styles.countdown}
        role="timer"
        aria-label={`Còn ${countdown.days} ngày, ${countdown.hours} giờ, ${countdown.minutes} phút và ${countdown.seconds} giây`}
        aria-live="off"
      >
        {UNITS.map(({ key, label }) => (
          <div className={styles.countdownUnit} key={key}>
            <strong>{countdown[key].toString().padStart(2, "0")}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className={styles.openingTime}>Mở quà lúc {opensAtLabel}</p>
    </div>
  );
}
