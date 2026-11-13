import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyModal } from '../components/layout/CurrencyModal';
import { DEFAULT_RATES } from '../utils/currency';

describe('CurrencyModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <CurrencyModal
        isOpen={false}
        onClose={vi.fn()}
        baseCurrency="RUB"
        rates={DEFAULT_RATES}
        onSave={vi.fn()}
      />
    );
    expect(screen.queryByTestId('currency-modal-container')).not.toBeInTheDocument();
  });

  it('renders modal dialog with base currency selector and rate table when open', () => {
    render(
      <CurrencyModal
        isOpen={true}
        onClose={vi.fn()}
        baseCurrency="RUB"
        rates={DEFAULT_RATES}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByTestId('currency-modal-container')).toBeInTheDocument();
    expect(screen.getByText('Курсы валют')).toBeInTheDocument();
    expect(screen.getByTestId('base-currency-select-KZT')).toBeInTheDocument();
    expect(screen.getByTestId('base-currency-select-USD')).toBeInTheDocument();
  });

  it('allows changing base currency and rebases rates', () => {
    render(
      <CurrencyModal
        isOpen={true}
        onClose={vi.fn()}
        baseCurrency="RUB"
        rates={DEFAULT_RATES}
        onSave={vi.fn()}
      />
    );

    // Initial base RUB: USD input should be 92.5
    const usdInputBefore = screen.getByTestId('rate-input-USD') as HTMLInputElement;
    expect(usdInputBefore.value).toBe('92.5');

    // Switch base currency to KZT
    const kztBaseBtn = screen.getByTestId('base-currency-select-KZT');
    fireEvent.click(kztBaseBtn);

    // After rebasing to KZT, USD input should be 92.5 / 0.188 ≈ 492.0213
    const usdInputAfter = screen.getByTestId('rate-input-USD') as HTMLInputElement;
    expect(parseFloat(usdInputAfter.value)).toBeCloseTo(492.0213, 1);

    // Switch back to RUB
    const rubBaseBtn = screen.getByTestId('base-currency-select-RUB');
    fireEvent.click(rubBaseBtn);
    const usdInputBack = screen.getByTestId('rate-input-USD') as HTMLInputElement;
    expect(parseFloat(usdInputBack.value)).toBeCloseTo(92.5, 1);
  });

  it('validates rate inputs and shows error on non-positive or empty inputs', () => {
    render(
      <CurrencyModal
        isOpen={true}
        onClose={vi.fn()}
        baseCurrency="RUB"
        rates={DEFAULT_RATES}
        onSave={vi.fn()}
      />
    );

    const usdInput = screen.getByTestId('rate-input-USD');
    fireEvent.change(usdInput, { target: { value: '-10' } });
    expect(screen.getByText('Курс должен быть больше 0')).toBeInTheDocument();

    fireEvent.change(usdInput, { target: { value: '0' } });
    expect(screen.getByText('Курс должен быть больше 0')).toBeInTheDocument();

    fireEvent.change(usdInput, { target: { value: 'abc' } });
    expect(screen.getByText('Курс должен быть больше 0')).toBeInTheDocument();

    // Fix with valid positive number
    fireEvent.change(usdInput, { target: { value: '95.5' } });
    expect(screen.queryByText('Курс должен быть больше 0')).not.toBeInTheDocument();
  });

  it('resets rates to defaults when "Сбросить курсы" button is clicked', () => {
    render(
      <CurrencyModal
        isOpen={true}
        onClose={vi.fn()}
        baseCurrency="RUB"
        rates={DEFAULT_RATES}
        onSave={vi.fn()}
      />
    );

    const usdInput = screen.getByTestId('rate-input-USD') as HTMLInputElement;
    fireEvent.change(usdInput, { target: { value: '110' } });
    expect(usdInput.value).toBe('110');

    const resetBtn = screen.getByTestId('reset-rates-btn');
    fireEvent.click(resetBtn);

    expect(usdInput.value).toBe('92.5');
  });

  it('calls onSave with updated base currency and numeric rates', () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();

    render(
      <CurrencyModal
        isOpen={true}
        onClose={handleClose}
        baseCurrency="RUB"
        rates={DEFAULT_RATES}
        onSave={handleSave}
      />
    );

    const usdInput = screen.getByTestId('rate-input-USD');
    fireEvent.change(usdInput, { target: { value: '94.5' } });

    const saveBtn = screen.getByTestId('save-rates-btn');
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith('RUB', expect.objectContaining({
      RUB: 1.0,
      USD: 94.5,
    }));
  });

  it('calls onClose when close button or cancel button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <CurrencyModal
        isOpen={true}
        onClose={handleClose}
        baseCurrency="RUB"
        rates={DEFAULT_RATES}
        onSave={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('currency-modal-close-btn'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('cancel-rates-btn'));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('calls onClose when clicking outside on the backdrop (light dismiss)', () => {
    const handleClose = vi.fn();
    render(
      <CurrencyModal
        isOpen={true}
        onClose={handleClose}
        baseCurrency="RUB"
        rates={DEFAULT_RATES}
        onSave={vi.fn()}
      />
    );

    const backdrop = screen.getByTestId('currency-modal-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('rejects non-finite inputs such as Infinity and 1e309 with error', () => {
    render(
      <CurrencyModal
        isOpen={true}
        onClose={vi.fn()}
        baseCurrency="RUB"
        rates={DEFAULT_RATES}
        onSave={vi.fn()}
      />
    );

    const usdInput = screen.getByTestId('rate-input-USD');

    fireEvent.change(usdInput, { target: { value: 'Infinity' } });
    expect(screen.getByText('Курс должен быть больше 0')).toBeInTheDocument();

    fireEvent.change(usdInput, { target: { value: '1e309' } });
    expect(screen.getByText('Курс должен быть больше 0')).toBeInTheDocument();

    fireEvent.change(usdInput, { target: { value: '-Infinity' } });
    expect(screen.getByText('Курс должен быть больше 0')).toBeInTheDocument();
  });

  it('ensures close button has touch target of at least 44px', () => {
    render(
      <CurrencyModal
        isOpen={true}
        onClose={vi.fn()}
        baseCurrency="RUB"
        rates={DEFAULT_RATES}
        onSave={vi.fn()}
      />
    );

    const closeBtn = screen.getByTestId('currency-modal-close-btn');
    expect(closeBtn.className).toContain('min-h-[44px]');
    expect(closeBtn.className).toContain('min-w-[44px]');
  });
});
