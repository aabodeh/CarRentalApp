import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useReducedMotion } from '../../src/hooks/useReducedMotion';

type Listener = (enabled: boolean) => void;

describe('useReducedMotion', () => {
  let listener: Listener | undefined;
  const remove = jest.fn();

  beforeEach(() => {
    listener = undefined;
    remove.mockClear();
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, handler) => {
      listener = handler as unknown as Listener;
      return { remove } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports reduce motion as on when the OS setting is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('reports reduce motion as off when the OS setting is off', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);

    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('updates when the user changes the setting while the app is open', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { result } = renderHook(() => useReducedMotion());
    await waitFor(() => expect(listener).toBeDefined());

    act(() => listener?.(true));

    expect(result.current).toBe(true);
  });

  it('stops listening when the component unmounts', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { unmount } = renderHook(() => useReducedMotion());
    await waitFor(() => expect(listener).toBeDefined());

    unmount();

    expect(remove).toHaveBeenCalled();
  });
});
