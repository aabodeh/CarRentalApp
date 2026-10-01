import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { UseCarFiltersResult } from '../hooks/useCarFilters';
import { useTheme } from '../hooks/useTheme';
import { spacing, typography, type ColorTokens } from '../theme';
import { FUEL_LABEL, TRANSMISSION_LABEL } from '../utils/carLabels';
import FilterChip from './FilterChip';
import SearchField from './SearchField';

export type CarFiltersProps = {
  filters: UseCarFiltersResult;
  /** How many cars there are before filtering. */
  total: number;
};

/** Search plus fuel and transmission chips above the car list, and how many cars match. */
export default function CarFilters({ filters, total }: CarFiltersProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.filters}>
      <SearchField
        label="Make or model"
        accessibilityLabel="Search cars by make or model"
        value={filters.query}
        onChangeText={filters.setQuery}
      />
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Fuel</Text>
        <View style={styles.chips}>
          {filters.fuelOptions.map((fuel) => (
            <FilterChip
              key={fuel}
              label={FUEL_LABEL[fuel]}
              selected={filters.fuels.has(fuel)}
              onPress={() => filters.toggleFuel(fuel)}
            />
          ))}
        </View>
      </View>
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Transmission</Text>
        <View style={styles.chips}>
          {filters.transmissionOptions.map((transmission) => (
            <FilterChip
              key={transmission}
              label={TRANSMISSION_LABEL[transmission]}
              selected={filters.transmissions.has(transmission)}
              onPress={() => filters.toggleTransmission(transmission)}
            />
          ))}
        </View>
      </View>
      {/* Always there and spoken when it changes, so a screen-reader user hears what a chip did. */}
      <Text style={styles.count} accessibilityLiveRegion="polite">
        {filters.isFiltering
          ? `Showing ${filters.results.length} of ${total} cars`
          : `Showing all ${total} cars`}
      </Text>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    filters: {
      gap: spacing.lg,
      paddingBottom: spacing.lg,
    },
    group: {
      gap: spacing.sm,
    },
    groupLabel: {
      ...typography.label,
      color: colors.textMuted,
    },
    // Chips wrap onto new lines, so they still fit at 200% text.
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    count: {
      ...typography.label,
      color: colors.text,
    },
  });
