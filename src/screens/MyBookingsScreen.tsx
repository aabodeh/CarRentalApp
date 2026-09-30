import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import BookingRow from '../components/BookingRow';
import Screen from '../components/Screen';
import Skeleton from '../components/Skeleton';
import StateView from '../components/StateView';
import { useBookings } from '../context/BookingContext';
import { useMyBookings, type BookingItem } from '../hooks/useMyBookings';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../hooks/useTheme';
import type { RootTabScreenProps } from '../navigation/types';
import { spacing, typography, type ColorTokens } from '../theme';

type Props = RootTabScreenProps<'MyBookingsTab'>;

/**
 * Every booking made on this phone, newest first, each with its sync status (K3). Offline is not
 * a separate state: the list stays, with the offline banner and a line saying bookings will sync.
 */
export default function MyBookingsScreen({ navigation }: Props) {
  const state = useMyBookings();
  const { retryBooking } = useBookings();
  const { isOffline } = useNetworkStatus();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const browseCars = () => navigation.navigate('CarsTab', { screen: 'CarList' });

  if (state.status !== 'ready') {
    return (
      <Screen>
        <View style={styles.content}>
          {state.status === 'loading' ? (
            <View accessible accessibilityLabel="Loading bookings" accessibilityRole="progressbar">
              <Skeleton />
            </View>
          ) : state.status === 'error' ? (
            <StateView
              title="Couldn't load your bookings"
              message="They are still saved on this phone. Try again in a moment."
              actionLabel="Try again"
              onAction={state.retry}
            />
          ) : (
            <StateView
              title="No bookings yet"
              message="Cars you book appear here, with whether they have reached us."
              actionLabel="Browse cars"
              onAction={browseCars}
            />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={state.items}
        keyExtractor={(item: BookingItem) => item.record.booking.id}
        renderItem={({ item, index }) => (
          <BookingRow
            record={item.record}
            carName={item.carName}
            index={index}
            onRetry={retryBooking}
          />
        )}
        ListHeaderComponent={
          isOffline ? (
            <Text style={styles.offlineNote}>Bookings will sync when you’re back online.</Text>
          ) : null
        }
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={separatorStyles.separator} />;
}

const separatorStyles = StyleSheet.create({
  separator: { height: spacing.lg },
});

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.huge,
    },
    offlineNote: {
      ...typography.bodySmall,
      color: colors.textMuted,
      paddingBottom: spacing.lg,
    },
  });
