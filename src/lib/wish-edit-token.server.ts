import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppSchedule } from "@/lib/time";

const TOKEN_VERSION = "v1";
const MINIMUM_SECRET_LENGTH = 32;
const SECRET_PLACEHOLDER = "replace_with_at_least_32_random_bytes";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

function getEditSecret(): string {
  const secret = process.env.WISH_EDIT_SECRET;

  if (!secret || secret === SECRET_PLACEHOLDER || secret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error("Wish edit secret is missing or too short.");
  }

  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getEditSecret())
    .update(value, "utf8")
    .digest("base64url");
}

export function createWishEditToken(wishId: string): string {
  if (!UUID_PATTERN.test(wishId)) {
    throw new Error("Cannot create an edit token for an invalid wish id.");
  }

  const expiresAt = Math.floor(
    getAppSchedule().contributionsCloseAt.getTime() / 1000,
  );
  const unsigned = `${TOKEN_VERSION}.${wishId}.${expiresAt}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyWishEditToken(token: string): string | null {
  if (!token || token.length > 256) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) {
    return null;
  }

  const wishId = parts[1];
  const expiresAt = Number(parts[2]);
  const signature = parts[3];
  const configuredExpiry = Math.floor(
    getAppSchedule().contributionsCloseAt.getTime() / 1000,
  );

  if (
    !UUID_PATTERN.test(wishId) ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt !== configuredExpiry ||
    Math.floor(Date.now() / 1000) >= expiresAt ||
    !BASE64URL_PATTERN.test(signature)
  ) {
    return null;
  }

  const unsigned = parts.slice(0, 3).join(".");

  try {
    const actual = Buffer.from(signature, "base64url");
    const expected = Buffer.from(sign(unsigned), "base64url");
    return actual.length === expected.length && timingSafeEqual(actual, expected)
      ? wishId
      : null;
  } catch {
    return null;
  }
}

export function createWishEditPath(wishId: string): string {
  return `/contribute/edit/${createWishEditToken(wishId)}`;
}
