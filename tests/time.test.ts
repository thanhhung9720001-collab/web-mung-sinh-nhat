import assert from "node:assert/strict";
import test from "node:test";
import {
  getCountdownParts,
  getScheduleState,
  parseInstant,
} from "../src/lib/time.ts";

const schedule = {
  contributionsCloseAt: new Date("2026-09-15T23:59:00+07:00"),
  giftOpensAt: new Date("2026-09-17T00:00:00+07:00"),
};

test("schedule changes exactly at the configured instants", () => {
  assert.equal(
    getScheduleState("2026-09-15T23:58:59.999+07:00", schedule),
    "accepting-contributions",
  );
  assert.equal(
    getScheduleState("2026-09-15T23:59:00+07:00", schedule),
    "contributions-closed",
  );
  assert.equal(
    getScheduleState("2026-09-17T00:00:00+07:00", schedule),
    "gift-open",
  );
});

test("countdown clamps at zero and carries units correctly", () => {
  assert.deepEqual(
    getCountdownParts("2026-09-17T00:00:00+07:00", "2026-09-15T22:58:59+07:00"),
    {
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1,
      totalMilliseconds: 90_061_000,
      isComplete: false,
    },
  );
  assert.equal(
    getCountdownParts("2026-09-17T00:00:00+07:00", "2026-09-17T00:00:01+07:00").isComplete,
    true,
  );
});

test("timestamps require an explicit UTC offset", () => {
  assert.equal(
    parseInstant("2026-09-17T00:00:00+07:00").toISOString(),
    "2026-09-16T17:00:00.000Z",
  );
  assert.throws(() => parseInstant("2026-09-17T00:00:00"), RangeError);
});
