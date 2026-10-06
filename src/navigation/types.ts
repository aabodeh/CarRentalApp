import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** The "Cars" tab: browse, look at a car, book it. */
export type CarsStackParamList = {
  CarList: undefined;
  CarDetails: { carId: string };
  Booking: { carId: string };
};

/** The "Bookings" tab: the list, and one booking's details (code and QR). */
export type MyBookingsStackParamList = {
  MyBookingsList: undefined;
  BookingDetails: { bookingId: string };
};

/** The app's root: four tabs. */
export type RootTabParamList = {
  CarsTab: NavigatorScreenParams<CarsStackParamList>;
  SavedTab: undefined;
  MyBookingsTab: NavigatorScreenParams<MyBookingsStackParamList>;
  ProfileTab: undefined;
};

/**
 * Props for a screen in the Cars stack. Composite, so a Cars screen can also navigate to the
 * other tab (booking → My bookings) with full type checking.
 */
export type CarsStackScreenProps<T extends keyof CarsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<CarsStackParamList, T>,
  BottomTabScreenProps<RootTabParamList>
>;

/** Props for a screen in the Bookings stack; composite, so it can open another tab. */
export type MyBookingsStackScreenProps<T extends keyof MyBookingsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<MyBookingsStackParamList, T>,
    BottomTabScreenProps<RootTabParamList>
  >;

export type RootTabScreenProps<T extends keyof RootTabParamList> = BottomTabScreenProps<
  RootTabParamList,
  T
>;
