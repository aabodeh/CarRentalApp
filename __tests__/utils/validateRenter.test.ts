import { fieldsNeedAttention, validateRenter } from '../../src/utils/validateRenter';

describe('validateRenter', () => {
  it('accepts a name and a plausible email', () => {
    expect(validateRenter({ renterName: 'Mette', renterEmail: 'mette@example.dk' })).toEqual({});
  });

  it('asks for a name and an email when both are blank', () => {
    expect(validateRenter({ renterName: '  ', renterEmail: '' })).toEqual({
      renterName: 'Enter your name.',
      renterEmail: 'Enter your email address.',
    });
  });

  it('rejects an email without a domain', () => {
    expect(validateRenter({ renterName: 'Mette', renterEmail: 'mette@' }).renterEmail).toBe(
      'Enter a valid email address, like name@example.com.'
    );
  });
});

describe('fieldsNeedAttention', () => {
  it('says how many fields need attention, in the singular and plural', () => {
    expect(fieldsNeedAttention(1)).toBe('1 field needs attention');
    expect(fieldsNeedAttention(2)).toBe('2 fields need attention');
  });
});
