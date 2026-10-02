import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import { typography, type ColorTokens } from '../theme';
import type { MyBookingsStackParamList } from './types';

const Stack = createNativeStackNavigator<MyBookingsStackParamList>();

/**
 * The "Bookings" tab: the list → one booking's details. Both keep the native header: the list
 * has no editorial title, because its tests pin the booking rows as its only headings (PR 7).
 */
export default function MyBookingsNavigator() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Stack.Navigator
      initialRouteName="MyBookingsList"
      screenOptions={{
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      }}
    >
      <Stack.Screen
        name="MyBookingsList"
        component={MyBookingsScreen}
        options={{ title: 'My bookings' }}
      />
      <Stack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={{ title: 'Booking' }}
      />
    </Stack.Navigator>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    header: {
      backgroundColor: colors.background,
    },
    headerTitle: {
      ...typography.button,
      color: colors.text,
    },
  });
