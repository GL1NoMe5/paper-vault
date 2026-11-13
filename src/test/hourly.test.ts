import { describe, it, expect } from 'vitest';
import {
  calculateHourlyIncome,
  formatHourlyFormula,
  parseHourlyInput,
  HOURLY_INCOME_SOURCES,
  DEFAULT_HOURLY_SOURCE,
  QUICK_HOURS_PRESETS,
} from '../utils/hourly';

describe('Hourly Income Utility (src/utils/hourly.ts)', () => {
  describe('calculateHourlyIncome', () => {
    it('calculates standard integer hourly income and generates formula metadata', () => {
      const result = calculateHourlyIncome(2500, 15);
      expect(result.amount).toBe(37500);
      expect(result.formula).toBe('15 ч. × 2 500 = 37 500');
      expect(result.metadata).toEqual({
        hourlyRate: 2500,
        hoursWorked: 15,
        formula: '15 ч. × 2 500 = 37 500',
      });
    });

    it('calculates fractional hours accurately', () => {
      const result = calculateHourlyIncome(3000, 7.5);
      expect(result.amount).toBe(22500);
      expect(result.formula).toBe('7,5 ч. × 3 000 = 22 500');
      expect(result.metadata.hoursWorked).toBe(7.5);
    });

    it('calculates micro-fractional hours (e.g. 4.25 hours)', () => {
      const result = calculateHourlyIncome(2200, 4.25);
      expect(result.amount).toBe(9350);
      expect(result.formula).toBe('4,25 ч. × 2 200 = 9 350');
    });

    it('handles rounding to 2 decimal places for fractional amounts', () => {
      const result = calculateHourlyIncome(333.333, 3);
      expect(result.amount).toBe(1000);
    });

    it('guards against zero rate by returning amount 0 and safe formula', () => {
      const result = calculateHourlyIncome(0, 8);
      expect(result.amount).toBe(0);
      expect(result.formula).toBe('8 ч. × 0 = 0');
    });

    it('guards against zero hours by returning amount 0 and safe formula', () => {
      const result = calculateHourlyIncome(2500, 0);
      expect(result.amount).toBe(0);
      expect(result.formula).toBe('0 ч. × 2 500 = 0');
    });

    it('guards against negative hourly rate', () => {
      const result = calculateHourlyIncome(-1000, 5);
      expect(result.amount).toBe(0);
      expect(result.formula).toBe('0 ч. × 0 = 0');
      expect(result.metadata.hourlyRate).toBe(0);
    });

    it('guards against negative hours worked', () => {
      const result = calculateHourlyIncome(1500, -4);
      expect(result.amount).toBe(0);
      expect(result.formula).toBe('0 ч. × 0 = 0');
      expect(result.metadata.hoursWorked).toBe(0);
    });

    it('guards against non-finite values (NaN, Infinity)', () => {
      expect(calculateHourlyIncome(NaN, 10).amount).toBe(0);
      expect(calculateHourlyIncome(1000, Infinity).amount).toBe(0);
      expect(calculateHourlyIncome(-Infinity, 5).amount).toBe(0);
    });

    it('handles upper boundary for maximum monthly work hours (744 hours)', () => {
      const result = calculateHourlyIncome(1500, 744);
      expect(result.amount).toBe(1116000);
      expect(result.formula).toBe('744 ч. × 1 500 = 1 116 000');
    });

    it('handles large consulting rate without precision loss', () => {
      const result = calculateHourlyIncome(150000, 40);
      expect(result.amount).toBe(6000000);
      expect(result.formula).toBe('40 ч. × 150 000 = 6 000 000');
    });
  });

  describe('formatHourlyFormula', () => {
    it('formats formula without currency symbol', () => {
      const formatted = formatHourlyFormula(15, 2500, 37500);
      expect(formatted).toBe('15 ч. × 2 500 = 37 500');
    });

    it('formats formula with currency symbol', () => {
      const formatted = formatHourlyFormula(15, 2500, 37500, '₸');
      expect(formatted).toBe('15 ч. × 2 500 = 37 500 ₸');
    });

    it('formats formula with fractional numbers and currency', () => {
      const formatted = formatHourlyFormula(7.5, 3000, 22500, '₽');
      expect(formatted).toBe('7,5 ч. × 3 000 = 22 500 ₽');
    });
  });

  describe('parseHourlyInput', () => {
    it('parses clean integer strings', () => {
      expect(parseHourlyInput('2500')).toBe(2500);
    });

    it('parses Russian decimal strings with commas', () => {
      expect(parseHourlyInput('7,5')).toBe(7.5);
      expect(parseHourlyInput('4,25')).toBe(4.25);
    });

    it('parses strings with standard decimal points', () => {
      expect(parseHourlyInput('7.5')).toBe(7.5);
    });

    it('strips leading, trailing, and embedded spaces', () => {
      expect(parseHourlyInput(' 2 500 ')).toBe(2500);
    });

    it('returns null for non-numeric or empty strings', () => {
      expect(parseHourlyInput('')).toBeNull();
      expect(parseHourlyInput('abc')).toBeNull();
      expect(parseHourlyInput('   ')).toBeNull();
    });

    it('returns null for negative input strings', () => {
      expect(parseHourlyInput('-1500')).toBeNull();
    });
  });

  describe('HOURLY_INCOME_SOURCES & presets', () => {
    it('contains all 4 required Russian income sources', () => {
      expect(HOURLY_INCOME_SOURCES).toHaveLength(4);
      const names = HOURLY_INCOME_SOURCES.map((s) => s.name);
      expect(names).toContain('Основная работа');
      expect(names).toContain('Подработка');
      expect(names).toContain('Фриланс');
      expect(names).toContain('Подарок / Другое');
    });

    it('each source has valid id, non-empty icon, and hex color token', () => {
      for (const src of HOURLY_INCOME_SOURCES) {
        expect(src.id).toBeTruthy();
        expect(src.icon).toBeTruthy();
        expect(src.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('defines default source as "Основная работа"', () => {
      expect(DEFAULT_HOURLY_SOURCE).toBe('Основная работа');
    });

    it('defines standard quick hour presets [1, 2, 4, 8]', () => {
      expect(QUICK_HOURS_PRESETS).toEqual([1, 2, 4, 8]);
    });
  });
});
