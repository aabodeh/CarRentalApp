import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { spacing, typography, type ColorTokens } from '../theme';
import type { Freshness } from '../repositories/carRepository';
import type { Car } from '../types';
import DataAge from './DataAge';

export type CarListHeaderProps = {
  /** The loaded cars, or undefined while there is nothing to count yet. */
  cars?: Car[];
  /** When the cars were fetched and whether they are a saved copy (K1). */
  fetchedAt?: string;
  freshness?: Freshness;
};

/** Editorial header of the car list: a large title and, once loaded, a count and the data's age. */
export default function CarListHeader({ cars, fetchedAt, freshness }: CarListHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const available = cars?.filter((car) => car.available).length ?? 0;

  return (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        Cars on Funen
      </Text>
      {cars ? (
        <Text style={styles.count}>
          {cars.length} {cars.length === 1 ? 'car' : 'cars'} · {available} available
        </Text>
      ) : null}
      {fetchedAt && freshness ? <DataAge fetchedAt={fetchedAt} freshness={freshness} /> : null}
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    header: {
      gap: spacing.sm,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    title: {
      ...typography.display,
      color: colors.text,
    },
    count: {
      ...typography.label,
      color: colors.textMuted,
    },
  });
