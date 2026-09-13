import assert from "node:assert/strict";
import test from "node:test";
import { validateRequiredContributionFields } from "../src/lib/contribution-validation.ts";

function createTextContribution(overrides: Record<string, string> = {}) {
  const values = {
    senderName: "Bạn Mây",
    contentType: "text",
    message: "Chúc Bé Heo sinh nhật vui vẻ!",
    consent: "accepted",
    ...overrides,
  };
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

test("valid text wish passes required field validation", () => {
  assert.deepEqual(
    validateRequiredContributionFields(createTextContribution()),
    {},
  );
});

test("missing name, message and consent return field-specific errors", () => {
  const errors = validateRequiredContributionFields(
    createTextContribution({ senderName: " ", message: "", consent: "" }),
  );

  assert.ok(errors.senderName);
  assert.ok(errors.message);
  assert.ok(errors.consent);
});

test("overlong name and message are rejected", () => {
  const errors = validateRequiredContributionFields(
    createTextContribution({
      senderName: "a".repeat(81),
      message: "b".repeat(5_001),
    }),
  );

  assert.match(errors.senderName ?? "", /80/);
  assert.match(errors.message ?? "", /5\.000/);
});

test("video choice requires a selected file", () => {
  const errors = validateRequiredContributionFields(
    createTextContribution({ contentType: "video", message: "" }),
  );

  assert.ok(errors.video);
});

test("unknown content type is rejected", () => {
  const errors = validateRequiredContributionFields(
    createTextContribution({ contentType: "audio" }),
  );

  assert.ok(errors.contentType);
});
