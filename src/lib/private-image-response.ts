const ALLOWED_IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type PrivateImageFetcher = (
  input: string,
  init: RequestInit,
) => Promise<Response>;

export async function proxyPrivateImage(
  signedUrl: string,
  fetchImage: PrivateImageFetcher = fetch,
): Promise<Response> {
  const upstream = await fetchImage(signedUrl, {
    cache: "no-store",
    redirect: "follow",
  });

  if (!upstream.ok || !upstream.body) {
    return unavailableImageResponse();
  }

  const contentType = upstream.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();

  if (!contentType || !ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) {
    return unavailableImageResponse();
  }

  const headers = new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Content-Type": contentType,
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  const contentLength = upstream.headers.get("content-length");

  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(upstream.body, { status: 200, headers });
}

function unavailableImageResponse(): Response {
  return new Response("Không thể mở ảnh lúc này.", {
    status: 502,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
