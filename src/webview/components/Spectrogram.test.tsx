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

// Create mock canvas context
const createMockCanvas2DContext = () => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  getContext: jest.fn(),
  fillStyle: '',
  font: '',
});

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((contextType) => {
  if (contextType === '2d') {
    return createMockCanvas2DContext();
  }
  return null;
});

// Test wrapper with context mocks
const TestWrapper = ({ 
  children, 
  vscodeState = {}, 
  analyzeState = {}, 
  analyzeSettings = {} 
}: {
  children: React.ReactNode;
  vscodeState?: any;
  analyzeState?: any;
  analyzeSettings?: any;
}) => {
  const mockVSCodeContext = {
    audioBuffer: null,
    ...vscodeState,
  };

  const mockAnalyzeContext = {
    roundToNearestNiceNumber: (value: number) => [value, 2],
    getSpectrogram: jest.fn().mockReturnValue([]),
    getMelSpectrogram: jest.fn().mockReturnValue([]),
    getSpectrogramColor: jest.fn().mockReturnValue('rgb(255,0,0)'),
    hzToMel: jest.fn().mockImplementation((hz) => hz * 1.127),
    melToHz: jest.fn().mockImplementation((mel) => mel / 1.127),
    ...analyzeState,
  };

  const mockAnalyzeSettings = {
    minTime: 0,
    maxTime: 1,
    minFrequency: 0,
    maxFrequency: 22050,
    frequencyScale: 'linear' as const,
    spectrogramVerticalScale: 1,
    spectrogramAmplitudeRange: 80,
    windowSize: 1024,
    hopSize: 512,
    ...analyzeSettings,
  };

  return (
    <div 
      data-testid="mock-provider"
      data-mock-vscode={JSON.stringify(mockVSCodeContext)}
      data-mock-analyze={JSON.stringify(mockAnalyzeContext)}
      data-mock-analyze-settings={JSON.stringify(mockAnalyzeSettings)}
    >
      {children}
    </div>
  );
};

// Mock the hooks
jest.mock('../hooks/useVSCode', () => ({
  useVSCode: () => {
    const element = document.querySelector('[data-mock-vscode]') as any;
    if (element) {
      return JSON.parse(element.getAttribute('data-mock-vscode') || '{}');
    }
    return { audioBuffer: null };
  },
}));

jest.mock('../hooks/useAnalyze', () => ({
  useAnalyze: () => {
    const element = document.querySelector('[data-mock-analyze]') as any;
    if (element) {
      return JSON.parse(element.getAttribute('data-mock-analyze') || '{}');
    }
    return {
      roundToNearestNiceNumber: (value: number) => [value, 2],
      getSpectrogram: jest.fn().mockReturnValue([]),
      getMelSpectrogram: jest.fn().mockReturnValue([]),
      getSpectrogramColor: jest.fn().mockReturnValue('rgb(255,0,0)'),
      hzToMel: jest.fn().mockImplementation((hz) => hz * 1.127),
      melToHz: jest.fn().mockImplementation((mel) => mel / 1.127),
    };
  },
}));

