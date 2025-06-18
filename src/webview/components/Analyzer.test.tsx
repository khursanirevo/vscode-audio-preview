import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Analyzer } from './Analyzer';

// Mock CSS import
jest.mock('./Analyzer.css', () => ({}));

// Mock child components
jest.mock('./Waveform', () => ({
  Waveform: ({ channelIndex, numberOfChannels }: any) => (
    <div data-testid={`waveform-${channelIndex}`}>
      Waveform Channel {channelIndex} of {numberOfChannels}
    </div>
  ),
}));

jest.mock('./Spectrogram', () => ({
  Spectrogram: ({ channelIndex, numberOfChannels }: any) => (
    <div data-testid={`spectrogram-${channelIndex}`}>
      Spectrogram Channel {channelIndex} of {numberOfChannels}
    </div>
  ),
}));

// Create test wrapper with context mocks
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
    config: null,
    fileData: null,
    isLoading: false,
    error: null,
    ...vscodeState,
  };

  const mockAnalyzeContext = {
    analyze: jest.fn(),
    isAnalyzing: false,
    lastAnalyzeTime: null,
    ...analyzeState,
  };

  const mockAnalyzeSettings = {
    waveformVisible: true,
    spectrogramVisible: true,
    setWaveformVisible: jest.fn(),
    setSpectrogramVisible: jest.fn(),
    fftWindowSize: 1024,
    freqScale: 'linear' as const,
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
    return {
      audioBuffer: null,
      config: null,
      fileData: null,
      isLoading: false,
      error: null,
    };
  },
}));

jest.mock('../hooks/useAnalyze', () => ({
  useAnalyze: () => {
    const element = document.querySelector('[data-mock-analyze]') as any;
    if (element) {
      return JSON.parse(element.getAttribute('data-mock-analyze') || '{}');
    }
    return {
      analyze: jest.fn(),
      isAnalyzing: false,
      lastAnalyzeTime: null,
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
      waveformVisible: true,
      spectrogramVisible: true,
      setWaveformVisible: jest.fn(),
      setSpectrogramVisible: jest.fn(),
      fftWindowSize: 1024,
      freqScale: 'linear' as const,
    };
  },
}));

