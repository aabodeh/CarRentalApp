# services/api

The HTTP client and one module per resource (`carApi.ts`, `bookingApi.ts`).

Each function does exactly one request and returns parsed data or throws a
typed error. No retries and no caching here — the repository owns those, so
that retry behaviour (K2) is written once rather than per endpoint.

While the app still runs on dummy data this folder stays empty. That is fine:
the repository is already the boundary, so filling it in later touches no UI.
