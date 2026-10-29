// Schedule dates are New York calendar dates, not the viewer's local day.
// Game tip-off timestamps remain UTC and are formatted by the UI.
export function isValidScheduleDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function getNbaScheduleDate(now: Date = new Date()): string {
  const pieces = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const pick = (type: string) => pieces.find((part) => part.type === type)?.value;
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");
  if (!year || !month || !day) throw new Error("Unable to determine NBA schedule date");
  return `${year}-${month}-${day}`;
}

/**
 * Bound public requests to the NBA's supported historical era and a limited
 * future schedule horizon. This avoids spending the free API quota on arbitrary
 * years such as 0001 and 9999.
 */
export function isSupportedScheduleDate(value: string, now: Date = new Date()): boolean {
  if (!isValidScheduleDate(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  const today = Date.parse(`${getNbaScheduleDate(now)}T00:00:00.000Z`);
  return timestamp >= Date.parse("1946-01-01T00:00:00.000Z") &&
    timestamp <= today + 366 * 86_400_000;
}
