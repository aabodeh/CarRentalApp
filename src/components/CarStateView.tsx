import { StyleSheet, View } from 'react-native';

import type { CarState } from '../hooks/useCar';
import { spacing } from '../theme';
import Screen from './Screen';
import Skeleton from './Skeleton';
import StateView from './StateView';

export type CarStateViewProps = {
  /** Any state except `ready` — the screen renders that one itself. */
  state: Exclude<CarState, { status: 'ready' }>;
  /** Where "Back to cars" goes when the car does not exist. */
  onBack: () => void;
};

/**
 * What a car screen shows before it has a car: a skeleton, a not-found message with a way back,
 * or an error with retry. Shared by the details and booking screens so both say the same thing.
 */
export default function CarStateView({ state, onBack }: CarStateViewProps) {
  return (
    <Screen>
      <View style={styles.content}>
        {state.status === 'loading' ? (
          <View accessible accessibilityLabel="Loading car" accessibilityRole="progressbar">
            <Skeleton />
          </View>
        ) : state.status === 'not-found' ? (
          <StateView
            title="This car is no longer listed"
            message="It may have been removed from the catalogue. The other cars are still available."
            actionLabel="Back to cars"
            onAction={onBack}
          />
        ) : (
          <StateView
            title="Couldn't load this car"
            message="Check your connection and try again."
            actionLabel="Try again"
            onAction={state.retry}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
});
