import { useCallback, useEffect, useRef, useState } from 'react';

import { carRepository, type CarsEvent, type Freshness } from '../repositories/carRepository';
import type { Car } from '../types';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Every state the car list can be in. A discriminated union rather than loose booleans, so a
 * screen has to handle each case explicitly — it cannot render a state nobody designed.
 * `ready` and `empty` say how old the data is and whether it is a saved copy (K1).
 */
export type CarsState =
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry: () => void }
  | { status: 'empty'; fetchedAt: string; freshness: Freshness }
  | { status: 'ready'; cars: Car[]; fetchedAt: string; freshness: Freshness };

export type UseCarsResult = {
  state: CarsState;
  /** Pull-to-refresh. The current list stays on screen while it runs. */
  refresh: () => void;
  /** True while a pull-to-refresh is in flight. Independent of `state`. */
  isRefreshing: boolean;
};

const LOADING: CarsState = { status: 'loading' };

function toState(event: CarsEvent, retry: () => void): CarsState {
  if (event.type === 'error') return { status: 'error', error: event.error, retry };
  const { cars, fetchedAt, freshness } = event.snapshot;
  return cars.length > 0
    ? { status: 'ready', cars, fetchedAt, freshness }
    : { status: 'empty', fetchedAt, freshness };
}

/**
 * The car list, cache first (K1): cached cars appear at once, fresh ones replace them when the
 * API answers, and when the connection comes back the list refreshes by itself.
 */
export function useCars(): UseCarsResult {
  const [state, setState] = useState<CarsState>(LOADING);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mounted = useRef(true);
  const { isOffline } = useNetworkStatus();
  const wasOffline = useRef(isOffline);

  const retry = useCallback(() => {
    setState(LOADING);
    void carRepository.refreshCars();
  }, []);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    carRepository.refreshCars().finally(() => {
      if (mounted.current) setIsRefreshing(false);
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Unsubscribing on unmount is what stops a late answer from updating a screen that is gone.
    const unsubscribe = carRepository.subscribeCars((event) => setState(toState(event, retry)));
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [retry]);

  useEffect(() => {
    if (wasOffline.current && !isOffline) {
      void carRepository.refreshCars();
    }
    wasOffline.current = isOffline;
  }, [isOffline]);

  return { state, refresh, isRefreshing };
}
