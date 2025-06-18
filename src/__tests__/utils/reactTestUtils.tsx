/**
 * React Testing Library utilities and custom render functions
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { MockAudioBuffer } from '../mocks/audioContext';
import { createMockVSCodeAPI } from '../mocks/webview';
import { createTestAudioBuffer } from './testHelpers';

// Import contexts (we'll need to create these imports as we implement the tests)
// These imports will work once we have the actual context tests

// Mock providers for testing
export const MockVSCodeProvider: React.FC<{ 
  children: React.ReactNode;
  mockAPI?: any;
  mockBuffer?: MockAudioBuffer;
  mockConfig?: any;
}> = ({ 
  children, 
  mockAPI = createMockVSCodeAPI(),
  mockBuffer = createTestAudioBuffer(),
  mockConfig = {}
}) => {
  // Mock context value
  const mockValue = {
    vscode: mockAPI,
    audioBuffer: mockBuffer,
    config: mockConfig,
    isLoading: false,
    error: null
  };

  // For now, just return children until we implement the actual contexts
  return <div data-testid="mock-vscode-provider">{children}</div>;
};

export const MockPlayerSettingsProvider: React.FC<{
  children: React.ReactNode;
  initialSettings?: any;
}> = ({ children, initialSettings = {} }) => {
  const mockValue = {
    settings: {
      volume: 1.0,
      hpfCutoff: 20,
      lpfCutoff: 20000,
      hpfEnabled: false,
      lpfEnabled: false,
      ...initialSettings
    },
    updateSettings: jest.fn(),
    resetSettings: jest.fn()
  };

  return <div data-testid="mock-player-settings-provider">{children}</div>;
};

export const MockAnalyzeSettingsProvider: React.FC<{
  children: React.ReactNode;
  initialSettings?: any;
}> = ({ children, initialSettings = {} }) => {
  const mockValue = {
    settings: {
      waveformVisible: true,
      spectrogramVisible: true,
      fftWindowSize: 2048,
      frequencyScale: 'linear' as const,
      spectrogramHeightRatio: 0.5,
      valueRangeMin: -1,
      valueRangeMax: 1,
      timeRangeMin: 0,
      timeRangeMax: 1,
      frequencyRangeMin: 0,
      frequencyRangeMax: 22050,
      ...initialSettings
    },
    updateSettings: jest.fn(),
    resetSettings: jest.fn()
  };

  return <div data-testid="mock-analyze-settings-provider">{children}</div>;
};

export const MockAnalyzeProvider: React.FC<{
  children: React.ReactNode;
  mockFFTData?: Float32Array[];
  mockSpectrogramData?: number[][];
}> = ({ children, mockFFTData, mockSpectrogramData }) => {
  const mockValue = {
    fftData: mockFFTData || [],
    spectrogramData: mockSpectrogramData || [],
    isAnalyzing: false,
    analyzeRange: jest.fn(),
    analyzeFullBuffer: jest.fn(),
    getFrequencyBins: jest.fn(),
    getTimeBins: jest.fn()
  };

  return <div data-testid="mock-analyze-provider">{children}</div>;
};

export const MockPlayerProvider: React.FC<{
  children: React.ReactNode;
  initialState?: any;
}> = ({ children, initialState = {} }) => {
  const mockValue = {
    isPlaying: false,
    currentTime: 0,
    duration: 1.0,
    volume: 1.0,
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    seek: jest.fn(),
    setVolume: jest.fn(),
    ...initialState
  };

  return <div data-testid="mock-player-provider">{children}</div>;
};

// Combined provider wrapper
export const AllProvidersWrapper: React.FC<{
  children: React.ReactNode;
  vscodeProps?: any;
  playerSettingsProps?: any;
  analyzeSettingsProps?: any;
  analyzeProps?: any;
  playerProps?: any;
}> = ({
  children,
  vscodeProps = {},
  playerSettingsProps = {},
  analyzeSettingsProps = {},
  analyzeProps = {},
  playerProps = {}
}) => {
  return (
    <MockVSCodeProvider {...vscodeProps}>
      <MockPlayerSettingsProvider {...playerSettingsProps}>
        <MockAnalyzeSettingsProvider {...analyzeSettingsProps}>
          <MockAnalyzeProvider {...analyzeProps}>
            <MockPlayerProvider {...playerProps}>
              {children}
            </MockPlayerProvider>
          </MockAnalyzeProvider>
        </MockAnalyzeSettingsProvider>
      </MockPlayerSettingsProvider>
    </MockVSCodeProvider>
  );
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Provider props
  vscodeProps?: any;
  playerSettingsProps?: any;
  analyzeSettingsProps?: any;
  analyzeProps?: any;
  playerProps?: any;
  
  // Override wrapper entirely
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  
  // Skip providers (for testing components in isolation)
  skipProviders?: boolean;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    vscodeProps,
    playerSettingsProps,
    analyzeSettingsProps,
    analyzeProps,
    playerProps,
    wrapper,
    skipProviders = false,
    ...renderOptions
  } = options;

  const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllProvidersWrapper
      vscodeProps={vscodeProps}
      playerSettingsProps={playerSettingsProps}
      analyzeSettingsProps={analyzeSettingsProps}
      analyzeProps={analyzeProps}
      playerProps={playerProps}
    >
      {children}
    </AllProvidersWrapper>
  );

  const finalWrapper = skipProviders ? wrapper : (wrapper || AllProviders);

  return render(ui, { wrapper: finalWrapper, ...renderOptions });
}

// Specialized render functions for different scenarios
export function renderWithVSCodeProvider(
  ui: React.ReactElement,
  vscodeProps?: any,
  options?: Omit<CustomRenderOptions, 'vscodeProps' | 'skipProviders'>
): RenderResult {
  return renderWithProviders(ui, { 
    ...options, 
    vscodeProps,
    skipProviders: false
  });
}

export function renderWithPlayerProvider(
  ui: React.ReactElement,
  playerProps?: any,
  options?: Omit<CustomRenderOptions, 'playerProps' | 'skipProviders'>
): RenderResult {
  return renderWithProviders(ui, { 
    ...options, 
    playerProps,
    skipProviders: false
  });
}

export function renderIsolated(
  ui: React.ReactElement,
  options?: Omit<CustomRenderOptions, 'skipProviders'>
): RenderResult {
  return renderWithProviders(ui, { ...options, skipProviders: true });
}

// Canvas testing utilities
export function getCanvasContext(canvas: HTMLCanvasElement) {
  return canvas.getContext('2d');
}

export function expectCanvasMethodCalled(
  context: any,
  method: string,
  times: number = 1
) {
  expect(context[method]).toHaveBeenCalledTimes(times);
}

export function expectCanvasMethodCalledWith(
  context: any,
  method: string,
  ...args: any[]
) {
  expect(context[method]).toHaveBeenCalledWith(...args);
}

// Event simulation utilities
export function simulateKeyboard(element: Element, key: string, options?: any) {
  const keyboardEvent = new KeyboardEvent('keydown', {
    key,
    code: key,
    bubbles: true,
    ...options
  });
  
  element.dispatchEvent(keyboardEvent);
}

export function simulateMouseEvent(
  element: Element,
  eventType: string,
  options?: Partial<MouseEventInit>
) {
  const mouseEvent = new MouseEvent(eventType, {
    bubbles: true,
    cancelable: true,
    ...options
  });
  
  element.dispatchEvent(mouseEvent);
}

export function simulateDrag(
  element: Element,
  startCoords: { x: number; y: number },
  endCoords: { x: number; y: number },
  options?: any
) {
  // Simulate mouse down
  simulateMouseEvent(element, 'mousedown', {
    clientX: startCoords.x,
    clientY: startCoords.y,
    ...options
  });

  // Simulate mouse move
  simulateMouseEvent(element, 'mousemove', {
    clientX: endCoords.x,
    clientY: endCoords.y,
    ...options
  });

  // Simulate mouse up
  simulateMouseEvent(element, 'mouseup', {
    clientX: endCoords.x,
    clientY: endCoords.y,
    ...options
  });
}

// Touch event simulation
export function simulateTouch(
  element: Element,
  eventType: string,
  touches: Array<{ x: number; y: number }>,
  options?: any
) {
  const touchList = touches.map(touch => ({
    clientX: touch.x,
    clientY: touch.y,
    identifier: 0,
    target: element
  }));

  const touchEvent = new TouchEvent(eventType, {
    bubbles: true,
    cancelable: true,
    touches: touchList as any,
    targetTouches: touchList as any,
    changedTouches: touchList as any,
    ...options
  });

  element.dispatchEvent(touchEvent);
}

// Async testing utilities
export async function waitForNextUpdate() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 10
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

// Custom matchers for better test assertions
export function expectElementToHaveCanvasContext(element: HTMLCanvasElement) {
  expect(element.tagName.toLowerCase()).toBe('canvas');
  expect(element.getContext('2d')).toBeTruthy();
}

export function expectArrayToBeApproximately(
  actual: ArrayLike<number>,
  expected: ArrayLike<number>,
  tolerance: number = 0.001
) {
  expect(actual.length).toBe(expected.length);
  
  for (let i = 0; i < actual.length; i++) {
    expect(actual[i]).toBeCloseTo(expected[i], -Math.log10(tolerance));
  }
}

export default {
  MockVSCodeProvider,
  MockPlayerSettingsProvider,
  MockAnalyzeSettingsProvider,
  MockAnalyzeProvider,
  MockPlayerProvider,
  AllProvidersWrapper,
  renderWithProviders,
  renderWithVSCodeProvider,
  renderWithPlayerProvider,
  renderIsolated,
  getCanvasContext,
  expectCanvasMethodCalled,
  expectCanvasMethodCalledWith,
  simulateKeyboard,
  simulateMouseEvent,
  simulateDrag,
  simulateTouch,
  waitForNextUpdate,
  waitForCondition,
  expectElementToHaveCanvasContext,
  expectArrayToBeApproximately
};