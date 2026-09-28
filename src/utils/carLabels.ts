import type { Car } from '../types';

/** Display words for a car's enum fields. One place, so the list and the details agree. */
export const TRANSMISSION_LABEL: Record<Car['transmission'], string> = {
  manual: 'Manual',
  automatic: 'Automatic',
};

export const FUEL_LABEL: Record<Car['fuel'], string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid',
};

/** Shown wherever a car cannot be booked. `Car` has no reason field, so this is all we can say. */
export const UNAVAILABLE_TEXT = 'Not available right now';
