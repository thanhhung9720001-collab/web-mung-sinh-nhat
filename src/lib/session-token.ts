import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_CLOCK_SKEW_SECONDS = 60;

export type SessionPayload = {
  issuedAt: number;
  expiresAt: number;
};

type SessionTokenConfig = {
  version: string;
  secret: string;
  maxTtlSeconds: number;
};

export function resolveSessionTtlSeconds(
  configuredValue: string | undefined,
  defaultTtlSeconds: number,
  maxTtlSeconds: number,
): number {
  const configured = Number(configuredValue);

  if (!Number.isSafeInteger(configured) || configured <= 0) {
    return defaultTtlSeconds;
  }

  return Math.min(configured, maxTtlSeconds);
}

export function createSignedSessionToken(
  config: SessionTokenConfig & { ttlSeconds: number },
  now = Date.now(),
): { token: string; payload: SessionPayload } {
  const issuedAt = Math.floor(now / 1000);
  const expiresAt = issuedAt + config.ttlSeconds;
  const nonce = randomBytes(18).toString("base64url");
  const unsignedToken = [config.version, issuedAt, expiresAt, nonce].join(".");

  return {
    token: `${unsignedToken}.${sign(unsignedToken, config.secret)}`,
    payload: { issuedAt, expiresAt },
  };
}

export function verifySignedSessionToken(
  token: string | undefined,
  config: SessionTokenConfig,
  now = Date.now(),
): SessionPayload | null {
  if (!token || token.length > 512) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 5 || parts[0] !== config.version) {
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
    expiresAt - issuedAt > config.maxTtlSeconds ||
    issuedAt > currentTime + MAX_CLOCK_SKEW_SECONDS ||
    nonce.length < 16 ||
    !BASE64URL_PATTERN.test(nonce) ||
    currentTime >= expiresAt
  ) {
    return null;
  }

  const unsignedToken = parts.slice(0, 4).join(".");
  const expected = sign(unsignedToken, config.secret);

  return signaturesMatch(signature, expected) ? { issuedAt, expiresAt } : null;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("base64url");
}

function signaturesMatch(actual: string, expected: string): boolean {
  if (!BASE64URL_PATTERN.test(actual) || !BASE64URL_PATTERN.test(expected)) {
    return false;
  }

  const actualBytes = Buffer.from(actual, "base64url");
  const expectedBytes = Buffer.from(expected, "base64url");

  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  );
}
