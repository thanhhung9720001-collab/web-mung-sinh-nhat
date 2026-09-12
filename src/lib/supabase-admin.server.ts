import "server-only";

import { hasValidAdminSession } from "@/lib/admin-session.server";

type WishContentType = "text" | "video";
export type WishStatus = "pending" | "approved" | "rejected";
export type WishStatusFilter = WishStatus | "all";
export type AdminMediaKind = "avatar" | "video";
export type AdminModerationIntent = "approved" | "rejected" | "delete";
export type AdminModerationResult =
  | "updated"
  | "deleted"
  | "deleted_media_cleanup_failed"
  | "not_found";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_SIGNED_URL_TTL_SECONDS = 5 * 60;
const MIN_SIGNED_URL_TTL_SECONDS = 60;
const MAX_SIGNED_URL_TTL_SECONDS = 15 * 60;

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

export type AdminWishSummary = {
  id: string;
  senderName: string;
  hasAvatar: boolean;
  contentType: WishContentType;
  messagePreview: string | null;
  videoSizeBytes: number | null;
  videoDurationSeconds: number | null;
  status: WishStatus;
  displayOrder: number | null;
  createdAt: string;
};

export type AdminWishDetail = AdminWishSummary & {
  messageText: string | null;
  consentGivenAt: string;
  reviewedAt: string | null;
};

