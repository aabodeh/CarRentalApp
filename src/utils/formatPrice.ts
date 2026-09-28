const wholeKroner = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
  maximumFractionDigits: 0,
});

const withOre = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
  minimumFractionDigits: 2,
});

/**
 * Formats an amount in DKK the Danish way: `1.195 kr.`, or `1.234,50 kr.` when there are øre.
 * The space before "kr." is non-breaking, so a price never wraps across two lines.
 */
export function formatPrice(amount: number): string {
  return Number.isInteger(amount) ? wholeKroner.format(amount) : withOre.format(amount);
}
