import React from 'react';
import { render, screen } from '@testing-library/react';
import { Spectrogram, SpectrogramProps } from './Spectrogram';
import { FrequencyScale } from '../types';

// Mock CSS import
jest.mock('../styles/figure.css', () => ({}));

// Mock types
jest.mock('../types', () => ({
  canvasSizes: {
    spectrogramWidth: 1000,
    spectrogramHeight: 300,
  },
  FrequencyScale: {
    Linear: 'linear',
    Log: 'log',
    Mel: 'mel',
  },
}));

// Create shared mock canvas context
const mockCanvasContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  getContext: jest.fn(),
  fillStyle: '',
  font: '',
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((contextType) => {
  if (contextType === '2d') {
    return mockCanvasContext;
  }
  return null;
});

// Simple test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="test-wrapper">{children}</div>;
};

// Mock functions that need to be tracked
const mockGetSpectrogram = jest.fn().mockReturnValue([]);
const mockGetMelSpectrogram = jest.fn().mockReturnValue([]);
const mockGetSpectrogramColor = jest.fn().mockReturnValue('rgb(255,0,0)');
const mockRoundToNearestNiceNumber = jest.fn().mockImplementation((value: number) => [value, 2]);
const mockHzToMel = jest.fn().mockImplementation((hz) => hz * 1.127);
const mockMelToHz = jest.fn().mockImplementation((mel) => mel / 1.127);

// Mock contexts that can be updated
let mockVSCodeContext: any = {
  audioBuffer: null,
};

let mockAnalyzeContext = {
  roundToNearestNiceNumber: mockRoundToNearestNiceNumber,
  getSpectrogram: mockGetSpectrogram,
  getMelSpectrogram: mockGetMelSpectrogram,
  getSpectrogramColor: mockGetSpectrogramColor,
  hzToMel: mockHzToMel,
  melToHz: mockMelToHz,
};

let mockAnalyzeSettings = {
  minTime: 0,
  maxTime: 1,
  minFrequency: 0,
  maxFrequency: 22050,
  frequencyScale: 'linear' as const,
  spectrogramVerticalScale: 1,
  spectrogramAmplitudeRange: 80,
  windowSize: 1024,
  hopSize: 512,
};

// Mock the hooks
jest.mock('../hooks/useVSCode', () => ({
  useVSCode: () => mockVSCodeContext,
}));

jest.mock('../hooks/useAnalyze', () => ({
  useAnalyze: () => mockAnalyzeContext,
}));

jest.mock('../hooks/useAnalyzeSettings', () => ({
  useAnalyzeSettings: () => mockAnalyzeSettings,
}));

// Helper function to update mock contexts
const updateMockContexts = (vscodeState = {}, analyzeState = {}, analyzeSettingsState = {}) => {
  mockVSCodeContext = { ...mockVSCodeContext, ...vscodeState };
  mockAnalyzeContext = { ...mockAnalyzeContext, ...analyzeState };
  mockAnalyzeSettings = { ...mockAnalyzeSettings, ...analyzeSettingsState };
};

