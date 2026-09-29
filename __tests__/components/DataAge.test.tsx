import { dataAgeText } from '../../src/components/DataAge';

const NOW = new Date('2026-09-29T12:00:00.000Z');
const TWO_HOURS_AGO = '2026-09-29T10:00:00.000Z';

describe('dataAgeText', () => {
  it.each([
    ['fresh', 'Updated 2 hours ago'],
    ['refreshing', 'Updated 2 hours ago · checking for updates'],
    ['stale', 'Saved copy · updated 2 hours ago'],
  ] as const)('describes %s data as "%s"', (freshness, expected) => {
    expect(dataAgeText(TWO_HOURS_AGO, freshness, NOW)).toBe(expected);
  });
});
