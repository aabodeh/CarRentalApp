import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { minTouchTarget, opacity, radii, spacing, typography, type ColorTokens } from '../theme';

export type StateViewProps = {
  title: string;
  message: string;
  /** Label of the optional action button, e.g. "Try again". */
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * The one way every screen presents "nothing to show" — empty, error, not found — so these
 * states look and read the same across the app.
 */
export default function StateView({ title, message, actionLabel, onAction }: StateViewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.xxxl,
    },
    title: {
      ...typography.heading,
      color: colors.text,
    },
    message: {
      ...typography.body,
      color: colors.textMuted,
    },
    button: {
      minHeight: minTouchTarget,
      minWidth: minTouchTarget,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      marginTop: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.accent,
    },
    buttonPressed: {
      opacity: opacity.pressed,
    },
    buttonLabel: {
      ...typography.button,
      color: colors.onAccent,
    },
  });
