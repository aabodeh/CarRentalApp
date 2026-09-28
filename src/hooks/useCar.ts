import { useCallback, useEffect, useState } from 'react';

import { CarNotFoundError, carRepository } from '../repositories/carRepository';
import type { Car } from '../types';
import { toError } from '../utils/toError';

/**
 * Every state a single car can be in. `not-found` is its own status, not a flavour of error:
 * retrying will not make a deleted car appear, so the screen needs a different design for it.
 */
export type CarState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; error: Error; retry: () => void }
  | { status: 'ready'; car: Car };

const LOADING: CarState = { status: 'loading' };

export function useCar(id: string): CarState {
  // The state remembers which id it belongs to, so switching ids shows `loading` straight away
  // instead of briefly showing the previous car.
  const [result, setResult] = useState<{ id: string; state: CarState }>({ id, state: LOADING });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setResult({ id, state: LOADING });
    setAttempt((previous) => previous + 1);
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    carRepository.getCarById(id).then(
      (car) => {
        if (!cancelled) setResult({ id, state: { status: 'ready', car } });
      },
      (thrown: unknown) => {
        if (cancelled) return;
        setResult({
          id,
          state:
            thrown instanceof CarNotFoundError
              ? { status: 'not-found' }
              : { status: 'error', error: toError(thrown), retry },
        });
      }
    );

    return () => {
      cancelled = true;
    };
  }, [id, attempt, retry]);

  return result.id === id ? result.state : LOADING;
}
