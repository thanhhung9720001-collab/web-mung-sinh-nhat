import "server-only";

import { cookies } from "next/headers";
import {
  createSignedSessionToken,
  resolveSessionTtlSeconds,
  verifySignedSessionToken,
  type SessionPayload,
} from "@/lib/session-token";

const ADMIN_SESSION_COOKIE = "birthday_admin_session";
const SESSION_VERSION = "v1";
const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;
const MAX_SESSION_TTL_SECONDS = 24 * 60 * 60;
const MINIMUM_SESSION_SECRET_LENGTH = 32;
const SESSION_SECRET_PLACEHOLDER = "replace_with_at_least_32_random_bytes";
type AdminSessionPayload = SessionPayload;

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
  return resolveSessionTtlSeconds(
    process.env.ADMIN_SESSION_TTL_SECONDS,
    DEFAULT_SESSION_TTL_SECONDS,
    MAX_SESSION_TTL_SECONDS,
  );
}

function createAdminSessionToken(now = Date.now()): {
  token: string;
  payload: AdminSessionPayload;
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

function verifyAdminSessionToken(
  token: string | undefined,
  now = Date.now(),
): AdminSessionPayload | null {
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
