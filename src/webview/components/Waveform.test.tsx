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

// Create shared mock canvas context
const mockCanvasContext = {
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
const mockRoundToNearestNiceNumber = jest.fn().mockImplementation((value: number) => [value, 2]);

// Mock contexts that can be updated
let mockVSCodeContext: any = {
  audioBuffer: null,
};

let mockAnalyzeContext = {
  roundToNearestNiceNumber: mockRoundToNearestNiceNumber,
};

let mockAnalyzeSettings = {
  minTime: 0,
  maxTime: 1,
  minAmplitude: -1,
  maxAmplitude: 1,
  waveformVisible: true,
  waveformVerticalScale: 1,
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

describe('Waveform Component', () => {
  const createMockAudioBuffer = (numberOfChannels = 2, length = 1000) => ({
    numberOfChannels,
    length,
    sampleRate: 44100,
    getChannelData: jest.fn().mockReturnValue(new Float32Array(length)),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  });

  const defaultProps: WaveformProps = {
    channelIndex: 0,
    numberOfChannels: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock contexts to defaults
    mockVSCodeContext = {
      audioBuffer: null,
    };
    mockAnalyzeContext = {
      roundToNearestNiceNumber: mockRoundToNearestNiceNumber,
    };
    mockAnalyzeSettings = {
      minTime: 0,
      maxTime: 1,
      minAmplitude: -1,
      maxAmplitude: 1,
      waveformVisible: true,
      waveformVerticalScale: 1,
    };
  });

  describe('Basic Rendering', () => {
    it('renders canvas elements', () => {
      render(
        <TestWrapper>
          <Waveform {...defaultProps} />
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
      updateMockContexts({ audioBuffer: null });
      
      render(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should render canvas elements but not draw anything
      expect(document.querySelector('.mainCanvas')).toBeInTheDocument();
    });

    it('renders waveform when audio buffer is available', () => {
      const audioBuffer = createMockAudioBuffer();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      
      updateMockContexts({ audioBuffer });

      render(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should clear canvases
      expect(mockCanvasContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 200);
      
      // Should get channel data
      expect(audioBuffer.getChannelData).toHaveBeenCalledWith(0);
    });
  });

  describe('Waveform Drawing', () => {
    it('draws waveform line', () => {
      const audioBuffer = createMockAudioBuffer();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.5, -0.5, 0.3, -0.3]));
      
      updateMockContexts({ audioBuffer });

      render(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should call drawing methods
      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
      expect(mockCanvasContext.moveTo).toHaveBeenCalled();
      expect(mockCanvasContext.lineTo).toHaveBeenCalled();
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('handles empty waveform data', () => {
      const audioBuffer = createMockAudioBuffer();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array());
      
      updateMockContexts({ audioBuffer });

      expect(() => {
        render(
          <TestWrapper>
            <Waveform {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('draws waveform with amplitude scaling', () => {
      const audioBuffer = createMockAudioBuffer();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([1.0, -1.0, 0.5, -0.5]));
      
      updateMockContexts({ audioBuffer }, {}, { 
        minAmplitude: -0.5,
        maxAmplitude: 0.5
      });

      render(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should draw scaled waveform
      expect(mockCanvasContext.moveTo).toHaveBeenCalled();
      expect(mockCanvasContext.lineTo).toHaveBeenCalled();
    });
  });

  describe('Axis Drawing', () => {
    it('draws time axis', () => {
      const audioBuffer = createMockAudioBuffer();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      mockRoundToNearestNiceNumber.mockReturnValue([0.1, 1]);
      
      updateMockContexts({ audioBuffer }, {}, { minTime: 0, maxTime: 1 });

      render(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should call roundToNearestNiceNumber for time axis
      expect(mockRoundToNearestNiceNumber).toHaveBeenCalledWith(0.1);
      
      // Should draw axis labels
      expect(mockCanvasContext.fillText).toHaveBeenCalled();
    });

    it('draws amplitude axis', () => {
      const audioBuffer = createMockAudioBuffer();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      mockRoundToNearestNiceNumber.mockReturnValue([0.2, 2]);
      
      updateMockContexts({ audioBuffer }, {}, { 
        minAmplitude: -1,
        maxAmplitude: 1
      });

      render(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should draw amplitude labels
      expect(mockCanvasContext.fillText).toHaveBeenCalled();
    });
  });

  describe('Channel Labels', () => {
    it('draws L/R channel labels for stereo', () => {
      const audioBuffer = createMockAudioBuffer(2);
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      updateMockContexts({ audioBuffer });

      // Test left channel
      render(
        <TestWrapper>
          <Waveform channelIndex={0} numberOfChannels={2} />
        </TestWrapper>
      );

      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('Lch', 33, 10);

      jest.clearAllMocks();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));

      // Test right channel
      render(
        <TestWrapper>
          <Waveform channelIndex={1} numberOfChannels={2} />
        </TestWrapper>
      );

      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('Rch', 33, 10);
    });

    it('draws numbered channel labels for multi-channel', () => {
      const audioBuffer = createMockAudioBuffer(4);
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      updateMockContexts({ audioBuffer });

      render(
        <TestWrapper>
          <Waveform channelIndex={2} numberOfChannels={4} />
        </TestWrapper>
      );

      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('ch3', 33, 10);
    });

    it('does not draw channel labels for mono', () => {
      const audioBuffer = createMockAudioBuffer(1);
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      updateMockContexts({ audioBuffer });

      render(
        <TestWrapper>
          <Waveform channelIndex={0} numberOfChannels={1} />
        </TestWrapper>
      );

      // Should not draw channel labels for mono
      const channelLabelCalls = (mockCanvasContext.fillText as jest.Mock).mock.calls
        .filter(call => call[0] === 'Lch' || call[0] === 'Rch' || call[0].startsWith('ch'));
      
      expect(channelLabelCalls).toHaveLength(0);
    });
  });

  describe('Settings Integration', () => {
    it('responds to amplitude range changes', () => {
      const audioBuffer = createMockAudioBuffer();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      
      updateMockContexts({ audioBuffer }, {}, { minAmplitude: -1, maxAmplitude: 1 });

      const { rerender } = render(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Change amplitude range
      updateMockContexts({ audioBuffer }, {}, { minAmplitude: -0.5, maxAmplitude: 0.5 });
      
      rerender(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should call getChannelData for each render
      expect(audioBuffer.getChannelData).toHaveBeenCalledTimes(2);
    });

    it('responds to time range changes', () => {
      const audioBuffer = createMockAudioBuffer();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      
      updateMockContexts({ audioBuffer }, {}, { minTime: 0, maxTime: 1 });

      const { rerender } = render(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Change time range
      updateMockContexts({ audioBuffer }, {}, { minTime: 0.5, maxTime: 1.5 });
      
      rerender(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should call getChannelData for each render
      expect(audioBuffer.getChannelData).toHaveBeenCalledTimes(2);
    });

    it('respects waveformVisible setting', () => {
      const audioBuffer = createMockAudioBuffer();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      
      updateMockContexts({ audioBuffer }, {}, { waveformVisible: false });

      render(
        <TestWrapper>
          <Waveform {...defaultProps} />
        </TestWrapper>
      );

      // Should still call clear but not draw waveform
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
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
            <Waveform {...defaultProps} />
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
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      updateMockContexts({ audioBuffer });
      
      expect(() => {
        render(
          <TestWrapper>
            <Waveform channelIndex={5} numberOfChannels={2} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles zero amplitude range', () => {
      const audioBuffer = createMockAudioBuffer();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      
      updateMockContexts({ audioBuffer }, {}, { minAmplitude: 0.5, maxAmplitude: 0.5 });

      expect(() => {
        render(
          <TestWrapper>
            <Waveform {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles zero time range', () => {
      const audioBuffer = createMockAudioBuffer();
      audioBuffer.getChannelData = jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, -0.1, -0.2]));
      
      updateMockContexts({ audioBuffer }, {}, { minTime: 1, maxTime: 1 });

      expect(() => {
        render(
          <TestWrapper>
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

      expect(canvasBox).toContainElement(mainCanvas as HTMLElement);
      expect(canvasBox).toContainElement(axisCanvas as HTMLElement);
    });
  });
});