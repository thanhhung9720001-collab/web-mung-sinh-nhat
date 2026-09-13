import { scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_PREFIX = "scrypt";
const SCRYPT_VERSION = "v1";
const SCRYPT_KEY_LENGTH = 32;
export const SCRYPT_N = 32_768;
export const SCRYPT_R = 8;
export const SCRYPT_P = 1;
export const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;
const MAX_PASSWORD_LENGTH = 256;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

type ParsedPasswordHash = {
  salt: Buffer;
  digest: Buffer;
};

export function verifyPasswordAgainstHash(
  password: string,
  configuredHash: string | undefined,
): boolean {
  if (!password || password.length > MAX_PASSWORD_LENGTH) {
    return false;
  }

  const parsed = parsePasswordHash(configuredHash);

  if (!parsed) {
    return false;
  }

  try {
    const actual = scryptSync(password, parsed.salt, parsed.digest.length, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: SCRYPT_MAX_MEMORY,
    });

    return timingSafeEqual(actual, parsed.digest);
  } catch {
    return false;
  }
}

function parsePasswordHash(value: string | undefined): ParsedPasswordHash | null {
  if (!value || value === "replace_with_generated_password_hash") {
    return null;
  }

  const parts = value.split("$");

  if (
    parts.length !== 8 ||
    parts[0] !== "" ||
    parts[1] !== SCRYPT_PREFIX ||
    parts[2] !== SCRYPT_VERSION ||
    Number(parts[3]) !== SCRYPT_N ||
    Number(parts[4]) !== SCRYPT_R ||
    Number(parts[5]) !== SCRYPT_P ||
    !BASE64URL_PATTERN.test(parts[6]) ||
    !BASE64URL_PATTERN.test(parts[7])
  ) {
    return null;
  }

  try {
    const salt = Buffer.from(parts[6], "base64url");
    const digest = Buffer.from(parts[7], "base64url");

    return salt.length >= 16 && digest.length === SCRYPT_KEY_LENGTH
      ? { salt, digest }
      : null;
  } catch {
    return null;
  }
}
