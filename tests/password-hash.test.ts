import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import test from "node:test";

import {
  SCRYPT_MAX_MEMORY,
  SCRYPT_N,
  SCRYPT_P,
  SCRYPT_R,
  verifyPasswordAgainstHash,
} from "../src/lib/password-hash.ts";

function createHash(password: string): string {
  const salt = randomBytes(16);
  const digest = scryptSync(password, salt, 32, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAX_MEMORY,
  });
  return `$scrypt$v1$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${digest.toString("base64url")}`;
}

test("password verifier accepts the right password and rejects the wrong one", () => {
  const hash = createHash("correct horse battery staple");

  assert.equal(verifyPasswordAgainstHash("correct horse battery staple", hash), true);
  assert.equal(verifyPasswordAgainstHash("wrong password", hash), false);
});

test("password verifier fails closed for malformed or placeholder hashes", () => {
  assert.equal(verifyPasswordAgainstHash("anything", undefined), false);
  assert.equal(
    verifyPasswordAgainstHash("anything", "replace_with_generated_password_hash"),
    false,
  );
  assert.equal(verifyPasswordAgainstHash("anything", "$scrypt$v1$bad"), false);
});
