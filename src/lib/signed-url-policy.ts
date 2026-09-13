export const DEFAULT_SIGNED_URL_TTL_SECONDS = 5 * 60;
export const MIN_SIGNED_URL_TTL_SECONDS = 60;
export const MAX_SIGNED_URL_TTL_SECONDS = 15 * 60;

export function resolveSignedUrlTtlSeconds(
  configuredValue: string | undefined,
): number {
  const configured = Number(configuredValue);

  if (!Number.isSafeInteger(configured)) {
    return DEFAULT_SIGNED_URL_TTL_SECONDS;
  }

  return Math.min(
    Math.max(configured, MIN_SIGNED_URL_TTL_SECONDS),
    MAX_SIGNED_URL_TTL_SECONDS,
  );
}
