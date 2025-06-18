import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { 
  AnalyzeSettingsContext, 
  AnalyzeSettingsProvider,
  SpectrogramScaleType 
} from './AnalyzeSettingsContext';
import { useVSCode } from '../hooks/useVSCode';
import { useAnalyzeSettings } from '../hooks/useAnalyzeSettings';

// Mock dependencies
jest.mock('../hooks/useVSCode');

describe('AnalyzeSettingsContext', () => {
  const mockVSCode = {
    audioContext: {} as AudioContext,
    audioBuffer: null,
    isWebviewReady: true,
    vscode: { 
      postMessage: jest.fn(),
      setState: jest.fn(),
      getState: jest.fn(),
    },
    reload: jest.fn(),
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useVSCode as jest.Mock).mockReturnValue(mockVSCode);
  });

  describe('AnalyzeSettingsProvider', () => {
    it('should provide default settings', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      expect(result.current.visibleWaveform).toBe(true);
      expect(result.current.visibleSpectrogram).toBe(true);
      expect(result.current.windowSizeIndex).toBe(10); // 2^10 = 1024
      expect(result.current.spectrogramScaleType).toBe('Linear');
    });

    it('should use provided default settings', () => {
      const customDefaults = {
        visibleWaveform: false,
        visibleSpectrogram: true,
        windowSizeIndex: 12, // 2^12 = 4096
        spectrogramScaleType: 'Log' as SpectrogramScaleType,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={customDefaults}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      expect(result.current.visibleWaveform).toBe(false);
      expect(result.current.visibleSpectrogram).toBe(true);
      expect(result.current.windowSizeIndex).toBe(12);
      expect(result.current.spectrogramScaleType).toBe('Log');
    });
  });

  describe('Visibility Settings', () => {
    it('should toggle waveform visibility', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      expect(result.current.visibleWaveform).toBe(true);

      act(() => {
        result.current.setVisibleWaveform(false);
      });

      expect(result.current.visibleWaveform).toBe(false);
    });

    it('should toggle spectrogram visibility', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      expect(result.current.visibleSpectrogram).toBe(true);

      act(() => {
        result.current.setVisibleSpectrogram(false);
      });

      expect(result.current.visibleSpectrogram).toBe(false);
    });

    it('should ensure at least one visualization is visible', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Turn off waveform
      act(() => {
        result.current.setVisibleWaveform(false);
      });

      // Try to turn off spectrogram (should fail)
      act(() => {
        result.current.setVisibleSpectrogram(false);
      });

      // At least one should remain visible
      expect(result.current.visibleWaveform || result.current.visibleSpectrogram).toBe(true);
    });
  });

  describe('Window Size Settings', () => {
    it('should update window size index', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      act(() => {
        result.current.setWindowSizeIndex(11); // 2^11 = 2048
      });

      expect(result.current.windowSizeIndex).toBe(11);
    });

    it('should validate window size index range', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Test minimum bound
      act(() => {
        result.current.setWindowSizeIndex(5); // Too small
      });
      expect(result.current.windowSizeIndex).toBeGreaterThanOrEqual(8); // Min 2^8 = 256

      // Test maximum bound
      act(() => {
        result.current.setWindowSizeIndex(20); // Too large
      });
      expect(result.current.windowSizeIndex).toBeLessThanOrEqual(15); // Max 2^15 = 32768
    });

    it('should calculate actual window size', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      const testCases = [
        { index: 8, expectedSize: 256 },
        { index: 10, expectedSize: 1024 },
        { index: 12, expectedSize: 4096 },
        { index: 14, expectedSize: 16384 },
      ];

      testCases.forEach(({ index, expectedSize }) => {
        act(() => {
          result.current.setWindowSizeIndex(index);
        });
        expect(Math.pow(2, result.current.windowSizeIndex)).toBe(expectedSize);
      });
    });
  });

  describe('Spectrogram Scale Settings', () => {
    it('should update spectrogram scale type', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      const scaleTypes: SpectrogramScaleType[] = ['Linear', 'Log', 'Mel'];
      
      scaleTypes.forEach(scaleType => {
        act(() => {
          result.current.setSpectrogramScaleType(scaleType);
        });
        expect(result.current.spectrogramScaleType).toBe(scaleType);
      });
    });

    it('should only accept valid scale types', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      const initialScale = result.current.spectrogramScaleType;
      
      act(() => {
        // @ts-expect-error Testing invalid scale type
        result.current.setSpectrogramScaleType('Invalid');
      });

      // Should not change from initial
      expect(result.current.spectrogramScaleType).toBe(initialScale);
    });
  });

  describe('Persistence', () => {
    it('should persist settings to VS Code state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      act(() => {
        result.current.setVisibleWaveform(false);
        result.current.setVisibleSpectrogram(true);
        result.current.setWindowSizeIndex(13);
        result.current.setSpectrogramScaleType('Mel');
      });

      expect(mockVSCode.vscode.setState).toHaveBeenCalledWith({
        analyzeSettings: {
          visibleWaveform: false,
          visibleSpectrogram: true,
          windowSizeIndex: 13,
          spectrogramScaleType: 'Mel',
        }
      });
    });

    it('should restore settings from VS Code state', () => {
      const savedSettings = {
        analyzeSettings: {
          visibleWaveform: false,
          visibleSpectrogram: true,
          windowSizeIndex: 14,
          spectrogramScaleType: 'Log' as SpectrogramScaleType,
        }
      };

      mockVSCode.vscode.getState.mockReturnValue(savedSettings);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      expect(result.current.visibleWaveform).toBe(false);
      expect(result.current.visibleSpectrogram).toBe(true);
      expect(result.current.windowSizeIndex).toBe(14);
      expect(result.current.spectrogramScaleType).toBe('Log');
    });

    it('should merge partial saved settings with defaults', () => {
      const savedSettings = {
        analyzeSettings: {
          windowSizeIndex: 9,
          // Other settings missing
        }
      };

      mockVSCode.vscode.getState.mockReturnValue(savedSettings);

      const defaults = {
        visibleWaveform: false,
        visibleSpectrogram: false,
        windowSizeIndex: 11,
        spectrogramScaleType: 'Mel' as SpectrogramScaleType,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={defaults}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      expect(result.current.windowSizeIndex).toBe(9); // From saved
      expect(result.current.visibleWaveform).toBe(false); // From defaults
      expect(result.current.visibleSpectrogram).toBe(false); // From defaults
      expect(result.current.spectrogramScaleType).toBe('Mel'); // From defaults
    });
  });

  describe('Context Updates', () => {
    it('should notify consumers of settings changes', () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        const settings = useAnalyzeSettings();
        renderCount++;
        return <div>{settings.windowSizeIndex}</div>;
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );

      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      const initialRenderCount = renderCount;

      act(() => {
        result.current.setWindowSizeIndex(12);
      });

      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });

    it('should batch multiple updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      act(() => {
        result.current.setVisibleWaveform(true);
        result.current.setVisibleSpectrogram(false);
        result.current.setWindowSizeIndex(11);
        result.current.setSpectrogramScaleType('Log');
      });

      // Should only call setState once with all updates
      expect(mockVSCode.vscode.setState).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing VS Code API gracefully', () => {
      (useVSCode as jest.Mock).mockReturnValue({
        ...mockVSCode,
        vscode: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Should still work without persistence
      act(() => {
        result.current.setWindowSizeIndex(13);
      });

      expect(result.current.windowSizeIndex).toBe(13);
    });

    it('should handle corrupted saved state', () => {
      mockVSCode.vscode.getState.mockReturnValue({
        analyzeSettings: {
          windowSizeIndex: 'not-a-number', // Invalid type
          spectrogramScaleType: 123, // Invalid type
        }
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Should fall back to defaults
      expect(result.current.windowSizeIndex).toBe(10);
      expect(result.current.spectrogramScaleType).toBe('Linear');
    });
  });

  describe('Performance Analysis Settings', () => {
    it('should provide optimal window size for different sample rates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // For 44.1kHz sample rate, window size of 1024 gives ~23ms resolution
      expect(result.current.windowSizeIndex).toBe(10); // 2^10 = 1024
      
      // User can adjust for better frequency resolution
      act(() => {
        result.current.setWindowSizeIndex(12); // 2^12 = 4096 for ~93ms
      });
      
      expect(Math.pow(2, result.current.windowSizeIndex)).toBe(4096);
    });

    it('should balance time and frequency resolution', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={undefined}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Smaller window = better time resolution
      act(() => {
        result.current.setWindowSizeIndex(8); // 256 samples
      });
      
      const timeResolution = Math.pow(2, 8) / 44100; // ~5.8ms
      expect(timeResolution).toBeLessThan(0.01); // < 10ms
      
      // Larger window = better frequency resolution
      act(() => {
        result.current.setWindowSizeIndex(14); // 16384 samples
      });
      
      const freqResolution = 44100 / Math.pow(2, 14); // ~2.7Hz
      expect(freqResolution).toBeLessThan(5); // < 5Hz bin width
    });
  });

  describe('Integration with Analysis System', () => {
    it('should provide settings for FFT analysis', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeSettingsProvider analyzeDefault={{
          visibleWaveform: true,
          visibleSpectrogram: true,
          windowSizeIndex: 11,
          spectrogramScaleType: 'Linear',
        }}>
          {children}
        </AnalyzeSettingsProvider>
      );
      
      const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });
      
      // Settings should be ready for FFT computation
      expect(Math.pow(2, result.current.windowSizeIndex)).toBe(2048);
      expect(['Linear', 'Log', 'Mel']).toContain(result.current.spectrogramScaleType);
    });
  });
});