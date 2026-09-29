# API

The app talks to a hosted MockAPI project (mockapi.io). We don't build or host our own backend.
MockAPI serves plain JSON over REST with no authentication, so its URL is not a secret.

The base URL goes in `app.json` → `expo.extra.apiBaseUrl`, e.g.
`https://<project-id>.mockapi.io/api/v1`. It's read at runtime by
`src/services/api/config.ts`, so nothing in code is hard-coded. While it's empty, every request
fails with `ApiConfigError`, and the app behaves as offline with no cache.

## Resources

Create both resources in the MockAPI project. MockAPI adds `id` (String) itself.

**`cars`** (read by the app, never written)

| Field          | Type                                               |
| -------------- | -------------------------------------------------- |
| `make`         | String                                             |
| `model`        | String                                             |
| `year`         | Number                                             |
| `imageUrl`     | String                                             |
| `pricePerDay`  | Number                                             |
| `seats`        | Number                                             |
| `transmission` | String: `manual` or `automatic`                    |
| `fuel`         | String: `petrol`, `diesel`, `electric` or `hybrid` |
| `location`     | String                                             |
| `available`    | Boolean                                            |

**`bookings`** (the app POSTs here when a booking syncs)

| Field             | Type                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| `carId`           | String                                                                          |
| `renterName`      | String                                                                          |
| `renterEmail`     | String                                                                          |
| `startDate`       | String, `YYYY-MM-DD`                                                            |
| `endDate`         | String, `YYYY-MM-DD`                                                            |
| `totalPrice`      | Number                                                                          |
| `createdAt`       | String, ISO-8601                                                                |
| `clientBookingId` | String: the app's local booking id, so a retried request can be recognised (K2) |

## Seeding `cars`

Paste [`cars.seed.json`](cars.seed.json) into the `cars` resource's data. It's generated from
`src/data/dummy/cars.ts`, without `id`. `__tests__/data/dummy/seed.test.ts` fails if the two
drift apart. If you change a dummy car, regenerate the seed and re-seed MockAPI.

MockAPI numbers the cars `"1"` to `"10"`. Nothing in the app depends on the dummy ids
(`car-01`, …); only tests use them.

Every reply is validated against `src/types/guards.ts` before it's used. So if a field is renamed
or mistyped in MockAPI, the app shows the error state (or keeps its cache) instead of crashing.
