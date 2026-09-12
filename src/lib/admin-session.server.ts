import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "birthday_admin_session";
const SESSION_VERSION = "v1";
const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;
const MAX_SESSION_TTL_SECONDS = 24 * 60 * 60;
const MINIMUM_SESSION_SECRET_LENGTH = 32;
const SESSION_SECRET_PLACEHOLDER = "replace_with_at_least_32_random_bytes";
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_CLOCK_SKEW_SECONDS = 60;

type AdminSessionPayload = {
  issuedAt: number;
  expiresAt: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (
    !secret ||
    secret === SESSION_SECRET_PLACEHOLDER ||
    secret.length < MINIMUM_SESSION_SECRET_LENGTH
  ) {
    throw new Error("Admin session secret is missing or too short.");
  }

  return secret;
}

function getSessionTtlSeconds(): number {
  const configured = Number(process.env.ADMIN_SESSION_TTL_SECONDS);

  if (!Number.isSafeInteger(configured) || configured <= 0) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }

  return Math.min(configured, MAX_SESSION_TTL_SECONDS);
}

function sign(unsignedToken: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(unsignedToken, "utf8")
    .digest("base64url");
}

function signaturesMatch(actual: string, expected: string): boolean {
  if (
    !BASE64URL_PATTERN.test(actual) ||
    !BASE64URL_PATTERN.test(expected)
  ) {
    return false;
  }

  const actualBytes = Buffer.from(actual, "base64url");
  const expectedBytes = Buffer.from(expected, "base64url");

  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  );
}

function createAdminSessionToken(now = Date.now()): {
  token: string;
  payload: AdminSessionPayload;
} {
  const issuedAt = Math.floor(now / 1000);
  const expiresAt = issuedAt + getSessionTtlSeconds();
  const nonce = randomBytes(18).toString("base64url");
  const unsignedToken = [SESSION_VERSION, issuedAt, expiresAt, nonce].join(".");

  return {
    token: `${unsignedToken}.${sign(unsignedToken)}`,
    payload: { issuedAt, expiresAt },
  };
}

function verifyAdminSessionToken(
  token: string | undefined,
  now = Date.now(),
): AdminSessionPayload | null {
  if (!token || token.length > 512) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 5 || parts[0] !== SESSION_VERSION) {
    return null;
  }

  const issuedAt = Number(parts[1]);
  const expiresAt = Number(parts[2]);
  const nonce = parts[3];
  const signature = parts[4];
  const currentTime = Math.floor(now / 1000);

  if (
    !Number.isSafeInteger(issuedAt) ||
    !Number.isSafeInteger(expiresAt) ||
    issuedAt <= 0 ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > MAX_SESSION_TTL_SECONDS ||
    issuedAt > currentTime + MAX_CLOCK_SKEW_SECONDS ||
    nonce.length < 16 ||
    !BASE64URL_PATTERN.test(nonce) ||
    currentTime >= expiresAt
  ) {
    return null;
  }

  const unsignedToken = parts.slice(0, 4).join(".");

  try {
    if (!signaturesMatch(signature, sign(unsignedToken))) {
      return null;
    }
  } catch {
    return null;
  }

  return { issuedAt, expiresAt };
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const { token, payload } = createAdminSessionToken();

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: new Date(payload.expiresAt * 1000),
    maxAge: payload.expiresAt - payload.issuedAt,
    priority: "high",
  });
}

export async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  try {
    return verifyAdminSessionToken(token) !== null;
  } catch {
    return false;
  }
}

export async function deleteAdminSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: new Date(0),
    maxAge: 0,
    priority: "high",
  });
}
