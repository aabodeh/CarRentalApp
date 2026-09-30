import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import {
  favouritePop,
  iconSize,
  minTouchTarget,
  pressSpring,
  radii,
  type ColorTokens,
} from '../theme';

export type FavouriteButtonProps = {
  /** "Tesla Model 3": part of the label, since a list has one heart per car. */
  carName: string;
  saved: boolean;
  onToggle: () => void;
};

/** What a screen reader says for the heart, which changes with its state. */
export function favouriteLabel(carName: string, saved: boolean): string {
  return saved ? `Remove ${carName} from saved` : `Save ${carName}`;
}

/**
 * The heart that saves a car. Saved is shown by shape (filled or outline), not only by colour, and
 * announced through the label and `selected`. A tap gives a selection haptic and a small spring,
 * and the spring is skipped with reduce motion on.
 */
export default function FavouriteButton({ carName, saved, onToggle }: FavouriteButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const handlePress = () => {
    Haptics.selectionAsync();
    if (!reduceMotion) {
      scale.set(
        withSequence(withSpring(favouritePop.scale, pressSpring), withSpring(1, pressSpring))
      );
    }
    onToggle();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={favouriteLabel(carName, saved)}
      accessibilityState={{ selected: saved }}
      onPress={handlePress}
      style={styles.button}
    >
      <Animated.View style={popStyle}>
        <Ionicons
          name={saved ? 'heart' : 'heart-outline'}
          size={iconSize.md}
          color={saved ? colors.accent : colors.text}
        />
      </Animated.View>
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    // A surface disc, so the heart reads on any photo.
    button: {
      width: minTouchTarget,
      height: minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
    },
  });
