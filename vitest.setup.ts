import "@testing-library/jest-dom/vitest";

// Polyfill IntersectionObserver for jsdom (not available in Node test environment)
if (typeof globalThis.IntersectionObserver === "undefined") {
  (globalThis as any).IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  };
}

