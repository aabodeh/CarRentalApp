# API

The app talks to a hosted MockAPI project (mockapi.io). We don't build or host our own backend.
MockAPI serves plain JSON over REST with no authentication, so its URL is not a secret.

The base URL goes in `app.json` → `expo.extra.apiBaseUrl`, e.g.
`https://<project-id>.mockapi.io/api/v1`. It's read at runtime by
`src/services/api/config.ts`, so nothing in code is hard-coded. While it's empty, every request
fails with `ApiConfigError`, and the app behaves as offline with no cache.

## Resources

Create both resources in the MockAPI project, each with an `id` (String) field.

- **Pasted data is stored as-is.** MockAPI does _not_ add ids to JSON pasted into the data editor
  (observed 2026-09-29, FL-015), so the `cars` seed carries its own ids.
- **POST generates the `id`** ("1", "2", …) and keeps every field we send, including our
  `createdAt` (observed 2026-09-29 with two probe bookings, deleted afterwards).
- **`GET /bookings?clientBookingId=x` matches as a substring**: `probe-a` also returned `probe-ab`.
  `findBookingByClientId` therefore compares exactly on the client.
- **No match is `404 "Not found"`, not `[]`.** An _empty collection_ does return `[]`.
  `findBookingByClientId` reads 404 as "not on the server". Without this, every retry of a booking
  the server didn't have would have been treated as a server error.

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

Open the `cars` resource's **Data** editor, replace its contents with
[`cars.seed.json`](cars.seed.json), and save. Then open `<base URL>/cars` in a browser and
check that you get 10 cars, **each with an `id`**.

The seed is generated from `src/data/dummy/cars.ts`, with ids `"1"` to `"10"` in place of our
`car-01`… ids. **The ids have to be in the seed.** MockAPI's data editor stores pasted JSON as-is
and does not add them. Without ids, every car fails the app's validation (see FL-015).
`__tests__/data/dummy/seed.test.ts` fails if the seed and the dummy cars drift apart. If you change
a dummy car, regenerate the seed and re-seed MockAPI.

Every reply is validated against `src/types/guards.ts` before it's used. So if a field is renamed
or mistyped in MockAPI, the app shows the error state (or keeps its cache) instead of crashing.
