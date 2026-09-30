import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { fontFamily, radii, spacing, typography, type ColorTokens } from '../theme';

export type TabLabelProps = {
  label: string;
  focused: boolean;
  color: string;
};

/**
 * A tab's label, with the selected tab's state carried three ways: bold instead of medium, an
 * accent bar under the word, and the tab's filled icon (see `TabIcon`). Never colour alone.
 */
export default function TabLabel({ label, focused, color }: TabLabelProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // The colour comes from the tab bar at render time, so it goes through a memoised style.
  const colorStyle = useMemo(() => ({ color }), [color]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, focused && styles.labelFocused, colorStyle]}>{label}</Text>
      {/* Always laid out, transparent when not selected, so the label never jumps. */}
      <View style={[styles.indicator, focused && styles.indicatorFocused]} />
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing.xxs,
      paddingBottom: spacing.xs,
    },
    label: {
      ...typography.label,
      textAlign: 'center',
    },
    labelFocused: {
      fontFamily: fontFamily.bold,
    },
    indicator: {
      width: spacing.lg,
      height: spacing.xxs,
      borderRadius: radii.sm,
    },
    indicatorFocused: {
      backgroundColor: colors.accent,
    },
  });
