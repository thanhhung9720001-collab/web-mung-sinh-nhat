import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

const MINIMUM_SECRET_LENGTH = 32;
const EXAMPLE_SECRET = "replace_with_random_url_safe_secret";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Validates the private contribution-link segment without exposing the expected
 * value to browser code. A missing or placeholder configuration always denies
 * access so a deployment cannot accidentally make the form public.
 */
export function isContributionSecretValid(candidate: string): boolean {
  const expected = process.env.CONTRIBUTION_LINK_SECRET;

  if (
    !expected ||
    expected === EXAMPLE_SECRET ||
    expected.length < MINIMUM_SECRET_LENGTH
  ) {
    return false;
  }

  return timingSafeEqual(digest(candidate), digest(expected));
}

export function getContributionInvitePath(): string | null {
  const secret = process.env.CONTRIBUTION_LINK_SECRET;

  if (
    !secret ||
    secret === EXAMPLE_SECRET ||
    secret.length < MINIMUM_SECRET_LENGTH
  ) {
    return null;
  }

  return `/contribute/${encodeURIComponent(secret)}`;
}
