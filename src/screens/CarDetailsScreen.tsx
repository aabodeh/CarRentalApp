import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import CarDetails from '../components/CarDetails';
import FadingHeaderTitle from '../components/FadingHeaderTitle';
import CarStateView from '../components/CarStateView';
import { useCar } from '../hooks/useCar';
import type { RootStackParamList } from '../navigation/types';

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

  if (state.status !== 'ready') {
    return <CarStateView state={state} onBack={() => navigation.popToTop()} />;
  }

  return (
    <CarDetails
      car={state.car}
      scrollY={scrollY}
      titleThreshold={titleThreshold}
      onBook={() => navigation.navigate('Booking', { carId })}
    />
  );
}
