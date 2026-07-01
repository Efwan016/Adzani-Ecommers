import { describe, expect, it } from 'vitest';
import {
  formatPhoneDisplay,
  getWhatsAppChatUrl,
  isIndonesianPhoneTooShort,
  normalizeIndonesianPhone,
} from './phone';

describe('phone helpers', () => {
  it('normalizes local Indonesian numbers from 08 to 628', () => {
    expect(normalizeIndonesianPhone('0812-3456-7890')).toBe('6281234567890');
  });

  it('normalizes +62 numbers to 62', () => {
    expect(normalizeIndonesianPhone('+62 812 3456 7890')).toBe('6281234567890');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeIndonesianPhone('')).toBe('');
    expect(normalizeIndonesianPhone(null)).toBe('');
    expect(formatPhoneDisplay(undefined)).toBe('');
    expect(getWhatsAppChatUrl('')).toBeNull();
  });

  it('detects normalized numbers that are too short', () => {
    expect(isIndonesianPhoneTooShort('08123')).toBe(true);
    expect(isIndonesianPhoneTooShort('+62 812 3456 7890')).toBe(false);
    expect(isIndonesianPhoneTooShort('')).toBe(false);
  });
});
