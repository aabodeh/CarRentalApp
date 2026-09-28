import { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { radii, spacing, typography, type ColorTokens } from '../theme';
import type { SyncStatus } from '../types';

export type SyncStatusBadgeProps = {
  status: SyncStatus;
};

/** K3 — words for each status. The colour dot is a second signal, never the only one. */
export const SYNC_STATUS_LABEL: Record<SyncStatus, string> = {
  pending: 'Saving…',
  failed: "Couldn't save yet",
  completed: 'Confirmed',
};

/**
 * Shows whether a booking has reached the server (K3). When the status changes while it is on
 * screen, the new status is announced to screen readers.
 */
export default function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const previous = useRef(status);

  useEffect(() => {
    if (previous.current !== status) {
      previous.current = status;
      AccessibilityInfo.announceForAccessibility(`Booking status: ${SYNC_STATUS_LABEL[status]}`);
    }
  }, [status]);

  return (
    <View
      style={styles.badge}
      accessible
      accessibilityLabel={`Booking status: ${SYNC_STATUS_LABEL[status]}`}
    >
      <View style={[styles.dot, styles[`${status}Dot`]]} />
      <Text style={[styles.text, styles[`${status}Text`]]}>{SYNC_STATUS_LABEL[status]}</Text>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    dot: {
      width: spacing.sm,
      height: spacing.sm,
      borderRadius: radii.pill,
    },
    text: {
      ...typography.label,
    },
    pendingDot: { backgroundColor: colors.status.pending },
    failedDot: { backgroundColor: colors.status.failed },
    completedDot: { backgroundColor: colors.status.completed },
    pendingText: { color: colors.status.pending },
    failedText: { color: colors.status.failed },
    completedText: { color: colors.status.completed },
  });
