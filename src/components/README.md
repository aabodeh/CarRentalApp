# components

Reusable presentational pieces shared by more than one screen — `CarCard`,
`PriceTag`, `SyncStatusBadge`, `EmptyState`.

**Goes here:** anything that renders UI and could be dropped into a second
screen unchanged.

**Does not go here:** whole screens (`src/screens/`), data fetching, or
storage access. Components receive everything they draw through props.

Rules that apply here are enforced by ESLint: no `fetch`, no imports from
`services/`, `storage/` or `data/`. If a component needs data, the screen
above it gets the data from a hook and passes it down.

## Today

- `Screen`: the root of every screen. Safe-area padding on the theme background.
- `CarCard`: a car in the catalogue. It has the staggered entrance, press spring, haptic and
  sentence-style accessibility label, and handles the unavailable state.
- `StateView`: the shared empty / error / not-found presentation, with an optional action.
- `Skeleton`: a card-shaped loading placeholder that pulses, and stays static on reduce motion.
- `CarListHeader`: the car list's editorial title and count.
- `PrimaryButton`: the one primary action style (accent, ≥44pt, light haptic, announced disabled).
- `TextField` / `DateField`: a visible label, the error shown as "Error: …" text, and the error
  folded into the accessibility label. RN has no `aria-describedby`. `DateField` uses the native
  picker with `onValueChange`, because `onChange` is deprecated in datetimepicker 9.
- `BookingSummary`: live day count and total, including the same-day rule as visible copy.
- `SyncStatusBadge`: K3. The status in words plus a dot, announced when it changes.
- `SpecGrid`: label/value pairs in two columns, each read as one phrase.
- `BottomActionBar`: pinned bottom bar. It clears the home indicator (additive SafeAreaView) and
  reports its height so the content can pad by it.
- `CarDetails`, `CarHero`, `AnimatedSection`, `FadingHeaderTitle`: the details screen's pieces.
- `OfflineBanner`: a quiet notice of what still works offline. It's rendered by `Screen` and
  `CarDetails`, so it appears on every screen.
- `DataAge`: "Updated 5 minutes ago" / "Saved copy · updated 2 hours ago".
- `CarStateView`: the loading / not-found / error view for any screen that loads one car.
- `BookingForm`: the booking form.
- `BookingRow`: one booking in My bookings. Shows the car, dates, total, `SyncStatusBadge`, a line
  saying what happens next, and **Try again** when only the user can move it on.
- `BookingRow` is pressable and opens the booking's details. **Try again** sits below the pressable
  part, not inside it, so VoiceOver can reach it.
- `BookingPass`: the booking code and QR once the server has confirmed the booking, and "Not
  confirmed yet" until then. A pass for a booking the server doesn't have would promise something
  untrue.
- `BookingQrCode`: the QR, drawn with `react-native-svg` from `utils/qrCodePath`. Dark on light in
  both schemes, because scanners need it. Read as "QR code for booking …".
- `SyncToast`: "Your booking for … is confirmed.", shown and announced when a booking succeeds
  after a failed attempt (K3). It hides itself after `toast.visibleMs`.

- `FavouriteButton`: the heart. Its label changes with its state ("Save …" / "Remove … from
  saved"), with `selected`, a selection haptic, and a spring that is skipped on reduce motion. On
  `CarCard` it sits beside the card's button, not inside it.
- `FilterChip`: a multi-select (`checkbox`) or single-select (`radio`) pill. On shows as an
  inverted fill and a check mark.
- `SearchField`: a visible label, and a "Clear search" control.
- `CarFilters`: search, fuel and transmission chips, and the "Showing 3 of 10 cars" line.
- `ScreenTitle`: the editorial title the Saved and Profile tabs open with.
- `TextButton`: a quiet, ≥44pt secondary action.
- `TabIcon` / `TabLabel`: a tab's icon (outline or filled) and its label (medium or bold, with an
  accent bar).
- `ProfileForm`, `ProfileStats` (reuses `SpecGrid`), `LocalOnlyNote`: the Profile screen's parts.
- `StateView` takes an optional decorative `icon`.

**Icons** come from `@expo/vector-icons/Ionicons` only, and are imported from that subpath so that
only that one font is bundled. `App.tsx` loads the font with the text fonts.

**Theme-aware styles.** Colours change with light and dark mode, so a component builds its styles
with `const createStyles = (colors: ColorTokens) => StyleSheet.create({...})` at the bottom of the
file, and calls `useMemo(() => createStyles(colors), [colors])`. There are still no inline style
objects.

**Animated values** use Reanimated's `.get()` / `.set()`, not `.value =`. The React Compiler lint
rule (`react-hooks/immutability`) rejects assignment to a hook's return value.