describe('Spectrogram Component', () => {
  const createMockAudioBuffer = (numberOfChannels = 2, length = 1000) => ({
    numberOfChannels,
    length,
    sampleRate: 44100,
    getChannelData: jest.fn().mockReturnValue(new Float32Array(length)),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  });

  const defaultProps: SpectrogramProps = {
    channelIndex: 0,
    numberOfChannels: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock functions
    mockGetSpectrogram.mockReturnValue([]);
    mockGetMelSpectrogram.mockReturnValue([]);
    mockGetSpectrogramColor.mockReturnValue('rgb(255,0,0)');
    // Reset mock contexts to defaults
    mockVSCodeContext = {
      audioBuffer: null,
    };
    mockAnalyzeContext = {
      roundToNearestNiceNumber: mockRoundToNearestNiceNumber,
      getSpectrogram: mockGetSpectrogram,
      getMelSpectrogram: mockGetMelSpectrogram,
      getSpectrogramColor: mockGetSpectrogramColor,
      hzToMel: mockHzToMel,
      melToHz: mockMelToHz,
    };
    mockAnalyzeSettings = {
      minTime: 0,
      maxTime: 1,
      minFrequency: 0,
      maxFrequency: 22050,
      frequencyScale: 'linear' as const,
      spectrogramVerticalScale: 1,
      spectrogramAmplitudeRange: 80,
      windowSize: 1024,
      hopSize: 512,
    };
  });

  describe('Basic Rendering', () => {
    it('renders canvas elements', () => {
      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      expect(document.querySelector('.canvasBox')).toBeInTheDocument();
      expect(document.querySelector('.mainCanvas')).toBeInTheDocument();
      expect(document.querySelector('.axisCanvas')).toBeInTheDocument();
      
      // Check that canvas elements are actually canvas elements
      const mainCanvas = document.querySelector('.mainCanvas') as HTMLCanvasElement;
      const axisCanvas = document.querySelector('.axisCanvas') as HTMLCanvasElement;
      expect(mainCanvas.tagName.toLowerCase()).toBe('canvas');
      expect(axisCanvas.tagName.toLowerCase()).toBe('canvas');
    });

    it('sets correct canvas dimensions', () => {
      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      const mainCanvas = document.querySelector('.mainCanvas') as HTMLCanvasElement;
      const axisCanvas = document.querySelector('.axisCanvas') as HTMLCanvasElement;

      expect(mainCanvas).toHaveAttribute('width', '1000');
      expect(mainCanvas).toHaveAttribute('height', '300');
      expect(axisCanvas).toHaveAttribute('width', '1000');
      expect(axisCanvas).toHaveAttribute('height', '300');
    });
  });

  describe('Audio Data Rendering', () => {
    it('renders without crashing when no audio buffer', () => {
      updateMockContexts({ audioBuffer: null });
      
      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should render canvas elements but not draw anything
      expect(document.querySelector('.mainCanvas')).toBeInTheDocument();
    });

    it('renders spectrogram when audio buffer is available', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      
      updateMockContexts({ audioBuffer });

      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should clear canvases
      expect(mockCanvasContext.clearRect).toHaveBeenCalledWith(0, 0, 1000, 300);
      
      // Should generate spectrogram data
      expect(mockGetSpectrogram).toHaveBeenCalledWith(0, expect.any(Object), audioBuffer);
    });
  });

  describe('Frequency Scale Rendering', () => {
    it('renders linear spectrogram by default', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([[1, 2], [3, 4]]);
      
      updateMockContexts({ audioBuffer }, {}, { frequencyScale: 'linear' });

      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      expect(mockGetSpectrogram).toHaveBeenCalled();
    });

    it('renders log spectrogram when log scale is selected', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([[1, 2], [3, 4]]);
      
      updateMockContexts({ audioBuffer }, {}, { frequencyScale: 'log', minFrequency: 10 });

      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      expect(mockGetSpectrogram).toHaveBeenCalled();
    });

    it('renders mel spectrogram when mel scale is selected', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetMelSpectrogram.mockReturnValue([[1, 2], [3, 4]]);
      
      updateMockContexts({ audioBuffer }, {}, { frequencyScale: 'mel' });

      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      expect(mockGetMelSpectrogram).toHaveBeenCalled();
    });

    it('adjusts minimum frequency for log scale', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([]);
      
      updateMockContexts({ audioBuffer }, {}, { 
        frequencyScale: 'log',
        minFrequency: 0, // Should be adjusted to 1
        maxFrequency: 1000 
      });
      
      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should call with adjusted settings where minFrequency is at least 1
      const callArgs = mockGetSpectrogram.mock.calls[0];
      expect(callArgs[1].minFrequency).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Axis Drawing', () => {
    it('draws time axis for all frequency scales', () => {
      const audioBuffer = createMockAudioBuffer();
      mockRoundToNearestNiceNumber.mockReturnValue([0.1, 1]);
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      
      updateMockContexts({ audioBuffer }, {}, { minTime: 0, maxTime: 1 });

      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should call roundToNearestNiceNumber for time axis
      expect(mockRoundToNearestNiceNumber).toHaveBeenCalledWith(0.1);
      
      // Should draw axis labels
      expect(mockCanvasContext.fillText).toHaveBeenCalled();
    });

    it('draws linear frequency axis', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      
      updateMockContexts({ audioBuffer }, {}, { 
        frequencyScale: 'linear',
        minFrequency: 0,
        maxFrequency: 22050,
        spectrogramVerticalScale: 1 
      });

      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should draw frequency labels
      expect(mockCanvasContext.fillText).toHaveBeenCalled();
    });

    it('draws logarithmic frequency axis', () => {
      const audioBuffer = createMockAudioBuffer();
      
      updateMockContexts({ audioBuffer }, {}, { 
        frequencyScale: 'log',
        minFrequency: 10,
        maxFrequency: 22050,
        spectrogramVerticalScale: 1 
      });

      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should draw log frequency labels
      expect(mockCanvasContext.fillText).toHaveBeenCalled();
    });

    it('draws mel frequency axis', () => {
      const audioBuffer = createMockAudioBuffer();
      mockHzToMel.mockReturnValue(1000);
      mockMelToHz.mockReturnValue(100);
      mockGetMelSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      
      updateMockContexts({ audioBuffer }, {}, { 
        frequencyScale: 'mel',
        minFrequency: 0,
        maxFrequency: 22050,
        spectrogramVerticalScale: 1 
      });

      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should call mel conversion functions
      expect(mockHzToMel).toHaveBeenCalled();
      expect(mockMelToHz).toHaveBeenCalled();
    });
  });

  describe('Channel Labels', () => {
    it('draws L/R channel labels for stereo', () => {
      const audioBuffer = createMockAudioBuffer(2);
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      updateMockContexts({ audioBuffer });

      // Test left channel
      render(
        <TestWrapper>
          <Spectrogram channelIndex={0} numberOfChannels={2} />
        </TestWrapper>
      );

      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('Lch', 60, 18);

      jest.clearAllMocks();
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);

      // Test right channel
      render(
        <TestWrapper>
          <Spectrogram channelIndex={1} numberOfChannels={2} />
        </TestWrapper>
      );

      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('Rch', 60, 18);
    });

    it('draws numbered channel labels for multi-channel', () => {
      const audioBuffer = createMockAudioBuffer(4);
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      updateMockContexts({ audioBuffer });

      render(
        <TestWrapper>
          <Spectrogram channelIndex={2} numberOfChannels={4} />
        </TestWrapper>
      );

      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('ch3', 60, 18);
    });

    it('does not draw channel labels for mono', () => {
      const audioBuffer = createMockAudioBuffer(1);
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      updateMockContexts({ audioBuffer });

      render(
        <TestWrapper>
          <Spectrogram channelIndex={0} numberOfChannels={1} />
        </TestWrapper>
      );

      // Should not draw channel labels for mono
      const channelLabelCalls = (mockCanvasContext.fillText as jest.Mock).mock.calls
        .filter(call => call[0] === 'Lch' || call[0] === 'Rch' || call[0].startsWith('ch'));
      
      expect(channelLabelCalls).toHaveLength(0);
    });
  });

  describe('Spectrogram Data Rendering', () => {
    it('draws spectrogram pixels with correct colors', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([[0.5, 0.8], [0.2, 0.9]]);
      mockGetSpectrogramColor
        .mockReturnValueOnce('rgb(100,100,100)')
        .mockReturnValueOnce('rgb(200,200,200)')
        .mockReturnValueOnce('rgb(50,50,50)')
        .mockReturnValueOnce('rgb(250,250,250)');
      
      updateMockContexts({ audioBuffer }, {}, { spectrogramAmplitudeRange: 80 });

      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should call color function for each pixel
      expect(mockGetSpectrogramColor).toHaveBeenCalledWith(0.5, 80);
      expect(mockGetSpectrogramColor).toHaveBeenCalledWith(0.8, 80);
      expect(mockGetSpectrogramColor).toHaveBeenCalledWith(0.2, 80);
      expect(mockGetSpectrogramColor).toHaveBeenCalledWith(0.9, 80);

      // Should draw rectangles with correct colors
      expect(mockCanvasContext.fillRect).toHaveBeenCalled();
    });

    it('handles empty spectrogram data', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([]);
      
      updateMockContexts({ audioBuffer: null });

      expect(() => {
        render(
          <TestWrapper>
            <Spectrogram {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('calculates correct rectangle dimensions', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([[1, 2, 3]]);
      
      updateMockContexts({ audioBuffer }, {}, { 
        minTime: 0,
        maxTime: 1,
        hopSize: 512 
      });

      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should draw rectangles with calculated dimensions
      expect(mockCanvasContext.fillRect).toHaveBeenCalled();
      const calls = (mockCanvasContext.fillRect as jest.Mock).mock.calls;
      calls.forEach(call => {
        expect(call[2]).toBeGreaterThan(0); // width > 0
        expect(call[3]).toBeGreaterThan(0); // height > 0
      });
    });
  });

  describe('Settings Integration', () => {
    it('responds to frequency range changes', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      
      updateMockContexts({ audioBuffer }, {}, { minFrequency: 0, maxFrequency: 22050 });

      const { rerender } = render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Change frequency range
      updateMockContexts({ audioBuffer }, {}, { minFrequency: 100, maxFrequency: 10000 });
      
      rerender(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should redraw with new settings
      expect(mockGetSpectrogram).toHaveBeenCalledTimes(2);
    });

    it('responds to time range changes', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      
      updateMockContexts({ audioBuffer }, {}, { minTime: 0, maxTime: 1 });

      const { rerender } = render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Change time range
      updateMockContexts({ audioBuffer }, {}, { minTime: 0.5, maxTime: 1.5 });
      
      rerender(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should redraw with new settings
      expect(mockGetSpectrogram).toHaveBeenCalledTimes(2);
    });

    it('uses spectrogramVerticalScale setting', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      
      updateMockContexts({ audioBuffer }, {}, { spectrogramVerticalScale: 2 });

      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should use vertical scale in calculations
      expect(mockCanvasContext.fillText).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing canvas context gracefully', () => {
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(null);
      
      const audioBuffer = createMockAudioBuffer();
      updateMockContexts({ audioBuffer });
      
      expect(() => {
        render(
          <TestWrapper>
            <Spectrogram {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
      
      // Restore normal mock
      HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((contextType) => {
        if (contextType === '2d') {
          return mockCanvasContext;
        }
        return null;
      });
    });

    it('handles invalid channel index', () => {
      const audioBuffer = createMockAudioBuffer(2);
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      updateMockContexts({ audioBuffer });
      
      expect(() => {
        render(
          <TestWrapper>
            <Spectrogram channelIndex={5} numberOfChannels={2} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles zero frequency range', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      
      updateMockContexts({ audioBuffer }, {}, { minFrequency: 1000, maxFrequency: 1000 });

      expect(() => {
        render(
          <TestWrapper>
            <Spectrogram {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles zero time range', () => {
      const audioBuffer = createMockAudioBuffer();
      mockGetSpectrogram.mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      
      updateMockContexts({ audioBuffer }, {}, { minTime: 1, maxTime: 1 });

      expect(() => {
        render(
          <TestWrapper>
            <Spectrogram {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Component Structure', () => {
    it('renders with correct CSS classes', () => {
      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      expect(document.querySelector('.canvasBox')).toBeInTheDocument();
      expect(document.querySelector('.mainCanvas')).toBeInTheDocument();
      expect(document.querySelector('.axisCanvas')).toBeInTheDocument();
    });

    it('has proper canvas stacking order', () => {
      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      const canvasBox = document.querySelector('.canvasBox');
      const mainCanvas = document.querySelector('.mainCanvas');
      const axisCanvas = document.querySelector('.axisCanvas');

      expect(canvasBox).toContainElement(mainCanvas as HTMLElement);
      expect(canvasBox).toContainElement(axisCanvas as HTMLElement);
    });
  });
});