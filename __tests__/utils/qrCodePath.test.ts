import { QR_QUIET_ZONE, qrCodePath } from '../../src/utils/qrCodePath';

describe('qrCodePath', () => {
  it('sizes the drawing as the QR modules plus a quiet zone on every side', () => {
    const { size } = qrCodePath('booking-mg8xk2lq-1');

    // The smallest QR code (version 1) is 21 modules wide; versions grow in steps of 4.
    const modules = size - 2 * QR_QUIET_ZONE;
    expect(modules).toBeGreaterThanOrEqual(21);
    expect((modules - 21) % 4).toBe(0);
  });

  it('draws one square per dark module, starting with the top-left finder pattern', () => {
    const { path } = qrCodePath('booking-mg8xk2lq-1');

    // The finder pattern's corner is always dark, so the first square sits just inside the quiet zone.
    expect(path.startsWith(`M${QR_QUIET_ZONE} ${QR_QUIET_ZONE}h1v1h-1z`)).toBe(true);
  });

  it('keeps every square inside the quiet zone', () => {
    const { size, path } = qrCodePath('booking-mg8xk2lq-1');
    const corners = [...path.matchAll(/M(\d+) (\d+)/g)].map((match) => [
      Number(match[1]),
      Number(match[2]),
    ]);

    expect(corners.length).toBeGreaterThan(0);
    for (const [x, y] of corners) {
      expect(x).toBeGreaterThanOrEqual(QR_QUIET_ZONE);
      expect(y).toBeGreaterThanOrEqual(QR_QUIET_ZONE);
      expect(x).toBeLessThan(size - QR_QUIET_ZONE);
      expect(y).toBeLessThan(size - QR_QUIET_ZONE);
    }
  });

  it('draws different codes for different bookings', () => {
    expect(qrCodePath('booking-a-1').path).not.toBe(qrCodePath('booking-b-1').path);
  });
});
