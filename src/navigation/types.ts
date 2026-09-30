import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** The "Cars" tab: browse, look at a car, book it. */
export type CarsStackParamList = {
  CarList: undefined;
  CarDetails: { carId: string };
  Booking: { carId: string };
};

/** The app's root: two tabs. */
export type RootTabParamList = {
  CarsTab: NavigatorScreenParams<CarsStackParamList>;
  MyBookingsTab: undefined;
};

/**
 * Props for a screen in the Cars stack. Composite, so a Cars screen can also navigate to the
 * other tab (booking → My bookings) with full type checking.
 */
export type CarsStackScreenProps<T extends keyof CarsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<CarsStackParamList, T>,
  BottomTabScreenProps<RootTabParamList>
>;

export type RootTabScreenProps<T extends keyof RootTabParamList> = BottomTabScreenProps<
  RootTabParamList,
  T
>;
