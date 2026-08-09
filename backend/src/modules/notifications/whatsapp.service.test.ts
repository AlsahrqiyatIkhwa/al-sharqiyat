import { describe, it, expect } from 'vitest';
import { toJordanE164 } from './whatsapp.service';

describe('toJordanE164', () => {
  it('replaces a leading 0 with the 962 country code', () => {
    expect(toJordanE164('0791234567')).toBe('962791234567');
  });

  it('strips non-digit characters (spaces, dashes) before converting', () => {
    expect(toJordanE164('079-123 4567')).toBe('962791234567');
  });

  it('leaves an already-international number unchanged', () => {
    expect(toJordanE164('962791234567')).toBe('962791234567');
  });
});
