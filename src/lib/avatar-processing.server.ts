import "server-only";

import sharp from "sharp";

export const OPTIMIZED_AVATAR_MIME_TYPE = "image/webp";

export async function optimizeAvatar(file: File): Promise<Blob> {
  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({
      width: 1_024,
      height: 1_024,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  return new Blob([new Uint8Array(output)], {
    type: OPTIMIZED_AVATAR_MIME_TYPE,
  });
}
