import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../hooks/useTheme';
import { spacing, typography, type ColorTokens } from '../theme';
import type { Booking, Car } from '../types';
import { formatDateRange } from '../utils/formatDateRange';
import { formatPrice } from '../utils/formatPrice';
import PrimaryButton from './PrimaryButton';
import SpecGrid from './SpecGrid';
import SyncStatusBadge from './SyncStatusBadge';

export type BookingConfirmationProps = {
  car: Car;
  booking: Booking;
  onDone: () => void;
};

const STATUS_MESSAGE: Record<Booking['syncStatus'], string> = {
  pending: 'Saved on this phone. We’re confirming it now.',
  failed: 'Saved on this phone, but our server didn’t accept it.',
  completed: 'Your booking is confirmed.',
};

/** Offline, a pending booking waits for the connection — say so rather than "confirming now". */
const PENDING_OFFLINE_MESSAGE = 'Saved on this phone. It will sync when you’re back online.';

/** Shown after a booking is created. The status badge updates live as the booking syncs (K3). */
export default function BookingConfirmation({ car, booking, onDone }: BookingConfirmationProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isOffline } = useNetworkStatus();
  const message =
    booking.syncStatus === 'pending' && isOffline
      ? PENDING_OFFLINE_MESSAGE
      : STATUS_MESSAGE[booking.syncStatus];

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.title} accessibilityRole="header">
          Booking received
        </Text>
        <SyncStatusBadge status={booking.syncStatus} />
        <Text style={styles.message}>{message}</Text>
      </View>
      <SpecGrid
        specs={[
          { label: 'Car', value: `${car.make} ${car.model}` },
          { label: 'Dates', value: formatDateRange(booking.startDate, booking.endDate) },
          { label: 'Pick-up', value: car.location },
          { label: 'Total', value: formatPrice(booking.totalPrice) },
          { label: 'Name', value: booking.renterName },
          { label: 'Email', value: booking.renterEmail },
        ]}
      />
      <PrimaryButton label="Back to cars" onPress={onDone} />
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      gap: spacing.xl,
    },
    intro: {
      gap: spacing.md,
    },
    title: {
      ...typography.display,
      color: colors.text,
    },
    message: {
      ...typography.body,
      color: colors.textMuted,
    },
  });
