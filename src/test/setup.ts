import '@testing-library/jest-dom';

// Polyfills or global mocks for test environment if needed
if (!globalThis.TextDecoder) {
  const { TextDecoder, TextEncoder } = await import('node:util');
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
  globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
}
