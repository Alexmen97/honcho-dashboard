import '@testing-library/jest-dom';

// Polyfills or global mocks for test environment if needed
if (!globalThis.TextDecoder) {
  const { TextDecoder, TextEncoder } = await import('node:util');
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
  globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
}

// In Node 22+, globalThis.localStorage exists but is unconfigured unless --localstorage-file is used.
// Provide robust standard in-memory storage for test suites:
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

const memoryStorage = new MemoryStorage();

Object.defineProperty(window, 'localStorage', {
  value: memoryStorage,
  writable: true,
  configurable: true,
});

try {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage,
    writable: true,
    configurable: true,
  });
} catch {
  // Ignore if locked
}
