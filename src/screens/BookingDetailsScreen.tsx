import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import BookingPass from '../components/BookingPass';
import { syncExplanation } from '../components/BookingRow';
import PrimaryButton from '../components/PrimaryButton';
import Screen from '../components/Screen';
import Skeleton from '../components/Skeleton';
import StateView from '../components/StateView';
import SyncStatusBadge from '../components/SyncStatusBadge';
import { useBookings } from '../context/BookingContext';
import { useBookingDetails } from '../hooks/useBookingDetails';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../hooks/useTheme';
import type { MyBookingsStackScreenProps } from '../navigation/types';
import { needsManualRetry } from '../repositories/syncPolicy';
import { radii, spacing, typography, type ColorTokens } from '../theme';
import { formatDateRange } from '../utils/formatDateRange';
import { formatPrice } from '../utils/formatPrice';

type Props = MyBookingsStackScreenProps<'BookingDetails'>;

/**
 * One booking, by the `bookingId` route param: what was booked, where it is on its way to the
 * server (K3), and, once confirmed, its code and QR. Everything comes from the phone, so it all
 * works offline (K1).
 */
export default function BookingDetailsScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const state = useBookingDetails(bookingId);
  const { retryBooking } = useBookings();
  const { isOffline } = useNetworkStatus();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (state.status !== 'ready') {
    return (
      <Screen>
        <View style={styles.content}>
          {state.status === 'loading' ? (
            <View accessible accessibilityLabel="Loading booking" accessibilityRole="progressbar">
              <Skeleton />
            </View>
          ) : state.status === 'error' ? (
            <StateView
              icon="alert-circle-outline"
              title="Couldn't load this booking"
              message="It is still saved on this phone. Try again in a moment."
              actionLabel="Try again"
              onAction={state.retry}
            />
          ) : (
            <StateView
              icon="calendar-outline"
              title="Booking not found"
              message="This booking is no longer saved on this phone."
              actionLabel="Back to my bookings"
              onAction={() => navigation.navigate('MyBookingsList')}
            />
          )}
        </View>
      </Screen>
    );
  }

  const { record, carName } = state;
  const { booking } = record;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.car} accessibilityRole="header">
            {carName}
          </Text>
          <Text style={styles.detail}>
            {formatDateRange(booking.startDate, booking.endDate)} ·{' '}
            {formatPrice(booking.totalPrice)}
          </Text>
          <Text style={styles.renter}>{booking.renterName}</Text>
          <Text style={styles.renter}>{booking.renterEmail}</Text>
        </View>

        <View style={styles.status}>
          <SyncStatusBadge status={booking.syncStatus} />
          <Text style={styles.explanation}>{syncExplanation(record, isOffline)}</Text>
          {needsManualRetry(record) ? (
            <PrimaryButton
              label="Try again"
              onPress={() => retryBooking(booking.id)}
              accessibilityHint={`Sends your booking for ${carName} again`}
            />
          ) : null}
        </View>

        <BookingPass bookingId={booking.id} confirmed={booking.syncStatus === 'completed'} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    content: {
      gap: spacing.xl,
      padding: spacing.lg,
      paddingBottom: spacing.huge,
    },
    section: {
      gap: spacing.sm,
    },
    car: {
      ...typography.title,
      color: colors.text,
    },
    detail: {
      ...typography.body,
      color: colors.text,
    },
    renter: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    status: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    explanation: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
  });
