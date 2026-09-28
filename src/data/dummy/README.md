# data/dummy

Hard-coded sample data, typed against `src/types/`.

> **Temporary by design.** This gets replaced by the API in a later PR. When that happens, the
> dummy source is either deleted or kept behind a flag for tests. Either way, the change is
> confined to `src/repositories/`, and no screen imports this folder (ESLint enforces that).

- `cars.ts`: ten cars for a rental shop on Funen (Odense, Svendborg, Middelfart, Nyborg). The mix
  is city cars, EVs, hybrids, a station wagon (Audi A6 Avant) and a van (VW Transporter). Day
  rates run 349–1,195 DKK. Two cars are `available: false`, so the disabled state can be
  exercised. `car-09` has deliberately the longest name, to expose wrapping problems.

**Images** are hotlinked from Unsplash's CDN, under the Unsplash License. Each one was checked to
return HTTP 200 with an image content type, and was looked at to confirm it shows that make and
model. They are representative photos: the model year or trim in a photo may not match the data
exactly.
