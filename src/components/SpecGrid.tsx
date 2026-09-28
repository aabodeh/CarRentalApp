import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { spacing, typography, type ColorTokens } from '../theme';

export type Spec = { label: string; value: string };

export type SpecGridProps = {
  specs: Spec[];
};

/**
 * Key facts in a two-column grid: small tracked label above a readable value. Each cell is read
 * as one phrase ("Seats: 5"). Cells are half-width with no fixed height, so at large text sizes
 * the values wrap instead of clipping.
 */
export default function SpecGrid({ specs }: SpecGridProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.grid}>
      {specs.map((spec) => (
        <View
          key={spec.label}
          style={styles.cell}
          accessible
          accessibilityLabel={`${spec.label}: ${spec.value}`}
        >
          <Text style={styles.label}>{spec.label}</Text>
          <Text style={styles.value}>{spec.value}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    cell: {
      width: '50%',
      gap: spacing.xs,
      paddingVertical: spacing.lg,
      paddingRight: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
    },
    value: {
      ...typography.heading,
      color: colors.text,
    },
  });
