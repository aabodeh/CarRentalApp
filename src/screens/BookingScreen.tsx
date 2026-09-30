import { useHeaderHeight } from '@react-navigation/elements';
import { useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type TextInput,
} from 'react-native';

import BookingForm from '../components/BookingForm';
import CarStateView from '../components/CarStateView';
import Screen from '../components/Screen';
import { useBookings } from '../context/BookingContext';
import { useCar } from '../hooks/useCar';
import type { CarsStackScreenProps } from '../navigation/types';
import { spacing } from '../theme';
import { addDays, todayIsoDate } from '../utils/localDate';
import {
  hasErrors,
  validateBooking,
  type BookingField,
  type BookingFormValues,
} from '../utils/validateBooking';

type Props = CarsStackScreenProps<'Booking'>;

const fieldsNeedAttention = (count: number) =>
  `${count} ${count === 1 ? 'field needs' : 'fields need'} attention`;

/**
 * Book one car. Once the booking is saved on the phone, the user is taken to My bookings, where its
 * sync status is shown and followed live (K3) — the status they were promised.
 */
export default function BookingScreen({ route, navigation }: Props) {
  const { carId } = route.params;
  const carState = useCar(carId);
  const { creation, createBooking } = useBookings();
  const headerHeight = useHeaderHeight();

  const today = useMemo(() => todayIsoDate(), []);
  const [values, setValues] = useState<BookingFormValues>(() => ({
    renterName: '',
    renterEmail: '',
    startDate: today,
    endDate: addDays(today, 1),
  }));
  // Errors appear after the first submit attempt, then update live as the user fixes them.
  const [showErrors, setShowErrors] = useState(false);
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const errors = showErrors ? validateBooking(values, today) : {};

  const handleChange = (field: BookingField, value: string) =>
    setValues((previous) => ({ ...previous, [field]: value }));

  const handleSubmit = () => {
    const found = validateBooking(values, today);
    if (hasErrors(found)) {
      setShowErrors(true);
      AccessibilityInfo.announceForAccessibility(fieldsNeedAttention(Object.keys(found).length));
      if (found.renterName) nameRef.current?.focus();
      else if (found.renterEmail) emailRef.current?.focus();
      return;
    }
    createBooking({
      carId,
      renterName: values.renterName.trim(),
      renterEmail: values.renterEmail.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
    }).then(
      () => {
        // Leave the Cars tab at its list, and show the booking where its status lives.
        navigation.popToTop();
        navigation.navigate('MyBookingsTab');
      },
      // The failure is shown from `creation`; nothing else to do here.
      () => undefined
    );
  };

  if (carState.status !== 'ready') {
    return <CarStateView state={carState} onBack={() => navigation.popToTop()} />;
  }

  return (
    <Screen>
      {/* iOS: pad by the keyboard height, offset by the header above this view — without the
          offset the submit button stays under the keyboard. Android resizes the window itself. */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <BookingForm
            car={carState.car}
            values={values}
            onChange={handleChange}
            errors={errors}
            today={today}
            onSubmit={handleSubmit}
            submitting={creation.status === 'submitting'}
            submitError={
              creation.status === 'error'
                ? "Couldn't save your booking. Check your details and try again."
                : undefined
            }
            nameRef={nameRef}
            emailRef={emailRef}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
});
