import type { Car } from '../types';
import { isCarArray } from '../types/guards';
import { readJson, writeJson } from './keyValueStore';

/** K1: the last car list fetched from the API, and when. Key: `carrental.v1.cars`. */
export const carCache = {
  async read(): Promise<{ cars: Car[]; fetchedAt: string } | null> {
    const stored = await readJson('cars', isCarArray);
    return stored ? { cars: stored.data, fetchedAt: stored.savedAt } : null;
  },

  write(cars: Car[], fetchedAt: Date = new Date()): Promise<void> {
    return writeJson('cars', cars, fetchedAt);
  },
};
