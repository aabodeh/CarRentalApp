import { render, screen } from '@testing-library/react-native';

import BookingQrCode from '../../src/components/BookingQrCode';

describe('BookingQrCode', () => {
  it('is an image named after the booking code, so a screen reader can say what it is', () => {
    render(<BookingQrCode bookingId="booking-mg8xk2lq-1" />);

    expect(screen.getByRole('image', { name: 'QR code for booking MG8XK2LQ-1' })).toBeTruthy();
  });
});
