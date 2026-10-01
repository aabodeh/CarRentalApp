import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, type SharedValue } from 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import type { Freshness } from '../repositories/carRepository';
import { spacing, typography, type ColorTokens } from '../theme';
import type { Car } from '../types';
import { FUEL_LABEL, TRANSMISSION_LABEL, UNAVAILABLE_TEXT } from '../utils/carLabels';
import { formatPrice } from '../utils/formatPrice';
import AnimatedSection from './AnimatedSection';
import BottomActionBar from './BottomActionBar';
import CarHero from './CarHero';
import DataAge from './DataAge';
import FavouriteButton from './FavouriteButton';
import OfflineBanner from './OfflineBanner';
import PrimaryButton from './PrimaryButton';
import SpecGrid from './SpecGrid';

export type CarDetailsProps = {
  car: Car;
  /** When this car's data was fetched, and whether it is a saved copy (K1). */
  fetchedAt: string;
  freshness: Freshness;
  onBook: () => void;
  /** Written on every scroll frame; the screen's header title reads it. */
  scrollY: SharedValue<number>;
  /** Set to the scroll offset where the name block ends, for the header title. */
  titleThreshold: SharedValue<number>;
  /** Whether the car is saved, and how to change that. The heart shows only with `onToggleSaved`. */
  saved?: boolean;
  onToggleSaved?: () => void;
};

/** The details of one car: hero, name, price, specs, and a pinned "Book this car" bar. */
export default function CarDetails({
  car,
  fetchedAt,
  freshness,
  onBook,
  scrollY,
  titleThreshold,
  saved = false,
  onToggleSaved,
}: CarDetailsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [barHeight, setBarHeight] = useState(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  // The bar floats over the content, so the content ends with a spacer of the bar's measured
  // height: scrolled to the bottom, the last line always sits above the bar.
  const spacer = useMemo(() => ({ height: barHeight }), [barHeight]);

  const specs = [
    { label: 'Year', value: String(car.year) },
    { label: 'Seats', value: String(car.seats) },
    { label: 'Transmission', value: TRANSMISSION_LABEL[car.transmission] },
    { label: 'Fuel', value: FUEL_LABEL[car.fuel] },
    { label: 'Pick-up', value: car.location },
  ];

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}>
        <CarHero imageUrl={car.imageUrl} scrollY={scrollY} />
        <AnimatedSection
          index={0}
          style={styles.section}
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;
            titleThreshold.set(y + height);
          }}
        >
          <View style={styles.nameRow}>
            <View style={styles.nameText}>
              <Text style={styles.make} importantForAccessibility="no" accessibilityElementsHidden>
                {car.make}
              </Text>
              <Text
                style={styles.name}
                accessibilityRole="header"
                accessibilityLabel={`${car.make} ${car.model}`}
              >
                {car.model}
              </Text>
            </View>
            {onToggleSaved ? (
              <FavouriteButton
                carName={`${car.make} ${car.model}`}
                saved={saved}
                onToggle={onToggleSaved}
              />
            ) : null}
          </View>
        </AnimatedSection>
        <AnimatedSection index={1} style={styles.section}>
          <Text style={styles.price} accessibilityLabel={`${car.pricePerDay} kroner per day`}>
            {formatPrice(car.pricePerDay)}
            <Text style={styles.perDay}> / day</Text>
          </Text>
          <Text style={car.available ? styles.available : styles.unavailable}>
            {car.available ? 'Available to book' : UNAVAILABLE_TEXT}
          </Text>
          {/* Only worth saying when this is not fresh from the server. */}
          {freshness === 'fresh' ? null : <DataAge fetchedAt={fetchedAt} freshness={freshness} />}
        </AnimatedSection>
        <AnimatedSection index={2} style={styles.section}>
          <SpecGrid specs={specs} />
        </AnimatedSection>
        <View style={spacer} />
      </Animated.ScrollView>

      <BottomActionBar onHeightChange={setBarHeight}>
        {car.available ? null : (
          <Text style={styles.reason}>{UNAVAILABLE_TEXT} — this car can’t be booked.</Text>
        )}
        <PrimaryButton
          label="Book this car"
          onPress={onBook}
          disabled={!car.available}
          accessibilityHint={car.available ? undefined : "This car can't be booked right now."}
        />
      </BottomActionBar>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      gap: spacing.xs,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    // Takes the room the heart leaves, so a long model name wraps instead of pushing it off.
    nameText: {
      flex: 1,
      gap: spacing.xs,
    },
    make: {
      ...typography.label,
      color: colors.textMuted,
    },
    name: {
      ...typography.display,
      color: colors.text,
    },
    price: {
      ...typography.title,
      color: colors.text,
    },
    perDay: {
      ...typography.body,
      color: colors.textMuted,
    },
    available: {
      ...typography.body,
      color: colors.status.completed,
    },
    unavailable: {
      ...typography.body,
      color: colors.textMuted,
    },
    reason: {
      ...typography.bodySmall,
      color: colors.text,
    },
  });
