import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { iconSize, radii, spacing, typography, type ColorTokens } from '../theme';
import PrimaryButton from './PrimaryButton';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type StateViewProps = {
  title: string;
  message: string;
  /** Label of the optional action button, e.g. "Try again". */
  actionLabel?: string;
  onAction?: () => void;
  /** A decorative Ionicons glyph above the title. Hidden from screen readers. */
  icon?: IconName;
};

/**
 * The one way every screen presents "nothing to show" — empty, error, not found — so these
 * states look and read the same across the app.
 */
export default function StateView({ title, message, actionLabel, onAction, icon }: StateViewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {icon ? (
        <View
          style={styles.icon}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Ionicons name={icon} size={iconSize.lg} color={colors.textMuted} />
        </View>
      ) : null}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
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
    // A soft disc behind the glyph: presence without another colour.
    icon: {
      width: spacing.huge,
      height: spacing.huge,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.pill,
      backgroundColor: colors.placeholder,
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.heading,
      color: colors.text,
    },
    message: {
      ...typography.body,
      color: colors.textMuted,
    },
    action: {
      marginTop: spacing.sm,
    },
  });
