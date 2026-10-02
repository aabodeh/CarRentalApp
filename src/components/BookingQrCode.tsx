import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { useTheme } from '../hooks/useTheme';
import { qrCodeSize, radii, type ColorTokens } from '../theme';
import { formatBookingCode } from '../utils/formatBookingCode';
import { qrCodePath } from '../utils/qrCodePath';

export type BookingQrCodeProps = {
  bookingId: string;
};

/**
 * The booking's QR code, to show at pick-up. It encodes the exact booking id, which the server
 * knows as `clientBookingId`. Dark on light in both colour schemes, so scanners can read it.
 */
export default function BookingQrCode({ bookingId }: BookingQrCodeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { size, path } = useMemo(() => qrCodePath(bookingId), [bookingId]);

  return (
    <View
      style={styles.frame}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`QR code for booking ${formatBookingCode(bookingId)}`}
    >
      <Svg width={qrCodeSize} height={qrCodeSize} viewBox={`0 0 ${size} ${size}`}>
        <Rect width={size} height={size} fill={colors.qr.background} />
        <Path d={path} fill={colors.qr.foreground} />
      </Svg>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    frame: {
      alignSelf: 'center',
      borderRadius: radii.md,
      overflow: 'hidden',
      backgroundColor: colors.qr.background,
    },
  });
