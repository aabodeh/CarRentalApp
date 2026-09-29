import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import CarCard from '../components/CarCard';
import CarListHeader from '../components/CarListHeader';
import Screen from '../components/Screen';
import Skeleton from '../components/Skeleton';
import StateView from '../components/StateView';
import { useCars, type CarsState } from '../hooks/useCars';
import { useTheme } from '../hooks/useTheme';
import type { RootStackParamList } from '../navigation/types';
import { spacing, type ColorTokens } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CarList'>;

const SKELETON_COUNT = 3;

/**
 * The catalogue. One FlatList for every state, so the header and pull-to-refresh are always there;
 * what differs is the list's empty component: skeletons, an error, or a genuine "no cars".
 */
export default function CarListScreen({ navigation }: Props) {
  const { state, refresh, isRefreshing } = useCars();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const cars = state.status === 'ready' ? state.cars : undefined;
  const openCar = (carId: string) => navigation.navigate('CarDetails', { carId });

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        data={cars ?? []}
        keyExtractor={(car) => car.id}
        renderItem={({ item, index }) => <CarCard car={item} index={index} onPress={openCar} />}
        ListHeaderComponent={
          <CarListHeader
            cars={cars}
            fetchedAt={state.status === 'ready' ? state.fetchedAt : undefined}
            freshness={state.status === 'ready' ? state.freshness : undefined}
          />
        }
        ListEmptyComponent={<ListPlaceholder state={state} styles={styles} />}
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
  styles: ReturnType<typeof createStyles>;
};

/** What the list shows when it has no rows to render. */
function ListPlaceholder({ state, styles }: ListPlaceholderProps) {
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
          title="Couldn't load the cars"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={state.retry}
        />
      );
    case 'empty':
      return (
        <StateView
          title="No cars right now"
          message="There are no cars to rent at the moment. Pull down to check again."
        />
      );
    case 'ready':
      return null;
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
