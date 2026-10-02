# navigation

Four bottom tabs, with a stack inside Cars and another inside Bookings:

- `RootNavigator.tsx`: the tabs **Cars**, **Saved**, **Bookings** and **Profile**, with Ionicons
  (`TabIcon`) and a custom label (`TabLabel`). The selected tab has a filled icon, a bold label and
  an accent bar, so the state never depends on colour alone. The Bookings tab's accessible name is
  "My bookings" (it contains the visible word), and its badge counts bookings not sent (K3).
  Every tab draws its own editorial title except My bookings, whose stack keeps the native header.
  Saved opens a car in the Cars tab (`CarsTab › CarDetails`).
- `CarsNavigator.tsx`: the Cars stack, CarList → CarDetails → Booking.
- `MyBookingsNavigator.tsx`: the Bookings stack, MyBookingsList → BookingDetails. It draws the
  native header for both screens. After a booking, `BookingScreen` navigates to
  `MyBookingsTab › MyBookingsList` with `pop: true`, so the user lands on the list even if the tab
  was left on an older booking's details.
- `types.ts`: `CarsStackParamList`, `MyBookingsStackParamList` and `RootTabParamList` are the
  single source of truth for route names and params. Screens take `CarsStackScreenProps<'…'>`,
  `MyBookingsStackScreenProps<'…'>` or `RootTabScreenProps<'…'>`. These are composite, so a stack
  screen can navigate to another tab with full type checking: after booking,
  `navigation.navigate('MyBookingsTab', { screen: 'MyBookingsList', pop: true })`.

There's no `declare global ReactNavigation.RootParamList`: that pattern needs an empty
interface in a namespace, which our lint rules reject, and we don't use `eslint-disable`. Typed
screen props give the same checking.
