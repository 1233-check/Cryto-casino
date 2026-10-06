/**
 * Headless Browser & Crypto Environment Polyfills for Node.js
 * Enables pure execution of balance.js, provablyFair.js, constants.js, and game engines.
 */

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  get length() {
    return this.store.size;
  }

  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

export function setupTestEnvironment() {
  if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage) {
    globalThis.localStorage = new MemoryStorage();
  }

  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
      crypto: globalThis.crypto,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {}
    };
  } else {
    if (!globalThis.window.crypto && globalThis.crypto) {
      globalThis.window.crypto = globalThis.crypto;
    }
  }
}

export function resetTestEnvironment(initialBalance = 1000000.0) {
  setupTestEnvironment();
  if (globalThis.localStorage) {
    globalThis.localStorage.clear();
    globalThis.localStorage.setItem('cryptobet_balance', initialBalance.toString());
    globalThis.localStorage.setItem('cryptobet_history', JSON.stringify([]));
  }
}

// Auto-initialize on import
setupTestEnvironment();
