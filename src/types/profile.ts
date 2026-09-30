/**
 * Mirrors `UserProfile` in the design document's class diagram. Change the diagram first.
 *
 * Who is using this phone, so the booking form does not have to be retyped every time. Local to
 * the device: there is no account and no authentication, and it is never sent to the API on its
 * own. Its name and email only leave the phone as part of a booking the user makes.
 */
export type UserProfile = {
  name: string;
  email: string;
  /**
   * A pick-up location the user prefers, e.g. "Odense C". Stored and edited in the profile only:
   * nothing else reads it yet.
   */
  preferredLocation?: string;
};
