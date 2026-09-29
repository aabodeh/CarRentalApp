# services/api

The HTTP client and one module per resource (`carApi.ts`, `bookingApi.ts`).

Each function does exactly one request and returns parsed data or throws a
typed error. No retries and no caching here — the repository owns those, so
that retry behaviour (K2) is written once rather than per endpoint.

## Today

- `config.ts`: the base URL from `app.json` → `expo.extra.apiBaseUrl` (via `expo-constants`).
- `client.ts`: `request(path, guard, options)`. It uses `fetch` with an 8 s `AbortController`
  timeout, and every reply is validated by a guard from `src/types/guards.ts` before it is
  returned. Typed errors:

  | Error             | Meaning                          | `isUnreachable` |
  | ----------------- | -------------------------------- | --------------- |
  | `ApiConfigError`  | no base URL configured           | yes             |
  | `ApiNetworkError` | the request never arrived        | yes             |
  | `ApiTimeoutError` | no answer within 8 s             | yes             |
  | `ApiStatusError`  | the server answered non-2xx      | no              |
  | `ApiPayloadError` | the reply was not what we expect | no              |

  "Unreachable" failures are the ones a later retry could fix, which is what K2 needs.

- `carApi.ts`: `fetchCars()` (GET /cars).
- `bookingApi.ts`: `postBooking(booking)` (POST /bookings). It sends our local id as
  `clientBookingId`, so a retry can be recognised as the same booking.

The API is a MockAPI project, seeded from `src/data/dummy/cars.ts`. See `docs/api/`.

In tests, stub `apiConfig.baseUrl` and `globalThis.fetch` with `jest.spyOn`. No test touches the
real network.
