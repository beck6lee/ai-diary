// vitest setup file - wire jsdom's localStorage to globalThis
import { beforeEach, afterEach } from 'vitest'

// Vitest with jsdom in VM mode doesn't expose window.localStorage to globalThis directly.
// We create a simple localStorage mock that behaves correctly.
const createLocalStorageMock = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index) => Object.keys(store)[index] ?? null,
  }
}

const localStorageMock = createLocalStorageMock()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

beforeEach(() => {
  localStorageMock.clear()
})
