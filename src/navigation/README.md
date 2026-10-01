# navigation

Four bottom tabs, and a stack inside the first:

- `RootNavigator.tsx`: the tabs **Cars**, **Saved**, **Bookings** and **Profile**, with Ionicons
  (`TabIcon`) and a custom label (`TabLabel`). The selected tab has a filled icon, a bold label and
  an accent bar, so the state never depends on colour alone. The Bookings tab's accessible name is
  "My bookings" (it contains the visible word), and its badge counts bookings not sent (K3).
  Every tab draws its own editorial title except My bookings, which keeps the native header.
  Saved opens a car in the Cars tab (`CarsTab › CarDetails`).
- `CarsNavigator.tsx`: the Cars stack, CarList → CarDetails → Booking.
- `types.ts`: `CarsStackParamList` and `RootTabParamList` are the single source of truth for
  route names and params. Screens take `CarsStackScreenProps<'…'>` or `RootTabScreenProps<'…'>`.
  These are composite, so a Cars screen can navigate to the other tab with full type checking:
  after booking, `navigation.navigate('MyBookingsTab')`.

There's no `declare global ReactNavigation.RootParamList`: that pattern needs an empty
interface in a namespace, which our lint rules reject, and we don't use `eslint-disable`. Typed
screen props give the same checking.
