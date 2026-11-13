import { CurrencyCode, CurrencyConfig, ExchangeRates } from '../types';

/**
 * Currency configuration dictionary for all 5 supported currencies.
 */
export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
  KZT: {
    code: 'KZT',
    symbol: '₸',
    name: 'Казахстанский тенге',
    flag: '🇰🇿',
    decimals: 0,
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Российский рубль',
    flag: '🇷🇺',
    decimals: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Доллар США',
    flag: '🇺🇸',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Евро',
    flag: '🇪🇺',
    decimals: 2,
  },
  CZK: {
    code: 'CZK',
    symbol: 'Kč',
    name: 'Чешская крона',
    flag: '🇨🇿',
    decimals: 0,
  },
};

export const CURRENCIES = CURRENCY_CONFIG;

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['KZT', 'RUB', 'USD', 'EUR', 'CZK'];

export const DEFAULT_BASE_CURRENCY: CurrencyCode = 'RUB';

/**
 * Default realistic exchange rates relative to RUB base.
 * Stored as: "Price in Base Currency per 1 unit of foreign currency"
 * (e.g. 1 USD = 92.5 RUB, 1 EUR = 100.5 RUB, 1 KZT = 0.188 RUB, 1 CZK = 3.95 RUB)
 */
export const DEFAULT_RATES_RUB: ExchangeRates = {
  RUB: 1.0,
  USD: 92.5,
  EUR: 100.5,
  KZT: 0.188,
  CZK: 3.95,
};

export const DEFAULT_RATES: ExchangeRates = DEFAULT_RATES_RUB;

/**
 * Helper to round numbers safely preserving sign symmetry and eliminating epsilon artifacts.
 * Uses exponential notation rounding to avoid IEEE-754 binary floating-point representation quirks.
 */
export function roundTo(val: number, decimals: number = 2): number {
  if (!Number.isFinite(val) || isNaN(val)) return 0;
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  const rounded = Number(Math.round(Number(abs + 'e' + decimals)) + 'e-' + decimals);
  return (sign * rounded) || 0;
}

/**
 * Converts an amount from one currency to another using the exchange rates dictionary.
 * Formula: amount * (rates[from] / rates[to])
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates
): number {
  if (!Number.isFinite(amount) || isNaN(amount)) return 0;
  if (amount === 0 || from === to) return amount;

  const rateFrom = rates?.[from];
  const rateTo = rates?.[to];

  if (!rateFrom || !rateTo || rateFrom <= 0 || rateTo <= 0) {
    return from === to ? amount : 0;
  }

  const converted = amount * (rateFrom / rateTo);
  return roundTo(converted, 2);
}

/**
 * Formats a monetary amount into Russian locale string with appropriate symbol and spacing.
 * Space character is normalized to standard ASCII space (char code 32) to prevent test mismatches.
 * Normalizes negative zero and sub-cent amounts to avoid displaying "-0 ₽".
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  showDecimals?: boolean
): string {
  if (!Number.isFinite(amount) || isNaN(amount) || amount === 0) {
    amount = 0;
  }

  const config = CURRENCY_CONFIG[currency];
  const symbol = config?.symbol ?? currency;

  // If showDecimals is explicit, use it. Otherwise, show 2 decimals only if fractional.
  const numDecimals = showDecimals !== undefined
    ? (showDecimals ? 2 : 0)
    : (amount % 1 !== 0 ? 2 : 0);

  // Normalize sub-cent or rounded-to-zero values to positive zero to avoid "-0" or "-0,00"
  let displayAmount = roundTo(amount, numDecimals);
  if (displayAmount === 0) {
    displayAmount = 0;
  }

  const formattedNumber = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: numDecimals,
    maximumFractionDigits: numDecimals,
  })
    .format(displayAmount)
    .replace(/[\u00A0\u202F]/g, ' ');

  return symbol ? `${formattedNumber} ${symbol}` : formattedNumber;
}

/**
 * Re-bases an exchange rate dictionary when the user selects a new Base Currency.
 * Invariance formula: newRates[C] = oldRates[C] / oldRates[newBase], with newRates[newBase] = 1.0.
 */
export function rebaseRates(oldRates: ExchangeRates, newBase: CurrencyCode): ExchangeRates {
  const baseFactor = oldRates?.[newBase];
  if (!baseFactor || baseFactor <= 0) {
    return { ...oldRates };
  }

  const result: Partial<ExchangeRates> = {};
  for (const c of SUPPORTED_CURRENCIES) {
    if (c === newBase) {
      result[c] = 1.0;
    } else {
      const oldVal = oldRates[c] ?? 1.0;
      result[c] = oldVal / baseFactor;
    }
  }

  return result as ExchangeRates;
}

/**
 * Returns default rates for any selected base currency.
 */
export function getDefaultRates(baseCurrency: CurrencyCode = DEFAULT_BASE_CURRENCY): ExchangeRates {
  return rebaseRates(DEFAULT_RATES_RUB, baseCurrency);
}

/**
 * Helper to get symbol for currency code.
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_CONFIG[currency]?.symbol ?? currency;
}

/**
 * Helper to get flag emoji for currency code.
 */
export function getCurrencyFlag(currency: CurrencyCode): string {
  return CURRENCY_CONFIG[currency]?.flag ?? '';
}

/**
 * Sanitizes user input in rate editor or amount inputs.
 * Replaces Russian comma ',' with '.' and strips whitespace.
 */
export function parseCurrencyInput(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  const cleaned = input.trim().replace(/\s+/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || isNaN(num)) return null;
  return num;
}

/**
 * Validates if a proposed exchange rate is valid (> 0 and finite).
 */
export function isValidRate(rate: number): boolean {
  return Number.isFinite(rate) && rate > 0;
}
