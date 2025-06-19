/**
 * Jest setup configuration for Audio Preview Extension tests
 */

import 'jest-canvas-mock';
import '@testing-library/jest-dom';
import { setupAudioContextMocks } from './mocks/audioContext';
import './mocks/vscode';

// Global test setup
beforeAll(() => {
  // Setup Audio Context mocks
  setupAudioContextMocks();
  
  // Mock global fetch
  global.fetch = jest.fn();
  
  // Mock global performance API
  Object.defineProperty(global, 'performance', {
    value: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn(() => []),
      getEntriesByType: jest.fn(() => []),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn()
    },
    writable: true
  });

  // Mock TextEncoder/TextDecoder for Node.js environment
  if (typeof TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }

  // Mock File and Blob APIs
  global.File = class MockFile {
    constructor(
      public bits: any[],
      public name: string,
      public options: any = {}
    ) {}
    
    get type() { return this.options.type || ''; }
    get size() { return this.bits.reduce((size: number, bit: any) => size + (bit?.length || bit?.byteLength || 0), 0); }
    get lastModified() { return this.options.lastModified || Date.now(); }
    
    arrayBuffer() { return Promise.resolve(new ArrayBuffer(this.size)); }
    text() { return Promise.resolve(''); }
    stream() { return new ReadableStream(); }
    slice() { return new MockFile([], this.name); }
  } as any;

  global.Blob = class MockBlob {
    constructor(public bits: any[] = [], public options: any = {}) {}
    
    get type() { return this.options.type || ''; }
    get size() { return this.bits.reduce((size: number, bit: any) => size + (bit?.length || bit?.byteLength || 0), 0); }
    
    arrayBuffer() { return Promise.resolve(new ArrayBuffer(this.size)); }
    text() { return Promise.resolve(''); }
    stream() { return new ReadableStream(); }
    slice() { return new MockBlob(); }
  } as any;

  // Mock URL.createObjectURL and revokeObjectURL
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();

  // Mock requestAnimationFrame and cancelAnimationFrame
  global.requestAnimationFrame = jest.fn((cb) => {
    setTimeout(cb, 16); // ~60fps
    return 1;
  });
  global.cancelAnimationFrame = jest.fn();

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));

  // Mock MutationObserver
  global.MutationObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => [])
  }));

  // Suppress console warnings in tests unless specifically testing error conditions
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = jest.fn((...args) => {
    // Only show warnings in tests if they're expected
    if (process.env.NODE_ENV === 'test' && !process.env.SHOW_CONSOLE_WARNINGS) {
      return;
    }
    originalWarn.apply(console, args);
  });

  console.error = jest.fn((...args) => {
    // Only show errors in tests if they're expected
    if (process.env.NODE_ENV === 'test' && !process.env.SHOW_CONSOLE_ERRORS) {
      return;
    }
    originalError.apply(console, args);
  });
});

// Setup before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset any global state
  if ((global as any).vscode) {
    (global as any).vscode.__resetAllMocks?.();
  }

  // Clear timers
  jest.clearAllTimers();
});

// Cleanup after each test
afterEach(() => {
  // Clean up any remaining timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Global cleanup
afterAll(() => {
  // Restore original console methods
  jest.restoreAllMocks();
});

// Custom Jest matchers
expect.extend({
  toBeAudioBuffer(received: any) {
    const pass = received && 
      typeof received.sampleRate === 'number' &&
      typeof received.length === 'number' &&
      typeof received.numberOfChannels === 'number' &&
      typeof received.duration === 'number' &&
      typeof received.getChannelData === 'function';

    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be an AudioBuffer`
          : `Expected ${received} to be an AudioBuffer`,
      pass
    };
  },

  toBeFloat32Array(received: any) {
    const pass = received instanceof Float32Array;
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a Float32Array`
          : `Expected ${received} to be a Float32Array`,
      pass
    };
  },

  toBeValidFFTData(received: any) {
    const pass = Array.isArray(received) && 
      received.every((frame: any) => frame instanceof Float32Array);
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be valid FFT data`
          : `Expected ${received} to be valid FFT data (array of Float32Arrays)`,
      pass
    };
  },

  toHaveCanvasContext(received: any) {
    const pass = received && 
      received.tagName && 
      received.tagName.toLowerCase() === 'canvas' &&
      typeof received.getContext === 'function';

    return {
      message: () => 
        pass 
          ? `Expected ${received} not to have canvas context`
          : `Expected ${received} to have canvas context`,
      pass
    };
  },

  toBeApproximatelyEqual(received: number, expected: number, tolerance: number = 0.001) {
    const pass = Math.abs(received - expected) <= tolerance;
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be approximately equal to ${expected} (tolerance: ${tolerance})`
          : `Expected ${received} to be approximately equal to ${expected} (tolerance: ${tolerance}), but difference was ${Math.abs(received - expected)}`,
      pass
    };
  }
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAudioBuffer(): R;
      toBeFloat32Array(): R;
      toBeValidFFTData(): R;
      toHaveCanvasContext(): R;
      toBeApproximatelyEqual(expected: number, tolerance?: number): R;
    }
  }
}

export {};