import {
  ALLOWED_VIDEO_MIME_TYPES,
  type VideoConstraints,
} from "./media-constraints.ts";

type ValidVideo = {
  ok: true;
  durationSeconds: number;
  mimeType: (typeof ALLOWED_VIDEO_MIME_TYPES)[number];
  sizeBytes: number;
};

type InvalidVideo = {
  ok: false;
  message: string;
};

export type VideoValidationResult = ValidVideo | InvalidVideo;

type BinaryElement = {
  id: bigint;
  dataStart: number;
  end: number;
};

function isAllowedVideoMimeType(
  value: string,
): value is (typeof ALLOWED_VIDEO_MIME_TYPES)[number] {
  return ALLOWED_VIDEO_MIME_TYPES.includes(
    value as (typeof ALLOWED_VIDEO_MIME_TYPES)[number],
  );
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function readIsoBox(
  view: DataView,
  bytes: Uint8Array,
  offset: number,
  limit: number,
): { type: string; dataStart: number; end: number } | null {
  if (offset + 8 > limit) {
    return null;
  }

  const compactSize = view.getUint32(offset, false);
  const type = readAscii(bytes, offset + 4, 4);
  let headerSize = 8;
  let size = compactSize;

  if (compactSize === 1) {
    if (offset + 16 > limit) {
      return null;
    }

    const extendedSize = view.getBigUint64(offset + 8, false);

    if (extendedSize > BigInt(Number.MAX_SAFE_INTEGER)) {
      return null;
    }

    size = Number(extendedSize);
    headerSize = 16;
  } else if (compactSize === 0) {
    size = limit - offset;
  }

  if (size < headerSize || offset + size > limit) {
    return null;
  }

  return {
    type,
    dataStart: offset + headerSize,
    end: offset + size,
  };
}

function parseMovieHeaderDuration(
  view: DataView,
  dataStart: number,
  end: number,
): number | null {
  if (dataStart + 20 > end) {
    return null;
  }

  const version = view.getUint8(dataStart);
  let timescale: number;
  let duration: number;

  if (version === 0) {
    timescale = view.getUint32(dataStart + 12, false);
    duration = view.getUint32(dataStart + 16, false);
  } else if (version === 1 && dataStart + 32 <= end) {
    timescale = view.getUint32(dataStart + 20, false);
    const rawDuration = view.getBigUint64(dataStart + 24, false);

    if (rawDuration > BigInt(Number.MAX_SAFE_INTEGER)) {
      return null;
    }

    duration = Number(rawDuration);
  } else {
    return null;
  }

  if (timescale <= 0 || duration <= 0) {
    return null;
  }

  return duration / timescale;
}

function readIsoDuration(buffer: ArrayBuffer): number | null {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let offset = 0;

  while (offset < bytes.length) {
    const box = readIsoBox(view, bytes, offset, bytes.length);

    if (!box) {
      return null;
    }

    if (box.type === "moov") {
      let childOffset = box.dataStart;

      while (childOffset < box.end) {
        const child = readIsoBox(view, bytes, childOffset, box.end);

        if (!child) {
          return null;
        }

        if (child.type === "mvhd") {
          return parseMovieHeaderDuration(view, child.dataStart, child.end);
        }

        childOffset = child.end;
      }
    }

    offset = box.end;
  }

  return null;
}

function readEbmlVint(
  bytes: Uint8Array,
  offset: number,
  preserveMarker: boolean,
): { length: number; value: bigint; unknown: boolean } | null {
  const first = bytes[offset];

  if (first === undefined || first === 0) {
    return null;
  }

  let length = 1;
  let marker = 0x80;

  while (length <= 8 && (first & marker) === 0) {
    length += 1;
    marker >>= 1;
  }

  if (length > 8 || offset + length > bytes.length) {
    return null;
  }

  let value = BigInt(preserveMarker ? first : first & (marker - 1));

  for (let index = 1; index < length; index += 1) {
    value = (value << BigInt(8)) | BigInt(bytes[offset + index]);
  }

  const unknownValue =
    (BigInt(1) << BigInt(length * 7)) - BigInt(1);

  return {
    length,
    value,
    unknown: !preserveMarker && value === unknownValue,
  };
}

function readEbmlElement(
  bytes: Uint8Array,
  offset: number,
  limit: number,
): BinaryElement | null {
  const id = readEbmlVint(bytes, offset, true);

  if (!id) {
    return null;
  }

  const size = readEbmlVint(bytes, offset + id.length, false);

  if (!size) {
    return null;
  }

  const dataStart = offset + id.length + size.length;
  const end = size.unknown ? limit : dataStart + Number(size.value);

  if (!Number.isSafeInteger(end) || end < dataStart || end > limit) {
    return null;
  }

  return { id: id.value, dataStart, end };
}

function readUnsignedInteger(bytes: Uint8Array, start: number, end: number) {
  if (end <= start || end - start > 8) {
    return null;
  }

  let value = BigInt(0);

  for (let offset = start; offset < end; offset += 1) {
    value = (value << BigInt(8)) | BigInt(bytes[offset]);
  }

  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  return Number(value);
}

function readFloat(view: DataView, start: number, end: number) {
  const length = end - start;

  if (length === 4) {
    return view.getFloat32(start, false);
  }

  if (length === 8) {
    return view.getFloat64(start, false);
  }

  return null;
}

function hasWebmDocType(bytes: Uint8Array, header: BinaryElement): boolean {
  let offset = header.dataStart;

  while (offset < header.end) {
    const child = readEbmlElement(bytes, offset, header.end);

    if (!child) {
      return false;
    }

    if (child.id === BigInt(0x4282)) {
      return readAscii(bytes, child.dataStart, child.end - child.dataStart) === "webm";
    }

    offset = child.end;
  }

  return false;
}

function readWebmInfoDuration(
  bytes: Uint8Array,
  view: DataView,
  info: BinaryElement,
): number | null {
  let offset = info.dataStart;
  let timecodeScale = 1_000_000;
  let duration: number | null = null;

  while (offset < info.end) {
    const child = readEbmlElement(bytes, offset, info.end);

    if (!child) {
      return null;
    }

    if (child.id === BigInt(0x2ad7b1)) {
      timecodeScale =
        readUnsignedInteger(bytes, child.dataStart, child.end) ?? timecodeScale;
    } else if (child.id === BigInt(0x4489)) {
      duration = readFloat(view, child.dataStart, child.end);
    }

    offset = child.end;
  }

  if (!duration || !Number.isFinite(duration) || duration <= 0) {
    return null;
  }

  return (duration * timecodeScale) / 1_000_000_000;
}

function readWebmDuration(buffer: ArrayBuffer): number | null {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const header = readEbmlElement(bytes, 0, bytes.length);

  if (
    !header ||
    header.id !== BigInt(0x1a45dfa3) ||
    !hasWebmDocType(bytes, header)
  ) {
    return null;
  }

  let offset = header.end;

  while (offset < bytes.length) {
    const element = readEbmlElement(bytes, offset, bytes.length);

    if (!element) {
      return null;
    }

    if (element.id === BigInt(0x18538067)) {
      let childOffset = element.dataStart;

      while (childOffset < element.end) {
        const child = readEbmlElement(bytes, childOffset, element.end);

        if (!child) {
          return null;
        }

        if (child.id === BigInt(0x1549a966)) {
          return readWebmInfoDuration(bytes, view, child);
        }

        childOffset = child.end;
      }
    }

    offset = element.end;
  }

  return null;
}

function hasIsoBaseMediaSignature(bytes: Uint8Array): boolean {
  return bytes.length >= 12 && readAscii(bytes, 4, 4) === "ftyp";
}

function hasEbmlSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  );
}

