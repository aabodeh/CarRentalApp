import { useCallback, useMemo, useState } from 'react';

import { inputDebounce } from '../theme';
import type { Car, Fuel, Transmission } from '../types';
import { FUEL_LABEL, TRANSMISSION_LABEL } from '../utils/carLabels';
import { filterCars, isEmptyFilter, type CarFilter } from '../utils/filterCars';
import { useDebouncedValue } from './useDebouncedValue';

export type UseCarFiltersResult = {
  /** What is in the search field right now (not yet debounced). */
  query: string;
  setQuery: (query: string) => void;
  fuels: ReadonlySet<Fuel>;
  toggleFuel: (fuel: Fuel) => void;
  transmissions: ReadonlySet<Transmission>;
  toggleTransmission: (transmission: Transmission) => void;
  /** Only the values some car in the list has, so no chip can only ever lead to nothing. */
  fuelOptions: Fuel[];
  transmissionOptions: Transmission[];
  /** The cars that pass the filter. */
  results: Car[];
  isFiltering: boolean;
  clear: () => void;
};

const ALL_FUELS = Object.keys(FUEL_LABEL) as Fuel[];
const ALL_TRANSMISSIONS = Object.keys(TRANSMISSION_LABEL) as Transmission[];

const toggled = <T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

/**
 * Search and filter chips for the car list. UI state only: the repository and its cache always
 * hold the whole list, and filtering happens here, on what the list already has.
 *
 * Typing is debounced (`inputDebounce`). Clearing is not: an empty search applies at once.
 */
export function useCarFilters(cars: readonly Car[]): UseCarFiltersResult {
  const [query, setQuery] = useState('');
  const [fuels, setFuels] = useState<ReadonlySet<Fuel>>(() => new Set());
  const [transmissions, setTransmissions] = useState<ReadonlySet<Transmission>>(() => new Set());
  const debouncedQuery = useDebouncedValue(query, inputDebounce.ms);

  const filter: CarFilter = useMemo(
    () => ({ query: query.trim() === '' ? '' : debouncedQuery, fuels, transmissions }),
    [query, debouncedQuery, fuels, transmissions]
  );

  const results = useMemo(() => filterCars(cars, filter), [cars, filter]);
  const fuelOptions = useMemo(
    () => ALL_FUELS.filter((fuel) => cars.some((car) => car.fuel === fuel)),
    [cars]
  );
  const transmissionOptions = useMemo(
    () => ALL_TRANSMISSIONS.filter((value) => cars.some((car) => car.transmission === value)),
    [cars]
  );

  const toggleFuel = useCallback((fuel: Fuel) => setFuels((current) => toggled(current, fuel)), []);
  const toggleTransmission = useCallback(
    (value: Transmission) => setTransmissions((current) => toggled(current, value)),
    []
  );
  const clear = useCallback(() => {
    setQuery('');
    setFuels(new Set());
    setTransmissions(new Set());
  }, []);

  return {
    query,
    setQuery,
    fuels,
    toggleFuel,
    transmissions,
    toggleTransmission,
    fuelOptions,
    transmissionOptions,
    results,
    isFiltering: !isEmptyFilter(filter),
    clear,
  };
}
