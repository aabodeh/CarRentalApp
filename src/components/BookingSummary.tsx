import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { spacing, typography, type ColorTokens } from '../theme';
import { calculateTotalPrice } from '../utils/calculateTotalPrice';
import { daysBetween } from '../utils/daysBetween';
import { formatPrice } from '../utils/formatPrice';

export type BookingSummaryProps = {
  pricePerDay: number;
  /** `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
};

/** "1 day" / "3 days". */
const dayCount = (days: number) => `${days} ${days === 1 ? 'day' : 'days'}`;

/**
 * The live price for the chosen dates, recalculated as they change. It uses the same utils as
 * bookingRepository, so what the user sees is what they will be charged. Announced politely on
 * Android when it changes; the accessibility label uses plain numbers ("1498 kroner").
 */
export default function BookingSummary({ pricePerDay, startDate, endDate }: BookingSummaryProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  let days: number;
  try {
    days = daysBetween(startDate, endDate);
  } catch {
    return (
      <View style={styles.summary} accessibilityLiveRegion="polite">
        <Text style={styles.detail}>Choose a return date on or after the pick-up date.</Text>
      </View>
    );
  }

  const total = calculateTotalPrice(pricePerDay, startDate, endDate);

  return (
    <View
      style={styles.summary}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Total ${total} kroner, for ${dayCount(days)} at ${pricePerDay} kroner per day`}
    >
      <Text style={styles.detail}>
        {dayCount(days)} × {formatPrice(pricePerDay)}
      </Text>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.total}>{formatPrice(total)}</Text>
      </View>
      {startDate === endDate ? (
        <Text style={styles.note}>Same-day return counts as 1 day.</Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    summary: {
      gap: spacing.xs,
      paddingVertical: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
    },
    detail: {
      ...typography.body,
      color: colors.textMuted,
    },
    totalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      columnGap: spacing.md,
    },
    totalLabel: {
      ...typography.label,
      color: colors.textMuted,
    },
    total: {
      ...typography.title,
      color: colors.text,
    },
    note: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
  });
