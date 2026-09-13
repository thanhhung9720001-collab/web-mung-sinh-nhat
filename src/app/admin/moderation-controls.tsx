"use client";

import type { FormEvent } from "react";
import { useFormStatus } from "react-dom";
import type { WishStatus } from "@/lib/supabase-admin.server";
import { moderateWish, updateWishDisplayOrder } from "./actions";
import styles from "./page.module.css";

type ModerationControlsProps = {
  wishId: string;
  status: WishStatus;
  displayOrder: number | null;
};

type ModerationFormProps = {
  wishId: string;
  intent: "approved" | "rejected" | "delete";
  label: string;
  pendingLabel: string;
  confirmation: string;
  className: string;
};

export function ModerationControls({
  wishId,
  status,
  displayOrder,
}: ModerationControlsProps) {
  return (
    <>
      {status === "approved" ? (
        <section className={styles.orderPanel} aria-labelledby="order-title">
          <h2 id="order-title">Thứ tự hiển thị</h2>
          <p>
            Mặc định hệ thống tự xếp theo thời gian gửi. Chỉ nhập vị trí khi
            muốn ưu tiên lời chúc này xuất hiện trước.
          </p>
          <form className={styles.orderForm} action={updateWishDisplayOrder}>
            <input type="hidden" name="wishId" value={wishId} />
            <label htmlFor="display-position">Vị trí ưu tiên (không bắt buộc)</label>
            <input
              id="display-position"
              name="position"
              type="number"
              min={1}
              max={10_000}
              step={1}
              defaultValue={displayOrder === null ? "" : displayOrder + 1}
              placeholder="Để trống để tự xếp"
            />
            <OrderSubmitButton />
          </form>
        </section>
      ) : null}

      <section className={styles.moderationPanel} aria-labelledby="moderation-title">
        <h2 id="moderation-title">Kiểm duyệt</h2>
        <div className={styles.moderationActions}>
          {status !== "approved" ? (
            <ModerationForm
              wishId={wishId}
              intent="approved"
              label="Duyệt lời chúc"
              pendingLabel="Đang duyệt..."
              confirmation="Duyệt lời chúc này để đưa vào dữ liệu trang quà?"
              className={styles.approveButton}
            />
          ) : null}

          {status !== "rejected" ? (
            <ModerationForm
              wishId={wishId}
              intent="rejected"
              label="Từ chối"
              pendingLabel="Đang từ chối..."
              confirmation="Bạn chắc chắn muốn từ chối lời chúc này?"
              className={styles.rejectButton}
            />
          ) : null}

          <ModerationForm
            wishId={wishId}
            intent="delete"
            label="Xóa vĩnh viễn"
            pendingLabel="Đang xóa..."
            confirmation="Xóa vĩnh viễn lời chúc và toàn bộ media liên quan? Thao tác này không thể hoàn tác."
            className={styles.deleteButton}
          />
        </div>
      </section>
    </>
  );
}

function ModerationForm({
  wishId,
  intent,
  label,
  pendingLabel,
  confirmation,
  className,
}: ModerationFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmation)) {
      event.preventDefault();
    }
  }

  return (
    <form action={moderateWish} onSubmit={handleSubmit}>
      <input type="hidden" name="wishId" value={wishId} />
      <input type="hidden" name="intent" value={intent} />
      <ModerationSubmitButton
        label={label}
        pendingLabel={pendingLabel}
        className={className}
      />
    </form>
  );
}

function ModerationSubmitButton({
  label,
  pendingLabel,
  className,
}: Pick<ModerationFormProps, "label" | "pendingLabel" | "className">) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function OrderSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Đang lưu..." : "Lưu vị trí"}
    </button>
  );
}
