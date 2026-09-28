import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';

import {
  bookingRepository as defaultRepository,
  type BookingInput,
  type BookingRepository,
} from '../repositories/bookingRepository';
import type { Booking } from '../types';
import { toError } from '../utils/toError';

/** Whether a booking is being created right now. One at a time: see `createBooking`. */
export type CreationState =
  { status: 'idle' } | { status: 'submitting' } | { status: 'error'; error: Error };

export type BookingState = {
  bookings: Booking[];
  creation: CreationState;
};

export type BookingAction =
  | { type: 'create/start' }
  | { type: 'create/success'; booking: Booking }
  | { type: 'create/failure'; error: Error }
  | { type: 'sync/settled'; booking: Booking }
  | { type: 'sync/failed'; bookingId: string };

export const initialBookingState: BookingState = {
  bookings: [],
  creation: { status: 'idle' },
};

/** Pure state transitions, unit-tested without rendering anything. */
export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'create/start':
      return { ...state, creation: { status: 'submitting' } };
    case 'create/success':
      return { bookings: [...state.bookings, action.booking], creation: { status: 'idle' } };
    case 'create/failure':
      return { ...state, creation: { status: 'error', error: action.error } };
    case 'sync/settled':
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.booking.id ? action.booking : booking
        ),
      };
    case 'sync/failed':
      // K2/K3: a booking that failed to sync is kept and shown as failed — never dropped.
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.bookingId ? { ...booking, syncStatus: 'failed' } : booking
        ),
      };
  }
}

export type BookingContextValue = {
  bookings: Booking[];
  creation: CreationState;
  /**
   * Saves a booking (pending), then syncs it in the background. Calling it again while a
   * creation is in flight returns the same promise, so a double tap can never create two.
   */
  createBooking: (input: BookingInput) => Promise<Booking>;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export type BookingProviderProps = {
  children: ReactNode;
  /** Injectable for tests. The app uses the shared repository. */
  repository?: BookingRepository;
};

export function BookingProvider({
  children,
  repository = defaultRepository,
}: BookingProviderProps) {
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);

  // React state updates are asynchronous: two taps in the same frame would both still see
  // `idle`. A ref is read synchronously, so it is what actually blocks the second call.
  const inFlight = useRef<Promise<Booking> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const sync = useCallback(
    (bookingId: string) => {
      repository.syncBooking(bookingId).then(
        (booking) => {
          if (mounted.current) dispatch({ type: 'sync/settled', booking });
        },
        () => {
          if (mounted.current) dispatch({ type: 'sync/failed', bookingId });
        }
      );
    },
    [repository]
  );

  const createBooking = useCallback(
    (input: BookingInput) => {
      if (inFlight.current) {
        return inFlight.current;
      }

      dispatch({ type: 'create/start' });
      const promise = repository.createBooking(input).then(
        (booking) => {
          inFlight.current = null;
          if (mounted.current) dispatch({ type: 'create/success', booking });
          sync(booking.id);
          return booking;
        },
        (thrown: unknown) => {
          inFlight.current = null;
          const error = toError(thrown);
          if (mounted.current) dispatch({ type: 'create/failure', error });
          throw error;
        }
      );
      inFlight.current = promise;
      return promise;
    },
    [repository, sync]
  );

  const value = useMemo(
    () => ({ bookings: state.bookings, creation: state.creation, createBooking }),
    [state.bookings, state.creation, createBooking]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

/** The app's bookings and the action that creates one. Must be inside `<BookingProvider>`. */
export function useBookings(): BookingContextValue {
  const value = useContext(BookingContext);
  if (!value) {
    throw new Error('useBookings must be used inside a <BookingProvider>');
  }
  return value;
}
