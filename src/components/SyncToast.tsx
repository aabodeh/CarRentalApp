import { useEffect, useMemo } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBookings } from '../context/BookingContext';
import { useCars } from '../hooks/useCars';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import {
  durations,
  elevation,
  minTouchTarget,
  radii,
  spacing,
  toast,
  typography,
  type ColorTokens,
} from '../theme';

/**
 * K3 — tells the user when a booking that had failed to send has now reached the server. A
 * silently updated badge is not enough: this is shown over the app, announced to screen readers,
 * and hides itself after a few seconds (or on tap). No push notifications.
 */
export default function SyncToast() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const { notice, dismissNotice } = useBookings();
  const { state: carsState } = useCars();

  const car =
    notice && carsState.status === 'ready'
      ? carsState.cars.find((candidate) => candidate.id === notice.booking.carId)
      : undefined;
  const message = notice
    ? `Your booking${car ? ` for ${car.make} ${car.model}` : ''} is confirmed.`
    : '';

  useEffect(() => {
    if (!notice) return;
    AccessibilityInfo.announceForAccessibility(message);
    const timer = setTimeout(dismissNotice, toast.visibleMs);
    return () => clearTimeout(timer);
  }, [notice, message, dismissNotice]);

  if (!notice) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(durations.base)}
        exiting={reduceMotion ? undefined : FadeOut.duration(durations.fast)}
      >
        <Pressable
          style={styles.toast}
          onPress={dismissNotice}
          accessibilityRole="button"
          accessibilityLabel={message}
          accessibilityHint="Dismisses this message"
        >
          <Text style={styles.label}>Synced</Text>
          <Text style={styles.message}>{message}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    toast: {
      ...elevation.raised,
      minHeight: minTouchTarget,
      gap: spacing.xxs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    label: {
      ...typography.label,
      color: colors.status.completed,
    },
    message: {
      ...typography.body,
      color: colors.text,
    },
  });
