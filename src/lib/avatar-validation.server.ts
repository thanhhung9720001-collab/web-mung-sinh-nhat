import {
  ALLOWED_AVATAR_MIME_TYPES,
  type AvatarConstraints,
} from "./media-constraints.ts";

type AvatarMimeType = (typeof ALLOWED_AVATAR_MIME_TYPES)[number];

type ValidAvatar = {
  ok: true;
  mimeType: AvatarMimeType;
  sizeBytes: number;
};

type InvalidAvatar = {
  ok: false;
  message: string;
};

export type AvatarValidationResult = ValidAvatar | InvalidAvatar;

function isAllowedAvatarMimeType(value: string): value is AvatarMimeType {
  return ALLOWED_AVATAR_MIME_TYPES.includes(value as AvatarMimeType);
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

function contentMatchesMime(bytes: Uint8Array, mimeType: AvatarMimeType) {
  if (mimeType === "image/jpeg") {
    return startsWith(bytes, [0xff, 0xd8, 0xff]);
  }

  if (mimeType === "image/png") {
    return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  return (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export async function validateAvatarFile(
  value: FormDataEntryValue | null,
  constraints: AvatarConstraints,
): Promise<AvatarValidationResult | null> {
  if (value === null || typeof value === "string" || value.size <= 0) {
    return null;
  }

  const mimeType = value.type.toLowerCase();

  if (!isAllowedAvatarMimeType(mimeType)) {
    return {
      ok: false,
      message: "Ảnh đại diện phải là JPEG, PNG hoặc WebP.",
    };
  }

  if (value.size > constraints.maxSizeBytes) {
    return {
      ok: false,
      message: `Ảnh đại diện không được vượt quá ${Math.floor(
        constraints.maxSizeBytes / (1024 * 1024),
      )} MB.`,
    };
  }

  const bytes = new Uint8Array(await value.slice(0, 12).arrayBuffer());

  if (!contentMatchesMime(bytes, mimeType)) {
    return {
      ok: false,
      message: "Nội dung tệp không khớp với định dạng ảnh đã chọn.",
    };
  }

  return { ok: true, mimeType, sizeBytes: value.size };
}
