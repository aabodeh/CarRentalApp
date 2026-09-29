import { cars } from '../../../src/data/dummy/cars';
import { fetchCars } from '../../../src/services/api/carApi';
import {
  ApiConfigError,
  ApiNetworkError,
  ApiPayloadError,
  ApiStatusError,
  ApiTimeoutError,
  REQUEST_TIMEOUT_MS,
  isUnreachable,
} from '../../../src/services/api/client';
import { apiConfig } from '../../../src/services/api/config';

/** A minimal stand-in for a fetch Response: only what the client reads. */
const reply = (status: number, body: unknown, json = true) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: json ? async () => body : async () => JSON.parse('<html>'),
  }) as unknown as Response;

describe('api client (via fetchCars)', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(apiConfig, 'baseUrl').mockReturnValue('https://api.test/v1');
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns validated cars from GET /cars', async () => {
    fetchSpy.mockResolvedValue(reply(200, cars));

    await expect(fetchCars()).resolves.toEqual(cars);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.test/v1/cars',
      expect.objectContaining({ method: 'GET', signal: expect.any(Object) })
    );
  });

  it('throws ApiTimeoutError when the server takes longer than the timeout', async () => {
    jest.useFakeTimers();
    fetchSpy.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
          );
        })
    );

    const result = fetchCars();
    const assertion = expect(result).rejects.toThrow(ApiTimeoutError);
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);

    await assertion;
  });

  it('throws ApiStatusError with the status on a 500', async () => {
    fetchSpy.mockResolvedValue(reply(500, { message: 'boom' }));

    await expect(fetchCars()).rejects.toMatchObject({ name: 'ApiStatusError', status: 500 });
    await expect(fetchCars()).rejects.toBeInstanceOf(ApiStatusError);
  });

  it('throws ApiPayloadError when a car is missing a field', async () => {
    const broken = cars.map((car, i) => (i === 3 ? { ...car, pricePerDay: undefined } : car));
    fetchSpy.mockResolvedValue(reply(200, broken));

    await expect(fetchCars()).rejects.toThrow(ApiPayloadError);
  });

  it('throws ApiPayloadError when the body is not JSON', async () => {
    fetchSpy.mockResolvedValue(reply(200, null, false));

    await expect(fetchCars()).rejects.toThrow(ApiPayloadError);
  });

  it('throws ApiNetworkError when the request never reaches the server', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Network request failed'));

    await expect(fetchCars()).rejects.toThrow(ApiNetworkError);
  });

  it('throws ApiConfigError, without calling fetch, when no base URL is configured', async () => {
    jest.spyOn(apiConfig, 'baseUrl').mockReturnValue(null);

    await expect(fetchCars()).rejects.toThrow(ApiConfigError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('isUnreachable', () => {
  it('is true for failures that a later retry could fix', () => {
    expect(isUnreachable(new ApiNetworkError(new Error('x')))).toBe(true);
    expect(isUnreachable(new ApiTimeoutError())).toBe(true);
    expect(isUnreachable(new ApiConfigError())).toBe(true);
  });

  it('is false when the server answered and said no', () => {
    expect(isUnreachable(new ApiStatusError(422))).toBe(false);
    expect(isUnreachable(new ApiPayloadError('/cars'))).toBe(false);
    expect(isUnreachable(new Error('other'))).toBe(false);
  });
});
