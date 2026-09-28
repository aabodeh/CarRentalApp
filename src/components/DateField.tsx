import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { minTouchTarget, radii, spacing, typography, type ColorTokens } from '../theme';
import { formatDateRange } from '../utils/formatDateRange';
import { isoToLocalDate, toLocalIsoDate } from '../utils/localDate';

export type DateFieldProps = {
  label: string;
  /** `YYYY-MM-DD`. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable date, `YYYY-MM-DD`. */
  minimumDate?: string;
  error?: string;
};

/**
 * A labelled date input using each platform's native picker (@react-native-community/datetimepicker):
 * iOS shows its compact date button, which opens the system calendar; Android shows our own button
 * that opens the system date dialog. Both are the OS's own accessible controls.
 */
export default function DateField({ label, value, onChange, minimumDate, error }: DateFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const displayValue = formatDateRange(value, value);
  const accessibilityLabel = error ? `${label}, error: ${error}` : label;
  const minimum = minimumDate ? isoToLocalDate(minimumDate) : undefined;

  // `onValueChange`, not the deprecated `onChange` (which logs a warning in 9.x). It fires only
  // when the user actually picks a date; dismissing the picker changes nothing.
  const handleValueChange = (_event: unknown, date: Date) => onChange(toLocalIsoDate(date));

  const openAndroidPicker = () =>
    DateTimePickerAndroid.open({
      value: isoToLocalDate(value),
      mode: 'date',
      minimumDate: minimum,
      onValueChange: handleValueChange,
    });

  return (
    <View style={styles.field}>
      <Text style={styles.label} importantForAccessibility="no" accessibilityElementsHidden>
        {label}
      </Text>
      {Platform.OS === 'ios' ? (
        <View style={styles.iosRow}>
          <DateTimePicker
            value={isoToLocalDate(value)}
            mode="date"
            display="compact"
            minimumDate={minimum}
            onValueChange={handleValueChange}
            accessibilityLabel={accessibilityLabel}
            accentColor={colors.accent}
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityLabel}, ${displayValue}`}
          accessibilityHint="Opens a calendar"
          onPress={openAndroidPicker}
          style={[styles.androidButton, error ? styles.invalid : null]}
        >
          <Text style={styles.value}>{displayValue}</Text>
        </Pressable>
      )}
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
    iosRow: {
      minHeight: minTouchTarget,
      flexDirection: 'row',
      alignItems: 'center',
    },
    androidButton: {
      minHeight: minTouchTarget,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
    },
    invalid: {
      borderColor: colors.status.failed,
      borderWidth: 2,
    },
    value: {
      ...typography.body,
      color: colors.text,
    },
    error: {
      ...typography.bodySmall,
      color: colors.status.failed,
    },
  });
