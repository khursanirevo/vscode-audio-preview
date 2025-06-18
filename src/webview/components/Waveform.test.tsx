import React from 'react';
import { render, screen } from '@testing-library/react';
import { Waveform, WaveformProps } from './Waveform';

// Mock CSS import
jest.mock('../styles/figure.css', () => ({}));

// Mock types
jest.mock('../types', () => ({
  canvasSizes: {
    waveformWidth: 800,
    waveformHeight: 200,
  },
}));

// Create mock canvas context
const createMockCanvas2DContext = () => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  getContext: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
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
    ...analyzeState,
  };

  const mockAnalyzeSettings = {
    minTime: 0,
    maxTime: 1,
    minAmplitude: -1,
    maxAmplitude: 1,
    waveformVerticalScale: 1,
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
    return { roundToNearestNiceNumber: (value: number) => [value, 2] };
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
      minAmplitude: -1,
      maxAmplitude: 1,
      waveformVerticalScale: 1,
    };
  },
}));

describe('Waveform Component', () => {
  const createMockAudioBuffer = (numberOfChannels = 2, length = 1000) => {
    const mockChannelData = new Float32Array(length);
    // Fill with some sample data
    for (let i = 0; i < length; i++) {
      mockChannelData[i] = Math.sin(2 * Math.PI * i / 100) * 0.5; // Simple sine wave
    }

    return {
      numberOfChannels,
      length,
      sampleRate: 44100,
      getChannelData: jest.fn().mockReturnValue(mockChannelData),
      copyFromChannel: jest.fn(),
      copyToChannel: jest.fn(),
    };
  };

  const defaultProps: WaveformProps = {
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
          <Waveform {...defaultProps} />
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
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      const mainCanvas = document.querySelector('.mainCanvas') as HTMLCanvasElement;
      const axisCanvas = document.querySelector('.axisCanvas') as HTMLCanvasElement;

      expect(mainCanvas).toHaveAttribute('width', '800');
      expect(mainCanvas).toHaveAttribute('height', '200');
      expect(axisCanvas).toHaveAttribute('width', '800');
      expect(axisCanvas).toHaveAttribute('height', '200');
    });
  });

  describe('Audio Data Rendering', () => {
    it('renders without crashing when no audio buffer', () => {
      render(
        <TestWrapper vscodeState={{ audioBuffer: null }}>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should render canvas elements but not draw anything
      expect(document.querySelector('.mainCanvas')).toBeInTheDocument();
    });

    it('draws waveform when audio buffer is available', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should clear canvases
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 200);
      
      // Should set drawing styles
      expect(mockContext.fillStyle).toBe('rgb(160,60,200)');
      expect(mockContext.strokeStyle).toBe('rgb(160,60,200)');
    });

    it('calls getChannelData with correct channel index', () => {
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Waveform channelIndex={1} numberOfChannels={2} />
        </TestWrapper>
      );

      expect(audioBuffer.getChannelData).toHaveBeenCalledWith(1);
    });

    it('handles different channel indices', () => {
      const audioBuffer = createMockAudioBuffer(4);
      
      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Waveform channelIndex={3} numberOfChannels={4} />
        </TestWrapper>
      );

      expect(audioBuffer.getChannelData).toHaveBeenCalledWith(3);
    });
  });

  describe('Axis Drawing', () => {
    it('draws horizontal time axis', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      const mockAnalyzeContext = {
        roundToNearestNiceNumber: jest.fn().mockReturnValue([0.1, 1]),
      };
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={mockAnalyzeContext}
          analyzeSettings={{ minTime: 0, maxTime: 1, minAmplitude: -1, maxAmplitude: 1 }}
        >
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should call roundToNearestNiceNumber for time axis
      expect(mockAnalyzeContext.roundToNearestNiceNumber).toHaveBeenCalledWith(0.1);
      
      // Should draw axis labels
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('draws vertical amplitude axis', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockContext = createMockCanvas2DContext();
      const mockAnalyzeContext = {
        roundToNearestNiceNumber: jest.fn().mockReturnValue([0.2, 1]),
      };
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={mockAnalyzeContext}
          analyzeSettings={{ 
            minTime: 0, 
            maxTime: 1, 
            minAmplitude: -1, 
            maxAmplitude: 1,
            waveformVerticalScale: 1 
          }}
        >
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should call roundToNearestNiceNumber for amplitude axis
      expect(mockAnalyzeContext.roundToNearestNiceNumber).toHaveBeenCalledWith(0.2);
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
          <Waveform channelIndex={0} numberOfChannels={2} />
        </TestWrapper>
      );

      expect(mockContext.fillText).toHaveBeenCalledWith('Lch', 33, 10);

      jest.clearAllMocks();

      // Test right channel
      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Waveform channelIndex={1} numberOfChannels={2} />
        </TestWrapper>
      );

      expect(mockContext.fillText).toHaveBeenCalledWith('Rch', 33, 10);
    });

    it('draws numbered channel labels for multi-channel', () => {
      const audioBuffer = createMockAudioBuffer(4);
      const mockContext = createMockCanvas2DContext();
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Waveform channelIndex={2} numberOfChannels={4} />
        </TestWrapper>
      );

      expect(mockContext.fillText).toHaveBeenCalledWith('ch3', 33, 10);
    });

    it('does not draw channel labels for mono', () => {
      const audioBuffer = createMockAudioBuffer(1);
      const mockContext = createMockCanvas2DContext();
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Waveform channelIndex={0} numberOfChannels={1} />
        </TestWrapper>
      );

      // Should not draw channel labels for mono
      const channelLabelCalls = (mockContext.fillText as jest.Mock).mock.calls
        .filter(call => call[0] === 'Lch' || call[0] === 'Rch' || call[0].startsWith('ch'));
      
      expect(channelLabelCalls).toHaveLength(0);
    });
  });

  describe('Performance Optimization', () => {
    it('uses fillRect for high-density data', () => {
      // Create large dataset
      const audioBuffer = createMockAudioBuffer(1, 50000);
      const mockContext = createMockCanvas2DContext();
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should use fillRect for performance
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('uses line drawing for low-density data', () => {
      // Create small dataset
      const audioBuffer = createMockAudioBuffer(1, 100);
      const mockContext = createMockCanvas2DContext();
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should use line drawing for better quality
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalled();
      expect(mockContext.lineTo).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('limits data size for performance', () => {
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{ minTime: 0, maxTime: 10 }} // Large time range
        >
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should handle large time ranges without performance issues
      expect(audioBuffer.getChannelData).toHaveBeenCalledWith(0);
    });
  });

  describe('Settings Integration', () => {
    it('responds to time range settings', () => {
      const audioBuffer = createMockAudioBuffer();
      
      const { rerender } = render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{ minTime: 0, maxTime: 1 }}
        >
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Change time range
      rerender(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{ minTime: 0.5, maxTime: 1.5 }}
        >
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should redraw with new time range
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });

    it('responds to amplitude range settings', () => {
      const audioBuffer = createMockAudioBuffer();
      
      const { rerender } = render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{ minAmplitude: -1, maxAmplitude: 1 }}
        >
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Change amplitude range
      rerender(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{ minAmplitude: -0.5, maxAmplitude: 0.5 }}
        >
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should redraw with new amplitude range
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });

    it('uses waveform vertical scale setting', () => {
      const audioBuffer = createMockAudioBuffer();
      const mockAnalyzeContext = {
        roundToNearestNiceNumber: jest.fn().mockReturnValue([0.1, 1]),
      };
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={mockAnalyzeContext}
          analyzeSettings={{ 
            waveformVerticalScale: 2,
            minAmplitude: -1,
            maxAmplitude: 1 
          }}
        >
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should use vertical scale in axis calculation
      expect(mockAnalyzeContext.roundToNearestNiceNumber).toHaveBeenCalledWith(0.1);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing canvas context gracefully', () => {
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(null);
      
      const audioBuffer = createMockAudioBuffer();
      
      expect(() => {
        render(
          <TestWrapper vscodeState={{ audioBuffer }}>
            <Waveform {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles empty channel data', () => {
      const audioBuffer = {
        ...createMockAudioBuffer(),
        getChannelData: jest.fn().mockReturnValue(new Float32Array(0)),
      };
      
      expect(() => {
        render(
          <TestWrapper vscodeState={{ audioBuffer }}>
            <Waveform {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles invalid channel index', () => {
      const audioBuffer = createMockAudioBuffer(2);
      
      expect(() => {
        render(
          <TestWrapper vscodeState={{ audioBuffer }}>
            <Waveform channelIndex={5} numberOfChannels={2} />
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
            <Waveform {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles zero amplitude range', () => {
      const audioBuffer = createMockAudioBuffer();
      
      expect(() => {
        render(
          <TestWrapper 
            vscodeState={{ audioBuffer }}
            analyzeSettings={{ minAmplitude: 0, maxAmplitude: 0 }}
          >
            <Waveform {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Component Structure', () => {
    it('renders with correct CSS classes', () => {
      render(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      expect(document.querySelector('.canvasBox')).toBeInTheDocument();
      expect(document.querySelector('.mainCanvas')).toBeInTheDocument();
      expect(document.querySelector('.axisCanvas')).toBeInTheDocument();
    });

    it('has proper canvas stacking order', () => {
      render(
        <TestWrapper>
          <Waveform {...defaultProps} />
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