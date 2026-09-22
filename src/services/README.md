# services

Outbound integrations. Today that means the HTTP API; later it could include
anything else the app talks to.

**Goes here:** transport-level code — building requests, parsing responses,
mapping HTTP errors onto our own error types.

**Does not go here:** caching, retry policy or business rules. Those belong to
the repository that calls this service.

Only `src/repositories/` may import from here. ESLint enforces that.
