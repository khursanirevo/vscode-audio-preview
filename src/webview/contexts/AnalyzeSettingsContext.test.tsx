import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { 
  AnalyzeSettingsContext, 
  AnalyzeSettingsProvider
} from './AnalyzeSettingsContext';
import { FrequencyScale } from '../types';
import { useVSCode } from '../hooks/useVSCode';
import { useAnalyzeSettings } from '../hooks/useAnalyzeSettings';
import { mockAudioBuffer } from '../../__tests__/mocks/audioContext';

// Mock dependencies
jest.mock('../hooks/useVSCode');

describe('AnalyzeSettingsContext', () => {
  const mockAudioBufferInstance = mockAudioBuffer({
    sampleRate: 44100,
    numberOfChannels: 2,
    length: 441000,
  });

  const mockAnalyzeDefault = {
    waveformVisible: true,
    waveformVerticalScale: 1.0,
    spectrogramVisible: true,
    spectrogramVerticalScale: 1.0,
    windowSizeIndex: 2, // W1024
    frequencyScale: FrequencyScale.Linear,
    melFilterNum: 40,
    minFrequency: 0,
    maxFrequency: 22050,
    minAmplitude: -1,
    maxAmplitude: 1,
    spectrogramAmplitudeRange: -90,
  };

  const mockVSCode = {
    audioContext: {} as AudioContext,
    audioBuffer: null as AudioBuffer | null,
    isWebviewReady: true,
    vscode: { 
      postMessage: jest.fn(),
      setState: jest.fn(),
      getState: jest.fn(),
    },
    reload: jest.fn(),
    error: null as string | null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useVSCode as jest.Mock).mockReturnValue(mockVSCode);
  });

  describe('AnalyzeSettingsProvider', () => {
    it('should provide default settings', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Initialize with default settings
      act(() => {
        result.current.initializeFromDefault(mockAnalyzeDefault, mockAudioBufferInstance);
      });
      
      expect(result.current.waveformVisible).toBe(true);
      expect(result.current.spectrogramVisible).toBe(true);
      expect(result.current.windowSizeIndex).toBe(2); // W1024
      expect(result.current.frequencyScale).toBe(FrequencyScale.Linear);
    });

    it('should use provided default settings', () => {
      const customDefaults = {
        ...mockAnalyzeDefault,
        waveformVisible: false,
        spectrogramVisible: true,
        windowSizeIndex: 4, // W4096
        frequencyScale: FrequencyScale.Log,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Initialize with custom default settings
      act(() => {
        result.current.initializeFromDefault(customDefaults, mockAudioBufferInstance);
      });
      
      expect(result.current.waveformVisible).toBe(false);
      expect(result.current.spectrogramVisible).toBe(true);
      expect(result.current.windowSizeIndex).toBe(4);
      expect(result.current.frequencyScale).toBe(FrequencyScale.Log);
    });
  });

  describe('Visibility Settings', () => {
    it('should toggle waveform visibility', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      expect(result.current.waveformVisible).toBe(true);

      act(() => {
        result.current.setWaveformVisible(false);
      });

      expect(result.current.waveformVisible).toBe(false);
    });

    it('should toggle spectrogram visibility', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      expect(result.current.spectrogramVisible).toBe(true);

      act(() => {
        result.current.setSpectrogramVisible(false);
      });

      expect(result.current.spectrogramVisible).toBe(false);
    });

    it('should allow independent visibility control', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Turn off waveform
      act(() => {
        result.current.setWaveformVisible(false);
      });

      expect(result.current.waveformVisible).toBe(false);
      expect(result.current.spectrogramVisible).toBe(true);

      // Turn off spectrogram
      act(() => {
        result.current.setSpectrogramVisible(false);
      });

      // Both can be turned off independently
      expect(result.current.waveformVisible).toBe(false);
      expect(result.current.spectrogramVisible).toBe(false);
    });
  });

  describe('Window Size Settings', () => {
    it('should update window size index', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      act(() => {
        result.current.setWindowSizeIndex(3); // WindowSizeIndex.W2048
      });

      expect(result.current.windowSizeIndex).toBe(3);
    });

    it('should validate window size index range', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Test minimum bound (WindowSizeIndex goes from 0-7)
      act(() => {
        result.current.setWindowSizeIndex(-1); // Too small
      });
      expect(result.current.windowSizeIndex).toBeGreaterThanOrEqual(0); // Min W256

      // Test maximum bound
      act(() => {
        result.current.setWindowSizeIndex(20); // Too large
      });
      expect(result.current.windowSizeIndex).toBeLessThanOrEqual(7); // Max W32768
    });

    it('should calculate actual window size', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      const testCases = [
        { index: 0, expectedSize: 256 },   // 2^(0+8) = 256
        { index: 2, expectedSize: 1024 },  // 2^(2+8) = 1024
        { index: 4, expectedSize: 4096 },  // 2^(4+8) = 4096
        { index: 6, expectedSize: 16384 }, // 2^(6+8) = 16384
      ];

      testCases.forEach(({ index, expectedSize }) => {
        act(() => {
          result.current.setWindowSizeIndex(index);
        });
        expect(result.current.windowSize).toBe(expectedSize);
      });
    });
  });

  describe('Spectrogram Scale Settings', () => {
    it('should update frequency scale type', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      const scaleTypes: FrequencyScale[] = [FrequencyScale.Linear, FrequencyScale.Log, FrequencyScale.Mel];
      
      scaleTypes.forEach(scaleType => {
        act(() => {
          result.current.setFrequencyScale(scaleType);
        });
        expect(result.current.frequencyScale).toBe(scaleType);
      });
    });

    it('should only accept valid scale types', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      const initialScale = result.current.frequencyScale;
      
      act(() => {
        // Testing invalid scale type
        result.current.setFrequencyScale('Invalid' as any);
      });

      // Should not change from initial
      expect(result.current.frequencyScale).toBe(initialScale);
    });
  });

  describe('State Management', () => {
    it('should update state correctly', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      act(() => {
        result.current.setWaveformVisible(false);
        result.current.setSpectrogramVisible(true);
        result.current.setWindowSizeIndex(4); // Valid index
        result.current.setFrequencyScale(FrequencyScale.Mel);
      });

      expect(result.current.waveformVisible).toBe(false);
      expect(result.current.spectrogramVisible).toBe(true);
      expect(result.current.windowSizeIndex).toBe(4);
      expect(result.current.frequencyScale).toBe(FrequencyScale.Mel);
    });

    it('should initialize from default settings', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Initialize with custom defaults
      act(() => {
        result.current.initializeFromDefault(mockAnalyzeDefault, mockAudioBufferInstance);
      });
      
      expect(result.current.waveformVisible).toBe(true);
      expect(result.current.spectrogramVisible).toBe(true);
      expect(result.current.windowSizeIndex).toBe(2); // W1024
      expect(result.current.frequencyScale).toBe(FrequencyScale.Linear);
    });

    it('should handle custom default initialization', () => {
      const customDefaults = {
        ...mockAnalyzeDefault,
        waveformVisible: false,
        spectrogramVisible: true,
        windowSizeIndex: 4, // W4096
        frequencyScale: FrequencyScale.Mel,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      act(() => {
        result.current.initializeFromDefault(customDefaults, mockAudioBufferInstance);
      });
      
      expect(result.current.windowSizeIndex).toBe(4); // W4096
      expect(result.current.waveformVisible).toBe(false); // From custom defaults
      expect(result.current.spectrogramVisible).toBe(true); // From custom defaults
      expect(result.current.frequencyScale).toBe(FrequencyScale.Mel); // From custom defaults
    });
  });

  describe('Context Updates', () => {
    it('should notify consumers of settings changes', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );

      const { result, rerender } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      const initialWindowSize = result.current.windowSizeIndex;

      act(() => {
        result.current.setWindowSizeIndex(5); // W8192
      });

      expect(result.current.windowSizeIndex).not.toBe(initialWindowSize);
      expect(result.current.windowSizeIndex).toBe(5);
    });

    it('should handle multiple updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      act(() => {
        result.current.setWaveformVisible(true);
        result.current.setSpectrogramVisible(false);
        result.current.setWindowSizeIndex(6); // W16384
        result.current.setFrequencyScale(FrequencyScale.Log);
      });

      // Check that all updates were applied
      expect(result.current.waveformVisible).toBe(true);
      expect(result.current.spectrogramVisible).toBe(false);
      expect(result.current.windowSizeIndex).toBe(6);
      expect(result.current.frequencyScale).toBe(FrequencyScale.Log);
    });
  });

  describe('Error Handling', () => {
    it('should handle operations gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Should work normally
      act(() => {
        result.current.setWindowSizeIndex(3); // W2048
      });

      expect(result.current.windowSizeIndex).toBe(3);
    });

    it('should handle invalid values gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Test with out-of-range values
      act(() => {
        result.current.setWindowSizeIndex(-5); // Invalid
      });
      
      // Should fallback to valid range
      expect(result.current.windowSizeIndex).toBeGreaterThanOrEqual(0);
      expect(result.current.windowSizeIndex).toBeLessThanOrEqual(7);
    });
  });

  describe('Performance Analysis Settings', () => {
    it('should provide optimal window size for different sample rates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // For 44.1kHz sample rate, default window size is 1024 (index 2)
      expect(result.current.windowSizeIndex).toBe(2); // W1024
      expect(result.current.windowSize).toBe(1024);
      
      // User can adjust for better frequency resolution
      act(() => {
        result.current.setWindowSizeIndex(4); // W4096
      });
      
      expect(result.current.windowSize).toBe(4096);
    });

    it('should balance time and frequency resolution', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Smaller window = better time resolution
      act(() => {
        result.current.setWindowSizeIndex(0); // W256
      });
      
      expect(result.current.windowSize).toBe(256);
      const timeResolution = result.current.windowSize / 44100; // ~5.8ms
      expect(timeResolution).toBeLessThan(0.01); // < 10ms
      
      // Larger window = better frequency resolution
      act(() => {
        result.current.setWindowSizeIndex(6); // W16384
      });
      
      expect(result.current.windowSize).toBe(16384);
      const freqResolution = 44100 / result.current.windowSize; // ~2.7Hz
      expect(freqResolution).toBeLessThan(5); // < 5Hz bin width
    });
  });

  describe('Integration with Analysis System', () => {
    it('should provide settings for FFT analysis', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Initialize with custom settings
      act(() => {
        result.current.setWindowSizeIndex(3); // W2048
        result.current.setFrequencyScale(FrequencyScale.Linear);
      });
      
      // Settings should be ready for FFT computation
      expect(result.current.windowSize).toBe(2048);
      expect([FrequencyScale.Linear, FrequencyScale.Log, FrequencyScale.Mel]).toContain(result.current.frequencyScale);
    });
  });
});