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
import { useProfile } from '../hooks/useProfile';
import type { CarsStackScreenProps } from '../navigation/types';
import { spacing } from '../theme';
import type { UserProfile } from '../types';
import { addDays, todayIsoDate } from '../utils/localDate';
import {
  hasErrors,
  validateBooking,
  type BookingField,
  type BookingFormValues,
} from '../utils/validateBooking';
import { fieldsNeedAttention } from '../utils/validateRenter';

type Props = CarsStackScreenProps<'Booking'>;

const fillEmptyRenterFields = (
  values: BookingFormValues,
  profile: UserProfile
): BookingFormValues => ({
  ...values,
  renterName: values.renterName === '' ? profile.name : values.renterName,
  renterEmail: values.renterEmail === '' ? profile.email : values.renterEmail,
});

/**
 * Book one car. Once the booking is saved on the phone, the user is taken to My bookings, where its
 * sync status is shown and followed live (K3) — the status they were promised.
 *
 * Name and email start from the profile, if there is one. They stay editable, and editing them here
 * does not change the profile.
 */
export default function BookingScreen({ route, navigation }: Props) {
  const { carId } = route.params;
  const carState = useCar(carId);
  const { creation, createBooking } = useBookings();
  const headerHeight = useHeaderHeight();

  const today = useMemo(() => todayIsoDate(), []);
  const { state: profileState } = useProfile();
  const profile = profileState.status === 'ready' ? profileState.profile : null;
  const [values, setValues] = useState<BookingFormValues>(() => ({
    renterName: profile?.name ?? '',
    renterEmail: profile?.email ?? '',
    startDate: today,
    endDate: addDays(today, 1),
  }));

  // A profile read after the form opened fills only what is still empty: never what was typed.
  const [prefilledFrom, setPrefilledFrom] = useState<UserProfile | null>(profile);
  if (profile && profile !== prefilledFrom) {
    setPrefilledFrom(profile);
    setValues((previous) => fillEmptyRenterFields(previous, profile));
  }
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
        // Leave the Cars tab at its list, and show the booking where its status lives. To the
        // list explicitly, with `pop`: the Bookings tab may still be on an older booking's details.
        navigation.popToTop();
        navigation.navigate('MyBookingsTab', { screen: 'MyBookingsList', pop: true });
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
            fromProfile={
              profile !== null &&
              values.renterName === profile.name &&
              values.renterEmail === profile.email
            }
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