export async function validateVideoFile(
  value: FormDataEntryValue | null,
  constraints: VideoConstraints,
): Promise<VideoValidationResult> {
  if (value === null || typeof value === "string" || value.size <= 0) {
    return { ok: false, message: "Vui lòng chọn một video lời chúc." };
  }

  const mimeType = value.type.toLowerCase();

  if (!isAllowedVideoMimeType(mimeType)) {
    return {
      ok: false,
      message: "Chỉ chấp nhận video MP4, WebM hoặc QuickTime.",
    };
  }

  if (value.size > constraints.maxSizeBytes) {
    return {
      ok: false,
      message: `Video không được vượt quá ${Math.floor(
        constraints.maxSizeBytes / (1024 * 1024),
      )} MB.`,
    };
  }

  const buffer = await value.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let durationSeconds: number | null = null;

  if (mimeType === "video/webm") {
    if (!hasEbmlSignature(bytes)) {
      return {
        ok: false,
        message: "Nội dung tệp không khớp với định dạng WebM.",
      };
    }

    durationSeconds = readWebmDuration(buffer);
  } else {
    if (!hasIsoBaseMediaSignature(bytes)) {
      return {
        ok: false,
        message: "Nội dung tệp không khớp với định dạng MP4 hoặc QuickTime.",
      };
    }

    durationSeconds = readIsoDuration(buffer);
  }

  if (!durationSeconds || !Number.isFinite(durationSeconds)) {
    return {
      ok: false,
      message: "Không thể đọc thời lượng video. Vui lòng chọn tệp khác.",
    };
  }

  if (durationSeconds > constraints.maxDurationSeconds) {
    return {
      ok: false,
      message: `Video không được dài quá ${constraints.maxDurationSeconds} giây.`,
    };
  }

  return {
    ok: true,
    durationSeconds,
    mimeType,
    sizeBytes: value.size,
  };
}
