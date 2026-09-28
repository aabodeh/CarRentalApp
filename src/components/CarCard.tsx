import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import {
  durations,
  easings,
  entrance,
  opacity,
  pressScale,
  pressSpring,
  radii,
  spacing,
  stagger,
  typography,
  type ColorTokens,
} from '../theme';
import type { Car } from '../types';
import { formatPrice } from '../utils/formatPrice';

export type CarCardProps = {
  car: Car;
  /** Position in the list. Drives the staggered entrance. */
  index: number;
  onPress: (carId: string) => void;
};

const UNAVAILABLE_TEXT = 'Not available right now';

const TRANSMISSION_LABEL: Record<Car['transmission'], string> = {
  manual: 'Manual',
  automatic: 'Automatic',
};

const FUEL_LABEL: Record<Car['fuel'], string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid',
};

/**
 * What a screen reader says for the card, as one sentence. The price is a plain number, not the
 * Danish-formatted "1.195 kr.", because English TalkBack reads "1.195" as "one point one nine five".
 */
export function carAccessibilityLabel(car: Car): string {
  const parts = [
    `${car.make} ${car.model} ${car.year}`,
    `${car.pricePerDay} kroner per day`,
    car.location,
  ];
  if (!car.available) parts.push(UNAVAILABLE_TEXT.toLowerCase());
  return parts.join(', ');
}

/**
 * A car in the catalogue: photo, name, metadata, price. Pressing opens its details; an unavailable
 * car is dimmed, says so, and cannot be pressed.
 */
export default function CarCard({ car, index, onPress }: CarCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();

  // Only the first wave of cards makes an entrance; see `stagger` in src/theme/motion.ts.
  const animateIn = !reduceMotion && index < stagger.maxItems;
  const progress = useSharedValue(animateIn ? 0 : 1);
  const scale = useSharedValue(1);

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
    // arrives after mount, the `!animateIn` branch snaps the card into place.
  }, [animateIn, index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * entrance.distance }, { scale: scale.get() }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!reduceMotion) scale.set(withSpring(pressScale, pressSpring));
  };

  const handlePressOut = () => {
    if (!reduceMotion) scale.set(withSpring(1, pressSpring));
  };

  const metadata = [
    String(car.year),
    `${car.seats} seats`,
    TRANSMISSION_LABEL[car.transmission],
    FUEL_LABEL[car.fuel],
  ];

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={carAccessibilityLabel(car)}
        accessibilityState={{ disabled: !car.available }}
        disabled={!car.available}
        onPress={() => onPress(car.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <Image
          source={{ uri: car.imageUrl }}
          style={[styles.image, !car.available && styles.imageUnavailable]}
          contentFit="cover"
          transition={reduceMotion ? 0 : durations.base}
          accessible={false}
        />
        <View style={styles.body}>
          <Text style={styles.location}>{car.location}</Text>
          <Text style={[styles.name, !car.available && styles.nameUnavailable]}>
            {car.make} {car.model}
          </Text>
          <View style={styles.metadata}>
            {metadata.map((item) => (
              <Text key={item} style={styles.metadataItem}>
                {item}
              </Text>
            ))}
          </View>
          <View style={styles.footer}>
            {car.available ? (
              <Text style={styles.price}>
                {formatPrice(car.pricePerDay)}
                <Text style={styles.perDay}> / day</Text>
              </Text>
            ) : (
              <Text style={styles.unavailable}>{UNAVAILABLE_TEXT}</Text>
            )}
          </View>
        </View>
      </Pressable>
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
      width: '100%',
      backgroundColor: colors.placeholder,
    },
    imageUnavailable: {
      opacity: opacity.dimmed,
    },
    body: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    location: {
      ...typography.label,
      color: colors.textMuted,
    },
    name: {
      ...typography.title,
      color: colors.text,
    },
    nameUnavailable: {
      color: colors.textMuted,
    },
    metadata: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: spacing.md,
      rowGap: spacing.xs,
    },
    metadataItem: {
      ...typography.label,
      color: colors.textMuted,
    },
    footer: {
      marginTop: spacing.sm,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    price: {
      ...typography.price,
      color: colors.text,
    },
    perDay: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    unavailable: {
      ...typography.body,
      color: colors.textMuted,
    },
  });
