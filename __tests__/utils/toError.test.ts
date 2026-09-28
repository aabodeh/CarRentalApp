import { toError } from '../../src/utils/toError';

describe('toError', () => {
  it('passes an Error through unchanged', () => {
    const error = new TypeError('boom');
    expect(toError(error)).toBe(error);
  });

  it('wraps anything else in an Error', () => {
    expect(toError('offline')).toEqual(new Error('offline'));
    expect(toError(undefined).message).toBe('undefined');
  });
});
