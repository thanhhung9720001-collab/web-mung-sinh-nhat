import assert from "node:assert/strict";
import test from "node:test";
import { proxyPrivateImage } from "../src/lib/private-image-response.ts";

test("private avatar is returned from the app origin with safe headers", async () => {
  const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46]);
  const response = await proxyPrivateImage(
    "https://storage.example.test/signed-avatar",
    async () =>
      new Response(bytes, {
        status: 200,
        headers: {
          "Content-Length": String(bytes.byteLength),
          "Content-Type": "image/webp",
        },
      }),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/webp");
  assert.equal(response.headers.get("content-length"), "4");
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
});

test("private avatar proxy fails closed for upstream errors", async () => {
  const response = await proxyPrivateImage(
    "https://storage.example.test/missing-avatar",
    async () => new Response("missing", { status: 404 }),
  );

  assert.equal(response.status, 502);
  assert.match(await response.text(), /Không thể mở ảnh/);
});

test("private avatar proxy rejects an unexpected content type", async () => {
  const response = await proxyPrivateImage(
    "https://storage.example.test/not-an-image",
    async () =>
      new Response("not an image", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
  );

  assert.equal(response.status, 502);
});
