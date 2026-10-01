import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { iconSize, minTouchTarget, radii, spacing, typography, type ColorTokens } from '../theme';

export type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /**
   * `checkbox` for a multi-select group (fuel, transmission); `radio` when only one in the group
   * can be on (the profile's preferred pick-up).
   */
  role?: 'checkbox' | 'radio';
};

/**
 * A pill that switches a filter on or off. On is shown three ways: inverted fill, a check mark,
 * and `checked` for screen readers — never by colour alone.
 */
export default function FilterChip({
  label,
  selected,
  onPress,
  role = 'checkbox',
}: FilterChipProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      {selected ? <Ionicons name="checkmark" size={iconSize.sm} color={colors.background} /> : null}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    chip: {
      minHeight: minTouchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
    },
    // Ink on paper, inverted: the same tested pair as body text.
    chipSelected: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    label: {
      ...typography.button,
      color: colors.text,
    },
    labelSelected: {
      color: colors.background,
    },
  });
