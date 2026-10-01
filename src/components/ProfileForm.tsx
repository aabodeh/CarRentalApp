import { useMemo, type RefObject } from 'react';
import { StyleSheet, Text, View, type TextInput } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { spacing, typography, type ColorTokens } from '../theme';
import type { RenterErrors } from '../utils/validateRenter';
import FilterChip from './FilterChip';
import PrimaryButton from './PrimaryButton';
import TextField from './TextField';

/** Field names match the booking form's, so both run through `validateRenter` unchanged. */
export type ProfileDraft = {
  renterName: string;
  renterEmail: string;
  preferredLocation?: string;
};

export type ProfileFormProps = {
  values: ProfileDraft;
  onChange: (field: keyof ProfileDraft, value: string | undefined) => void;
  errors: RenterErrors;
  /** Pick-up locations to choose from: the ones in the car list. */
  locations: string[];
  onSave: () => void;
  saving: boolean;
  /** Shown above the button after saving: a confirmation, or why it failed. */
  outcome?: { kind: 'saved' | 'failed'; text: string };
  nameRef: RefObject<TextInput | null>;
  emailRef: RefObject<TextInput | null>;
};

/** The profile's editable details. Presentational: the screen holds the values. */
export default function ProfileForm({
  values,
  onChange,
  errors,
  locations,
  onSave,
  saving,
  outcome,
  nameRef,
  emailRef,
}: ProfileFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // A saved location stays choosable even when no listed car is there any more.
  const choices =
    values.preferredLocation && !locations.includes(values.preferredLocation)
      ? [values.preferredLocation, ...locations]
      : locations;

  return (
    <View style={styles.form}>
      <View style={styles.intro}>
        <Text style={styles.heading} accessibilityRole="header">
          Your details
        </Text>
        <Text style={styles.hint}>
          They fill in the booking form for you. You can still change them there.
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

      {choices.length > 0 ? (
        <View
          style={styles.group}
          accessibilityRole="radiogroup"
          accessibilityLabel="Preferred pick-up"
        >
          <Text
            style={styles.groupLabel}
            importantForAccessibility="no"
            accessibilityElementsHidden
          >
            Preferred pick-up
          </Text>
          <View style={styles.chips}>
            <FilterChip
              role="radio"
              label="Any"
              selected={!values.preferredLocation}
              onPress={() => onChange('preferredLocation', undefined)}
            />
            {choices.map((location) => (
              <FilterChip
                key={location}
                role="radio"
                label={location}
                selected={values.preferredLocation === location}
                onPress={() => onChange('preferredLocation', location)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {outcome ? (
        <Text
          style={outcome.kind === 'saved' ? styles.saved : styles.failed}
          accessibilityLiveRegion="polite"
        >
          {outcome.kind === 'failed' ? `Error: ${outcome.text}` : outcome.text}
        </Text>
      ) : null}
      <PrimaryButton
        label={saving ? 'Saving…' : 'Save details'}
        onPress={onSave}
        disabled={saving}
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
    heading: {
      ...typography.heading,
      color: colors.text,
    },
    hint: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    group: {
      gap: spacing.sm,
    },
    groupLabel: {
      ...typography.label,
      color: colors.textMuted,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    saved: {
      ...typography.body,
      color: colors.status.completed,
    },
    failed: {
      ...typography.body,
      color: colors.status.failed,
    },
  });
