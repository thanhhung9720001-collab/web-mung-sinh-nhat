"use server";

import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { validateAvatarFile } from "@/lib/avatar-validation.server";
import { isContributionSecretValid } from "@/lib/contribution-access";
import {
  getContributionRateLimitConfig,
  getContributionRateLimitKey,
} from "@/lib/contribution-rate-limit.server";
import {
  getAvatarConstraints,
  getVideoConstraints,
} from "@/lib/media-constraints.server";
import {
  validateRequiredContributionFields,
  type ContributionFormState,
} from "@/lib/contribution-validation";
import {
  consumeContributionRateLimit,
  insertPendingWish,
  removePrivateObjects,
  uploadPrivateObject,
  wishExists,
  type WishInsert,
} from "@/lib/supabase-admin.server";
import {
  formatAppDateTime,
  getAppSchedule,
  getCurrentScheduleState,
} from "@/lib/time";
import { validateVideoFile } from "@/lib/video-validation.server";
import { createWishEditPath } from "@/lib/wish-edit-token.server";

const AVATAR_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const VIDEO_EXTENSIONS = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
} as const;

function readText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function readFile(value: FormDataEntryValue | null): File | null {
  return value !== null && typeof value !== "string" && value.size > 0
    ? value
    : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function result(
  status: ContributionFormState["status"],
  message: string,
  submissionId: string,
  fieldErrors: ContributionFormState["fieldErrors"] = {},
  editUrl?: string,
): ContributionFormState {
  return { status, message, submissionId, fieldErrors, editUrl };
}

async function cleanupUploadedObjects(
  uploaded: Array<{ bucket: string; path: string }>,
) {
  const uploadsByBucket = new Map<string, string[]>();

  for (const item of uploaded) {
    const paths = uploadsByBucket.get(item.bucket) ?? [];
    paths.push(item.path);
    uploadsByBucket.set(item.bucket, paths);
  }

  await Promise.allSettled(
    [...uploadsByBucket].map(async ([bucket, paths]) => {
      await removePrivateObjects(bucket, paths);
    }),
  );
}

export async function submitContribution(
  secret: string,
  formData: FormData,
): Promise<ContributionFormState> {
  if (!isContributionSecretValid(secret)) {
    notFound();
  }

  const submissionId = readText(formData.get("submissionId"));
  const schedule = getAppSchedule();

  if (getCurrentScheduleState(schedule) !== "accepting-contributions") {
    return result(
      "closed",
      `Cổng nhận lời chúc đã đóng lúc ${formatAppDateTime(
        schedule.contributionsCloseAt,
      )} (giờ Việt Nam).`,
      isUuid(submissionId) ? submissionId : randomUUID(),
    );
  }

  // Silently accept bot-looking submissions so the trap does not reveal itself.
  if (readText(formData.get("website"))) {
    return result(
      "success",
      "Lời chúc đã được gửi và đang chờ duyệt. Cảm ơn bạn!",
      randomUUID(),
    );
  }

  if (!isUuid(submissionId)) {
    return result(
      "error",
      "Phiên gửi đã hết hiệu lực. Vui lòng tải lại trang và thử lại.",
      submissionId,
    );
  }

  try {
    if (await wishExists(submissionId)) {
      return result(
        "success",
        "Lời chúc đã được gửi trước đó và đang chờ duyệt. Cảm ơn bạn!",
        randomUUID(),
        {},
        createWishEditPath(submissionId),
      );
    }

    const rateLimitKey = await getContributionRateLimitKey();
    const { maxAttempts, windowSeconds } = getContributionRateLimitConfig();
    const isAllowed = await consumeContributionRateLimit(
      rateLimitKey,
      maxAttempts,
      windowSeconds,
    );

    if (!isAllowed) {
      return result(
        "error",
        "Bạn đã gửi quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau ít phút.",
        submissionId,
      );
    }
  } catch (error) {
    console.error(
      "Contribution rate-limit check failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return result(
      "error",
      "Chưa thể nhận lời chúc lúc này. Vui lòng thử lại sau.",
      submissionId,
    );
  }

  const fieldErrors = validateRequiredContributionFields(formData);
  const avatarFile = readFile(formData.get("avatar"));
  const avatarResult = await validateAvatarFile(
    formData.get("avatar"),
    getAvatarConstraints(),
  );

  if (avatarResult && !avatarResult.ok) {
    fieldErrors.avatar = avatarResult.message;
  }

  const contentType = readText(formData.get("contentType"));
  const videoFile = readFile(formData.get("video"));
  const videoResult =
    contentType === "video" && !fieldErrors.video
      ? await validateVideoFile(
          formData.get("video"),
          getVideoConstraints(),
        )
      : null;

  if (videoResult && !videoResult.ok) {
    fieldErrors.video = videoResult.message;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return result(
      "error",
      "Vui lòng kiểm tra lại các trường được đánh dấu.",
      submissionId,
      fieldErrors,
    );
  }

  const wishId = submissionId;
  const editUrl = createWishEditPath(wishId);
  const avatarBucket = process.env.AVATAR_BUCKET || "wish-avatars";
  const videoBucket = process.env.VIDEO_BUCKET || "wish-videos";
  const avatarPath =
    avatarFile && avatarResult?.ok
      ? `${wishId}/avatar.${AVATAR_EXTENSIONS[avatarResult.mimeType]}`
      : null;
  const videoPath =
    videoFile && videoResult?.ok
      ? `${wishId}/wish.${VIDEO_EXTENSIONS[videoResult.mimeType]}`
      : null;
  const uploaded: Array<{ bucket: string; path: string }> = [];
  let insertAttempted = false;

  try {
    if (avatarFile && avatarResult?.ok && avatarPath) {
      await uploadPrivateObject(
        avatarBucket,
        avatarPath,
        avatarFile,
        avatarResult.mimeType,
      );
      uploaded.push({ bucket: avatarBucket, path: avatarPath });
    }

    if (videoFile && videoResult?.ok && videoPath) {
      await uploadPrivateObject(
        videoBucket,
        videoPath,
        videoFile,
        videoResult.mimeType,
      );
      uploaded.push({ bucket: videoBucket, path: videoPath });
    }

    const wish: WishInsert = {
      id: wishId,
      sender_name: readText(formData.get("senderName")),
      avatar_path: avatarPath,
      content_type: contentType as "text" | "video",
      message_text:
        contentType === "text" ? readText(formData.get("message")) : null,
      video_path: videoPath,
      video_mime_type: videoResult?.ok ? videoResult.mimeType : null,
      video_size_bytes: videoResult?.ok ? videoResult.sizeBytes : null,
      video_duration_seconds: videoResult?.ok
        ? videoResult.durationSeconds
        : null,
      status: "pending",
    };

    insertAttempted = true;
    await insertPendingWish(wish);

    return result(
      "success",
      "Lời chúc đã được gửi và đang chờ duyệt. Cảm ơn bạn!",
      randomUUID(),
      {},
      editUrl,
    );
  } catch (error) {
    let existenceCheckFailed = false;

    try {
      if (await wishExists(submissionId)) {
        return result(
          "success",
          "Lời chúc đã được gửi trước đó và đang chờ duyệt. Cảm ơn bạn!",
          randomUUID(),
          {},
          createWishEditPath(submissionId),
        );
      }
    } catch {
      existenceCheckFailed = true;
    }

    // If the insert request was sent but its outcome cannot be checked, retain
    // deterministic media paths. A retry can then confirm the existing record
    // without leaving a database row that points at deleted media.
    if (!insertAttempted || !existenceCheckFailed) {
      await cleanupUploadedObjects(uploaded);
    }
    console.error(
      "Contribution submission failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return result(
      "error",
      "Chưa thể lưu lời chúc lúc này. Nội dung vẫn được giữ để bạn thử lại.",
      submissionId,
    );
  }
}
