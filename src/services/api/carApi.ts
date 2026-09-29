import type { Car } from '../../types';
import { isCarArray } from '../../types/guards';
import { request } from './client';

/** GET /cars — every car, validated field by field. */
export function fetchCars(): Promise<Car[]> {
  return request('/cars', isCarArray);
}
