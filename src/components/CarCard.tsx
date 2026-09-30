import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useEntrance } from '../hooks/useEntrance';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import {
  durations,
  opacity,
  pressScale,
  pressSpring,
  radii,
  spacing,
  typography,
  type ColorTokens,
} from '../theme';
import type { Car } from '../types';
import { FUEL_LABEL, TRANSMISSION_LABEL, UNAVAILABLE_TEXT } from '../utils/carLabels';
import { formatPrice } from '../utils/formatPrice';
import FavouriteButton from './FavouriteButton';

export type CarCardProps = {
  car: Car;
  /** Position in the list. Drives the staggered entrance. */
  index: number;
  onPress: (carId: string) => void;
  /** Whether the car is saved. Only used together with `onToggleSaved`. */
  saved?: boolean;
  /** Shows the heart. Without it the card has no heart, e.g. where saving makes no sense. */
  onToggleSaved?: (carId: string) => void;
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
 * car is dimmed, says so, and cannot be pressed. It can still be saved: the heart sits *beside*
 * the card's button, laid over the photo, because a control inside an accessible button is
 * unreachable for VoiceOver.
 */
export default function CarCard({
  car,
  index,
  onPress,
  saved = false,
  onToggleSaved,
}: CarCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();

  const entranceStyle = useEntrance(index);
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

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
    // Two views, because both styles set `transform`: in one style array the second would
    // replace the first, and the press scale would silently cancel the entrance rise.
    <Animated.View style={entranceStyle}>
      <Animated.View style={pressStyle}>
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
      {onToggleSaved ? (
        <View style={styles.favourite}>
          <FavouriteButton
            carName={`${car.make} ${car.model}`}
            saved={saved}
            onToggle={() => onToggleSaved(car.id)}
          />
        </View>
      ) : null}
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
    favourite: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
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
