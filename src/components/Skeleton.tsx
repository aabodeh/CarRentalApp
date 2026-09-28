import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { easings, radii, shimmer, spacing, type ColorTokens } from '../theme';

/**
 * A card-shaped placeholder shown while cars load. It pulses so the screen reads as "working",
 * and stays still when the user has asked for reduced motion.
 *
 * Hidden from screen readers: the list announces "Loading cars" once, instead of three blank cards.
 */
export default function Skeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      opacity.set(1);
      return;
    }
    opacity.set(
      withRepeat(
        withTiming(shimmer.minOpacity, {
          duration: shimmer.duration,
          easing: Easing.bezier(...easings.standard),
        }),
        -1,
        true
      )
    );
    return () => cancelAnimation(opacity);
  }, [reduceMotion, opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={[styles.card, pulse]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.image} />
      <View style={styles.body}>
        <View style={[styles.line, styles.lineShort]} />
        <View style={[styles.line, styles.lineTitle]} />
        <View style={[styles.line, styles.lineMedium]} />
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      borderRadius: radii.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
    },
    image: {
      aspectRatio: 4 / 3,
      backgroundColor: colors.placeholder,
    },
    body: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    line: {
      height: spacing.md,
      borderRadius: radii.sm,
      backgroundColor: colors.placeholder,
    },
    lineShort: { width: '30%' },
    lineTitle: { width: '70%', height: spacing.xl },
    lineMedium: { width: '50%' },
  });
