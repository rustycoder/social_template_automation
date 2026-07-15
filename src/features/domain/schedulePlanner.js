/**
 * @file features/domain/schedulePlanner.js
 * @description Pure helpers that spread posts across weekdays and time slots.
 */

/** @type {{ id: number, label: string, short: string }[]} */
export const WEEKDAY_OPTIONS = [
  { id: 0, label: 'Sunday', short: 'Sun' },
  { id: 1, label: 'Monday', short: 'Mon' },
  { id: 2, label: 'Tuesday', short: 'Tue' },
  { id: 3, label: 'Wednesday', short: 'Wed' },
  { id: 4, label: 'Thursday', short: 'Thu' },
  { id: 5, label: 'Friday', short: 'Fri' },
  { id: 6, label: 'Saturday', short: 'Sat' },
];

/** Platforms offered in Schedule All (subset of SAVE_PLATFORMS). */
export const SCHEDULE_ALL_PLATFORMS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
];

const DEFAULT_SLOT_PRESETS = {
  1: ['09:00'],
  2: ['09:00', '17:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '16:00', '20:00'],
};

/**
 * @param {number} frequency
 * @returns {string[]} HH:mm strings
 */
export function defaultSlotsForFrequency(frequency) {
  const n = Math.max(1, Math.floor(Number(frequency)) || 1);
  if (DEFAULT_SLOT_PRESETS[n]) return [...DEFAULT_SLOT_PRESETS[n]];

  const slots = [];
  for (let i = 0; i < n; i += 1) {
    const hour = Math.min(23, Math.floor((8 + (i * 12) / Math.max(1, n - 1))));
    slots.push(`${String(hour).padStart(2, '0')}:00`);
  }
  return slots;
}

/**
 * @param {string} ymd YYYY-MM-DD
 * @returns {{ y: number, m: number, d: number } | null}
 */
function parseYmd(ymd) {
  if (typeof ymd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  return { y, m, d };
}

/**
 * @param {string} hm HH:mm
 * @returns {{ hours: number, minutes: number } | null}
 */
function parseHm(hm) {
  if (typeof hm !== 'string' || !/^\d{1,2}:\d{2}$/.test(hm)) return null;
  const [hours, minutes] = hm.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

/**
 * Local calendar date components for a Date.
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
export function toLocalYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {string} ymd
 * @param {string} hm
 * @returns {Date | null}
 */
function localDateTime(ymd, hm) {
  const day = parseYmd(ymd);
  const time = parseHm(hm);
  if (!day || !time) return null;
  return new Date(day.y, day.m - 1, day.d, time.hours, time.minutes, 0, 0);
}

/**
 * Advance YYYY-MM-DD by one calendar day (local).
 * @param {string} ymd
 * @returns {string}
 */
function nextYmd(ymd) {
  const day = parseYmd(ymd);
  if (!day) return ymd;
  const dt = new Date(day.y, day.m - 1, day.d);
  dt.setDate(dt.getDate() + 1);
  return toLocalYmd(dt);
}

/**
 * @param {string} ymd
 * @returns {number} 0=Sun … 6=Sat
 */
function weekdayOfYmd(ymd) {
  const day = parseYmd(ymd);
  if (!day) return -1;
  return new Date(day.y, day.m - 1, day.d).getDay();
}

/**
 * Assign local Date objects for each post using start date, allowed weekdays, and daily slots.
 * Past slots on the start day (relative to `now`) are skipped.
 *
 * @param {object} opts
 * @param {number} opts.count Number of posts to schedule.
 * @param {string} opts.startDate YYYY-MM-DD
 * @param {number[]} opts.weekdays Allowed day-of-week ids (0=Sun … 6=Sat).
 * @param {string[]} opts.slots HH:mm strings in order for each allowed day.
 * @param {Date} [opts.now]
 * @returns {Date[]}
 */
export function planSchedules({ count, startDate, weekdays, slots, now = new Date() }) {
  const total = Math.max(0, Math.floor(Number(count)) || 0);
  if (total === 0) return [];

  const allowed = new Set(
    (Array.isArray(weekdays) ? weekdays : [])
      .map((d) => Number(d))
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  );
  const slotList = (Array.isArray(slots) ? slots : [])
    .map((s) => String(s).trim())
    .filter((s) => parseHm(s));

  if (allowed.size === 0 || slotList.length === 0 || !parseYmd(startDate)) {
    throw new Error('Invalid schedule plan inputs');
  }

  const sortedSlots = [...slotList].sort((a, b) => {
    const pa = parseHm(a);
    const pb = parseHm(b);
    return pa.hours * 60 + pa.minutes - (pb.hours * 60 + pb.minutes);
  });

  const results = [];
  let cursor = startDate;
  let guard = 0;
  const maxDays = Math.max(total * 7, 366) + 14;

  while (results.length < total && guard < maxDays) {
    guard += 1;
    const dow = weekdayOfYmd(cursor);
    if (!allowed.has(dow)) {
      cursor = nextYmd(cursor);
      continue;
    }

    const isStartDay = cursor === startDate;
    for (const hm of sortedSlots) {
      if (results.length >= total) break;
      const when = localDateTime(cursor, hm);
      if (!when) continue;
      if (isStartDay && when.getTime() <= now.getTime()) continue;
      results.push(when);
    }

    cursor = nextYmd(cursor);
  }

  if (results.length < total) {
    throw new Error('Could not assign schedule times for all posts');
  }

  return results;
}

/**
 * @param {Date[]} dates
 * @returns {{ firstLabel: string, lastLabel: string, daySpan: number } | null}
 */
export function summarizeSchedule(dates) {
  if (!Array.isArray(dates) || dates.length === 0) return null;

  const first = dates[0];
  const last = dates[dates.length - 1];
  const fmt = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const startDay = new Date(first.getFullYear(), first.getMonth(), first.getDate());
  const endDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const daySpan = Math.round((endDay - startDay) / 86400000) + 1;

  return {
    firstLabel: fmt.format(first),
    lastLabel: fmt.format(last),
    daySpan,
  };
}
