# data

Static, in-repo data. Right now that is the dummy dataset the app ships with
so the UI can be built before any backend exists.

Only `src/repositories/` may import from here, which is what lets us delete
the dummy source later without touching a screen.
