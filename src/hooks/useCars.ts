import { useCallback, useEffect, useState } from 'react';

import { carRepository } from '../repositories/carRepository';
import type { Car } from '../types';
import { toError } from '../utils/toError';

/**
 * Every state the car list can be in. A discriminated union rather than loose booleans, so a
 * screen has to handle each case explicitly — it cannot render a state nobody designed.
 */
export type CarsState =
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry: () => void }
  | { status: 'empty' }
  | { status: 'ready'; cars: Car[] };

export type UseCarsResult = {
  state: CarsState;
  /** Pull-to-refresh. The current list stays on screen while it runs. */
  refresh: () => void;
  /** True while a pull-to-refresh is in flight. Independent of `state`. */
  isRefreshing: boolean;
};

type Request = { attempt: number; kind: 'load' | 'refresh' };

const LOADING: CarsState = { status: 'loading' };

export function useCars(): UseCarsResult {
  const [state, setState] = useState<CarsState>(LOADING);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Changing this object is what triggers a new request, from retry or refresh.
  const [request, setRequest] = useState<Request>({ attempt: 0, kind: 'load' });

  const retry = useCallback(() => {
    setState(LOADING);
    setRequest((previous) => ({ attempt: previous.attempt + 1, kind: 'load' }));
  }, []);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setRequest((previous) => ({ attempt: previous.attempt + 1, kind: 'refresh' }));
  }, []);

  useEffect(() => {
    // Set by the cleanup when the component unmounts or a newer request starts, so a late
    // answer can never overwrite fresher state.
    let cancelled = false;

    carRepository.getCars().then(
      (cars) => {
        if (cancelled) return;
        setState(cars.length > 0 ? { status: 'ready', cars } : { status: 'empty' });
        setIsRefreshing(false);
      },
      (thrown: unknown) => {
        if (cancelled) return;
        setIsRefreshing(false);
        setState((previous) =>
          // A failed refresh keeps what the user already has on screen.
          request.kind === 'refresh' && previous.status !== 'error' && previous.status !== 'loading'
            ? previous
            : { status: 'error', error: toError(thrown), retry }
        );
      }
    );

    return () => {
      cancelled = true;
    };
  }, [request, retry]);

  return { state, refresh, isRefreshing };
}
