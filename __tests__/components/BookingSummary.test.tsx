import { render, screen } from '@testing-library/react-native';

import BookingSummary from '../../src/components/BookingSummary';
import { formatPrice } from '../../src/utils/formatPrice';

describe('BookingSummary', () => {
  it('shows the day count, the day rate and the total', () => {
    render(<BookingSummary pricePerDay={749} startDate="2026-10-01" endDate="2026-10-03" />);

    expect(screen.getByText(`2 days × ${formatPrice(749)}`)).toBeTruthy();
    expect(screen.getByText(formatPrice(1498))).toBeTruthy();
    expect(
      screen.getByLabelText('Total 1498 kroner, for 2 days at 749 kroner per day')
    ).toBeTruthy();
  });

  it('counts a same-day rental as one day and says so', () => {
    render(<BookingSummary pricePerDay={749} startDate="2026-10-01" endDate="2026-10-01" />);

    expect(screen.getByText(`1 day × ${formatPrice(749)}`)).toBeTruthy();
    expect(screen.getByText('Same-day return counts as 1 day.')).toBeTruthy();
  });

  it('asks for valid dates instead of showing a price when the range is reversed', () => {
    render(<BookingSummary pricePerDay={749} startDate="2026-10-03" endDate="2026-10-01" />);

    expect(screen.getByText('Choose a return date on or after the pick-up date.')).toBeTruthy();
    expect(screen.queryByText('Total')).toBeNull();
  });
});
