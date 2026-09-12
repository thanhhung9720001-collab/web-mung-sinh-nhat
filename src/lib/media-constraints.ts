export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const DEFAULT_MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
export const DEFAULT_MAX_VIDEO_SIZE_BYTES = 30 * 1024 * 1024;
export const DEFAULT_MAX_VIDEO_DURATION_SECONDS = 60;

export type AvatarConstraints = {
  maxSizeBytes: number;
};

export type VideoConstraints = {
  maxSizeBytes: number;
  maxDurationSeconds: number;
};
