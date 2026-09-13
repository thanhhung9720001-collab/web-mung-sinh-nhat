import assert from "node:assert/strict";
import test from "node:test";

function relativeLuminance(hex: string): number {
  const channels = hex.match(/[a-f\d]{2}/gi);

  assert.ok(channels);

  const [red, green, blue] = channels.map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: string, second: string): number {
  const light = Math.max(relativeLuminance(first), relativeLuminance(second));
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (light + 0.05) / (dark + 0.05);
}

test("primary gift palette meets WCAG AA contrast for normal text", () => {
  const pairs = [
    ["#f8f0df", "#172238"],
    ["#6f2832", "#f8f0df"],
    ["#e6c98d", "#172238"],
  ] as const;

  for (const [foreground, background] of pairs) {
    assert.ok(
      contrastRatio(foreground, background) >= 4.5,
      `${foreground} on ${background} must reach 4.5:1`,
    );
  }
});
