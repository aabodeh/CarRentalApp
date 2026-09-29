import { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { durations, spacing, typography, type ColorTokens } from '../theme';

export const OFFLINE_TITLE = 'You’re offline';
export const OFFLINE_MESSAGE =
  'Cars you’ve already seen are still here, but availability may be out of date. Bookings you make will sync when you’re back online.';

/**
 * A quiet, persistent notice while the device is offline, saying what still works (K1).
 * It eases in from above, or simply appears with reduce motion on. When the connection drops
 * while a screen is open, the change is announced once to screen readers.
 */
export default function OfflineBanner() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isOffline } = useNetworkStatus();
  const reduceMotion = useReducedMotion();
  const wasOffline = useRef(isOffline);

  useEffect(() => {
    if (isOffline && !wasOffline.current) {
      AccessibilityInfo.announceForAccessibility(`${OFFLINE_TITLE}. ${OFFLINE_MESSAGE}`);
    }
    wasOffline.current = isOffline;
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInUp.duration(durations.base)}
      style={styles.banner}
      accessible
      accessibilityLabel={`${OFFLINE_TITLE}. ${OFFLINE_MESSAGE}`}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.title}>{OFFLINE_TITLE}</Text>
      <Text style={styles.message}>{OFFLINE_MESSAGE}</Text>
    </Animated.View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    banner: {
      gap: spacing.xxs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    title: {
      ...typography.label,
      color: colors.text,
    },
    message: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
  });
