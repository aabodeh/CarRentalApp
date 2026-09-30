import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { iconSize, spacing, typography, type ColorTokens } from '../theme';

/** Exactly what the profile is and is not. Each claim is true of the code: see `bookingApi`. */
export const LOCAL_ONLY_TEXT =
  'Saved on this phone only. There’s no account. Your name and email are sent only with a booking you make.';

/** The profile's honesty line: where these details live and when they leave the phone. */
export default function LocalOnlyNote() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.note}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Ionicons name="phone-portrait-outline" size={iconSize.md} color={colors.textMuted} />
      </View>
      <Text style={styles.text}>{LOCAL_ONLY_TEXT}</Text>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    note: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingTop: spacing.xl,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    text: {
      ...typography.bodySmall,
      flex: 1,
      color: colors.textMuted,
    },
  });
