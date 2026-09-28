import type { ReactNode } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useEntrance } from '../hooks/useEntrance';

export type AnimatedSectionProps = {
  /** Position among its siblings; drives the stagger. */
  index: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
};

/** A block of content that fades and rises into place in order with its siblings. */
export default function AnimatedSection({
  index,
  children,
  style,
  onLayout,
}: AnimatedSectionProps) {
  const entranceStyle = useEntrance(index);

  return (
    <Animated.View style={[style, entranceStyle]} onLayout={onLayout}>
      {children}
    </Animated.View>
  );
}
