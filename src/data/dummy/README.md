# data/dummy

Hard-coded sample cars and bookings, typed against `src/types/`.

Keep it realistic enough to expose layout problems — long car names, missing
images, prices of different lengths — and small enough to read at a glance.

This folder is temporary by design. When the API lands, the dummy source is
either deleted or kept behind a flag for tests; either way the change is
confined to `src/repositories/`.
