import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { minTouchTarget, opacity, radii, spacing, typography, type ColorTokens } from '../theme';

export type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Read by screen readers after the label, e.g. why the button is disabled. */
  accessibilityHint?: string;
};

/**
 * The one primary action style: accent fill, ≥44pt, a light haptic on press. Disabled is both
 * `disabled` (no presses) and `accessibilityState.disabled` (announced as dimmed/unavailable).
 */
export default function PrimaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityHint,
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    button: {
      minHeight: minTouchTarget,
      minWidth: minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      backgroundColor: colors.accent,
    },
    buttonDisabled: {
      backgroundColor: colors.placeholder,
    },
    buttonPressed: {
      opacity: opacity.pressed,
    },
    label: {
      ...typography.button,
      color: colors.onAccent,
      textAlign: 'center',
    },
    labelDisabled: {
      color: colors.textMuted,
    },
  });
