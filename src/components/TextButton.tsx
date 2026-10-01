import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { minTouchTarget, opacity, typography, type ColorTokens } from '../theme';

export type TextButtonProps = {
  label: string;
  onPress: () => void;
};

/**
 * A quiet secondary action: accent text, no fill, still ≥44pt tall. For actions that sit beside
 * content ("Remove"), where a filled button would shout.
 */
export default function TextButton({ label, onPress }: TextButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    button: {
      minHeight: minTouchTarget,
      minWidth: minTouchTarget,
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    pressed: {
      opacity: opacity.pressed,
    },
    label: {
      ...typography.button,
      color: colors.accent,
      textDecorationLine: 'underline',
    },
  });
