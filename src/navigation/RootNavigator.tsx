import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useBookings } from '../context/BookingContext';
import { useTheme } from '../hooks/useTheme';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import { spacing, typography, type ColorTokens } from '../theme';
import CarsNavigator from './CarsNavigator';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Two tabs, text only: no icon set is installed, and plain labels suit the editorial, minimal
 * chrome. "My bookings" shows a badge with the number of bookings that could not be sent (K3),
 * so their status is visible from anywhere in the app.
 */
export default function RootNavigator() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { records } = useBookings();
  const failed = records.filter((record) => record.booking.syncStatus === 'failed').length;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarIconStyle: styles.noIcon,
        tabBarBadgeStyle: styles.badge,
        headerTitleStyle: styles.headerTitle,
        headerStyle: styles.header,
      }}
    >
      <Tab.Screen
        name="CarsTab"
        component={CarsNavigator}
        options={{ title: 'Cars', headerShown: false }}
      />
      <Tab.Screen
        name="MyBookingsTab"
        component={MyBookingsScreen}
        options={{
          title: 'My bookings',
          tabBarBadge: failed > 0 ? failed : undefined,
          tabBarAccessibilityLabel:
            failed > 0 ? `My bookings, ${failed} not sent yet` : 'My bookings',
        }}
      />
    </Tab.Navigator>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    tabBar: {
      backgroundColor: colors.surface,
      borderTopColor: colors.hairline,
    },
    label: {
      ...typography.label,
      paddingBottom: spacing.xs,
    },
    noIcon: {
      display: 'none',
    },
    badge: {
      backgroundColor: colors.status.failed,
      color: colors.surface,
    },
    header: {
      backgroundColor: colors.background,
    },
    headerTitle: {
      ...typography.button,
      color: colors.text,
    },
  });
