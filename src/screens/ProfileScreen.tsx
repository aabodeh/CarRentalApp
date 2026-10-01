import { useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native';

import AnimatedSection from '../components/AnimatedSection';
import LocalOnlyNote from '../components/LocalOnlyNote';
import ProfileForm, { type ProfileDraft } from '../components/ProfileForm';
import ProfileStats from '../components/ProfileStats';
import Screen from '../components/Screen';
import ScreenTitle from '../components/ScreenTitle';
import Skeleton from '../components/Skeleton';
import { useCars } from '../hooks/useCars';
import { useProfile } from '../hooks/useProfile';
import { useProfileStats } from '../hooks/useProfileStats';
import { spacing } from '../theme';
import type { UserProfile } from '../types';
import { fieldsNeedAttention, validateRenter } from '../utils/validateRenter';

type Outcome = 'idle' | 'saving' | 'saved' | 'failed';

const toDraft = (profile: UserProfile | null): ProfileDraft => ({
  renterName: profile?.name ?? '',
  renterEmail: profile?.email ?? '',
  preferredLocation: profile?.preferredLocation,
});

/**
 * The user's details on this phone — no account — plus a few counts from their own bookings and
 * saved cars. The details prefill the booking form.
 */
export default function ProfileScreen() {
  const { state, save } = useProfile();
  const stats = useProfileStats();
  const { state: carsState } = useCars();

  // What the user is editing. Taken from the stored profile once it has been read.
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  if (draft === null && state.status === 'ready') setDraft(toDraft(state.profile));

  // Errors appear after the first save attempt, then update live, as in the booking form.
  const [showErrors, setShowErrors] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>('idle');
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const locations = useMemo(
    () =>
      carsState.status === 'ready'
        ? [...new Set(carsState.cars.map((car) => car.location))].sort()
        : [],
    [carsState]
  );

  const handleChange = (field: keyof ProfileDraft, value: string | undefined) => {
    setDraft((previous) => previous && { ...previous, [field]: value });
    setOutcome('idle');
  };

  const handleSave = () => {
    if (!draft) return;
    const found = validateRenter(draft);
    if (Object.keys(found).length > 0) {
      setShowErrors(true);
      AccessibilityInfo.announceForAccessibility(fieldsNeedAttention(Object.keys(found).length));
      if (found.renterName) nameRef.current?.focus();
      else emailRef.current?.focus();
      return;
    }
    setOutcome('saving');
    save({
      name: draft.renterName,
      email: draft.renterEmail,
      preferredLocation: draft.preferredLocation,
    }).then(
      () => {
        setOutcome('saved');
        AccessibilityInfo.announceForAccessibility('Details saved');
      },
      () => setOutcome('failed')
    );
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <ScreenTitle title="Profile" />
          <AnimatedSection index={0} style={styles.section}>
            <ProfileStats stats={stats} />
          </AnimatedSection>
          <AnimatedSection index={1} style={styles.section}>
            {draft ? (
              <ProfileForm
                values={draft}
                onChange={handleChange}
                errors={showErrors ? validateRenter(draft) : {}}
                locations={locations}
                onSave={handleSave}
                saving={outcome === 'saving'}
                outcome={
                  outcome === 'saved'
                    ? { kind: 'saved', text: 'Details saved on this phone.' }
                    : outcome === 'failed'
                      ? { kind: 'failed', text: "Couldn't save your details. Try again." }
                      : undefined
                }
                nameRef={nameRef}
                emailRef={emailRef}
              />
            ) : (
              <View
                accessible
                accessibilityLabel="Loading your details"
                accessibilityRole="progressbar"
              >
                <Skeleton />
              </View>
            )}
          </AnimatedSection>
          <AnimatedSection index={2}>
            <LocalOnlyNote />
          </AnimatedSection>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  section: {
    paddingBottom: spacing.xxl,
  },
});
