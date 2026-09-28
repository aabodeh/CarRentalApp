import { useMemo, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { minTouchTarget, radii, spacing, typography, type ColorTokens } from '../theme';

export type TextFieldProps = Pick<
  TextInputProps,
  | 'value'
  | 'onChangeText'
  | 'keyboardType'
  | 'autoComplete'
  | 'textContentType'
  | 'autoCapitalize'
  | 'returnKeyType'
  | 'onSubmitEditing'
> & {
  label: string;
  /** Shown under the field, and folded into its accessibility label. */
  error?: string;
  ref?: Ref<TextInput>;
};

/**
 * A labelled text input. The label is always visible (no placeholder-as-label). An error is shown
 * as text under the field, prefixed "Error:" so it never relies on colour, and it is folded into
 * the input's accessibility label — React Native has no aria-describedby, so this is how a screen
 * reader hears the error when it lands on the field.
 */
export default function TextField({ label, error, ref, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.field}>
      <Text style={styles.label} importantForAccessibility="no" accessibilityElementsHidden>
        {label}
      </Text>
      <TextInput
        ref={ref}
        {...inputProps}
        accessibilityLabel={error ? `${label}, error: ${error}` : label}
        style={[styles.input, error ? styles.inputInvalid : null]}
        placeholderTextColor={colors.textMuted}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          Error: {error}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    field: {
      gap: spacing.xs,
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
    },
    input: {
      ...typography.body,
      color: colors.text,
      minHeight: minTouchTarget,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
    },
    inputInvalid: {
      borderColor: colors.status.failed,
      borderWidth: 2,
    },
    error: {
      ...typography.bodySmall,
      color: colors.status.failed,
    },
  });
