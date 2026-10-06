import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { radii, spacing, typography, type ColorTokens } from '../theme';
import { formatBookingCode, spellBookingCode } from '../utils/formatBookingCode';
import BookingQrCode from './BookingQrCode';

export type BookingPassProps = {
  bookingId: string;
  /** Has the server confirmed the booking (`completed`)? Only then is there a pass to show. */
  confirmed: boolean;
};

/**
 * The booking's code and QR. Shown only once the server has confirmed the booking: a pass for a
 * booking the server does not have would promise something untrue. Until then, it says so.
 */
export default function BookingPass({ bookingId, confirmed }: BookingPassProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!confirmed) {
    return (
      <View style={styles.pass}>
        <Text style={styles.title}>Not confirmed yet</Text>
        <Text style={styles.message}>
          Your booking code and QR appear here once our server has confirmed it.
        </Text>
      </View>
    );
  }

  const code = formatBookingCode(bookingId);
  return (
    <View style={styles.pass}>
      <Text style={styles.label}>Booking code</Text>
      <Text style={styles.code} accessibilityLabel={`Booking code: ${spellBookingCode(code)}`}>
        {code}
      </Text>
      <BookingQrCode bookingId={bookingId} />
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    pass: {
      gap: spacing.md,
      padding: spacing.xl,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
    },
    code: {
      ...typography.code,
      color: colors.text,
    },
    title: {
      ...typography.heading,
      color: colors.text,
    },
    message: {
      ...typography.body,
      color: colors.textMuted,
    },
  });
