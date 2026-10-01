import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import CarCard from '../components/CarCard';
import Screen from '../components/Screen';
import ScreenTitle from '../components/ScreenTitle';
import Skeleton from '../components/Skeleton';
import StateView from '../components/StateView';
import TextButton from '../components/TextButton';
import { useSavedCars } from '../hooks/useSavedCars';
import { useTheme } from '../hooks/useTheme';
import type { RootTabScreenProps } from '../navigation/types';
import { spacing, typography, type ColorTokens } from '../theme';

type Props = RootTabScreenProps<'SavedTab'>;

const TITLE = 'Saved';

const carCount = (n: number) => `${n} ${n === 1 ? 'car' : 'cars'}`;

/**
 * The cars the user has saved, as the same cards as the catalogue. A saved car that has left the
 * catalogue is not shown, and not silently forgotten either: a line says how many, with Remove.
 */
export default function SavedScreen({ navigation }: Props) {
  const { state, toggle, remove } = useSavedCars();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const browseCars = () => navigation.navigate('CarsTab', { screen: 'CarList' });
  const openCar = (carId: string) =>
    navigation.navigate('CarsTab', { screen: 'CarDetails', params: { carId } });

  if (state.status !== 'ready') {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <ScreenTitle title={TITLE} />
          {state.status === 'loading' ? (
            <View
              accessible
              accessibilityLabel="Loading saved cars"
              accessibilityRole="progressbar"
            >
              <Skeleton />
            </View>
          ) : state.status === 'error' ? (
            <StateView
              icon="cloud-offline-outline"
              title="Couldn't load your saved cars"
              message="They are still saved on this phone. Check your connection and try again."
              actionLabel="Try again"
              onAction={state.retry}
            />
          ) : (
            <StateView
              icon="heart-outline"
              title="Nothing saved yet"
              message="Tap the heart on a car to keep it here."
              actionLabel="Browse cars"
              onAction={browseCars}
            />
          )}
        </View>
      </Screen>
    );
  }

  const missing = state.missingIds.length;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        data={state.cars}
        keyExtractor={(car) => car.id}
        renderItem={({ item, index }) => (
          <CarCard car={item} index={index} onPress={openCar} saved onToggleSaved={toggle} />
        )}
        ListHeaderComponent={
          <>
            <ScreenTitle title={TITLE} subtitle={carCount(state.cars.length)} />
            {missing > 0 ? (
              <View style={styles.missing}>
                <Text style={styles.missingText}>
                  {missing === 1
                    ? '1 saved car is no longer listed.'
                    : `${missing} saved cars are no longer listed.`}
                </Text>
                <TextButton
                  label={missing === 1 ? 'Remove it' : 'Remove them'}
                  onPress={() => remove(state.missingIds)}
                />
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <StateView
            icon="heart-dislike-outline"
            title="None of your saved cars are listed"
            message="They may be back later. The other cars are still available."
            actionLabel="Browse cars"
            onAction={browseCars}
          />
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
  separator: { height: spacing.xl },
});

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.huge,
      flexGrow: 1,
    },
    missing: {
      gap: spacing.xs,
      paddingBottom: spacing.xl,
    },
    missingText: {
      ...typography.body,
      color: colors.textMuted,
    },
  });
