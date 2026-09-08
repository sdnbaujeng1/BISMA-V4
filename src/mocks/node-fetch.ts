const safeFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch(input, init);
  }
  return fetch(input, init);
};

export default safeFetch;
export const Headers = typeof window !== 'undefined' ? window.Headers : (typeof globalThis !== 'undefined' ? (globalThis as any).Headers : undefined);
export const Request = typeof window !== 'undefined' ? window.Request : (typeof globalThis !== 'undefined' ? (globalThis as any).Request : undefined);
export const Response = typeof window !== 'undefined' ? window.Response : (typeof globalThis !== 'undefined' ? (globalThis as any).Response : undefined);