export type AdminGiftPreviewWish = {
  id: string;
  senderName: string;
  hasAvatar: boolean;
  contentType: WishContentType;
  messageText: string | null;
  videoDurationSeconds: number | null;
  displayOrder: number | null;
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

export async function listAdminWishes(
  status: WishStatusFilter,
): Promise<AdminWishSummary[]> {
  if (!(await hasValidAdminSession())) {
    throw new Error("Unauthorized admin data access.");
  }

  const config = getSupabaseAdminConfig();
  const query = new URLSearchParams({
    select:
      "id,sender_name,avatar_path,content_type,message_text,video_size_bytes,video_duration_seconds,status,display_order,created_at",
    order:
      status === "approved"
        ? "display_order.asc.nullslast,created_at.asc"
        : "created_at.desc",
    limit: "200",
  });

  if (status !== "all") {
    query.set("status", `eq.${status}`);
  }

  const response = await fetch(
    `${config.baseUrl}/rest/v1/wishes?${query.toString()}`,
    {
      headers: adminHeaders(config.secretKey),
      cache: "no-store",
    },
  );

  await ensureSuccessful(response, "Admin wish list");

  const rows: unknown = await response.json();

  if (!Array.isArray(rows)) {
    throw new Error("Admin wish list returned an invalid response.");
  }

  return rows.map(toAdminWishSummary);
}

export async function listAdminApprovedWishesForPreview(): Promise<
  AdminGiftPreviewWish[]
> {
  if (!(await hasValidAdminSession())) {
    throw new Error("Unauthorized admin data access.");
  }

  const config = getSupabaseAdminConfig();
  const query = new URLSearchParams({
    status: "eq.approved",
    select:
      "id,sender_name,avatar_path,content_type,message_text,video_duration_seconds,display_order",
    order: "display_order.asc.nullslast,created_at.asc",
    limit: "200",
  });
  const response = await fetch(
    `${config.baseUrl}/rest/v1/wishes?${query.toString()}`,
    {
      headers: adminHeaders(config.secretKey),
      cache: "no-store",
    },
  );

  await ensureSuccessful(response, "Admin gift preview");

  const rows: unknown = await response.json();

  if (!Array.isArray(rows)) {
    throw new Error("Admin gift preview returned an invalid response.");
  }

  return rows.map(toAdminGiftPreviewWish);
}

function toAdminGiftPreviewWish(row: unknown): AdminGiftPreviewWish {
  if (!isRecord(row)) {
    throw new Error("Admin gift preview contained an invalid row.");
  }

  const contentType = row.content_type;

  if (
    typeof row.id !== "string" ||
    typeof row.sender_name !== "string" ||
    (contentType !== "text" && contentType !== "video")
  ) {
    throw new Error("Admin gift preview contained invalid field values.");
  }

  return {
    id: row.id,
    senderName: row.sender_name,
    hasAvatar: typeof row.avatar_path === "string",
    contentType,
    messageText:
      typeof row.message_text === "string" ? row.message_text : null,
    videoDurationSeconds:
      typeof row.video_duration_seconds === "number"
        ? row.video_duration_seconds
        : null,
    displayOrder:
      typeof row.display_order === "number" ? row.display_order : null,
  };
}

export async function createAdminMediaUrl(
  wishId: string,
  kind: AdminMediaKind,
): Promise<string | null> {
  if (!(await hasValidAdminSession())) {
    return null;
  }

  if (!UUID_PATTERN.test(wishId) || (kind !== "avatar" && kind !== "video")) {
    return null;
  }

  const config = getSupabaseAdminConfig();
  const query = new URLSearchParams({
    id: `eq.${wishId}`,
    select: kind === "avatar" ? "avatar_path" : "video_path",
    limit: "1",
  });
  const response = await fetch(
    `${config.baseUrl}/rest/v1/wishes?${query.toString()}`,
    {
      headers: adminHeaders(config.secretKey),
      cache: "no-store",
    },
  );

  await ensureSuccessful(response, "Admin media lookup");

  const rows: unknown = await response.json();

  if (!Array.isArray(rows) || rows.length !== 1 || !isRecord(rows[0])) {
    return null;
  }

  const objectPath = rows[0][kind === "avatar" ? "avatar_path" : "video_path"];

  if (typeof objectPath !== "string" || !isSafeObjectPath(objectPath)) {
    return null;
  }

  const bucket =
    kind === "avatar"
      ? process.env.AVATAR_BUCKET || "wish-avatars"
      : process.env.VIDEO_BUCKET || "wish-videos";
  const signedResponse = await fetch(
    `${config.baseUrl}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: {
        ...adminHeaders(config.secretKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: getSignedUrlTtlSeconds() }),
      cache: "no-store",
    },
  );

  await ensureSuccessful(signedResponse, "Admin media signing");

  const payload: unknown = await signedResponse.json();

  if (!isRecord(payload) || typeof payload.signedURL !== "string") {
    throw new Error("Admin media signing returned an invalid response.");
  }

  const signedUrl = new URL(payload.signedURL, config.baseUrl);

  if (signedUrl.origin !== new URL(config.baseUrl).origin) {
    throw new Error("Admin media signing returned an unexpected origin.");
  }

  return signedUrl.toString();
}

export async function getAdminWish(
  wishId: string,
): Promise<AdminWishDetail | null> {
  if (!(await hasValidAdminSession()) || !UUID_PATTERN.test(wishId)) {
    return null;
  }

  const config = getSupabaseAdminConfig();
  const query = new URLSearchParams({
    id: `eq.${wishId}`,
    select:
      "id,sender_name,avatar_path,content_type,message_text,video_size_bytes,video_duration_seconds,status,display_order,consent_given_at,created_at,reviewed_at",
    limit: "1",
  });
  const response = await fetch(
    `${config.baseUrl}/rest/v1/wishes?${query.toString()}`,
    {
      headers: adminHeaders(config.secretKey),
      cache: "no-store",
    },
  );

  await ensureSuccessful(response, "Admin wish detail");

  const rows: unknown = await response.json();

  if (!Array.isArray(rows) || rows.length !== 1 || !isRecord(rows[0])) {
    return null;
  }

  const summary = toAdminWishSummary(rows[0]);
  const consentGivenAt = rows[0].consent_given_at;
  const reviewedAt = rows[0].reviewed_at;

  if (
    typeof consentGivenAt !== "string" ||
    (reviewedAt !== null && typeof reviewedAt !== "string")
  ) {
    throw new Error("Admin wish detail contained invalid field values.");
  }

  return {
    ...summary,
    messageText:
      typeof rows[0].message_text === "string" ? rows[0].message_text : null,
    consentGivenAt,
    reviewedAt,
  };
}

export async function moderateAdminWish(
  wishId: string,
  intent: AdminModerationIntent,
): Promise<AdminModerationResult> {
  if (!(await hasValidAdminSession())) {
    throw new Error("Unauthorized admin mutation.");
  }

  if (
    !UUID_PATTERN.test(wishId) ||
    (intent !== "approved" &&
      intent !== "rejected" &&
      intent !== "delete")
  ) {
    return "not_found";
  }

  if (intent === "delete") {
    return deleteAdminWish(wishId);
  }

  const config = getSupabaseAdminConfig();
  const query = new URLSearchParams({
    id: `eq.${wishId}`,
    select: "id",
  });
  const response = await fetch(
    `${config.baseUrl}/rest/v1/wishes?${query.toString()}`,
    {
      method: "PATCH",
      headers: {
        ...adminHeaders(config.secretKey),
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        status: intent,
        reviewed_at: new Date().toISOString(),
      }),
      cache: "no-store",
    },
  );

  await ensureSuccessful(response, "Admin wish moderation");

  const rows: unknown = await response.json();
  return Array.isArray(rows) && rows.length === 1 ? "updated" : "not_found";
}

export async function setAdminWishDisplayOrder(
  wishId: string,
  displayOrder: number | null,
): Promise<boolean> {
  if (!(await hasValidAdminSession())) {
    throw new Error("Unauthorized admin mutation.");
  }

  if (
    !UUID_PATTERN.test(wishId) ||
    (displayOrder !== null &&
      (!Number.isSafeInteger(displayOrder) ||
        displayOrder < 0 ||
        displayOrder > 9_999))
  ) {
    return false;
  }

  const config = getSupabaseAdminConfig();
  const query = new URLSearchParams({
    id: `eq.${wishId}`,
    status: "eq.approved",
    select: "id",
  });
  const response = await fetch(
    `${config.baseUrl}/rest/v1/wishes?${query.toString()}`,
    {
      method: "PATCH",
      headers: {
        ...adminHeaders(config.secretKey),
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ display_order: displayOrder }),
      cache: "no-store",
    },
  );

  await ensureSuccessful(response, "Admin wish display order update");

  const rows: unknown = await response.json();
  return Array.isArray(rows) && rows.length === 1;
}

async function deleteAdminWish(wishId: string): Promise<AdminModerationResult> {
  const config = getSupabaseAdminConfig();
  const query = new URLSearchParams({
    id: `eq.${wishId}`,
    select: "avatar_path,video_path",
  });
  const response = await fetch(
    `${config.baseUrl}/rest/v1/wishes?${query.toString()}`,
    {
      method: "DELETE",
      headers: {
        ...adminHeaders(config.secretKey),
        Prefer: "return=representation",
      },
      cache: "no-store",
    },
  );

  await ensureSuccessful(response, "Admin wish deletion");

  const rows: unknown = await response.json();

  if (!Array.isArray(rows) || rows.length !== 1 || !isRecord(rows[0])) {
    return "not_found";
  }

  const avatarPath = rows[0].avatar_path;
  const videoPath = rows[0].video_path;
  const cleanupTasks: Array<Promise<void>> = [];

  if (typeof avatarPath === "string" && isSafeObjectPath(avatarPath)) {
    cleanupTasks.push(
      removePrivateObjects(
        process.env.AVATAR_BUCKET || "wish-avatars",
        [avatarPath],
      ),
    );
  }

  if (typeof videoPath === "string" && isSafeObjectPath(videoPath)) {
    cleanupTasks.push(
      removePrivateObjects(process.env.VIDEO_BUCKET || "wish-videos", [videoPath]),
    );
  }

  const cleanupResults = await Promise.allSettled(cleanupTasks);

  return cleanupResults.some((result) => result.status === "rejected")
    ? "deleted_media_cleanup_failed"
    : "deleted";
}

function toAdminWishSummary(row: unknown): AdminWishSummary {
  if (!isRecord(row)) {
    throw new Error("Admin wish list contained an invalid row.");
  }

  const contentType = row.content_type;
  const status = row.status;

  if (
    typeof row.id !== "string" ||
    typeof row.sender_name !== "string" ||
    (contentType !== "text" && contentType !== "video") ||
    (status !== "pending" && status !== "approved" && status !== "rejected") ||
    typeof row.created_at !== "string"
  ) {
    throw new Error("Admin wish list contained invalid field values.");
  }

  return {
    id: row.id,
    senderName: row.sender_name,
    hasAvatar: typeof row.avatar_path === "string",
    contentType,
    messagePreview:
      typeof row.message_text === "string"
        ? createMessagePreview(row.message_text)
        : null,
    videoSizeBytes:
      typeof row.video_size_bytes === "number" ? row.video_size_bytes : null,
    videoDurationSeconds:
      typeof row.video_duration_seconds === "number"
        ? row.video_duration_seconds
        : null,
    status,
    displayOrder:
      typeof row.display_order === "number" ? row.display_order : null,
    createdAt: row.created_at,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createMessagePreview(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim();
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function getSignedUrlTtlSeconds(): number {
  const configured = Number(process.env.SIGNED_URL_TTL_SECONDS);

  if (!Number.isSafeInteger(configured)) {
    return DEFAULT_SIGNED_URL_TTL_SECONDS;
  }

  return Math.min(
    Math.max(configured, MIN_SIGNED_URL_TTL_SECONDS),
    MAX_SIGNED_URL_TTL_SECONDS,
  );
}

function isSafeObjectPath(path: string): boolean {
  if (path.length === 0 || path.length > 1024 || path.includes("\\")) {
    return false;
  }

  return path
    .split("/")
    .every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
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
