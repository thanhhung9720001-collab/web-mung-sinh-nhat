import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SIGNED_URL_TTL_SECONDS,
  MAX_SIGNED_URL_TTL_SECONDS,
  MIN_SIGNED_URL_TTL_SECONDS,
  resolveSignedUrlTtlSeconds,
} from "../src/lib/signed-url-policy.ts";

test("signed URLs use a five-minute default", () => {
  assert.equal(resolveSignedUrlTtlSeconds(undefined), DEFAULT_SIGNED_URL_TTL_SECONDS);
  assert.equal(resolveSignedUrlTtlSeconds("invalid"), DEFAULT_SIGNED_URL_TTL_SECONDS);
});

test("signed URL lifetime is clamped to a short safe window", () => {
  assert.equal(resolveSignedUrlTtlSeconds("1"), MIN_SIGNED_URL_TTL_SECONDS);
  assert.equal(resolveSignedUrlTtlSeconds("420"), 420);
  assert.equal(resolveSignedUrlTtlSeconds("99999"), MAX_SIGNED_URL_TTL_SECONDS);
});
