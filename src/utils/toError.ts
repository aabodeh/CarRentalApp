/** Anything can be thrown in JavaScript. Normalise it to an Error so the UI can rely on `.message`. */
export function toError(thrown: unknown): Error {
  return thrown instanceof Error ? thrown : new Error(String(thrown));
}
