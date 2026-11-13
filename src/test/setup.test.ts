import { describe, it, expect } from 'vitest';
import { cn } from '../utils/cn';

describe('Tooling & Setup Smoke Tests', () => {
  it('combines tailwind classes properly using cn()', () => {
    const result = cn('bg-paper', 'text-charcoal', false && 'hidden', 'p-4');
    expect(result).toBe('bg-paper text-charcoal p-4');
  });

  it('handles class conflict overrides with tailwind-merge in cn()', () => {
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4');
  });

  it('verifies ResizeObserver is polyfilled in test environment', () => {
    expect(global.ResizeObserver).toBeDefined();
    const observer = new ResizeObserver(() => {});
    expect(typeof observer.observe).toBe('function');
  });
});
