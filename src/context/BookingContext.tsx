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
import { AppState } from 'react-native';

import { useNetworkStatus } from '../hooks/useNetworkStatus';
import {
  bookingRepository as defaultRepository,
  type BookingInput,
  type BookingRepository,
  type StoredBooking,
} from '../repositories/bookingRepository';
import { createSyncQueue, type SyncQueue } from '../repositories/syncQueue';
import { toError } from '../utils/toError';

/** Whether a booking is being created right now. One at a time: see `createBooking`. */
export type CreationState =
  { status: 'idle' } | { status: 'submitting' } | { status: 'error'; error: Error };

/** Whether the saved bookings have been read from the phone yet. */
export type LoadState =
  { status: 'loading' } | { status: 'ready' } | { status: 'error'; error: Error };

export type BookingState = {
  records: StoredBooking[];
  load: LoadState;
  creation: CreationState;
  /** A booking that just reached the server after at least one failed attempt (K3 notice). */
  notice: StoredBooking | null;
};

export type BookingAction =
  | { type: 'records/loading' }
  | { type: 'records/loaded'; records: StoredBooking[] }
  | { type: 'records/failed'; error: Error }
  | { type: 'create/start' }
  | { type: 'create/success'; record: StoredBooking }
  | { type: 'create/failure'; error: Error }
  | { type: 'record/updated'; record: StoredBooking }
  | { type: 'notice/dismissed' };

export const initialBookingState: BookingState = {
  records: [],
  load: { status: 'loading' },
  creation: { status: 'idle' },
  notice: null,
};

const upsert = (records: StoredBooking[], record: StoredBooking) =>
  records.some((candidate) => candidate.booking.id === record.booking.id)
    ? records.map((candidate) => (candidate.booking.id === record.booking.id ? record : candidate))
    : [...records, record];

/** Succeeded now, after at least one earlier attempt had failed: the user must be told. */
const succeededAfterRetry = (record: StoredBooking) =>
  record.booking.syncStatus === 'completed' && record.sync.attempts > 1;

/** Pure state transitions, unit-tested without rendering anything. */
export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'records/loading':
      return { ...state, load: { status: 'loading' } };
    case 'records/loaded': {
      // Anything created since launch is kept alongside the saved bookings.
      const merged = state.records.reduce(upsert, action.records);
      return { ...state, records: merged, load: { status: 'ready' } };
    }
    case 'records/failed':
      return { ...state, load: { status: 'error', error: action.error } };
    case 'create/start':
      return { ...state, creation: { status: 'submitting' } };
    case 'create/success':
      return {
        ...state,
        records: upsert(state.records, action.record),
        creation: { status: 'idle' },
      };
    case 'create/failure':
      return { ...state, creation: { status: 'error', error: action.error } };
    case 'record/updated':
      return {
        ...state,
        records: upsert(state.records, action.record),
        notice: succeededAfterRetry(action.record) ? action.record : state.notice,
      };
    case 'notice/dismissed':
      return { ...state, notice: null };
  }
}

export type BookingContextValue = {
  /** Every booking on this phone, with its sync state and retry bookkeeping. */
  records: StoredBooking[];
  load: LoadState;
  creation: CreationState;
  notice: StoredBooking | null;
  /**
   * Saves a booking on the phone (pending), then the queue sends it. Calling it again while a
   * creation is in flight returns the same promise, so a double tap can never create two.
   */
  createBooking: (input: BookingInput) => Promise<StoredBooking>;
  /** The user's "Try again" on a failed booking. */
  retryBooking: (id: string) => void;
  /** Read the saved bookings again after a failed load. */
  reload: () => void;
  dismissNotice: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export type BookingProviderProps = {
  children: ReactNode;
  /** Injectable for tests. The app uses the shared repository. */
  repository?: BookingRepository;
};

/**
 * The app's bookings and the retry queue that sends them (K2), with their status for the UI (K3).
 * The queue is tried again at start (bookings left unsent by a previous session), when the app
 * returns to the foreground, and when the network comes back — plus its own backoff timer.
 */
export function BookingProvider({
  children,
  repository = defaultRepository,
}: BookingProviderProps) {
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);
  const { isOffline } = useNetworkStatus();

  // Refs, because the queue and the listeners live longer than any one render.
  const inFlight = useRef<Promise<StoredBooking> | null>(null);
  const mounted = useRef(true);
  const online = useRef(!isOffline);
  const queue = useRef<SyncQueue | null>(null);

  const load = useCallback(() => {
    dispatch({ type: 'records/loading' });
    repository.getBookings().then(
      (records) => {
        if (!mounted.current) return;
        dispatch({ type: 'records/loaded', records });
        void queue.current?.run({ ignoreSchedule: true });
      },
      (thrown: unknown) => {
        if (mounted.current) dispatch({ type: 'records/failed', error: toError(thrown) });
      }
    );
  }, [repository]);

  useEffect(() => {
    mounted.current = true;
    queue.current = createSyncQueue({
      repository,
      isOnline: () => online.current,
      onSettled: (record) => {
        if (mounted.current) dispatch({ type: 'record/updated', record });
      },
    });
    load();

    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') void queue.current?.run({ ignoreSchedule: true });
    });

    return () => {
      mounted.current = false;
      appState.remove();
      queue.current?.stop();
      queue.current = null;
    };
  }, [repository, load]);

  useEffect(() => {
    const wasOnline = online.current;
    online.current = !isOffline;
    if (!wasOnline && !isOffline) {
      void queue.current?.run({ ignoreSchedule: true });
    }
  }, [isOffline]);

  const createBooking = useCallback(
    (input: BookingInput) => {
      if (inFlight.current) {
        return inFlight.current;
      }

      dispatch({ type: 'create/start' });
      const promise = repository.createBooking(input).then(
        (record) => {
          inFlight.current = null;
          if (mounted.current) dispatch({ type: 'create/success', record });
          void queue.current?.run({ ignoreSchedule: true });
          return record;
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
    [repository]
  );

  const retryBooking = useCallback((id: string) => {
    void queue.current?.retryNow(id);
  }, []);

  const dismissNotice = useCallback(() => dispatch({ type: 'notice/dismissed' }), []);

  const value = useMemo(
    () => ({
      records: state.records,
      load: state.load,
      creation: state.creation,
      notice: state.notice,
      createBooking,
      retryBooking,
      reload: load,
      dismissNotice,
    }),
    [state, createBooking, retryBooking, load, dismissNotice]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

/** The app's bookings and the actions on them. Must be inside `<BookingProvider>`. */
export function useBookings(): BookingContextValue {
  const value = useContext(BookingContext);
  if (!value) {
    throw new Error('useBookings must be used inside a <BookingProvider>');
  }
  return value;
}
