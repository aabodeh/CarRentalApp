import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BookingScreen from '../screens/BookingScreen';
import CarDetailsScreen from '../screens/CarDetailsScreen';
import CarListScreen from '../screens/CarListScreen';
import type { CarsStackParamList } from './types';

const Stack = createNativeStackNavigator<CarsStackParamList>();

/** The "Cars" tab: list → details → booking. */
export default function CarsNavigator() {
  return (
    <Stack.Navigator initialRouteName="CarList">
      <Stack.Screen
        name="CarList"
        component={CarListScreen}
        // The list draws its own editorial title; the other screens keep the native header
        // for the back button.
        options={{ title: 'Cars', headerShown: false }}
      />
      <Stack.Screen
        name="CarDetails"
        component={CarDetailsScreen}
        // Empty until the car loads: the screen replaces it with the car's name, which fades in
        // once the on-page name has scrolled away.
        options={{ title: '' }}
      />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book' }} />
    </Stack.Navigator>
  );
}
