/** The app's reference time zone: displayed dates follow Romanian time. */
export const APP_TIME_ZONE = 'Europe/Bucharest';

/** A calendar day as `YYYY-MM-DD`. */
export type CalendarDay = string;

const HOUR_MS = 60 * 60 * 1000;
const ROMANIA_WINTER_OFFSET_HOURS = 2; // EET
const ROMANIA_SUMMER_OFFSET_HOURS = 3; // EEST

/** EU summer time switches at 01:00 UTC on the last Sunday of the month. */
const lastSundayAt0100Utc = (year: number, monthIndex: number) => {
  const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0, 1));
  return lastDayOfMonth.getTime() - lastDayOfMonth.getUTCDay() * 24 * HOUR_MS;
};

const MARCH = 2;
const OCTOBER = 9;

const romaniaOffsetHours = (date: Date) => {
  const year = date.getUTCFullYear();
  const time = date.getTime();
  const isSummerTime =
    time >= lastSundayAt0100Utc(year, MARCH) && time < lastSundayAt0100Utc(year, OCTOBER);
  return isSummerTime ? ROMANIA_SUMMER_OFFSET_HOURS : ROMANIA_WINTER_OFFSET_HOURS;
};

/**
 * `YYYY-MM-DD` of `date` in Romanian time, independent of the phone's time zone.
 * Computed from the EU daylight-saving rule instead of `Intl` time zones, which
 * not every JavaScript engine build supports.
 */
export const toCalendarDay = (date: Date = new Date()): CalendarDay =>
  new Date(date.getTime() + romaniaOffsetHours(date) * HOUR_MS).toISOString().slice(0, 10);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const isCalendarDay = (value: string): value is CalendarDay => DAY_PATTERN.test(value);

/** `2026-09-27` → `27 Sep 2026` (no `Intl`, see `toCalendarDay`). */
export const formatCalendarDay = (day: CalendarDay) => {
  const match = DAY_PATTERN.exec(day);
  if (!match) return day;
  const [, year, month, date] = match;
  return `${Number(date)} ${MONTH_NAMES[Number(month) - 1] ?? month} ${year}`;
};
