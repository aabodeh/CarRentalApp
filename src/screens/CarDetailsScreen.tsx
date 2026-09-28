import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';

import Screen from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import { spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CarDetails'>;

/** Placeholder: the real details screen (via `useCar`) is the next PR. */
export default function CarDetailsScreen({ route }: Props) {
  return (
    <Screen>
      <Text style={styles.text}>Car details: {route.params.carId}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: {
    ...typography.body,
    padding: spacing.lg,
  },
});
