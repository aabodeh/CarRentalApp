import type { ProfileStats as Stats } from '../hooks/useProfileStats';
import { formatDateRange } from '../utils/formatDateRange';
import SpecGrid from './SpecGrid';

export type ProfileStatsProps = {
  stats: Stats;
};

/** Counts from the user's own bookings and saved cars. Nothing here is estimated or made up. */
export default function ProfileStats({ stats }: ProfileStatsProps) {
  const next = stats.next
    ? `${stats.next.carName}, ${formatDateRange(stats.next.startDate, stats.next.endDate)}`
    : 'None';

  return (
    <SpecGrid
      specs={[
        { label: 'Bookings made', value: String(stats.bookingsMade) },
        { label: 'Saved cars', value: String(stats.savedCars) },
        { label: 'Next booking', value: next },
      ]}
    />
  );
}
