"use client";

import { useActionState } from "react";
import { loginGift, type GiftLoginState } from "./actions";
import styles from "./page.module.css";

const INITIAL_STATE: GiftLoginState = {
  status: "idle",
  message: "",
};

export function GiftLoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginGift,
    INITIAL_STATE,
  );

  return (
    <form className={styles.loginForm} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="gift-password">Mật khẩu mở quà</label>
        <input
          id="gift-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          aria-describedby={state.message ? "gift-login-error" : undefined}
          aria-invalid={state.status === "error"}
          autoFocus
        />
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? "Đang mở khóa..." : "Mở món quà"}
      </button>

      {state.message ? (
        <p id="gift-login-error" className={styles.error} role="alert">
          {state.message}
        </p>
      ) : (
        <p className={styles.hint}>Cánh cửa này chỉ dành riêng cho bé Heo.</p>
      )}
    </form>
  );
}
