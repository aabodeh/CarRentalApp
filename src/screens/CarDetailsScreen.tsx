import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import CarDetails from '../components/CarDetails';
import FadingHeaderTitle from '../components/FadingHeaderTitle';
import Screen from '../components/Screen';
import Skeleton from '../components/Skeleton';
import StateView from '../components/StateView';
import { useCar } from '../hooks/useCar';
import type { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CarDetails'>;

/** One car, by the `carId` route param. Every state from `useCar` has its own presentation. */
export default function CarDetailsScreen({ route, navigation }: Props) {
  const { carId } = route.params;
  const state = useCar(carId);
  const scrollY = useSharedValue(0);
  // Until the name block is measured, keep the header title hidden.
  const titleThreshold = useSharedValue(Number.MAX_SAFE_INTEGER);

  const title = state.status === 'ready' ? `${state.car.make} ${state.car.model}` : '';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <FadingHeaderTitle title={title} scrollY={scrollY} threshold={titleThreshold} />
      ),
    });
  }, [navigation, title, scrollY, titleThreshold]);

  switch (state.status) {
    case 'loading':
      return (
        <Screen>
          <View
            style={styles.padded}
            accessible
            accessibilityLabel="Loading car"
            accessibilityRole="progressbar"
          >
            <Skeleton />
          </View>
        </Screen>
      );
    case 'not-found':
      return (
        <Screen>
          <View style={styles.padded}>
            <StateView
              title="This car is no longer listed"
              message="It may have been removed from the catalogue. The other cars are still available."
              actionLabel="Back to cars"
              onAction={() => navigation.popToTop()}
            />
          </View>
        </Screen>
      );
    case 'error':
      return (
        <Screen>
          <View style={styles.padded}>
            <StateView
              title="Couldn't load this car"
              message="Check your connection and try again."
              actionLabel="Try again"
              onAction={state.retry}
            />
          </View>
        </Screen>
      );
    case 'ready':
      return (
        <CarDetails
          car={state.car}
          scrollY={scrollY}
          titleThreshold={titleThreshold}
          onBook={() => navigation.navigate('Booking', { carId })}
        />
      );
  }
}

const styles = StyleSheet.create({
  padded: {
    padding: spacing.lg,
  },
});
