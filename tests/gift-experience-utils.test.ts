import assert from "node:assert/strict";
import test from "node:test";
import {
  getFinaleThreshold,
  isStoredGiftProgress,
  restoreOpenedWishIds,
} from "../src/app/gift/gift-experience-utils.ts";

test("finale threshold uses ceil at 70 percent for small and odd totals", () => {
  const expected = [0, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7];

  expected.forEach((threshold, total) => {
    assert.equal(getFinaleThreshold(total), threshold, `total ${total}`);
  });
});

test("finale threshold rejects invalid totals", () => {
  assert.throws(() => getFinaleThreshold(-1), RangeError);
  assert.throws(() => getFinaleThreshold(1.5), RangeError);
});

test("stored progress requires the complete versioned shape", () => {
  assert.equal(
    isStoredGiftProgress({
      version: 1,
      openedIds: ["a"],
      finaleUnlocked: false,
    }),
    true,
  );
  assert.equal(
    isStoredGiftProgress({
      version: 2,
      openedIds: [],
      finaleUnlocked: false,
    }),
    false,
  );
  assert.equal(
    isStoredGiftProgress({
      version: 1,
      openedIds: [1],
      finaleUnlocked: false,
    }),
    false,
  );
  assert.equal(isStoredGiftProgress(null), false);
});

test("restored progress drops removed wishes and duplicate ids", () => {
  assert.deepEqual(
    [
      ...restoreOpenedWishIds(
        ["a", "a", "removed", "b"],
        ["a", "b", "c"],
      ),
    ],
    ["a", "b"],
  );
});

test("a stored finale flag does not replace the current 70 percent calculation", () => {
  const stored = {
    version: 1 as const,
    openedIds: ["first"],
    finaleUnlocked: true,
  };
  const approvedIds = ["first", "second", "third"];
  const restored = restoreOpenedWishIds(stored.openedIds, approvedIds);

  assert.equal(restored.size >= getFinaleThreshold(approvedIds.length), false);
});
