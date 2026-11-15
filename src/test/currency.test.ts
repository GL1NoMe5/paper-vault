import { describe, it, expect } from 'vitest';
import {
  convertCurrency,
  formatCurrency,
  rebaseRates,
  getDefaultRates,
  roundTo,
  CURRENCY_CONFIG,
  DEFAULT_RATES_RUB,
  SUPPORTED_CURRENCIES,
  getCurrencySymbol,
  getCurrencyFlag,
  parseCurrencyInput,
  isValidRate,
  getDualCurrencyDisplay,
} from '../utils/currency';
import { ExchangeRates } from '../types';

describe('Multi-Currency Engine (src/utils/currency.ts)', () => {
  describe('Currency Configurations & Supported Set', () => {
    it('supports exactly 5 currencies', () => {
      expect(SUPPORTED_CURRENCIES).toEqual(['KZT', 'RUB', 'USD', 'EUR', 'CZK']);
      expect(Object.keys(CURRENCY_CONFIG)).toHaveLength(5);
    });

    it('contains correct symbols, flags, and Russian names for all currencies', () => {
      expect(CURRENCY_CONFIG.KZT.symbol).toBe('₸');
      expect(CURRENCY_CONFIG.KZT.flag).toBe('🇰🇿');
      expect(CURRENCY_CONFIG.KZT.name).toBe('Казахстанский тенге');

      expect(CURRENCY_CONFIG.RUB.symbol).toBe('₽');
      expect(CURRENCY_CONFIG.RUB.flag).toBe('🇷🇺');
      expect(CURRENCY_CONFIG.RUB.name).toBe('Российский рубль');

      expect(CURRENCY_CONFIG.USD.symbol).toBe('$');
      expect(CURRENCY_CONFIG.USD.flag).toBe('🇺🇸');

      expect(CURRENCY_CONFIG.EUR.symbol).toBe('€');
      expect(CURRENCY_CONFIG.EUR.flag).toBe('🇪🇺');

      expect(CURRENCY_CONFIG.CZK.symbol).toBe('Kč');
      expect(CURRENCY_CONFIG.CZK.flag).toBe('🇨🇿');
    });

    it('helper functions getCurrencySymbol and getCurrencyFlag return expected values', () => {
      expect(getCurrencySymbol('KZT')).toBe('₸');
      expect(getCurrencySymbol('RUB')).toBe('₽');
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencyFlag('KZT')).toBe('🇰🇿');
      expect(getCurrencyFlag('RUB')).toBe('🇷🇺');
    });
  });

  describe('Currency Conversion (convertCurrency)', () => {
    const rates: ExchangeRates = DEFAULT_RATES_RUB; // Base: RUB

    it('returns exact amount on identity conversion (same currency)', () => {
      expect(convertCurrency(100, 'RUB', 'RUB', rates)).toBe(100);
      expect(convertCurrency(500, 'USD', 'USD', rates)).toBe(500);
      expect(convertCurrency(1250, 'KZT', 'KZT', rates)).toBe(1250);
      expect(convertCurrency(33.33, 'EUR', 'EUR', rates)).toBe(33.33);
    });

    it('converts foreign currency to base currency correctly', () => {
      // 100 USD at 92.5 = 9250 RUB
      expect(convertCurrency(100, 'USD', 'RUB', rates)).toBe(9250);
      // 10 EUR at 100.5 = 1005 RUB
      expect(convertCurrency(10, 'EUR', 'RUB', rates)).toBe(1005);
      // 1000 KZT at 0.188 = 188 RUB
      expect(convertCurrency(1000, 'KZT', 'RUB', rates)).toBe(188);
      // 100 CZK at 3.95 = 395 RUB
      expect(convertCurrency(100, 'CZK', 'RUB', rates)).toBe(395);
    });

    it('converts base currency to foreign currency correctly', () => {
      // 9250 RUB to USD = 100 USD
      expect(convertCurrency(9250, 'RUB', 'USD', rates)).toBe(100);
      // 1005 RUB to EUR = 10 EUR
      expect(convertCurrency(1005, 'RUB', 'EUR', rates)).toBe(10);
      // 188 RUB to KZT = 1000 KZT
      expect(convertCurrency(188, 'RUB', 'KZT', rates)).toBe(1000);
      // 395 RUB to CZK = 100 CZK
      expect(convertCurrency(395, 'RUB', 'CZK', rates)).toBe(100);
    });

    it('converts cross-currencies (neither is base) with high precision', () => {
      // 100 USD -> EUR: 100 * (92.5 / 100.5) = 92.0398... -> 92.04
      expect(convertCurrency(100, 'USD', 'EUR', rates)).toBe(92.04);
      // 100 EUR -> USD: 100 * (100.5 / 92.5) = 108.648... -> 108.65
      expect(convertCurrency(100, 'EUR', 'USD', rates)).toBe(108.65);
      // 1000 KZT -> CZK: 1000 * (0.188 / 3.95) = 47.5949... -> 47.59
      expect(convertCurrency(1000, 'KZT', 'CZK', rates)).toBe(47.59);
      // 100 CZK -> KZT: 100 * (3.95 / 0.188) = 2101.063... -> 2101.06
      expect(convertCurrency(100, 'CZK', 'KZT', rates)).toBe(2101.06);
    });

    it('handles zero amount gracefully', () => {
      expect(convertCurrency(0, 'USD', 'RUB', rates)).toBe(0);
      expect(convertCurrency(0, 'EUR', 'USD', rates)).toBe(0);
    });

    it('handles negative amounts correctly (symmetric sign)', () => {
      expect(convertCurrency(-100, 'USD', 'RUB', rates)).toBe(-9250);
      expect(convertCurrency(-50, 'USD', 'EUR', rates)).toBe(-46.02);
    });

    it('handles large numbers without overflow', () => {
      expect(convertCurrency(1_000_000, 'USD', 'RUB', rates)).toBe(92_500_000);
    });

    it('handles non-finite and NaN values gracefully', () => {
      expect(convertCurrency(NaN, 'USD', 'RUB', rates)).toBe(0);
      expect(convertCurrency(Infinity, 'USD', 'RUB', rates)).toBe(0);
      expect(convertCurrency(-Infinity, 'USD', 'RUB', rates)).toBe(0);
    });

    it('handles missing or zero exchange rates gracefully without crashing', () => {
      const brokenRates: ExchangeRates = { ...rates, USD: 0 };
      expect(convertCurrency(100, 'USD', 'RUB', brokenRates)).toBe(0);
      expect(convertCurrency(100, 'RUB', 'USD', brokenRates)).toBe(0);
      expect(convertCurrency(100, 'RUB', 'RUB', brokenRates)).toBe(100);
    });
  });

  describe('Rate Rebasing (rebaseRates)', () => {
    it('sets the new base currency rate to exactly 1.0', () => {
      const rebasedUSD = rebaseRates(DEFAULT_RATES_RUB, 'USD');
      expect(rebasedUSD.USD).toBe(1.0);

      const rebasedKZT = rebaseRates(DEFAULT_RATES_RUB, 'KZT');
      expect(rebasedKZT.KZT).toBe(1.0);

      const rebasedCZK = rebaseRates(DEFAULT_RATES_RUB, 'CZK');
      expect(rebasedCZK.CZK).toBe(1.0);
    });

    it('calculates reciprocal rate for the old base currency', () => {
      const rebasedUSD = rebaseRates(DEFAULT_RATES_RUB, 'USD');
      // 1 RUB in USD base = 1 / 92.5
      expect(rebasedUSD.RUB).toBeCloseTo(1 / 92.5, 6);

      const rebasedKZT = rebaseRates(DEFAULT_RATES_RUB, 'KZT');
      // 1 RUB in KZT base = 1 / 0.188 ≈ 5.3191489
      expect(rebasedKZT.RUB).toBeCloseTo(1 / 0.188, 6);
    });

    it('guarantees cross-currency conversion invariance under rebasing', () => {
      const ratesUSD = rebaseRates(DEFAULT_RATES_RUB, 'USD');
      const ratesKZT = rebaseRates(DEFAULT_RATES_RUB, 'KZT');

      // Conversion of 100 EUR to USD must be mathematically identical under all bases
      const convertedUnderRUB = convertCurrency(100, 'EUR', 'USD', DEFAULT_RATES_RUB);
      const convertedUnderUSD = convertCurrency(100, 'EUR', 'USD', ratesUSD);
      const convertedUnderKZT = convertCurrency(100, 'EUR', 'USD', ratesKZT);

      expect(convertedUnderUSD).toBe(convertedUnderRUB);
      expect(convertedUnderKZT).toBe(convertedUnderRUB);
    });

    it('supports round-trip rebasing without degradation', () => {
      const rebasedUSD = rebaseRates(DEFAULT_RATES_RUB, 'USD');
      const roundTripRUB = rebaseRates(rebasedUSD, 'RUB');

      expect(roundTripRUB.RUB).toBe(1.0);
      expect(roundTripRUB.USD).toBeCloseTo(92.5, 8);
      expect(roundTripRUB.EUR).toBeCloseTo(100.5, 8);
      expect(roundTripRUB.KZT).toBeCloseTo(0.188, 8);
      expect(roundTripRUB.CZK).toBeCloseTo(3.95, 8);
    });

    it('handles invalid newBase safely', () => {
      const invalidRates = { ...DEFAULT_RATES_RUB, USD: 0 };
      const fallback = rebaseRates(invalidRates, 'USD');
      expect(fallback).toEqual(invalidRates);
    });

    it('getDefaultRates returns valid rebased rates for any currency', () => {
      const rubRates = getDefaultRates('RUB');
      expect(rubRates.RUB).toBe(1.0);
      const kztRates = getDefaultRates('KZT');
      expect(kztRates.KZT).toBe(1.0);
      expect(kztRates.USD).toBeGreaterThan(400); // ~492
    });
  });

  describe('Currency Formatting (formatCurrency)', () => {
    it('formats integer amounts without decimals by default', () => {
      expect(formatCurrency(15000, 'RUB')).toBe('15 000 ₽');
      expect(formatCurrency(2500, 'KZT')).toBe('2 500 ₸');
      expect(formatCurrency(100, 'USD')).toBe('100 $');
      expect(formatCurrency(50, 'EUR')).toBe('50 €');
      expect(formatCurrency(350, 'CZK')).toBe('350 Kč');
    });

    it('formats fractional amounts with 2 decimals by default', () => {
      expect(formatCurrency(15.5, 'USD')).toBe('15,50 $');
      expect(formatCurrency(1234.56, 'RUB')).toBe('1 234,56 ₽');
      expect(formatCurrency(99.99, 'EUR')).toBe('99,99 €');
    });

    it('forces 2 decimals when showDecimals is true', () => {
      expect(formatCurrency(15000, 'RUB', true)).toBe('15 000,00 ₽');
      expect(formatCurrency(100, 'USD', true)).toBe('100,00 $');
      expect(formatCurrency(0, 'RUB', true)).toBe('0,00 ₽');
    });

    it('forces integer rounding when showDecimals is false', () => {
      expect(formatCurrency(15.75, 'USD', false)).toBe('16 $');
      expect(formatCurrency(1234.2, 'RUB', false)).toBe('1 234 ₽');
      expect(formatCurrency(1234.8, 'RUB', false)).toBe('1 235 ₽');
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0, 'RUB')).toBe('0 ₽');
      expect(formatCurrency(0, 'KZT')).toBe('0 ₸');
      expect(formatCurrency(0, 'USD')).toBe('0 $');
    });

    it('formats negative numbers with minus sign correctly', () => {
      expect(formatCurrency(-450, 'USD')).toBe('-450 $');
      expect(formatCurrency(-1500, 'RUB')).toBe('-1 500 ₽');
      expect(formatCurrency(-25.5, 'EUR')).toBe('-25,50 €');
    });

    it('normalizes negative zero to positive zero without minus sign', () => {
      expect(formatCurrency(-0, 'RUB')).toBe('0 ₽');
      expect(formatCurrency(-0, 'USD')).toBe('0 $');
      expect(formatCurrency(roundTo(-0.001, 2), 'RUB')).toBe('0 ₽');
    });

    it('formats millions with proper space grouping', () => {
      expect(formatCurrency(10000000, 'KZT')).toBe('10 000 000 ₸');
    });

    it('handles NaN and non-finite inputs by returning zero format', () => {
      expect(formatCurrency(NaN, 'RUB')).toBe('0 ₽');
      expect(formatCurrency(Infinity, 'USD')).toBe('0 $');
    });
  });

  describe('Rounding Precision (roundTo)', () => {
    it('correctly rounds halfway values without IEEE-754 binary floating point absorption', () => {
      expect(roundTo(1.005, 2)).toBe(1.01);
      expect(roundTo(0.145, 2)).toBe(0.15);
      expect(roundTo(0.285, 2)).toBe(0.29);
      expect(roundTo(0.565, 2)).toBe(0.57);
      expect(roundTo(1.015, 2)).toBe(1.02);
      expect(roundTo(1.255, 2)).toBe(1.26);
    });

    it('preserves symmetric negative rounding on halfway values', () => {
      expect(roundTo(-1.005, 2)).toBe(-1.01);
      expect(roundTo(-0.145, 2)).toBe(-0.15);
    });

    it('normalizes negative zero to positive zero', () => {
      expect(roundTo(-0.001, 2)).toBe(0);
      expect(Object.is(roundTo(-0.001, 2), 0)).toBe(true);
      expect(roundTo(-0, 2)).toBe(0);
      expect(Object.is(roundTo(-0, 2), 0)).toBe(true);
    });

    it('returns zero for NaN and non-finite inputs', () => {
      expect(roundTo(NaN, 2)).toBe(0);
      expect(roundTo(Infinity, 2)).toBe(0);
      expect(roundTo(-Infinity, 2)).toBe(0);
    });
  });

  describe('Utility & Validation Helpers', () => {
    it('parseCurrencyInput cleans spaces and commas', () => {
      expect(parseCurrencyInput('1 250,50')).toBe(1250.5);
      expect(parseCurrencyInput('2500.75')).toBe(2500.75);
      expect(parseCurrencyInput('  100  ')).toBe(100);
      expect(parseCurrencyInput('invalid')).toBeNull();
      expect(parseCurrencyInput('')).toBeNull();
    });

    it('isValidRate verifies positive finite numbers', () => {
      expect(isValidRate(92.5)).toBe(true);
      expect(isValidRate(0.001)).toBe(true);
      expect(isValidRate(0)).toBe(false);
      expect(isValidRate(-1)).toBe(false);
      expect(isValidRate(NaN)).toBe(false);
      expect(isValidRate(Infinity)).toBe(false);
    });
  });

  describe('Live Dual Currency Display Helper (getDualCurrencyDisplay)', () => {
    const rates: ExchangeRates = {
      RUB: 1.0,
      USD: 92.5,
      EUR: 100.5,
      KZT: 0.188,
      CZK: 3.95,
    };

    it('returns isDifferent: false when currency matches baseCurrency', () => {
      const display = getDualCurrencyDisplay(5000, 'RUB', 'RUB', rates);
      expect(display.isDifferent).toBe(false);
      expect(display.convertedAmount).toBeNull();
      expect(display.convertedFormatted).toBeNull();
      expect(display.approximateText).toBeNull();
      expect(display.originalFormatted).toBe('5 000 ₽');
      expect(display.combinedText).toBe('5 000 ₽');
    });

    it('returns isDifferent: false when amount is 0 or non-finite', () => {
      const displayZero = getDualCurrencyDisplay(0, 'USD', 'RUB', rates);
      expect(displayZero.isDifferent).toBe(false);
      expect(displayZero.convertedAmount).toBeNull();

      const displayNaN = getDualCurrencyDisplay(NaN, 'USD', 'RUB', rates);
      expect(displayNaN.isDifferent).toBe(false);
      expect(displayNaN.convertedAmount).toBeNull();
    });

    it('calculates live conversion and formatted approximate badge when currency differs from baseCurrency', () => {
      // 100 USD to RUB (100 * 92.5 = 9250 RUB)
      const displayUsd = getDualCurrencyDisplay(100, 'USD', 'RUB', rates);
      expect(displayUsd.isDifferent).toBe(true);
      expect(displayUsd.originalFormatted).toBe('100 $');
      expect(displayUsd.convertedAmount).toBe(9250);
      expect(displayUsd.convertedFormatted).toBe('9 250 ₽');
      expect(displayUsd.approximateText).toBe('≈ 9 250 ₽');
      expect(displayUsd.combinedText).toBe('100 $ (≈ 9 250 ₽)');
    });

    it('correctly calculates KZT to CZK conversion per user prompt requirement', () => {
      // 300 000 KZT to CZK:
      // rates relative to RUB: KZT = 0.188, CZK = 3.95
      // 300000 * (0.188 / 3.95) = 14278.48...
      // Or if CZK base rates are used:
      const czkRates = rebaseRates(rates, 'CZK');
      const displayKzt = getDualCurrencyDisplay(300000, 'KZT', 'CZK', czkRates);
      expect(displayKzt.isDifferent).toBe(true);
      expect(displayKzt.originalFormatted).toBe('300 000 ₸');
      expect(displayKzt.convertedAmount).toBeGreaterThan(14000);
      expect(displayKzt.convertedFormatted).toContain('Kč');
      expect(displayKzt.approximateText).toContain('≈');
      expect(displayKzt.combinedText).toContain('300 000 ₸');
    });
  });
});
