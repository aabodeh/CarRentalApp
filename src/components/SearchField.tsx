import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { iconSize, minTouchTarget, radii, spacing, typography, type ColorTokens } from '../theme';

export type SearchFieldProps = {
  /** Visible above the field. */
  label: string;
  /** The field's accessible name. It contains the visible label, so voice control finds it too. */
  accessibilityLabel: string;
  value: string;
  onChangeText: (text: string) => void;
};

/**
 * A search input with a visible label (no placeholder-as-label) and a "Clear search" control that
 * appears once there is something to clear.
 */
export default function SearchField({
  label,
  accessibilityLabel,
  value,
  onChangeText,
}: SearchFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.field}>
      <Text style={styles.label} importantForAccessibility="no" accessibilityElementsHidden>
        {label}
      </Text>
      <View style={styles.box}>
        <Ionicons name="search" size={iconSize.md} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          accessibilityLabel={accessibilityLabel}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          placeholderTextColor={colors.textMuted}
        />
        {value !== '' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => onChangeText('')}
            style={styles.clear}
          >
            <Ionicons name="close-circle" size={iconSize.md} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    field: {
      gap: spacing.xs,
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
    },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: minTouchTarget,
      paddingLeft: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
    },
    input: {
      ...typography.body,
      flex: 1,
      color: colors.text,
      paddingVertical: spacing.sm,
    },
    clear: {
      width: minTouchTarget,
      height: minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
