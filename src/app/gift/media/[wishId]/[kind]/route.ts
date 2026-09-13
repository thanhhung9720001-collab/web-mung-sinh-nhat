import {
  createGiftWishMediaUrl,
  type GiftMediaKind,
} from "@/lib/supabase-admin.server";

type GiftWishMediaRouteContext = {
  params: Promise<{ wishId: string; kind: string }>;
};

export async function GET(
  _request: Request,
  { params }: GiftWishMediaRouteContext,
): Promise<Response> {
  const { wishId, kind } = await params;

  if (kind !== "avatar" && kind !== "video") {
    return notFoundResponse();
  }

  try {
    const signedUrl = await createGiftWishMediaUrl(
      wishId,
      kind as GiftMediaKind,
    );

    return signedUrl ? redirectToPrivateMedia(signedUrl) : notFoundResponse();
  } catch {
    return unavailableResponse();
  }
}

function redirectToPrivateMedia(signedUrl: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: signedUrl,
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function notFoundResponse(): Response {
  return new Response("Không tìm thấy media.", {
    status: 404,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function unavailableResponse(): Response {
  return new Response("Không thể mở media lúc này.", {
    status: 502,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
