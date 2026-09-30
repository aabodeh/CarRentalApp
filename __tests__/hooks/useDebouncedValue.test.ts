import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from '../../src/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the old value until the new one has been still for the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 250),
      {
        initialProps: { value: 'a' },
      }
    );

    rerender({ value: 'ab' });
    act(() => {
      jest.advanceTimersByTime(249);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('ab');
  });

  it('restarts the wait on every change', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 250),
      {
        initialProps: { value: 'a' },
      }
    );

    rerender({ value: 'ab' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: 'abc' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(result.current).toBe('abc');
  });
});
