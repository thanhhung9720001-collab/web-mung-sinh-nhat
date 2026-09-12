export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh" as const;
export const APP_LOCALE = "vi-VN" as const;

export const DEFAULT_CONTRIBUTIONS_CLOSE_AT =
  "2026-09-15T23:59:00+07:00" as const;
export const DEFAULT_GIFT_OPENS_AT = "2026-09-17T00:00:00+07:00" as const;

const EXPLICIT_OFFSET_PATTERN = /(z|[+-]\d{2}:\d{2})$/i;

export type DateInput = Date | number | string;

export type ScheduleState =
  | "accepting-contributions"
  | "contributions-closed"
  | "gift-open";

export interface AppSchedule {
  contributionsCloseAt: Date;
  giftOpensAt: Date;
}

export interface ScheduleEnvironment {
  APP_TIME_ZONE?: string;
  CONTRIBUTIONS_CLOSE_AT?: string;
  GIFT_OPENS_AT?: string;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMilliseconds: number;
  isComplete: boolean;
}

export interface AppDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function toValidDate(input: DateInput, label = "date"): Date {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`${label} không phải là ngày giờ hợp lệ.`);
  }

  return date;
}

export function parseInstant(value: string, label = "date"): Date {
  if (!EXPLICIT_OFFSET_PATTERN.test(value)) {
    throw new RangeError(
      `${label} phải là ISO 8601 có UTC offset, ví dụ 2026-09-17T00:00:00+07:00.`,
    );
  }

  return toValidDate(value, label);
}

export function getAppSchedule(
  env: ScheduleEnvironment = {
    APP_TIME_ZONE: process.env.APP_TIME_ZONE,
    CONTRIBUTIONS_CLOSE_AT: process.env.CONTRIBUTIONS_CLOSE_AT,
    GIFT_OPENS_AT: process.env.GIFT_OPENS_AT,
  },
): AppSchedule {
  const configuredTimeZone = env.APP_TIME_ZONE ?? APP_TIME_ZONE;

  if (configuredTimeZone !== APP_TIME_ZONE) {
    throw new RangeError(`APP_TIME_ZONE phải là ${APP_TIME_ZONE}.`);
  }

  const contributionsCloseAt = parseInstant(
    env.CONTRIBUTIONS_CLOSE_AT ?? DEFAULT_CONTRIBUTIONS_CLOSE_AT,
    "CONTRIBUTIONS_CLOSE_AT",
  );
  const giftOpensAt = parseInstant(
    env.GIFT_OPENS_AT ?? DEFAULT_GIFT_OPENS_AT,
    "GIFT_OPENS_AT",
  );

  if (giftOpensAt.getTime() <= contributionsCloseAt.getTime()) {
    throw new RangeError(
      "GIFT_OPENS_AT phải diễn ra sau CONTRIBUTIONS_CLOSE_AT.",
    );
  }

  return { contributionsCloseAt, giftOpensAt };
}

export function formatAppDateTime(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "long",
    timeStyle: "short",
  },
): string {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    ...options,
    timeZone: APP_TIME_ZONE,
  }).format(toValidDate(input));
}

export function getAppDateParts(input: DateInput): AppDateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(toValidDate(input));

  const values = new Map(parts.map((part) => [part.type, part.value]));
  const readNumber = (key: Intl.DateTimeFormatPartTypes) =>
    Number(values.get(key));

  return {
    year: readNumber("year"),
    month: readNumber("month"),
    day: readNumber("day"),
    hour: readNumber("hour"),
    minute: readNumber("minute"),
    second: readNumber("second"),
  };
}

export function getScheduleState(
  now: DateInput = Date.now(),
  schedule: AppSchedule = getAppSchedule(),
): ScheduleState {
  const currentTime = toValidDate(now, "now").getTime();

  if (currentTime >= schedule.giftOpensAt.getTime()) {
    return "gift-open";
  }

  if (currentTime >= schedule.contributionsCloseAt.getTime()) {
    return "contributions-closed";
  }

  return "accepting-contributions";
}

export function getCurrentScheduleState(
  schedule: AppSchedule = getAppSchedule(),
): ScheduleState {
  return getScheduleState(Date.now(), schedule);
}

export function getCountdownParts(
  target: DateInput,
  now: DateInput = Date.now(),
): CountdownParts {
  const targetTime = toValidDate(target, "target").getTime();
  const currentTime = toValidDate(now, "now").getTime();
  const totalMilliseconds = Math.max(0, targetTime - currentTime);
  const totalSeconds = Math.ceil(totalMilliseconds / 1000);

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    totalMilliseconds,
    isComplete: totalMilliseconds === 0,
  };
}
