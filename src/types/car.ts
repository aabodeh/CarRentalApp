/**
 * Mirrors `Car` in the design document's class diagram. Change the diagram first.
 */

export type Transmission = 'manual' | 'automatic';

export type Fuel = 'petrol' | 'diesel' | 'electric' | 'hybrid';

export type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  imageUrl: string;
  /** Price per rental day in DKK. */
  pricePerDay: number;
  seats: number;
  transmission: Transmission;
  fuel: Fuel;
  /** Pick-up location, e.g. "Odense C". */
  location: string;
  /**
   * Static flag for now. Real availability depends on the requested dates and will become a
   * repository query once the API exists.
   */
  available: boolean;
};
