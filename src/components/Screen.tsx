import { useMemo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '../hooks/useTheme';
import type { ColorTokens } from '../theme';

export type ScreenProps = {
  children: ReactNode;
  /**
   * Which edges to pad for the notch and home indicator. Screens that show the native header
   * leave out 'top' (the header already handles it); screens without one include it.
   */
  edges?: Edge[];
};

const SIDE_EDGES: Edge[] = ['left', 'right'];

/** Root wrapper for every screen: safe-area padding on our background colour. */
export default function Screen({ children, edges = SIDE_EDGES }: ScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
