import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { spacing, typography, type ColorTokens } from '../theme';

export type ScreenTitleProps = {
  title: string;
  /** A short line under the title, e.g. a count. */
  subtitle?: string;
};

/**
 * The editorial title every tab opens with, matching the car list's "Cars on Funen": large
 * display type, then an optional metadata line.
 */
export default function ScreenTitle({ title, subtitle }: ScreenTitleProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    subtitle: {
      ...typography.label,
      color: colors.textMuted,
    },
  });
