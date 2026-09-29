import { useMemo, type RefObject } from 'react';
import { StyleSheet, Text, View, type TextInput } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { spacing, typography, type ColorTokens } from '../theme';
import type { Car } from '../types';
import { formatPrice } from '../utils/formatPrice';
import type { BookingErrors, BookingField, BookingFormValues } from '../utils/validateBooking';
import BookingSummary from './BookingSummary';
import DateField from './DateField';
import PrimaryButton from './PrimaryButton';
import TextField from './TextField';

export type BookingFormProps = {
  car: Car;
  values: BookingFormValues;
  onChange: (field: BookingField, value: string) => void;
  errors: BookingErrors;
  /** The user's local date, the earliest selectable pick-up. */
  today: string;
  onSubmit: () => void;
  submitting: boolean;
  /** Shown above the button when saving failed for a reason other than the fields. */
  submitError?: string;
  nameRef: RefObject<TextInput | null>;
  emailRef: RefObject<TextInput | null>;
};

/** The booking form: who is renting, when, and what it will cost. Presentational only. */
export default function BookingForm({
  car,
  values,
  onChange,
  errors,
  today,
  onSubmit,
  submitting,
  submitError,
  nameRef,
  emailRef,
}: BookingFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.form}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>You’re booking</Text>
        <Text style={styles.carName} accessibilityRole="header">
          {car.make} {car.model}
        </Text>
        <Text style={styles.meta}>
          {formatPrice(car.pricePerDay)} / day · pick-up in {car.location}
        </Text>
      </View>

      <TextField
        ref={nameRef}
        label="Your name"
        value={values.renterName}
        onChangeText={(text) => onChange('renterName', text)}
        error={errors.renterName}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
        label="Email"
        value={values.renterEmail}
        onChangeText={(text) => onChange('renterEmail', text)}
        error={errors.renterEmail}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
        returnKeyType="done"
      />

      <View style={styles.dates}>
        <DateField
          label="Pick-up date"
          value={values.startDate}
          onChange={(date) => onChange('startDate', date)}
          minimumDate={today}
          error={errors.startDate}
        />
        <DateField
          label="Return date"
          value={values.endDate}
          onChange={(date) => onChange('endDate', date)}
          minimumDate={values.startDate >= today ? values.startDate : today}
          error={errors.endDate}
        />
        <Text style={styles.hint}>
          Rental days count from pick-up to return. A same-day return counts as 1 day.
        </Text>
      </View>

      <BookingSummary
        pricePerDay={car.pricePerDay}
        startDate={values.startDate}
        endDate={values.endDate}
      />

      {submitError ? (
        <Text style={styles.submitError} accessibilityRole="alert">
          Error: {submitError}
        </Text>
      ) : null}
      <PrimaryButton
        label={submitting ? 'Booking…' : 'Confirm booking'}
        onPress={onSubmit}
        disabled={submitting}
      />
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    form: {
      gap: spacing.xl,
    },
    intro: {
      gap: spacing.xs,
    },
    eyebrow: {
      ...typography.label,
      color: colors.textMuted,
    },
    carName: {
      ...typography.title,
      color: colors.text,
    },
    meta: {
      ...typography.body,
      color: colors.textMuted,
    },
    dates: {
      gap: spacing.lg,
    },
    hint: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    submitError: {
      ...typography.body,
      color: colors.status.failed,
    },
  });
