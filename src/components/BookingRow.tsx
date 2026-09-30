import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../hooks/useTheme';
import type { StoredBooking } from '../repositories/bookingRepository';
import { needsManualRetry } from '../repositories/syncPolicy';
import { radii, spacing, typography, type ColorTokens } from '../theme';
import { formatDateRange } from '../utils/formatDateRange';
import { formatPrice } from '../utils/formatPrice';
import AnimatedSection from './AnimatedSection';
import PrimaryButton from './PrimaryButton';
import SyncStatusBadge from './SyncStatusBadge';

export type BookingRowProps = {
  record: StoredBooking;
  carName: string;
  index: number;
  onRetry: (bookingId: string) => void;
};

/**
 * What the user should know about where their booking is (K3), in words — the badge says the
 * status, this says what happens next.
 */
export function syncExplanation(record: StoredBooking, isOffline: boolean): string {
  const { booking, sync } = record;
  switch (booking.syncStatus) {
    case 'completed':
      return 'Confirmed by our server.';
    case 'pending':
      return isOffline
        ? 'Saved on this phone. It will sync when you’re back online.'
        : 'Saved on this phone. Sending it now.';
    case 'failed':
      if (sync.rejected) return 'Our server didn’t accept this booking.';
      if (needsManualRetry(record)) return 'We couldn’t reach our server after several tries.';
      return 'We couldn’t reach our server. Trying again automatically.';
  }
}

/** One booking in My bookings: car, dates, total, and where it is on its way to the server. */
export default function BookingRow({ record, carName, index, onRetry }: BookingRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isOffline } = useNetworkStatus();
  const { booking } = record;

  return (
    <AnimatedSection index={index} style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.car} accessibilityRole="header">
          {carName}
        </Text>
        <SyncStatusBadge status={booking.syncStatus} />
      </View>
      <Text style={styles.detail}>
        {formatDateRange(booking.startDate, booking.endDate)} · {formatPrice(booking.totalPrice)}
      </Text>
      <Text style={styles.explanation}>{syncExplanation(record, isOffline)}</Text>
      {needsManualRetry(record) ? (
        <PrimaryButton
          label="Try again"
          onPress={() => onRetry(booking.id)}
          accessibilityHint={`Sends your booking for ${carName} again`}
        />
      ) : null}
    </AnimatedSection>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    row: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    top: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    car: {
      ...typography.heading,
      color: colors.text,
      flexShrink: 1,
    },
    detail: {
      ...typography.body,
      color: colors.text,
    },
    explanation: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
  });
