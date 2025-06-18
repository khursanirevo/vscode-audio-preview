/**
 * Common test utilities and helpers
 */

import { MockAudioBuffer, MockAudioContext } from '../mocks/audioContext';

// Test timeout helpers
export const TEST_TIMEOUTS = {
  FAST: 1000,
  MEDIUM: 5000,
  SLOW: 10000,
  WASM: 15000
} as const;

// Common test data
export const TEST_CONSTANTS = {
  SAMPLE_RATE: 44100,
  CHANNELS: 2,
  DURATION: 1.0, // 1 second
  BUFFER_SIZE: 44100, // 1 second at 44.1kHz
  FFT_SIZE: 2048,
  FREQUENCY: 440 // A4
} as const;

// Audio test data generators
export function generateSineWave(
  frequency: number = TEST_CONSTANTS.FREQUENCY,
  duration: number = TEST_CONSTANTS.DURATION,
  sampleRate: number = TEST_CONSTANTS.SAMPLE_RATE,
  amplitude: number = 0.5
): Float32Array {
  const length = Math.floor(duration * sampleRate);
  const data = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    data[i] = amplitude * Math.sin(2 * Math.PI * frequency * i / sampleRate);
  }
  
  return data;
}

export function generateWhiteNoise(
  duration: number = TEST_CONSTANTS.DURATION,
  sampleRate: number = TEST_CONSTANTS.SAMPLE_RATE,
  amplitude: number = 0.1
): Float32Array {
  const length = Math.floor(duration * sampleRate);
  const data = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    data[i] = amplitude * (Math.random() * 2 - 1);
  }
  
  return data;
}

export function generateSilence(
  duration: number = TEST_CONSTANTS.DURATION,
  sampleRate: number = TEST_CONSTANTS.SAMPLE_RATE
): Float32Array {
  const length = Math.floor(duration * sampleRate);
  return new Float32Array(length); // Already filled with zeros
}

export function generateMultiTone(
  frequencies: number[],
  duration: number = TEST_CONSTANTS.DURATION,
  sampleRate: number = TEST_CONSTANTS.SAMPLE_RATE,
  amplitude: number = 0.3
): Float32Array {
  const length = Math.floor(duration * sampleRate);
  const data = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    let sample = 0;
    for (const freq of frequencies) {
      sample += amplitude * Math.sin(2 * Math.PI * freq * i / sampleRate);
    }
    data[i] = sample / frequencies.length; // Normalize
  }
  
  return data;
}

// AudioBuffer creation helpers
export function createTestAudioBuffer(
  channelData?: Float32Array[],
  sampleRate: number = TEST_CONSTANTS.SAMPLE_RATE
): MockAudioBuffer {
  const defaultData = [
    generateSineWave(440, 1, sampleRate),
    generateSineWave(440, 1, sampleRate)
  ];
  
  const data = channelData || defaultData;
  const buffer = new MockAudioBuffer({
    numberOfChannels: data.length,
    length: data[0].length,
    sampleRate
  });
  
  // Copy test data into buffer
  data.forEach((channel, index) => {
    buffer.copyToChannel(channel, index);
  });
  
  return buffer;
}

export function createStereoTestBuffer(
  leftData?: Float32Array,
  rightData?: Float32Array,
  sampleRate: number = TEST_CONSTANTS.SAMPLE_RATE
): MockAudioBuffer {
  const left = leftData || generateSineWave(440, 1, sampleRate);
  const right = rightData || generateSineWave(880, 1, sampleRate);
  
  return createTestAudioBuffer([left, right], sampleRate);
}

// File data helpers
export function createMockFileData(size: number = 1024): Uint8Array {
  const data = new Uint8Array(size);
  
  // Fill with mock WAV header-like data
  if (size >= 44) {
    // RIFF header
    data[0] = 0x52; // 'R'
    data[1] = 0x49; // 'I'
    data[2] = 0x46; // 'F'
    data[3] = 0x46; // 'F'
    
    // File size (little endian)
    const fileSize = size - 8;
    data[4] = fileSize & 0xFF;
    data[5] = (fileSize >> 8) & 0xFF;
    data[6] = (fileSize >> 16) & 0xFF;
    data[7] = (fileSize >> 24) & 0xFF;
    
    // WAVE header
    data[8] = 0x57; // 'W'
    data[9] = 0x41; // 'A'
    data[10] = 0x56; // 'V'
    data[11] = 0x45; // 'E'
  }
  
  // Fill rest with pseudo-random data
  for (let i = 44; i < size; i++) {
    data[i] = Math.floor(Math.random() * 256);
  }
  
  return data;
}

