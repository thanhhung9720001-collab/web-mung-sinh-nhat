"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminLoginState } from "./actions";
import styles from "./page.module.css";

const INITIAL_STATE: AdminLoginState = {
  status: "idle",
  message: "",
};

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    INITIAL_STATE,
  );

  return (
    <form className={styles.loginForm} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="admin-password">Mật khẩu quản trị</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          aria-describedby={state.message ? "admin-login-error" : undefined}
          aria-invalid={state.status === "error"}
          autoFocus
        />
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? "Đang xác minh..." : "Đăng nhập"}
      </button>

      {state.message ? (
        <p id="admin-login-error" className={styles.error} role="alert">
          {state.message}
        </p>
      ) : (
        <p className={styles.hint}>Phiên đăng nhập sẽ tự hết hạn.</p>
      )}
    </form>
  );
}
