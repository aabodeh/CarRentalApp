import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import TabIcon from '../components/TabIcon';
import TabLabel from '../components/TabLabel';
import type { IconName } from '../components/StateView';
import { useBookings } from '../context/BookingContext';
import { useTheme } from '../hooks/useTheme';
import ProfileScreen from '../screens/ProfileScreen';
import SavedScreen from '../screens/SavedScreen';
import type { ColorTokens } from '../theme';
import CarsNavigator from './CarsNavigator';
import MyBookingsNavigator from './MyBookingsNavigator';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

/** Label and icons for one tab. The label is also its accessible name, unless said otherwise. */
const tab = (label: string, icon: IconName, focusedIcon: IconName) => ({
  tabBarAccessibilityLabel: label,
  tabBarLabel: ({ focused, color }: { focused: boolean; color: string }) => (
    <TabLabel label={label} focused={focused} color={color} />
  ),
  tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
    <TabIcon name={icon} focusedName={focusedIcon} focused={focused} color={color} />
  ),
});

/**
 * Four tabs. The selected one is shown by a filled icon, a bold label and an accent bar, not by
 * colour alone. Cars, Saved and Profile draw their own editorial title; My bookings keeps a
 * native header, drawn by its stack (MyBookingsNavigator).
 *
 * "Bookings" shows a badge with the number of bookings that could not be sent (K3), so their
 * status is visible from anywhere in the app. Its accessible name stays "My bookings": it contains
 * the visible word, so voice control still finds it.
 */
export default function RootNavigator() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { records } = useBookings();
  const failed = records.filter((record) => record.booking.syncStatus === 'failed').length;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarBadgeStyle: styles.badge,
      }}
    >
      <Tab.Screen
        name="CarsTab"
        component={CarsNavigator}
        options={{ title: 'Cars', ...tab('Cars', 'car-outline', 'car') }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedScreen}
        options={{ title: 'Saved', ...tab('Saved', 'heart-outline', 'heart') }}
      />
      <Tab.Screen
        name="MyBookingsTab"
        component={MyBookingsNavigator}
        options={{
          title: 'My bookings',
          ...tab('Bookings', 'calendar-outline', 'calendar'),
          tabBarBadge: failed > 0 ? failed : undefined,
          tabBarAccessibilityLabel:
            failed > 0 ? `My bookings, ${failed} not sent yet` : 'My bookings',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', ...tab('Profile', 'person-outline', 'person') }}
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
    badge: {
      backgroundColor: colors.status.failed,
      color: colors.surface,
    },
  });
