import { describe, it, expect } from 'vitest';
import { formatINR, formatArea, formatDate } from '../lib/utils.js';

describe('Frontend Utility Functions', () => {
  describe('formatINR (Indian Rupee Currency Formatter)', () => {
    it('correctly converts integer paise into formatted INR string', () => {
      // 49900 paise = ₹499
      const feeFormatted = formatINR(49900);
      expect(feeFormatted).toContain('499');

      // 18500000 paise = ₹1,85,000
      const quoteFormatted = formatINR(18500000);
      expect(quoteFormatted).toContain('1,85,000');
    });

    it('handles zero paise gracefully', () => {
      const formatted = formatINR(0);
      expect(formatted).toContain('0');
    });
  });

  describe('formatArea', () => {
    it('appends correct measurement units for feet', () => {
      expect(formatArea(1800, 'FEET')).toBe('1,800 sq.ft');
    });

    it('appends correct measurement units for metres', () => {
      expect(formatArea(250, 'METRES')).toBe('250 sq.m');
    });
  });

  describe('formatDate', () => {
    it('handles ISO date strings and returns readable date', () => {
      const formatted = formatDate('2026-10-15T10:00:00Z');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('Oct');
    });

    it('returns N/A when null or undefined', () => {
      expect(formatDate(null)).toBe('N/A');
    });
  });
});