jest.mock('../hooks/useAnalyzeSettings', () => ({
  useAnalyzeSettings: () => {
    const element = document.querySelector('[data-mock-analyze-settings]') as any;
    if (element) {
      return JSON.parse(element.getAttribute('data-mock-analyze-settings') || '{}');
    }
    return {
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
  },
}));

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
  });

  describe('Basic Rendering', () => {
    it('renders canvas elements', () => {
      render(
        <TestWrapper>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Canvas elements have img role
      expect(document.querySelector('.canvasBox')).toBeInTheDocument();
      expect(document.querySelector('.mainCanvas')).toBeInTheDocument();
      expect(document.querySelector('.axisCanvas')).toBeInTheDocument();
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
      render(
        <TestWrapper vscodeState={{ audioBuffer: null }}>
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should render canvas elements but not draw anything
      expect(document.querySelector('.mainCanvas')).toBeInTheDocument();
    });

    it('renders spectrogram when audio buffer is available', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      const mockGetSpectrogram = jest.fn().mockReturnValue([[1, 2, 3], [4, 5, 6]]);
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ getSpectrogram: mockGetSpectrogram }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should clear canvases
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 1000, 300);
      
      // Should generate spectrogram data
      expect(mockGetSpectrogram).toHaveBeenCalledWith(0, expect.any(Object), audioBuffer);
    });
  });

  describe('Frequency Scale Rendering', () => {
    it('renders linear spectrogram by default', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      const mockGetSpectrogram = jest.fn().mockReturnValue([[1, 2], [3, 4]]);
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ getSpectrogram: mockGetSpectrogram }}
          analyzeSettings={{ frequencyScale: 'linear' }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      expect(mockGetSpectrogram).toHaveBeenCalled();
    });

    it('renders log spectrogram when log scale is selected', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      const mockGetSpectrogram = jest.fn().mockReturnValue([[1, 2], [3, 4]]);
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ getSpectrogram: mockGetSpectrogram }}
          analyzeSettings={{ frequencyScale: 'log', minFrequency: 10 }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      expect(mockGetSpectrogram).toHaveBeenCalled();
    });

    it('renders mel spectrogram when mel scale is selected', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      const mockGetMelSpectrogram = jest.fn().mockReturnValue([[1, 2], [3, 4]]);
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ getMelSpectrogram: mockGetMelSpectrogram }}
          analyzeSettings={{ frequencyScale: 'mel' }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      expect(mockGetMelSpectrogram).toHaveBeenCalled();
    });

    it('adjusts minimum frequency for log scale', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockGetSpectrogram = jest.fn().mockReturnValue([]);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ getSpectrogram: mockGetSpectrogram }}
          analyzeSettings={{ 
            frequencyScale: 'log',
            minFrequency: 0, // Should be adjusted to 1
            maxFrequency: 1000 
          }}
        >
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
      const mockContext = createMockCanvas2DContext();
      const mockRoundToNearestNiceNumber = jest.fn().mockReturnValue([0.1, 1]);
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ roundToNearestNiceNumber: mockRoundToNearestNiceNumber }}
          analyzeSettings={{ minTime: 0, maxTime: 1 }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should call roundToNearestNiceNumber for time axis
      expect(mockRoundToNearestNiceNumber).toHaveBeenCalledWith(0.1);
      
      // Should draw axis labels
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('draws linear frequency axis', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{ 
            frequencyScale: 'linear',
            minFrequency: 0,
            maxFrequency: 22050,
            spectrogramVerticalScale: 1 
          }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should draw frequency labels
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('draws logarithmic frequency axis', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{ 
            frequencyScale: 'log',
            minFrequency: 10,
            maxFrequency: 22050,
            spectrogramVerticalScale: 1 
          }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should draw log frequency labels
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('draws mel frequency axis', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      const mockHzToMel = jest.fn().mockReturnValue(1000);
      const mockMelToHz = jest.fn().mockReturnValue(100);
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ hzToMel: mockHzToMel, melToHz: mockMelToHz }}
          analyzeSettings={{ 
            frequencyScale: 'mel',
            minFrequency: 0,
            maxFrequency: 22050,
            spectrogramVerticalScale: 1 
          }}
        >
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
      const mockContext = createMockCanvas2DContext();
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      // Test left channel
      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Spectrogram channelIndex={0} numberOfChannels={2} />
        </TestWrapper>
      );

      expect(mockContext.fillText).toHaveBeenCalledWith('Lch', 60, 18);

      jest.clearAllMocks();

      // Test right channel
      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Spectrogram channelIndex={1} numberOfChannels={2} />
        </TestWrapper>
      );

      expect(mockContext.fillText).toHaveBeenCalledWith('Rch', 60, 18);
    });

    it('draws numbered channel labels for multi-channel', () => {
      const audioBuffer = createMockAudioBuffer(4);
      const mockContext = createMockCanvas2DContext();
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Spectrogram channelIndex={2} numberOfChannels={4} />
        </TestWrapper>
      );

      expect(mockContext.fillText).toHaveBeenCalledWith('ch3', 60, 18);
    });

    it('does not draw channel labels for mono', () => {
      const audioBuffer = createMockAudioBuffer(1);
      const mockContext = createMockCanvas2DContext();
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Spectrogram channelIndex={0} numberOfChannels={1} />
        </TestWrapper>
      );

      // Should not draw channel labels for mono
      const channelLabelCalls = (mockContext.fillText as jest.Mock).mock.calls
        .filter(call => call[0] === 'Lch' || call[0] === 'Rch' || call[0].startsWith('ch'));
      
      expect(channelLabelCalls).toHaveLength(0);
    });
  });

  describe('Spectrogram Data Rendering', () => {
    it('draws spectrogram pixels with correct colors', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      const mockGetSpectrogram = jest.fn().mockReturnValue([[0.5, 0.8], [0.2, 0.9]]);
      const mockGetSpectrogramColor = jest.fn()
        .mockReturnValueOnce('rgb(100,100,100)')
        .mockReturnValueOnce('rgb(200,200,200)')
        .mockReturnValueOnce('rgb(50,50,50)')
        .mockReturnValueOnce('rgb(250,250,250)');
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ 
            getSpectrogram: mockGetSpectrogram,
            getSpectrogramColor: mockGetSpectrogramColor 
          }}
          analyzeSettings={{ spectrogramAmplitudeRange: 80 }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should call color function for each pixel
      expect(mockGetSpectrogramColor).toHaveBeenCalledWith(0.5, 80);
      expect(mockGetSpectrogramColor).toHaveBeenCalledWith(0.8, 80);
      expect(mockGetSpectrogramColor).toHaveBeenCalledWith(0.2, 80);
      expect(mockGetSpectrogramColor).toHaveBeenCalledWith(0.9, 80);

      // Should draw rectangles with correct colors
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('handles empty spectrogram data', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      const mockGetSpectrogram = jest.fn().mockReturnValue([]);
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      expect(() => {
        render(
          <TestWrapper 
            vscodeState={{ audioBuffer }}
            analyzeState={{ getSpectrogram: mockGetSpectrogram }}
          >
            <Spectrogram {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('calculates correct rectangle dimensions', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      const mockGetSpectrogram = jest.fn().mockReturnValue([[1, 2, 3]]);
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ getSpectrogram: mockGetSpectrogram }}
          analyzeSettings={{ 
            minTime: 0,
            maxTime: 1,
            hopSize: 512 
          }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should draw rectangles with calculated dimensions
      expect(mockContext.fillRect).toHaveBeenCalled();
      const calls = (mockContext.fillRect as jest.Mock).mock.calls;
      calls.forEach(call => {
        expect(call[2]).toBeGreaterThan(0); // width > 0
        expect(call[3]).toBeGreaterThan(0); // height > 0
      });
    });
  });

  describe('Settings Integration', () => {
    it('responds to frequency range changes', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockGetSpectrogram = jest.fn().mockReturnValue([]);
      
      const { rerender } = render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ getSpectrogram: mockGetSpectrogram }}
          analyzeSettings={{ minFrequency: 0, maxFrequency: 22050 }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Change frequency range
      rerender(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ getSpectrogram: mockGetSpectrogram }}
          analyzeSettings={{ minFrequency: 100, maxFrequency: 10000 }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should redraw with new settings
      expect(mockGetSpectrogram).toHaveBeenCalledTimes(2);
    });

    it('responds to time range changes', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockGetSpectrogram = jest.fn().mockReturnValue([]);
      
      const { rerender } = render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ getSpectrogram: mockGetSpectrogram }}
          analyzeSettings={{ minTime: 0, maxTime: 1 }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Change time range
      rerender(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ getSpectrogram: mockGetSpectrogram }}
          analyzeSettings={{ minTime: 0.5, maxTime: 1.5 }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should redraw with new settings
      expect(mockGetSpectrogram).toHaveBeenCalledTimes(2);
    });

    it('uses spectrogramVerticalScale setting', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{ spectrogramVerticalScale: 2 }}
        >
          <Spectrogram {...defaultProps} />
        </TestWrapper>
      );

      // Should use vertical scale in calculations
      expect(mockContext.fillText).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing canvas context gracefully', () => {
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(null);
      
      const audioBuffer = createMockAudioBuffer();
      
      expect(() => {
        render(
          <TestWrapper vscodeState={{ audioBuffer }}>
            <Spectrogram {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles invalid channel index', () => {
      const audioBuffer = createMockAudioBuffer(2);
      
      expect(() => {
        render(
          <TestWrapper vscodeState={{ audioBuffer }}>
            <Spectrogram channelIndex={5} numberOfChannels={2} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles zero frequency range', () => {
      const audioBuffer = createMockAudioBuffer();
      
      expect(() => {
        render(
          <TestWrapper 
            vscodeState={{ audioBuffer }}
            analyzeSettings={{ minFrequency: 1000, maxFrequency: 1000 }}
          >
            <Spectrogram {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles zero time range', () => {
      const audioBuffer = createMockAudioBuffer();
      
      expect(() => {
        render(
          <TestWrapper 
            vscodeState={{ audioBuffer }}
            analyzeSettings={{ minTime: 1, maxTime: 1 }}
          >
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

      expect(canvasBox).toContainElement(mainCanvas);
      expect(canvasBox).toContainElement(axisCanvas);
    });
  });
});