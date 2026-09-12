import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_SECONDS = 15 * 60;

function readBoundedInteger(
  value: string | undefined,
  fallback: number,
  maximum: number,
): number {
  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
}

export function getContributionRateLimitConfig() {
  return {
    maxAttempts: readBoundedInteger(
      process.env.CONTRIBUTION_RATE_LIMIT_MAX,
      DEFAULT_MAX_ATTEMPTS,
      100,
    ),
    windowSeconds: readBoundedInteger(
      process.env.CONTRIBUTION_RATE_LIMIT_WINDOW_SECONDS,
      DEFAULT_WINDOW_SECONDS,
      86_400,
    ),
  };
}

export async function getContributionRateLimitKey(): Promise<string> {
  const digestSecret = process.env.CONTRIBUTION_LINK_SECRET;

  if (!digestSecret) {
    throw new Error("Contribution rate-limit secret is missing.");
  }

  const requestHeaders = await headers();
  const forwardedFor =
    requestHeaders.get("x-vercel-forwarded-for") ||
    requestHeaders.get("x-forwarded-for") ||
    requestHeaders.get("x-real-ip") ||
    "unknown";
  const clientAddress = forwardedFor.split(",", 1)[0]?.trim() || "unknown";

  return createHmac("sha256", digestSecret)
    .update(clientAddress, "utf8")
    .digest("hex");
}
