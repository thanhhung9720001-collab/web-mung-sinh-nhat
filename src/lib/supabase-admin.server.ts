import "server-only";

type WishContentType = "text" | "video";

export type WishInsert = {
  id: string;
  sender_name: string;
  avatar_path: string | null;
  content_type: WishContentType;
  message_text: string | null;
  video_path: string | null;
  video_mime_type: string | null;
  video_size_bytes: number | null;
  video_duration_seconds: number | null;
  status: "pending";
};

type SupabaseAdminConfig = {
  baseUrl: string;
  secretKey: string;
};

function getSupabaseAdminConfig(): SupabaseAdminConfig {
  const rawUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (
    !rawUrl ||
    rawUrl.includes("your-project-ref") ||
    !secretKey ||
    secretKey === "sb_secret_replace_me"
  ) {
    throw new Error("Supabase server configuration is missing.");
  }

  const url = new URL(rawUrl);

  if (url.protocol !== "https:" && url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    throw new Error("Supabase URL must use HTTPS outside local development.");
  }

  return {
    baseUrl: url.toString().replace(/\/$/, ""),
    secretKey,
  };
}

function adminHeaders(secretKey: string): HeadersInit {
  if (secretKey.startsWith("sb_secret_")) {
    // Modern secret keys are opaque API keys and must not be treated as JWTs.
    return { apikey: secretKey };
  }

  // Legacy service_role keys are JWTs. Keep this compatibility path until the
  // linked project has rotated to a retrievable modern server key.
  return {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
  };
}

function encodeObjectPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function ensureSuccessful(response: Response, operation: string) {
  if (response.ok) {
    return;
  }

  const details = (await response.text()).slice(0, 500);
  throw new Error(`${operation} failed (${response.status}): ${details}`);
}

export async function uploadPrivateObject(
  bucket: string,
  path: string,
  file: File,
  contentType: string,
): Promise<void> {
  const config = getSupabaseAdminConfig();
  const response = await fetch(
    `${config.baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectPath(path)}`,
    {
      method: "POST",
      headers: {
        ...adminHeaders(config.secretKey),
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: file,
      cache: "no-store",
    },
  );

  await ensureSuccessful(response, `Storage upload to ${bucket}`);
}

export async function removePrivateObjects(
  bucket: string,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  const config = getSupabaseAdminConfig();
  const response = await fetch(
    `${config.baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`,
    {
      method: "DELETE",
      headers: {
        ...adminHeaders(config.secretKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: paths }),
      cache: "no-store",
    },
  );

  await ensureSuccessful(response, `Storage cleanup in ${bucket}`);
}

export async function insertPendingWish(wish: WishInsert): Promise<void> {
  const config = getSupabaseAdminConfig();
  const response = await fetch(`${config.baseUrl}/rest/v1/wishes`, {
    method: "POST",
    headers: {
      ...adminHeaders(config.secretKey),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(wish),
    cache: "no-store",
  });

  await ensureSuccessful(response, "Wish insert");
}

export async function wishExists(wishId: string): Promise<boolean> {
  const config = getSupabaseAdminConfig();
  const query = new URLSearchParams({
    id: `eq.${wishId}`,
    select: "id",
    limit: "1",
  });
  const response = await fetch(
    `${config.baseUrl}/rest/v1/wishes?${query.toString()}`,
    {
      headers: adminHeaders(config.secretKey),
      cache: "no-store",
    },
  );

  await ensureSuccessful(response, "Wish idempotency check");

  const rows: unknown = await response.json();
  return Array.isArray(rows) && rows.length > 0;
}

export async function consumeContributionRateLimit(
  keyHash: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<boolean> {
  const config = getSupabaseAdminConfig();
  const response = await fetch(
    `${config.baseUrl}/rest/v1/rpc/check_contribution_rate_limit`,
    {
      method: "POST",
      headers: {
        ...adminHeaders(config.secretKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_key_hash: keyHash,
        p_max_attempts: maxAttempts,
        p_window_seconds: windowSeconds,
      }),
      cache: "no-store",
    },
  );

  await ensureSuccessful(response, "Contribution rate-limit check");

  return (await response.json()) === true;
}
