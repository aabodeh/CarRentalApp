import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { headerTitleFade, typography, type ColorTokens } from '../theme';

export type FadingHeaderTitleProps = {
  title: string;
  scrollY: SharedValue<number>;
  /** Scroll offset at which the on-page name has fully left the screen. */
  threshold: SharedValue<number>;
};

/**
 * Header title that stays invisible while the car's name is on the page, then fades in as the
 * name scrolls away — so the name is never shown twice. With reduce motion on, it switches
 * instead of fading.
 */
export default function FadingHeaderTitle({ title, scrollY, threshold }: FadingHeaderTitleProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();

  const fade = useAnimatedStyle(() => {
    const end = threshold.get();
    if (reduceMotion) return { opacity: scrollY.get() >= end ? 1 : 0 };
    return {
      opacity: interpolate(scrollY.get(), [end - headerTitleFade.distance, end], [0, 1], 'clamp'),
    };
  });

  return (
    <Animated.Text style={[styles.title, fade]} numberOfLines={1} accessibilityRole="header">
      {title}
    </Animated.Text>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    title: {
      ...typography.button,
      color: colors.text,
    },
  });
