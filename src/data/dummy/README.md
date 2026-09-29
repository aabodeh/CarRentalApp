# data/dummy

Hard-coded sample data, typed against `src/types/`.

> **No longer the app's data source.** Since PR 4 the app reads cars from the API (MockAPI) and
> caches them on the phone. This folder stays for two reasons: it is **the seed source** for the
> API (`docs/api/cars.seed.json` is generated from it, and a test keeps them in sync), and it is
> the **test fixture** most tests use. No screen or repository imports it at runtime, and ESLint
> keeps screens out.

- `cars.ts`: ten cars for a rental shop on Funen (Odense, Svendborg, Middelfart, Nyborg). The mix
  is city cars, EVs, hybrids, a station wagon (Audi A6 Avant) and a van (VW Transporter). Day
  rates run 349–1,195 DKK. Two cars are `available: false`, so the disabled state can be
  exercised. `car-09` has deliberately the longest name, to expose wrapping problems.

**Images** are hotlinked from Unsplash's CDN, under the Unsplash License. Each one was checked to
return HTTP 200 with an image content type, and was looked at to confirm it shows that make and
model. They are representative photos: the model year or trim in a photo may not match the data
exactly.
