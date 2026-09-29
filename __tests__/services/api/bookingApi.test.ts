import { postBooking } from '../../../src/services/api/bookingApi';
import { ApiPayloadError } from '../../../src/services/api/client';
import { apiConfig } from '../../../src/services/api/config';
import type { Booking } from '../../../src/types';

const booking: Booking = {
  id: 'booking-local-1',
  carId: '5',
  renterName: 'Mette',
  renterEmail: 'mette@example.dk',
  startDate: '2026-10-01',
  endDate: '2026-10-03',
  totalPrice: 1498,
  createdAt: '2026-09-28T08:00:00.000Z',
  syncStatus: 'pending',
};

describe('postBooking', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(apiConfig, 'baseUrl').mockReturnValue('https://api.test/v1');
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POSTs the booking with our local id as clientBookingId, and returns the server id', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: '17', clientBookingId: booking.id }),
    } as unknown as Response);

    await expect(postBooking(booking)).resolves.toEqual({ remoteId: '17' });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.test/v1/bookings');
    expect(init.method).toBe('POST');
    const sent = JSON.parse(init.body);
    expect(sent).toMatchObject({
      carId: '5',
      clientBookingId: 'booking-local-1',
      totalPrice: 1498,
    });
    expect(sent).not.toHaveProperty('syncStatus');
    expect(sent).not.toHaveProperty('id');
  });

  it('rejects a reply without an id', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    } as unknown as Response);

    await expect(postBooking(booking)).rejects.toThrow(ApiPayloadError);
  });
});
