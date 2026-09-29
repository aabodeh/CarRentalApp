import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SyncToast from './src/components/SyncToast';
import { BookingProvider } from './src/context/BookingContext';
import RootNavigator from './src/navigation/RootNavigator';
import { fontAssets } from './src/theme';

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  // The splash screen stays up until the first render with content. Fonts load from the bundle in
  // milliseconds; if they fail we render anyway and fall back to the system font.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <BookingProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
        <SyncToast />
      </BookingProvider>
    </SafeAreaProvider>
  );
}
