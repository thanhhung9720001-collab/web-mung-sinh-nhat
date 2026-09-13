import assert from "node:assert/strict";
import test from "node:test";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  DEFAULT_MAX_AVATAR_SIZE_BYTES,
  DEFAULT_MAX_VIDEO_DURATION_SECONDS,
  DEFAULT_MAX_VIDEO_SIZE_BYTES,
} from "../src/lib/media-constraints.ts";

test("media allowlists and limits match the public form contract", () => {
  assert.deepEqual(ALLOWED_AVATAR_MIME_TYPES, [
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  assert.deepEqual(ALLOWED_VIDEO_MIME_TYPES, [
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]);
  assert.equal(DEFAULT_MAX_AVATAR_SIZE_BYTES, 5 * 1024 * 1024);
  assert.equal(DEFAULT_MAX_VIDEO_SIZE_BYTES, 30 * 1024 * 1024);
  assert.equal(DEFAULT_MAX_VIDEO_DURATION_SECONDS, 60);
});
