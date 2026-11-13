import '@testing-library/jest-dom';

// Polyfill matchMedia for mobile / viewport checks in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill ResizeObserver for Recharts in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill scrollTo
window.scrollTo = () => {};

// Polyfill custom element methods for NumberFlow in jsdom
if (typeof document !== 'undefined') {
  const origCreate = document.createElement.bind(document);
  document.createElement = function(tagName: string, options?: ElementCreationOptions) {
    const el = origCreate(tagName, options);
    if (tagName.toLowerCase() === 'number-flow-react') {
      (el as any).willUpdate = () => {};
      (el as any).didUpdate = () => {};
    }
    return el;
  };
}
