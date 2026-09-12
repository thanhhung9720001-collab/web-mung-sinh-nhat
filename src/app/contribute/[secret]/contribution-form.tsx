"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import type { ContributionFormState } from "@/lib/contribution-validation";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  type AvatarConstraints,
  type VideoConstraints,
} from "@/lib/media-constraints";
import { submitContribution } from "./actions";
import { ContributionClosed } from "./contribution-closed";
import styles from "./contribution-form.module.css";

type WishType = "text" | "video";
const DEFAULT_AVATAR_SRC = "/images/default-avatar.svg";
type ContributionFormProps = {
  secret: string;
  initialSubmissionId: string;
  contributionsCloseAt: string;
  contributionsCloseAtLabel: string;
  avatarConstraints: AvatarConstraints;
  videoConstraints: VideoConstraints;
};

type VideoFeedback = {
  kind: "error" | "success";
  message: string;
};

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  })} MB`;
}

function formatDuration(seconds: number): string {
  const roundedSeconds = Math.ceil(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function ContributionForm({
  secret,
  initialSubmissionId,
  contributionsCloseAt,
  contributionsCloseAtLabel,
  avatarConstraints,
  videoConstraints,
}: ContributionFormProps) {
  const [wishType, setWishType] = useState<WishType>("text");
  const [formState, setFormState] = useState<ContributionFormState>({
    status: "idle",
    message: "",
    fieldErrors: {},
    submissionId: initialSubmissionId,
  });
  const [isPending, startTransition] = useTransition();
  const [isClosed, setIsClosed] = useState(false);
  const [avatarPreviewSrc, setAvatarPreviewSrc] = useState(DEFAULT_AVATAR_SRC);
  const [hasCustomAvatar, setHasCustomAvatar] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const videoObjectUrlRef = useRef<string | null>(null);
  const videoInspectionIdRef = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const submissionInFlightRef = useRef(false);
  const [videoFeedback, setVideoFeedback] = useState<VideoFeedback | null>(null);
  const [isInspectingVideo, setIsInspectingVideo] = useState(false);
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const closeTime = new Date(contributionsCloseAt).getTime();
    const remainingMilliseconds = Math.max(0, closeTime - Date.now());
    const timeoutId = window.setTimeout(
      () => setIsClosed(true),
      remainingMilliseconds,
    );

    return () => window.clearTimeout(timeoutId);
  }, [contributionsCloseAt]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const file = event.currentTarget.files?.[0];

    if (!file) {
      setAvatarPreviewSrc(DEFAULT_AVATAR_SRC);
      setHasCustomAvatar(false);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setAvatarPreviewSrc(objectUrl);
    setHasCustomAvatar(true);
  }

  function handleWishTypeChange(nextType: WishType) {
    videoInspectionIdRef.current += 1;

    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }

    setWishType(nextType);
    setVideoFeedback(null);
    setIsInspectingVideo(false);
  }

  function handleVideoChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const inspectionId = videoInspectionIdRef.current + 1;
    videoInspectionIdRef.current = inspectionId;
    input.setCustomValidity("");
    setVideoFeedback(null);
    setIsInspectingVideo(false);

    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }

    if (!file) {
      return;
    }

    if (
      !ALLOWED_VIDEO_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_VIDEO_MIME_TYPES)[number],
      )
    ) {
      const message = "Chỉ chấp nhận video MP4, WebM hoặc QuickTime.";
      input.setCustomValidity(message);
      setVideoFeedback({ kind: "error", message });
      return;
    }

    if (file.size > videoConstraints.maxSizeBytes) {
      const message = `Video không được vượt quá ${formatMegabytes(
        videoConstraints.maxSizeBytes,
      )}.`;
      input.setCustomValidity(message);
      setVideoFeedback({ kind: "error", message });
      return;
    }

    setIsInspectingVideo(true);

    const objectUrl = URL.createObjectURL(file);
    videoObjectUrlRef.current = objectUrl;
    const video = document.createElement("video");

    function finishInspection() {
      video.onloadedmetadata = null;
      video.onerror = null;

      if (videoObjectUrlRef.current === objectUrl) {
        URL.revokeObjectURL(objectUrl);
        videoObjectUrlRef.current = null;
      }

      video.removeAttribute("src");
      video.load();
    }

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      if (videoInspectionIdRef.current !== inspectionId) {
        finishInspection();
        return;
      }

      const duration = video.duration;

      if (!Number.isFinite(duration) || duration <= 0) {
        const message = "Không thể đọc thời lượng video. Vui lòng chọn tệp khác.";
        input.setCustomValidity(message);
        setVideoFeedback({ kind: "error", message });
      } else if (duration > videoConstraints.maxDurationSeconds) {
        const message = `Video không được dài quá ${videoConstraints.maxDurationSeconds} giây.`;
        input.setCustomValidity(message);
        setVideoFeedback({ kind: "error", message });
      } else {
        setVideoFeedback({
          kind: "success",
          message: `Video hợp lệ · ${formatDuration(duration)} · ${formatMegabytes(file.size)}`,
        });
      }

      setIsInspectingVideo(false);
      finishInspection();
    };
    video.onerror = () => {
      if (videoInspectionIdRef.current === inspectionId) {
        const message = "Không thể đọc video. Vui lòng chọn tệp khác.";
        input.setCustomValidity(message);
        setVideoFeedback({ kind: "error", message });
        setIsInspectingVideo(false);
      }

      finishInspection();
    };
    video.src = objectUrl;
  }

  function resetSubmittedFields() {
    formRef.current?.reset();
    setWishType("text");
    setAvatarPreviewSrc(DEFAULT_AVATAR_SRC);
    setHasCustomAvatar(false);
    setVideoFeedback(null);
    setIsInspectingVideo(false);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submissionInFlightRef.current || isInspectingVideo) {
      return;
    }

    submissionInFlightRef.current = true;
    const formData = new FormData(event.currentTarget);

    setFormState((current) => ({
      ...current,
      status: "submitting",
      message: "Đang gửi lời chúc và giữ mọi thứ thật riêng tư...",
      fieldErrors: {},
    }));

    startTransition(async () => {
      try {
        const nextState = await submitContribution(secret, formData);
        setFormState(nextState);

        if (nextState.status === "closed") {
          setIsClosed(true);
        } else if (nextState.status === "success") {
          resetSubmittedFields();
        }
      } catch {
        setFormState((current) => ({
          ...current,
          status: "error",
          message:
            "Kết nối bị gián đoạn. Nội dung vẫn được giữ — hãy bấm gửi lại khi mạng ổn định.",
          fieldErrors: {},
        }));
      } finally {
        submissionInFlightRef.current = false;
      }
    });
  }

  if (isClosed) {
    return <ContributionClosed closeAtLabel={contributionsCloseAtLabel} />;
  }

  return (
    <form
      ref={formRef}
      className={styles.form}
      onSubmit={handleSubmit}
      encType="multipart/form-data"
    >
      <input
        type="hidden"
        name="submissionId"
        value={formState.submissionId}
      />
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="website">Website của bạn</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="sender-name">
          Tên của bạn <span aria-hidden="true">*</span>
        </label>
        <input
          id="sender-name"
          name="senderName"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          placeholder="Ví dụ: Minh Anh"
          aria-describedby={
            formState.fieldErrors.senderName
              ? "sender-name-hint sender-name-error"
              : "sender-name-hint"
          }
          aria-invalid={Boolean(formState.fieldErrors.senderName)}
        />
        <p id="sender-name-hint" className={styles.hint}>
          Tên này sẽ được tiết lộ sau khi bé Heo mở lời chúc.
        </p>
        {formState.fieldErrors.senderName ? (
          <p id="sender-name-error" className={styles.error}>
            {formState.fieldErrors.senderName}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="avatar">Ảnh đại diện (không bắt buộc)</label>
        <figure className={styles.avatarPreview}>
          <Image
            src={avatarPreviewSrc}
            width={112}
            height={112}
            alt={
              hasCustomAvatar
                ? "Ảnh đại diện bạn vừa chọn"
                : "Ảnh đại diện mặc định hình bé Heo"
            }
            unoptimized
          />
          <figcaption>
            {hasCustomAvatar
              ? "Ảnh bạn vừa chọn"
              : "Chưa chọn ảnh — bé Heo sẽ đại diện cho bạn"}
          </figcaption>
        </figure>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept={ALLOWED_AVATAR_MIME_TYPES.join(",")}
          aria-describedby={
            formState.fieldErrors.avatar
              ? "avatar-hint avatar-error"
              : "avatar-hint"
          }
          aria-invalid={Boolean(formState.fieldErrors.avatar)}
          onChange={handleAvatarChange}
        />
        <p id="avatar-hint" className={styles.hint}>
          JPEG, PNG hoặc WebP, tối đa {formatMegabytes(avatarConstraints.maxSizeBytes)}.
        </p>
        {formState.fieldErrors.avatar ? (
          <p id="avatar-error" className={styles.error}>
            {formState.fieldErrors.avatar}
          </p>
        ) : null}
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Bạn muốn gửi lời chúc theo cách nào?</legend>
        <div className={styles.choices}>
          <label className={styles.choice}>
            <input
              type="radio"
              name="contentType"
              value="text"
              required
              checked={wishType === "text"}
              onChange={() => handleWishTypeChange("text")}
            />
            <span>
              <strong>Viết lời chúc</strong>
              <small>Gửi vài dòng yêu thương</small>
            </span>
          </label>

          <label className={styles.choice}>
            <input
              type="radio"
              name="contentType"
              value="video"
              required
              checked={wishType === "video"}
              onChange={() => handleWishTypeChange("video")}
            />
            <span>
              <strong>Gửi video</strong>
              <small>Ghi lại lời chúc của bạn</small>
            </span>
          </label>
        </div>
        {formState.fieldErrors.contentType ? (
          <p className={styles.error}>{formState.fieldErrors.contentType}</p>
        ) : null}
      </fieldset>

      {wishType === "text" ? (
        <div className={styles.field}>
          <label htmlFor="message">
            Lời chúc dành cho bé Heo <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={7}
            required
            maxLength={5000}
            placeholder="Viết điều bạn muốn nhắn gửi tới bé Heo..."
            aria-describedby={
              formState.fieldErrors.message ? "message-error" : undefined
            }
            aria-invalid={Boolean(formState.fieldErrors.message)}
          />
          {formState.fieldErrors.message ? (
            <p id="message-error" className={styles.error}>
              {formState.fieldErrors.message}
            </p>
          ) : null}
        </div>
      ) : (
        <div className={styles.field}>
          <label htmlFor="video">
            Video lời chúc <span aria-hidden="true">*</span>
          </label>
          <input
            id="video"
            name="video"
            type="file"
            accept={ALLOWED_VIDEO_MIME_TYPES.join(",")}
            required
            aria-describedby={
              [
                "video-hint",
                videoFeedback ? "video-feedback" : null,
                formState.fieldErrors.video ? "video-error" : null,
              ]
                .filter(Boolean)
                .join(" ")
            }
            aria-invalid={Boolean(
              formState.fieldErrors.video || videoFeedback?.kind === "error",
            )}
            onChange={handleVideoChange}
          />
          <p id="video-hint" className={styles.hint}>
            Video tối đa 60 giây và 30 MB. Định dạng sẽ được kiểm tra khi gửi.
          </p>
          {isInspectingVideo ? (
            <p id="video-feedback" className={styles.hint} aria-live="polite">
              Đang đọc thông tin video...
            </p>
          ) : videoFeedback ? (
            <p
              id="video-feedback"
              className={
                videoFeedback.kind === "error"
                  ? styles.error
                  : styles.formStatus
              }
              aria-live="polite"
            >
              {videoFeedback.message}
            </p>
          ) : null}
          {formState.fieldErrors.video ? (
            <p id="video-error" className={styles.error}>
              {formState.fieldErrors.video}
            </p>
          ) : null}
        </div>
      )}

      <div className={styles.consentGroup}>
        <label className={styles.consent}>
          <input
            type="checkbox"
            name="consent"
            value="accepted"
            required
            aria-describedby={
              formState.fieldErrors.consent ? "consent-error" : undefined
            }
            aria-invalid={Boolean(formState.fieldErrors.consent)}
          />
          <span>
            Tôi đồng ý sử dụng tên, ảnh, video và lời chúc của mình trong món quà
            sinh nhật riêng tư dành cho bé Heo. <span aria-hidden="true">*</span>
          </span>
        </label>
        {formState.fieldErrors.consent ? (
          <p id="consent-error" className={styles.error}>
            {formState.fieldErrors.consent}
          </p>
        ) : null}
      </div>

      <div className={styles.submitArea}>
        <button type="submit" disabled={isPending || isInspectingVideo}>
          {isInspectingVideo
            ? "Đang đọc video..."
            : isPending
              ? "Đang gửi..."
              : "Gửi lời chúc"}
        </button>
        <p
          className={
            formState.status === "error"
              ? styles.formError
              : formState.status === "submitting"
                ? styles.formPending
                : styles.formStatus
          }
          role={formState.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {isPending && formState.status === "submitting"
            ? "Đang gửi lời chúc và giữ mọi thứ thật riêng tư..."
            : formState.message ||
              "Lời chúc sẽ được giữ riêng tư và chờ duyệt."}
        </p>
        {formState.status === "success" && formState.editUrl ? (
          <div className={styles.editLinkNotice}>
            <strong>Giữ lại link này nếu bạn muốn sửa lời chúc:</strong>
            <a href={formState.editUrl}>Mở trang chỉnh sửa bí mật</a>
            <small>Link chỉ có hiệu lực đến lúc cổng nhận lời chúc đóng.</small>
          </div>
        ) : null}
      </div>
    </form>
  );
}
