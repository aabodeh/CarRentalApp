import { apiConfig } from './config';

/** Give up on a request after this long. Slow mobile networks get time; a dead one does not hang. */
export const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Every way a request can fail, as its own type, so a repository can tell "try again later"
 * (network, timeout, no URL) from "the server said no" (status, payload).
 */
export class ApiConfigError extends Error {
  constructor() {
    super('No API base URL is configured (app.json → expo.extra.apiBaseUrl)');
    this.name = 'ApiConfigError';
  }
}

export class ApiNetworkError extends Error {
  readonly cause: Error;

  constructor(cause: Error) {
    super(`The request did not reach the server: ${cause.message}`);
    this.name = 'ApiNetworkError';
    this.cause = cause;
  }
}

export class ApiTimeoutError extends Error {
  constructor() {
    super(`The server did not answer within ${REQUEST_TIMEOUT_MS / 1000} seconds`);
    this.name = 'ApiTimeoutError';
  }
}

export class ApiStatusError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`The server answered with status ${status}`);
    this.name = 'ApiStatusError';
    this.status = status;
  }
}

export class ApiPayloadError extends Error {
  constructor(path: string) {
    super(`The server's reply to ${path} did not have the expected shape`);
    this.name = 'ApiPayloadError';
  }
}

/** True for failures a later retry could fix: we never heard from the server. */
export function isUnreachable(error: unknown): boolean {
  return (
    error instanceof ApiNetworkError ||
    error instanceof ApiTimeoutError ||
    error instanceof ApiConfigError
  );
}

type RequestOptions = {
  method: 'GET' | 'POST';
  body?: unknown;
};

/**
 * One request, validated. Returns the body only if `guard` accepts it, so nothing unchecked ever
 * becomes a domain object. No retries or caching here — repositories own those (K1, K2).
 */
export async function request<T>(
  path: string,
  guard: (value: unknown) => value is T,
  { method, body }: RequestOptions = { method: 'GET' }
): Promise<T> {
  const baseUrl = apiConfig.baseUrl();
  if (!baseUrl) throw new ApiConfigError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (thrown) {
      if (controller.signal.aborted) throw new ApiTimeoutError();
      throw new ApiNetworkError(thrown instanceof Error ? thrown : new Error(String(thrown)));
    }

    if (!response.ok) throw new ApiStatusError(response.status);

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      if (controller.signal.aborted) throw new ApiTimeoutError();
      throw new ApiPayloadError(path);
    }
    if (!guard(payload)) throw new ApiPayloadError(path);
    return payload;
  } finally {
    clearTimeout(timer);
  }
}