// Async test helpers
export function waitFor(
  condition: () => boolean,
  timeout: number = TEST_TIMEOUTS.MEDIUM,
  interval: number = 10
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
      } else {
        setTimeout(check, interval);
      }
    };
    
    check();
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock function helpers
export function createMockFunction<T extends (...args: any[]) => any>(
  returnValue?: ReturnType<T>
): jest.MockedFunction<T> {
  return jest.fn().mockReturnValue(returnValue) as jest.MockedFunction<T>;
}

export function createMockAsyncFunction<T extends (...args: any[]) => Promise<any>>(
  resolveValue?: Awaited<ReturnType<T>>,
  rejectValue?: any
): jest.MockedFunction<T> {
  const mockFn = jest.fn() as jest.MockedFunction<T>;
  
  if (rejectValue !== undefined) {
    mockFn.mockRejectedValue(rejectValue);
  } else {
    mockFn.mockResolvedValue(resolveValue);
  }
  
  return mockFn;
}

// Array comparison helpers
export function arraysEqual<T>(a: ArrayLike<T>, b: ArrayLike<T>, tolerance: number = 0): boolean {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (typeof a[i] === 'number' && typeof b[i] === 'number') {
      if (Math.abs((a[i] as any) - (b[i] as any)) > tolerance) return false;
    } else if (a[i] !== b[i]) {
      return false;
    }
  }
  
  return true;
}

export function findPeaks(data: Float32Array, threshold: number = 0.1): number[] {
  const peaks: number[] = [];
  
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > threshold && 
        data[i] > data[i - 1] && 
        data[i] > data[i + 1]) {
      peaks.push(i);
    }
  }
  
  return peaks;
}

// Performance testing helpers
export function measureTime<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

export async function measureTimeAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// Test setup/teardown helpers
export function setupTest() {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup global test environment
  Object.defineProperty(window, 'performance', {
    value: {
      now: jest.fn(() => Date.now())
    },
    writable: true
  });
}

export function teardownTest() {
  // Clean up global state
  jest.restoreAllMocks();
}

// Error testing helpers
export function expectToThrow(fn: () => void, expectedError?: string | RegExp): void {
  expect(fn).toThrow(expectedError);
}

export async function expectToThrowAsync(
  fn: () => Promise<void>,
  expectedError?: string | RegExp
): Promise<void> {
  await expect(fn).rejects.toThrow(expectedError);
}

// Canvas testing helpers
export function createMockCanvas(width: number = 800, height: number = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Mock getContext to return a mock 2D context
  const mockContext = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    clearRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    transform: jest.fn(),
    setTransform: jest.fn(),
    resetTransform: jest.fn(),
    createImageData: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createLinearGradient: jest.fn(),
    createRadialGradient: jest.fn(),
    createPattern: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    isPointInPath: jest.fn(() => false),
    isPointInStroke: jest.fn(() => false),
    clip: jest.fn(),
    drawImage: jest.fn(),
    canvas
  };
  
  jest.spyOn(canvas, 'getContext').mockReturnValue(mockContext as any);
  
  return { canvas, context: mockContext };
}

export default {
  TEST_TIMEOUTS,
  TEST_CONSTANTS,
  generateSineWave,
  generateWhiteNoise,
  generateSilence,
  generateMultiTone,
  createTestAudioBuffer,
  createStereoTestBuffer,
  createMockFileData,
  waitFor,
  delay,
  createMockFunction,
  createMockAsyncFunction,
  arraysEqual,
  findPeaks,
  measureTime,
  measureTimeAsync,
  setupTest,
  teardownTest,
  expectToThrow,
  expectToThrowAsync,
  createMockCanvas
};