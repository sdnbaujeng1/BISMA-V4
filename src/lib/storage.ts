// Safe storage helper that never throws in restricted/partitioned iframe environments
const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string, fallback: string | null = null): string | null => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const val = window.localStorage.getItem(key);
        if (val !== null && val !== undefined) return val;
      }
    } catch (e) {
      // Fall through to memory store
    }
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : fallback;
  },

  setItem: (key: string, value: string): void => {
    memoryStore[key] = String(value);
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // Memory store already set
    }
  },

  removeItem: (key: string): void => {
    delete memoryStore[key];
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // Memory store already removed
    }
  },

  clear: (): void => {
    Object.keys(memoryStore).forEach(k => delete memoryStore[k]);
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.clear();
      }
    } catch (e) {
      // Memory store already cleared
    }
  }
};
