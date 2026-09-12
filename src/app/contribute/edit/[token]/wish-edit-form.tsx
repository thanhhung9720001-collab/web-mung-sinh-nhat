"use client";

import { useActionState, useState } from "react";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  type AvatarConstraints,
  type VideoConstraints,
} from "@/lib/media-constraints";
import type { EditableWishRecord } from "@/lib/supabase-admin.server";
import { updateContribution, type WishEditState } from "./actions";
import styles from "./wish-edit-form.module.css";

const INITIAL_STATE: WishEditState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

type WishEditFormProps = {
  token: string;
  wish: EditableWishRecord;
  avatarConstraints: AvatarConstraints;
  videoConstraints: VideoConstraints;
  closeAtLabel: string;
};

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  })} MB`;
}

export function WishEditForm({
  token,
  wish,
  avatarConstraints,
  videoConstraints,
  closeAtLabel,
}: WishEditFormProps) {
  const [wishType, setWishType] = useState(wish.contentType);
  const updateWithToken = updateContribution.bind(null, token);
  const [state, formAction, isPending] = useActionState(
    updateWithToken,
    INITIAL_STATE,
  );

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.hiddenField} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.field}>
        <label htmlFor="senderName">Tên của bạn</label>
        <input
          id="senderName"
          name="senderName"
          defaultValue={wish.senderName}
          maxLength={80}
          required
          aria-invalid={Boolean(state.fieldErrors.senderName)}
        />
        {state.fieldErrors.senderName ? (
          <p className={styles.error}>{state.fieldErrors.senderName}</p>
        ) : null}
      </div>

      <fieldset className={styles.field}>
        <legend>Ảnh đại diện (không bắt buộc)</legend>
        {wish.avatarPath ? (
          <p className={styles.help}>Lời chúc hiện đang có ảnh đại diện.</p>
        ) : null}
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept={ALLOWED_AVATAR_MIME_TYPES.join(",")}
        />
        <p className={styles.help}>
          Chọn ảnh mới để thay ảnh cũ, tối đa {formatMegabytes(avatarConstraints.maxSizeBytes)}.
        </p>
        {wish.avatarPath ? (
          <label className={styles.checkRow}>
            <input type="checkbox" name="removeAvatar" value="yes" />
            Xóa ảnh đại diện hiện tại
          </label>
        ) : null}
        {state.fieldErrors.avatar ? (
          <p className={styles.error}>{state.fieldErrors.avatar}</p>
        ) : null}
      </fieldset>

      <fieldset className={styles.field}>
        <legend>Kiểu lời chúc</legend>
        <div className={styles.choices}>
          <label>
            <input
              type="radio"
              name="contentType"
              value="text"
              defaultChecked={wish.contentType === "text"}
              onChange={() => setWishType("text")}
            />
            Văn bản
          </label>
          <label>
            <input
              type="radio"
              name="contentType"
              value="video"
              defaultChecked={wish.contentType === "video"}
              onChange={() => setWishType("video")}
            />
            Video
          </label>
        </div>
        {state.fieldErrors.contentType ? (
          <p className={styles.error}>{state.fieldErrors.contentType}</p>
        ) : null}
      </fieldset>

      {wishType === "text" ? (
        <div className={styles.field}>
          <label htmlFor="message">Lời chúc</label>
          <textarea
            id="message"
            name="message"
            defaultValue={wish.messageText ?? ""}
            maxLength={5000}
            rows={8}
            required
          />
          {state.fieldErrors.message ? (
            <p className={styles.error}>{state.fieldErrors.message}</p>
          ) : null}
        </div>
      ) : (
        <div className={styles.field}>
          <label htmlFor="video">Video lời chúc</label>
          <input
            id="video"
            name="video"
            type="file"
            accept={ALLOWED_VIDEO_MIME_TYPES.join(",")}
            required={!wish.videoPath}
          />
          <p className={styles.help}>
            {wish.videoPath
              ? "Để trống nếu bạn muốn giữ video hiện tại. "
              : "Hãy chọn một video. "}
            Tối đa {formatMegabytes(videoConstraints.maxSizeBytes)} và {videoConstraints.maxDurationSeconds} giây.
          </p>
          {state.fieldErrors.video ? (
            <p className={styles.error}>{state.fieldErrors.video}</p>
          ) : null}
        </div>
      )}

      <label className={styles.consent}>
        <input type="checkbox" name="consent" value="accepted" required />
        Tôi đồng ý để lời chúc và media này xuất hiện trong món quà sinh nhật.
      </label>
      {state.fieldErrors.consent ? (
        <p className={styles.error}>{state.fieldErrors.consent}</p>
      ) : null}

      <div className={styles.submitArea}>
        <button type="submit" disabled={isPending || state.status === "closed"}>
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        <p
          className={state.status === "error" ? styles.error : styles.status}
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {state.message || `Bạn có thể sửa đến ${closeAtLabel}.`}
        </p>
      </div>
    </form>
  );
}
