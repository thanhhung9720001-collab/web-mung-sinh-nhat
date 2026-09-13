import assert from "node:assert/strict";
import test from "node:test";

import {
  createSignedSessionToken,
  resolveSessionTtlSeconds,
  verifySignedSessionToken,
} from "../src/lib/session-token.ts";

const config = {
  version: "test-v1",
  secret: "a-test-secret-long-enough-for-an-hmac-session",
  maxTtlSeconds: 3_600,
};
const now = Date.UTC(2026, 8, 13, 12, 0, 0);

test("session token is valid before expiry and invalid at expiry", () => {
  const created = createSignedSessionToken({ ...config, ttlSeconds: 120 }, now);

  assert.deepEqual(verifySignedSessionToken(created.token, config, now + 119_000), created.payload);
  assert.equal(verifySignedSessionToken(created.token, config, now + 120_000), null);
});

test("session token rejects tampering, wrong version and excessive lifetime", () => {
  const created = createSignedSessionToken({ ...config, ttlSeconds: 120 }, now);
  const tampered = `${created.token.slice(0, -1)}${created.token.endsWith("a") ? "b" : "a"}`;

  assert.equal(verifySignedSessionToken(tampered, config, now), null);
  assert.equal(verifySignedSessionToken(created.token, { ...config, version: "other" }, now), null);

  const tooLong = createSignedSessionToken({ ...config, ttlSeconds: 7_200 }, now);
  assert.equal(verifySignedSessionToken(tooLong.token, config, now), null);
});

test("session lifetime uses defaults and an upper bound", () => {
  assert.equal(resolveSessionTtlSeconds(undefined, 300, 900), 300);
  assert.equal(resolveSessionTtlSeconds("0", 300, 900), 300);
  assert.equal(resolveSessionTtlSeconds("600", 300, 900), 600);
  assert.equal(resolveSessionTtlSeconds("5000", 300, 900), 900);
});
