import { cars } from '../../src/data/dummy/cars';
import { isBooking, isBookingArray, isCar, isCarArray } from '../../src/types/guards';

const booking = {
  id: 'booking-1',
  carId: 'car-05',
  renterName: 'Mette',
  renterEmail: 'mette@example.dk',
  startDate: '2026-10-01',
  endDate: '2026-10-03',
  totalPrice: 1498,
  createdAt: '2026-09-28T08:00:00.000Z',
  syncStatus: 'pending',
};

describe('isCar', () => {
  it.each(cars.map((car) => [car.id, car] as const))('accepts dummy car %s', (_id, car) => {
    expect(isCar(car)).toBe(true);
  });

  it.each([
    ['null', null],
    ['a string', 'car'],
    ['an array', []],
    ['a missing field', { ...cars[0], pricePerDay: undefined }],
    ['a number sent as a string', { ...cars[0], pricePerDay: '749' }],
    ['an unknown fuel', { ...cars[0], fuel: 'steam' }],
    ['an unknown transmission', { ...cars[0], transmission: 'cvt' }],
    ['a non-boolean availability', { ...cars[0], available: 'yes' }],
    ['a non-finite price', { ...cars[0], pricePerDay: Number.NaN }],
  ])('rejects %s', (_label, value) => {
    expect(isCar(value)).toBe(false);
  });

  it('accepts extra fields a server may add, like createdAt', () => {
    expect(isCar({ ...cars[0], createdAt: '2026-01-01' })).toBe(true);
  });
});

describe('isCarArray', () => {
  it('accepts a list of cars and an empty list', () => {
    expect(isCarArray(cars)).toBe(true);
    expect(isCarArray([])).toBe(true);
  });

  it('rejects a list with one bad car in it', () => {
    expect(isCarArray([...cars, { id: 'x' }])).toBe(false);
  });

  it('rejects something that is not a list', () => {
    expect(isCarArray({ items: cars })).toBe(false);
  });
});

describe('isBooking', () => {
  it('accepts a complete booking', () => {
    expect(isBooking(booking)).toBe(true);
    expect(isBookingArray([booking])).toBe(true);
  });

  it.each([
    ['an unknown sync status', { ...booking, syncStatus: 'queued' }],
    ['a missing renter email', { ...booking, renterEmail: undefined }],
    ['a price sent as a string', { ...booking, totalPrice: '1498' }],
  ])('rejects %s', (_label, value) => {
    expect(isBooking(value)).toBe(false);
  });
});
