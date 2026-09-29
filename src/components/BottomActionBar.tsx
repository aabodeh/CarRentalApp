import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { durations, easings, elevation, spacing, type ColorTokens } from '../theme';

export type BottomActionBarProps = {
  children: ReactNode;
  /**
   * Reports the bar's full height (inset included), so the screen can pad its scroll content
   * by the same amount and the last line is never hidden behind the bar.
   */
  onHeightChange?: (height: number) => void;
};

/**
 * A bar pinned to the bottom of the screen for the primary action. It sits above the home
 * indicator (SafeAreaView adds the bottom inset on top of its own padding), has no fixed height
 * so it grows with large text, and slides up on mount unless reduce motion is on.
 */
export default function BottomActionBar({ children, onHeightChange }: BottomActionBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();

  const height = useSharedValue(0);
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.set(
      reduceMotion
        ? 1
        : withTiming(1, { duration: durations.slow, easing: Easing.bezier(...easings.enter) })
    );
  }, [reduceMotion, progress]);

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * height.get() }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    height.set(event.nativeEvent.layout.height);
    onHeightChange?.(event.nativeEvent.layout.height);
  };

  return (
    <Animated.View style={[styles.container, slide]} onLayout={handleLayout}>
      <SafeAreaView edges={['bottom']} style={styles.bar}>
        {children}
      </SafeAreaView>
    </Animated.View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    bar: {
      ...elevation.raised,
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderColor: colors.hairline,
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
    },
  });
