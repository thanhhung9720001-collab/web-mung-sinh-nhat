import "server-only";

import {
  DEFAULT_MAX_AVATAR_SIZE_BYTES,
  DEFAULT_MAX_VIDEO_DURATION_SECONDS,
  DEFAULT_MAX_VIDEO_SIZE_BYTES,
  type AvatarConstraints,
  type VideoConstraints,
} from "@/lib/media-constraints";

function readBoundedPositiveInteger(
  value: string | undefined,
  upperBound: number,
): number {
  if (!value) {
    return upperBound;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return upperBound;
  }

  return Math.min(parsed, upperBound);
}

export function getVideoConstraints(): VideoConstraints {
  return {
    maxSizeBytes: readBoundedPositiveInteger(
      process.env.MAX_VIDEO_SIZE_BYTES,
      DEFAULT_MAX_VIDEO_SIZE_BYTES,
    ),
    maxDurationSeconds: readBoundedPositiveInteger(
      process.env.MAX_VIDEO_DURATION_SECONDS,
      DEFAULT_MAX_VIDEO_DURATION_SECONDS,
    ),
  };
}

export function getAvatarConstraints(): AvatarConstraints {
  return {
    maxSizeBytes: readBoundedPositiveInteger(
      process.env.MAX_AVATAR_SIZE_BYTES,
      DEFAULT_MAX_AVATAR_SIZE_BYTES,
    ),
  };
}
