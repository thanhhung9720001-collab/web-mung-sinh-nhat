import "server-only";

import { cookies } from "next/headers";
import {
  createSignedSessionToken,
  resolveSessionTtlSeconds,
  verifySignedSessionToken,
  type SessionPayload,
} from "@/lib/session-token";

const GIFT_SESSION_COOKIE = "birthday_gift_session";
const SESSION_VERSION = "gift-v1";
const DEFAULT_SESSION_TTL_SECONDS = 24 * 60 * 60;
const MAX_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const MINIMUM_SESSION_SECRET_LENGTH = 32;
const SESSION_SECRET_PLACEHOLDER = "replace_with_at_least_32_random_bytes";
type GiftSessionPayload = SessionPayload;

function getSessionSecret(): string {
  const secret = process.env.GIFT_SESSION_SECRET;

  if (
    !secret ||
    secret === SESSION_SECRET_PLACEHOLDER ||
    secret.length < MINIMUM_SESSION_SECRET_LENGTH
  ) {
    throw new Error("Gift session secret is missing or too short.");
  }

  return secret;
}

function getSessionTtlSeconds(): number {
  return resolveSessionTtlSeconds(
    process.env.GIFT_SESSION_TTL_SECONDS,
    DEFAULT_SESSION_TTL_SECONDS,
    MAX_SESSION_TTL_SECONDS,
  );
}

function createGiftSessionToken(now = Date.now()): {
  token: string;
  payload: GiftSessionPayload;
} {
  return createSignedSessionToken(
    {
      version: SESSION_VERSION,
      secret: getSessionSecret(),
      ttlSeconds: getSessionTtlSeconds(),
      maxTtlSeconds: MAX_SESSION_TTL_SECONDS,
    },
    now,
  );
}

function verifyGiftSessionToken(
  token: string | undefined,
  now = Date.now(),
): GiftSessionPayload | null {
  try {
    return verifySignedSessionToken(
      token,
      {
        version: SESSION_VERSION,
        secret: getSessionSecret(),
        maxTtlSeconds: MAX_SESSION_TTL_SECONDS,
      },
      now,
    );
  } catch {
    return null;
  }
}

export async function createGiftSession(): Promise<void> {
  const cookieStore = await cookies();
  const { token, payload } = createGiftSessionToken();

  cookieStore.set(GIFT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/gift",
    expires: new Date(payload.expiresAt * 1000),
    maxAge: payload.expiresAt - payload.issuedAt,
    priority: "high",
  });
}

export async function hasValidGiftSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GIFT_SESSION_COOKIE)?.value;

  try {
    return verifyGiftSessionToken(token) !== null;
  } catch {
    return false;
  }
}

export async function deleteGiftSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(GIFT_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/gift",
    expires: new Date(0),
    maxAge: 0,
    priority: "high",
  });
}
