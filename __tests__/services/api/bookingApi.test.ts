import { findBookingByClientId, postBooking } from '../../../src/services/api/bookingApi';
import { ApiPayloadError, ApiStatusError } from '../../../src/services/api/client';
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

  describe('findBookingByClientId', () => {
    const reply = (status: number, body: unknown) =>
      ({ ok: status < 300, status, json: async () => body }) as unknown as Response;

    it('finds a booking the server already has, by exact client id', async () => {
      // MockAPI filters by substring: asking for "booking-1" also returns "booking-12".
      fetchSpy.mockResolvedValue(
        reply(200, [
          { id: '7', clientBookingId: 'booking-12' },
          { id: '3', clientBookingId: 'booking-1' },
        ])
      );

      await expect(findBookingByClientId('booking-1')).resolves.toEqual({ remoteId: '3' });
      expect(fetchSpy.mock.calls[0][0]).toBe(
        'https://api.test/v1/bookings?clientBookingId=booking-1'
      );
    });

    it('ignores a substring match that is not the same booking', async () => {
      fetchSpy.mockResolvedValue(reply(200, [{ id: '7', clientBookingId: 'booking-12' }]));

      await expect(findBookingByClientId('booking-1')).resolves.toBeNull();
    });

    it('reads a 404 as "not on the server", because that is how MockAPI says no match', async () => {
      fetchSpy.mockResolvedValue(reply(404, 'Not found'));

      await expect(findBookingByClientId('booking-1')).resolves.toBeNull();
    });

    it('still reports a real server error', async () => {
      fetchSpy.mockResolvedValue(reply(500, 'boom'));

      await expect(findBookingByClientId('booking-1')).rejects.toBeInstanceOf(ApiStatusError);
    });
  });
});
