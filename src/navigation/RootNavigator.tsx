import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BookingScreen from '../screens/BookingScreen';
import CarDetailsScreen from '../screens/CarDetailsScreen';
import CarListScreen from '../screens/CarListScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
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
        options={{ title: 'Car Details' }}
      />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Booking' }} />
    </Stack.Navigator>
  );
}
