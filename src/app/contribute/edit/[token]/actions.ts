"use server";

import { randomUUID } from "node:crypto";
import { validateAvatarFile } from "@/lib/avatar-validation.server";
import {
  optimizeAvatar,
  OPTIMIZED_AVATAR_MIME_TYPE,
} from "@/lib/avatar-processing.server";
import {
  getAvatarConstraints,
  getVideoConstraints,
} from "@/lib/media-constraints.server";
import {
  getEditableWishByToken,
  removePrivateObjects,
  updateEditableWishByToken,
  uploadPrivateObject,
  type WishEditUpdate,
} from "@/lib/supabase-admin.server";
import {
  formatAppDateTime,
  getAppSchedule,
  getCurrentScheduleState,
} from "@/lib/time";
import { validateVideoFile } from "@/lib/video-validation.server";

const VIDEO_EXTENSIONS = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
} as const;

export type WishEditField =
  | "senderName"
  | "avatar"
  | "contentType"
  | "message"
  | "video"
  | "consent";

export type WishEditState = {
  status: "idle" | "error" | "success" | "closed";
  message: string;
  fieldErrors: Partial<Record<WishEditField, string>>;
};

export async function updateContribution(
  editToken: string,
  _previousState: WishEditState,
  formData: FormData,
): Promise<WishEditState> {
  const schedule = getAppSchedule();

  if (getCurrentScheduleState(schedule) !== "accepting-contributions") {
    return {
      status: "closed",
      message: `Không thể sửa sau ${formatAppDateTime(schedule.contributionsCloseAt)} (giờ Việt Nam).`,
      fieldErrors: {},
    };
  }

  const existing = await getEditableWishByToken(editToken);

  if (!existing) {
    return {
      status: "error",
      message: "Link chỉnh sửa không hợp lệ, đã hết hạn hoặc lời chúc không còn tồn tại.",
      fieldErrors: {},
    };
  }

  if (readText(formData.get("website"))) {
    return {
      status: "success",
      message: "Đã lưu thay đổi và chuyển lời chúc về trạng thái chờ duyệt.",
      fieldErrors: {},
    };
  }

  const senderName = readText(formData.get("senderName"));
  const contentType = readText(formData.get("contentType"));
  const message = readText(formData.get("message"));
  const consent = readText(formData.get("consent"));
  const removeAvatar = readText(formData.get("removeAvatar")) === "yes";
  const avatarFile = readFile(formData.get("avatar"));
  const videoFile = readFile(formData.get("video"));
  const fieldErrors: WishEditState["fieldErrors"] = {};

  if (!senderName) {
    fieldErrors.senderName = "Vui lòng nhập tên của bạn.";
  } else if (senderName.length > 80) {
    fieldErrors.senderName = "Tên không được dài quá 80 ký tự.";
  }

  if (contentType !== "text" && contentType !== "video") {
    fieldErrors.contentType = "Vui lòng chọn văn bản hoặc video.";
  } else if (contentType === "text") {
    if (!message) {
      fieldErrors.message = "Vui lòng nhập lời chúc.";
    } else if (message.length > 5000) {
      fieldErrors.message = "Lời chúc không được dài quá 5.000 ký tự.";
    }
  } else if (!videoFile && !existing.videoPath) {
    fieldErrors.video = "Vui lòng chọn video lời chúc.";
  }

  if (consent !== "accepted") {
    fieldErrors.consent = "Bạn cần xác nhận lại việc sử dụng nội dung.";
  }

  const avatarResult = await validateAvatarFile(
    formData.get("avatar"),
    getAvatarConstraints(),
  );

  if (avatarResult && !avatarResult.ok) {
    fieldErrors.avatar = avatarResult.message;
  }

  const videoResult = videoFile
    ? await validateVideoFile(formData.get("video"), getVideoConstraints())
    : null;

  if (videoResult && !videoResult.ok) {
    fieldErrors.video = videoResult.message;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Vui lòng kiểm tra lại các trường được đánh dấu.",
      fieldErrors,
    };
  }

  const revisionId = randomUUID();
  const avatarBucket = process.env.AVATAR_BUCKET || "wish-avatars";
  const videoBucket = process.env.VIDEO_BUCKET || "wish-videos";
  const newAvatarPath =
    !removeAvatar && avatarFile && avatarResult?.ok
      ? `${existing.id}/edits/${revisionId}/avatar.webp`
      : null;
  const newVideoPath =
    videoFile && videoResult?.ok
      ? `${existing.id}/edits/${revisionId}/wish.${VIDEO_EXTENSIONS[videoResult.mimeType]}`
      : null;
  const uploaded: Array<{ bucket: string; path: string }> = [];

  try {
    if (!removeAvatar && avatarFile && avatarResult?.ok && newAvatarPath) {
      const optimizedAvatar = await optimizeAvatar(avatarFile);
      await uploadPrivateObject(
        avatarBucket,
        newAvatarPath,
        optimizedAvatar,
        OPTIMIZED_AVATAR_MIME_TYPE,
      );
      uploaded.push({ bucket: avatarBucket, path: newAvatarPath });
    }

    if (videoFile && videoResult?.ok && newVideoPath) {
      await uploadPrivateObject(
        videoBucket,
        newVideoPath,
        videoFile,
        videoResult.mimeType,
      );
      uploaded.push({ bucket: videoBucket, path: newVideoPath });
    }

    const update: WishEditUpdate = {
      sender_name: senderName,
      avatar_path: removeAvatar
        ? null
        : newAvatarPath ?? existing.avatarPath,
      content_type: contentType as "text" | "video",
      message_text: contentType === "text" ? message : null,
      video_path:
        contentType === "video" ? newVideoPath ?? existing.videoPath : null,
      video_mime_type:
        contentType === "video"
          ? videoResult?.ok
            ? videoResult.mimeType
            : existing.videoMimeType
          : null,
      video_size_bytes:
        contentType === "video"
          ? videoResult?.ok
            ? videoResult.sizeBytes
            : existing.videoSizeBytes
          : null,
      video_duration_seconds:
        contentType === "video"
          ? videoResult?.ok
            ? videoResult.durationSeconds
            : existing.videoDurationSeconds
          : null,
    };

    if (!(await updateEditableWishByToken(editToken, update))) {
      await cleanupObjects(uploaded);
      return {
        status: "error",
        message: "Không thể cập nhật lời chúc. Vui lòng mở lại link và thử lại.",
        fieldErrors: {},
      };
    }

    const obsolete: Array<{ bucket: string; path: string }> = [];

    if (
      existing.avatarPath &&
      existing.avatarPath !== update.avatar_path
    ) {
      obsolete.push({ bucket: avatarBucket, path: existing.avatarPath });
    }

    if (existing.videoPath && existing.videoPath !== update.video_path) {
      obsolete.push({ bucket: videoBucket, path: existing.videoPath });
    }

    await cleanupObjects(obsolete);

    return {
      status: "success",
      message: "Đã lưu thay đổi. Lời chúc đã trở lại hàng chờ để được duyệt lại.",
      fieldErrors: {},
    };
  } catch {
    await cleanupObjects(uploaded);
    return {
      status: "error",
      message: "Chưa thể lưu thay đổi lúc này. Vui lòng thử lại sau.",
      fieldErrors: {},
    };
  }
}

function readText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function readFile(value: FormDataEntryValue | null): File | null {
  return value !== null && typeof value !== "string" && value.size > 0
    ? value
    : null;
}

async function cleanupObjects(
  objects: Array<{ bucket: string; path: string }>,
): Promise<void> {
  const byBucket = new Map<string, string[]>();

  for (const object of objects) {
    const paths = byBucket.get(object.bucket) ?? [];
    paths.push(object.path);
    byBucket.set(object.bucket, paths);
  }

  await Promise.allSettled(
    [...byBucket].map(([bucket, paths]) =>
      removePrivateObjects(bucket, paths),
    ),
  );
}
