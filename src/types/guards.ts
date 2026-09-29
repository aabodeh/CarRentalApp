import type { Booking, SyncStatus } from './booking';
import type { Car, Fuel, Transmission } from './car';

/**
 * Runtime checks that unknown data really has the shape of our domain types. Used wherever data
 * crosses into the app from outside TypeScript's reach: API responses and AsyncStorage.
 *
 * Hand-written on purpose (no schema library): they are small, and each one mirrors a type in
 * this folder field by field, so a reviewer can check them against the class diagram.
 * Extra fields are allowed — a server may add `createdAt` — but every field we use must be present
 * with the right type.
 */

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const TRANSMISSIONS: readonly Transmission[] = ['manual', 'automatic'];
const FUELS: readonly Fuel[] = ['petrol', 'diesel', 'electric', 'hybrid'];
const SYNC_STATUSES: readonly SyncStatus[] = ['pending', 'failed', 'completed'];

const isOneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  isString(value) && (options as readonly string[]).includes(value);

export function isCar(value: unknown): value is Car {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.make) &&
    isString(value.model) &&
    isNumber(value.year) &&
    isString(value.imageUrl) &&
    isNumber(value.pricePerDay) &&
    isNumber(value.seats) &&
    isOneOf(TRANSMISSIONS, value.transmission) &&
    isOneOf(FUELS, value.fuel) &&
    isString(value.location) &&
    typeof value.available === 'boolean'
  );
}

export function isCarArray(value: unknown): value is Car[] {
  return Array.isArray(value) && value.every(isCar);
}

export function isBooking(value: unknown): value is Booking {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.carId) &&
    isString(value.renterName) &&
    isString(value.renterEmail) &&
    isString(value.startDate) &&
    isString(value.endDate) &&
    isNumber(value.totalPrice) &&
    isString(value.createdAt) &&
    isOneOf(SYNC_STATUSES, value.syncStatus)
  );
}

export function isBookingArray(value: unknown): value is Booking[] {
  return Array.isArray(value) && value.every(isBooking);
}
