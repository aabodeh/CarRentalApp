import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { durations, easings, entrance, stagger } from '../theme';
import { useReducedMotion } from './useReducedMotion';

/**
 * The staggered fade-and-rise used when content first appears (list cards, details sections).
 * Only the first `stagger.maxItems` animate; later ones appear in place. With reduce motion on,
 * nothing animates. Returns a Reanimated style for an `Animated.View`.
 */
export function useEntrance(index: number) {
  const reduceMotion = useReducedMotion();
  const animateIn = !reduceMotion && index < stagger.maxItems;
  const progress = useSharedValue(animateIn ? 0 : 1);

  useEffect(() => {
    if (!animateIn) {
      progress.set(1);
      return;
    }
    progress.set(
      withDelay(
        index * stagger.step,
        withTiming(1, { duration: durations.slow, easing: Easing.bezier(...easings.enter) })
      )
    );
    // Re-running is harmless: animating to 1 from 1 does nothing. And if the reduce-motion answer
    // arrives after mount, the `!animateIn` branch snaps the content into place.
  }, [animateIn, index, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * entrance.distance }],
  }));
}
