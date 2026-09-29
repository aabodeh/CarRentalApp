import { Image } from 'expo-image';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { durations, hero, type ColorTokens } from '../theme';

export type CarHeroProps = {
  imageUrl: string;
  /** The details scroll offset, driven on the UI thread. */
  scrollY: SharedValue<number>;
};

/**
 * Full-bleed photo at the top of the details screen. It stretches when pulled down, so no gap
 * opens above it, and zooms in slightly as it scrolls away. Decorative: the name below says what
 * it shows, so it is hidden from screen readers.
 */
export default function CarHero({ imageUrl, scrollY }: CarHeroProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const height = useSharedValue(1);

  const motion = useAnimatedStyle(() => {
    if (reduceMotion) return { transform: [{ translateY: 0 }, { scale: 1 }] };
    const y = scrollY.get();
    const h = Math.max(height.get(), 1);
    if (y < 0) {
      // Pulled down: grow enough to cover the gap, anchored to the top edge.
      return { transform: [{ translateY: y / 2 }, { scale: 1 + -y / h }] };
    }
    const progress = Math.min(y / h, 1);
    return { transform: [{ translateY: 0 }, { scale: 1 + progress * (hero.zoom - 1) }] };
  });

  return (
    <Animated.View
      style={[styles.hero, motion]}
      onLayout={(event) => height.set(event.nativeEvent.layout.height)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={reduceMotion ? 0 : durations.base}
        accessible={false}
      />
    </Animated.View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    hero: {
      width: '100%',
      aspectRatio: 4 / 3,
    },
    image: {
      flex: 1,
      backgroundColor: colors.placeholder,
    },
  });
