import assert from "node:assert/strict";
import test from "node:test";
import { validateAvatarFile } from "../src/lib/avatar-validation.server.ts";
import { validateVideoFile } from "../src/lib/video-validation.server.ts";

const avatarConstraints = { maxSizeBytes: 5 * 1024 * 1024 };
const videoConstraints = {
  maxSizeBytes: 30 * 1024 * 1024,
  maxDurationSeconds: 60,
};

test("valid PNG signature passes avatar validation", async () => {
  const png = new File(
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    "avatar.png",
    { type: "image/png" },
  );

  const result = await validateAvatarFile(png, avatarConstraints);
  assert.equal(result?.ok, true);
});

test("avatar rejects wrong MIME, oversized file and forged signature", async () => {
  const wrongMime = new File(["hello"], "avatar.gif", { type: "image/gif" });
  const oversized = new File(
    [new Uint8Array(avatarConstraints.maxSizeBytes + 1)],
    "large.png",
    { type: "image/png" },
  );
  const forged = new File(["not a png"], "forged.png", { type: "image/png" });

  assert.match(await avatarError(wrongMime), /JPEG/);
  assert.match(await avatarError(oversized), /5 MB/);
  assert.match(await avatarError(forged), /không khớp/);
});

test("valid short MP4 passes video validation", async () => {
  const video = createMp4File(5);
  const result = await validateVideoFile(video, videoConstraints);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.durationSeconds, 5);
    assert.equal(result.mimeType, "video/mp4");
  }
});

test("video rejects wrong MIME, oversized file, forged signature and long duration", async () => {
  const wrongMime = new File(["hello"], "wish.avi", { type: "video/x-msvideo" });
  const oversized = new File(
    [new Uint8Array(videoConstraints.maxSizeBytes + 1)],
    "large.mp4",
    { type: "video/mp4" },
  );
  const forged = new File(["not an mp4"], "forged.mp4", { type: "video/mp4" });

  assert.match(await videoError(wrongMime), /MP4/);
  assert.match(await videoError(oversized), /30 MB/);
  assert.match(await videoError(forged), /không khớp/);
  assert.match(await videoError(createMp4File(61)), /60 giây/);
});

async function avatarError(file: File): Promise<string> {
  const result = await validateAvatarFile(file, avatarConstraints);
  assert.ok(result && !result.ok);
  return result.message;
}

async function videoError(file: File): Promise<string> {
  const result = await validateVideoFile(file, videoConstraints);
  assert.equal(result.ok, false);
  return result.ok ? "" : result.message;
}

function createMp4File(durationSeconds: number): File {
  const bytes = new Uint8Array(60);
  const view = new DataView(bytes.buffer);

  writeBox(view, bytes, 0, 24, "ftyp");
  writeAscii(bytes, 8, "isom");
  writeBox(view, bytes, 24, 36, "moov");
  writeBox(view, bytes, 32, 28, "mvhd");
  view.setUint8(40, 0);
  view.setUint32(52, 1_000, false);
  view.setUint32(56, durationSeconds * 1_000, false);

  return new File([bytes], "wish.mp4", { type: "video/mp4" });
}

function writeBox(
  view: DataView,
  bytes: Uint8Array,
  offset: number,
  size: number,
  type: string,
) {
  view.setUint32(offset, size, false);
  writeAscii(bytes, offset + 4, type);
}

function writeAscii(bytes: Uint8Array, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    bytes[offset + index] = value.charCodeAt(index);
  }
}
