import {
  createAdminMediaUrl,
  type AdminMediaKind,
} from "@/lib/supabase-admin.server";

type AdminMediaRouteContext = {
  params: Promise<{ wishId: string; kind: string }>;
};

export async function GET(
  _request: Request,
  { params }: AdminMediaRouteContext,
): Promise<Response> {
  const { wishId, kind } = await params;

  if (kind !== "avatar" && kind !== "video") {
    return notFoundResponse();
  }

  try {
    const signedUrl = await createAdminMediaUrl(
      wishId,
      kind as AdminMediaKind,
    );

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
    return new Response("Không thể tạo liên kết media lúc này.", {
      status: 502,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
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
