import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import CarCard from '../components/CarCard';
import CarFilters from '../components/CarFilters';
import CarListHeader from '../components/CarListHeader';
import Screen from '../components/Screen';
import Skeleton from '../components/Skeleton';
import StateView from '../components/StateView';
import { useCarFilters } from '../hooks/useCarFilters';
import { useCars, type CarsState } from '../hooks/useCars';
import { useFavourites } from '../hooks/useFavourites';
import { useTheme } from '../hooks/useTheme';
import type { CarsStackScreenProps } from '../navigation/types';
import { spacing, type ColorTokens } from '../theme';
import type { Car } from '../types';

type Props = CarsStackScreenProps<'CarList'>;

const SKELETON_COUNT = 3;

const NO_CARS: readonly Car[] = [];

/**
 * The catalogue. One FlatList for every state, so the header and pull-to-refresh are always there;
 * what differs is the list's empty component: skeletons, an error, a genuine "no cars", or "no cars
 * match" when the search and chips leave nothing. Filtering is UI state (`useCarFilters`); the
 * repository always holds the whole list.
 */
export default function CarListScreen({ navigation }: Props) {
  const { state, refresh, isRefreshing } = useCars();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const cars = state.status === 'ready' ? state.cars : undefined;
  const filters = useCarFilters(cars ?? NO_CARS);
  const favourites = useFavourites();
  const openCar = (carId: string) => navigation.navigate('CarDetails', { carId });

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        data={cars ? filters.results : []}
        keyExtractor={(car) => car.id}
        renderItem={({ item, index }) => (
          <CarCard
            car={item}
            index={index}
            onPress={openCar}
            saved={favourites.ids.has(item.id)}
            onToggleSaved={favourites.toggle}
          />
        )}
        ListHeaderComponent={
          <>
            <CarListHeader
              cars={cars}
              fetchedAt={state.status === 'ready' ? state.fetchedAt : undefined}
              freshness={state.status === 'ready' ? state.freshness : undefined}
            />
            {cars ? <CarFilters filters={filters} total={cars.length} /> : null}
          </>
        }
        ListEmptyComponent={
          <ListPlaceholder state={state} onClearFilters={filters.clear} styles={styles} />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            enabled={state.status !== 'loading'}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }
      />
    </Screen>
  );
}

type ListPlaceholderProps = {
  state: CarsState;
  onClearFilters: () => void;
  styles: ReturnType<typeof createStyles>;
};

/** What the list shows when it has no rows to render. */
function ListPlaceholder({ state, onClearFilters, styles }: ListPlaceholderProps) {
  switch (state.status) {
    case 'loading':
      return (
        <View
          style={styles.skeletons}
          accessible
          accessibilityLabel="Loading cars"
          accessibilityRole="progressbar"
        >
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <Skeleton key={i} />
          ))}
        </View>
      );
    case 'error':
      return (
        <StateView
          icon="cloud-offline-outline"
          title="Couldn't load the cars"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={state.retry}
        />
      );
    case 'empty':
      return (
        <StateView
          icon="car-outline"
          title="No cars right now"
          message="There are no cars to rent at the moment. Pull down to check again."
        />
      );
    case 'ready':
      // There are cars, so the filters left none.
      return (
        <StateView
          icon="search"
          title="No cars match"
          message="Try another make or model, or fewer filters."
          actionLabel="Clear filters"
          onAction={onClearFilters}
        />
      );
  }
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
      backgroundColor: colors.background,
      flexGrow: 1,
    },
    skeletons: {
      gap: spacing.xl,
    },
  });
