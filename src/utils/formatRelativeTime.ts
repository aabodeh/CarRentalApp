const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;

/**
 * How long ago `iso` was, in words: "just now", "5 minutes ago", "yesterday". Used for data age
 * ("Updated 5 minutes ago"), where a rough answer is the useful one.
 */
export function formatRelativeTime(iso: string, now: Date): string {
  const elapsed = now.getTime() - new Date(iso).getTime();

  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return plural(Math.floor(elapsed / MINUTE), 'minute');
  if (elapsed < DAY) return plural(Math.floor(elapsed / HOUR), 'hour');
  if (elapsed < 2 * DAY) return 'yesterday';
  return plural(Math.floor(elapsed / DAY), 'day');
}
