import {
  createGiftAssetUrl,
  type GiftAssetKind,
} from "@/lib/supabase-admin.server";

type GiftAssetRouteContext = {
  params: Promise<{ asset: string }>;
};

export async function GET(
  _request: Request,
  { params }: GiftAssetRouteContext,
): Promise<Response> {
  const { asset } = await params;

  if (asset !== "music" && asset !== "finale-video") {
    return notFoundResponse();
  }

  try {
    const signedUrl = await createGiftAssetUrl(asset as GiftAssetKind);

    if (!signedUrl) {
      return notFoundResponse();
    }

    return new Response(null, {
      status: 307,
      headers: {
        Location: signedUrl,
        "Cache-Control": "private, no-store, max-age=0",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Không thể mở media lúc này.", {
      status: 502,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

function notFoundResponse(): Response {
  return new Response("Chưa có media này.", {
    status: 404,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
