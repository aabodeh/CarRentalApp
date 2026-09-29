import { formatRelativeTime } from '../../src/utils/formatRelativeTime';

const NOW = new Date('2026-09-29T12:00:00.000Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

describe('formatRelativeTime', () => {
  it.each([
    ['just now', ago(20_000)],
    ['1 minute ago', ago(MINUTE)],
    ['5 minutes ago', ago(5 * MINUTE + 10_000)],
    ['1 hour ago', ago(HOUR)],
    ['3 hours ago', ago(3 * HOUR)],
    ['yesterday', ago(30 * HOUR)],
    ['4 days ago', ago(4 * 24 * HOUR)],
  ])('says "%s"', (expected, iso) => {
    expect(formatRelativeTime(iso, NOW)).toBe(expected);
  });

  it('says "just now" for a time slightly in the future (clock skew)', () => {
    expect(formatRelativeTime(ago(-5_000), NOW)).toBe('just now');
  });
});
