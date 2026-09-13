export type StoredGiftProgress = {
  version: 1;
  openedIds: string[];
  finaleUnlocked: boolean;
};

export function getFinaleThreshold(approvedTotal: number): number {
  if (!Number.isSafeInteger(approvedTotal) || approvedTotal < 0) {
    throw new RangeError("approvedTotal must be a non-negative safe integer.");
  }

  return Math.ceil(approvedTotal * 0.7);
}

export function isStoredGiftProgress(
  value: unknown,
): value is StoredGiftProgress {
  if (!value || typeof value !== "object") {
    return false;
  }

  const progress = value as Record<string, unknown>;
  return (
    progress.version === 1 &&
    Array.isArray(progress.openedIds) &&
    progress.openedIds.every((id) => typeof id === "string") &&
    typeof progress.finaleUnlocked === "boolean"
  );
}

export function restoreOpenedWishIds(
  storedIds: readonly string[],
  approvedIds: readonly string[],
): Set<string> {
  const approved = new Set(approvedIds);
  return new Set(storedIds.filter((id) => approved.has(id)));
}
