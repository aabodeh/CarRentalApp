# navigation

Two bottom tabs, and a stack inside the first:

- `RootNavigator.tsx`: the tabs, **Cars** and **My bookings**. Labels only, because no icon set is
  installed. My bookings shows a badge with the number of bookings not sent (K3).
- `CarsNavigator.tsx`: the Cars stack, CarList → CarDetails → Booking.
- `types.ts`: `CarsStackParamList` and `RootTabParamList` are the single source of truth for
  route names and params. Screens take `CarsStackScreenProps<'…'>` or `RootTabScreenProps<'…'>`.
  These are composite, so a Cars screen can navigate to the other tab with full type checking:
  after booking, `navigation.navigate('MyBookingsTab')`.

There's no `declare global ReactNavigation.RootParamList`: that pattern needs an empty
interface in a namespace, which our lint rules reject, and we don't use `eslint-disable`. Typed
screen props give the same checking.