describe('Analyzer Component', () => {
  const user = userEvent.setup();
  
  const createMockAudioBuffer = (numberOfChannels = 2) => ({
    numberOfChannels,
    length: 1000,
    sampleRate: 44100,
    getChannelData: jest.fn(() => new Float32Array(1000)),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders analyzer component with analyze button', () => {
      render(
        <TestWrapper>
          <Analyzer />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
      expect(document.querySelector('.analyzerComponent')).toBeInTheDocument();
    });

    it('disables analyze button when no audio buffer', () => {
      render(
        <TestWrapper vscodeState={{ audioBuffer: null }}>
          <Analyzer />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /analyze/i })).toBeDisabled();
    });

    it('enables analyze button when audio buffer is available', () => {
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <Analyzer />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /analyze/i })).toBeEnabled();
    });
  });

  describe('Auto Analysis', () => {
    it('automatically analyzes when autoAnalyze is true and audio buffer is available', async () => {
      const analyzeMock = jest.fn();
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ analyze: analyzeMock }}
        >
          <Analyzer autoAnalyze={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(analyzeMock).toHaveBeenCalledTimes(1);
      });
    });

    it('does not auto analyze when autoAnalyze is false', async () => {
      const analyzeMock = jest.fn();
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ analyze: analyzeMock }}
        >
          <Analyzer autoAnalyze={false} />
        </TestWrapper>
      );

      // Wait a bit to ensure no analysis happens
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(analyzeMock).not.toHaveBeenCalled();
    });

    it('does not auto analyze when already analyzed', async () => {
      const analyzeMock = jest.fn();
      const audioBuffer = createMockAudioBuffer();
      
      // First render with analysis
      const { rerender } = render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ analyze: analyzeMock, lastAnalyzeTime: Date.now() }}
        >
          <Analyzer autoAnalyze={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(analyzeMock).toHaveBeenCalledTimes(1);
      });

      // Rerender should not trigger another analysis
      rerender(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ analyze: analyzeMock, lastAnalyzeTime: Date.now() }}
        >
          <Analyzer autoAnalyze={true} />
        </TestWrapper>
      );

      expect(analyzeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual Analysis', () => {
    it('calls analyze when button is clicked', async () => {
      const analyzeMock = jest.fn();
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ analyze: analyzeMock }}
        >
          <Analyzer />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /analyze/i }));
      expect(analyzeMock).toHaveBeenCalledTimes(1);
    });

    it('shows analyzing state when processing', () => {
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ isAnalyzing: true }}
        >
          <Analyzer />
        </TestWrapper>
      );

      expect(screen.getByText('Analyzing...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('sets show results when analyze is clicked', async () => {
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{ waveformVisible: true }}
        >
          <Analyzer />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /analyze/i }));

      // Results should be shown (empty at first, but container should exist)
      expect(document.querySelector('.analyzeResultBox')).toBeInTheDocument();
    });
  });

  describe('Visualization Rendering', () => {
    it('renders waveform when visible and results are shown', async () => {
      const audioBuffer = createMockAudioBuffer(2);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ lastAnalyzeTime: Date.now() }}
          analyzeSettings={{ waveformVisible: true, spectrogramVisible: false }}
        >
          <Analyzer />
        </TestWrapper>
      );

      expect(screen.getByTestId('waveform-0')).toBeInTheDocument();
      expect(screen.getByTestId('waveform-1')).toBeInTheDocument();
      expect(screen.queryByTestId('spectrogram-0')).not.toBeInTheDocument();
    });

    it('renders spectrogram when visible and results are shown', async () => {
      const audioBuffer = createMockAudioBuffer(2);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ lastAnalyzeTime: Date.now() }}
          analyzeSettings={{ waveformVisible: false, spectrogramVisible: true }}
        >
          <Analyzer />
        </TestWrapper>
      );

      expect(screen.getByTestId('spectrogram-0')).toBeInTheDocument();
      expect(screen.getByTestId('spectrogram-1')).toBeInTheDocument();
      expect(screen.queryByTestId('waveform-0')).not.toBeInTheDocument();
    });

    it('renders both waveform and spectrogram when both are visible', async () => {
      const audioBuffer = createMockAudioBuffer(1);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ lastAnalyzeTime: Date.now() }}
          analyzeSettings={{ waveformVisible: true, spectrogramVisible: true }}
        >
          <Analyzer />
        </TestWrapper>
      );

      expect(screen.getByTestId('waveform-0')).toBeInTheDocument();
      expect(screen.getByTestId('spectrogram-0')).toBeInTheDocument();
    });

    it('renders correct number of channels', async () => {
      const audioBuffer = createMockAudioBuffer(4);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ lastAnalyzeTime: Date.now() }}
          analyzeSettings={{ waveformVisible: true, spectrogramVisible: false }}
        >
          <Analyzer />
        </TestWrapper>
      );

      expect(screen.getByTestId('waveform-0')).toBeInTheDocument();
      expect(screen.getByTestId('waveform-1')).toBeInTheDocument();
      expect(screen.getByTestId('waveform-2')).toBeInTheDocument();
      expect(screen.getByTestId('waveform-3')).toBeInTheDocument();
    });

    it('does not render visualizations when results are not shown', () => {
      const audioBuffer = createMockAudioBuffer(2);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{ waveformVisible: true, spectrogramVisible: true }}
        >
          <Analyzer />
        </TestWrapper>
      );

      expect(screen.queryByTestId('waveform-0')).not.toBeInTheDocument();
      expect(screen.queryByTestId('spectrogram-0')).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('updates hasAnalyzed state when lastAnalyzeTime changes', async () => {
      const audioBuffer = createMockAudioBuffer();
      
      const { rerender } = render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ lastAnalyzeTime: null }}
        >
          <Analyzer />
        </TestWrapper>
      );

      // Initially should not show results
      expect(document.querySelector('.analyzeResultBox')).not.toBeInTheDocument();

      // Update with analyze time
      rerender(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ lastAnalyzeTime: Date.now() }}
        >
          <Analyzer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(document.querySelector('.analyzeResultBox')).toBeInTheDocument();
      });
    });

    it('shows results when analysis completes', async () => {
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ lastAnalyzeTime: Date.now() }}
          analyzeSettings={{ waveformVisible: true }}
        >
          <Analyzer />
        </TestWrapper>
      );

      expect(document.querySelector('.analyzeResultBox')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('uses default autoAnalyze value', () => {
      const audioBuffer = createMockAudioBuffer();
      
      // Should not auto analyze by default
      const analyzeMock = jest.fn();
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ analyze: analyzeMock }}
        >
          <Analyzer />
        </TestWrapper>
      );

      expect(analyzeMock).not.toHaveBeenCalled();
    });

    it('respects autoAnalyze prop when set to true', async () => {
      const audioBuffer = createMockAudioBuffer();
      const analyzeMock = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ analyze: analyzeMock }}
        >
          <Analyzer autoAnalyze={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(analyzeMock).toHaveBeenCalled();
      });
    });

    it('respects autoAnalyze prop when set to false', async () => {
      const audioBuffer = createMockAudioBuffer();
      const analyzeMock = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ analyze: analyzeMock }}
        >
          <Analyzer autoAnalyze={false} />
        </TestWrapper>
      );

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(analyzeMock).not.toHaveBeenCalled();
    });
  });

  describe('Component Structure', () => {
    it('renders with correct CSS classes', () => {
      render(
        <TestWrapper>
          <Analyzer />
        </TestWrapper>
      );

      expect(document.querySelector('.analyzerComponent')).toBeInTheDocument();
      expect(document.querySelector('.analyzeButton')).toBeInTheDocument();
    });

    it('renders canvas boxes for visualizations', async () => {
      const audioBuffer = createMockAudioBuffer(1);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ lastAnalyzeTime: Date.now() }}
          analyzeSettings={{ waveformVisible: true, spectrogramVisible: true }}
        >
          <Analyzer />
        </TestWrapper>
      );

      expect(document.querySelectorAll('.canvasBox')).toHaveLength(2);
    });

    it('has proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <Analyzer />
        </TestWrapper>
      );

      // Analyze button should be accessible
      const analyzeButton = screen.getByRole('button', { name: /analyze/i });
      expect(analyzeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null audio buffer gracefully', () => {
      render(
        <TestWrapper vscodeState={{ audioBuffer: null }}>
          <Analyzer />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toBeDisabled();
      expect(document.querySelector('.analyzeResultBox')).not.toBeInTheDocument();
    });

    it('handles audio buffer with zero channels', async () => {
      const audioBuffer = createMockAudioBuffer(0);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ lastAnalyzeTime: Date.now() }}
        >
          <Analyzer />
        </TestWrapper>
      );

      // Should render results box but no channels
      expect(document.querySelector('.analyzeResultBox')).toBeInTheDocument();
      expect(screen.queryByTestId('waveform-0')).not.toBeInTheDocument();
    });

    it('handles settings with both visualizations disabled', async () => {
      const audioBuffer = createMockAudioBuffer(1);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ lastAnalyzeTime: Date.now() }}
          analyzeSettings={{ waveformVisible: false, spectrogramVisible: false }}
        >
          <Analyzer />
        </TestWrapper>
      );

      expect(document.querySelector('.analyzeResultBox')).toBeInTheDocument();
      expect(screen.queryByTestId('waveform-0')).not.toBeInTheDocument();
      expect(screen.queryByTestId('spectrogram-0')).not.toBeInTheDocument();
    });
  });
});