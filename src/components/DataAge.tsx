import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useNow } from '../hooks/useNow';
import { useTheme } from '../hooks/useTheme';
import type { Freshness } from '../repositories/carRepository';
import { typography, type ColorTokens } from '../theme';
import { formatRelativeTime } from '../utils/formatRelativeTime';

export type DataAgeProps = {
  fetchedAt: string;
  freshness: Freshness;
};

/** Words for how old the data is, and whether it is a saved copy (K1). */
export function dataAgeText(fetchedAt: string, freshness: Freshness, now: Date): string {
  const age = formatRelativeTime(fetchedAt, now);
  switch (freshness) {
    case 'fresh':
      return `Updated ${age}`;
    case 'refreshing':
      return `Updated ${age} · checking for updates`;
    case 'stale':
      return `Saved copy · updated ${age}`;
  }
}

/** "Updated 5 minutes ago". Re-renders every minute so the age stays true. */
export default function DataAge({ fetchedAt, freshness }: DataAgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const now = useNow();

  return <Text style={styles.age}>{dataAgeText(fetchedAt, freshness, now)}</Text>;
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    age: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
  });
