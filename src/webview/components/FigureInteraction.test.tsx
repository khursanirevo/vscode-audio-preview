import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FigureInteraction } from './FigureInteraction';

// Mock CSS import
jest.mock('./FigureInteraction.css', () => ({}));

// Mock utils
jest.mock('../utils/math', () => ({
  hzToMel: (hz: number) => hz * 1.127,
  melToHz: (mel: number) => mel / 1.127,
}));

// Mock types
jest.mock('../types', () => ({
  WindowSizeIndex: {
    W1024: 1024,
  },
  FrequencyScale: {
    Linear: 'linear',
    Log: 'log',
    Mel: 'mel',
  },
}));

// Test wrapper with context mocks
const TestWrapper = ({ 
  children, 
  vscodeState = {}, 
  playerState = {},
  analyzeState = {}, 
  analyzeSettings = {} 
}: {
  children: React.ReactNode;
  vscodeState?: any;
  playerState?: any;
  analyzeState?: any;
  analyzeSettings?: any;
}) => {
  const mockVSCodeContext = {
    audioBuffer: null,
    ...vscodeState,
  };

  const mockPlayerContext = {
    seekbarPercent: 0,
    setSeekbarPercent: jest.fn(),
    ...playerState,
  };

  const mockAnalyzeContext = {
    analyze: jest.fn(),
    ...analyzeState,
  };

  const mockAnalyzeSettings = {
    minTime: 0,
    maxTime: 1,
    setMinTime: jest.fn(),
    setMaxTime: jest.fn(),
    minAmplitude: -1,
    maxAmplitude: 1,
    setMinAmplitude: jest.fn(),
    setMaxAmplitude: jest.fn(),
    minFrequency: 0,
    maxFrequency: 22050,
    setMinFrequency: jest.fn(),
    setMaxFrequency: jest.fn(),
    frequencyScale: 'linear' as const,
    resetToDefaultTimeRange: jest.fn(),
    resetToDefaultAmplitudeRange: jest.fn(),
    resetToDefaultFrequencyRange: jest.fn(),
    ...analyzeSettings,
  };

  return (
    <div 
      data-testid="mock-provider"
      data-mock-vscode={JSON.stringify(mockVSCodeContext)}
      data-mock-player={JSON.stringify(mockPlayerContext)}
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

jest.mock('../hooks/usePlayer', () => ({
  usePlayer: () => {
    const element = document.querySelector('[data-mock-player]') as any;
    if (element) {
      return JSON.parse(element.getAttribute('data-mock-player') || '{}');
    }
    return { seekbarPercent: 0, setSeekbarPercent: jest.fn() };
  },
}));

jest.mock('../hooks/useAnalyze', () => ({
  useAnalyze: () => {
    const element = document.querySelector('[data-mock-analyze]') as any;
    if (element) {
      return JSON.parse(element.getAttribute('data-mock-analyze') || '{}');
    }
    return { analyze: jest.fn() };
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
      setMinTime: jest.fn(),
      setMaxTime: jest.fn(),
      minAmplitude: -1,
      maxAmplitude: 1,
      setMinAmplitude: jest.fn(),
      setMaxAmplitude: jest.fn(),
      minFrequency: 0,
      maxFrequency: 22050,
      setMinFrequency: jest.fn(),
      setMaxFrequency: jest.fn(),
      frequencyScale: 'linear' as const,
      resetToDefaultTimeRange: jest.fn(),
      resetToDefaultAmplitudeRange: jest.fn(),
      resetToDefaultFrequencyRange: jest.fn(),
    };
  },
}));

describe('FigureInteraction Component', () => {
  const user = userEvent.setup();
  
  const createMockAudioBuffer = (duration = 10) => ({
    numberOfChannels: 2,
    length: 44100 * duration,
    sampleRate: 44100,
    duration,
    getChannelData: jest.fn().mockReturnValue(new Float32Array(44100 * duration)),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders FigureInteraction component', () => {
      render(
        <TestWrapper>
          <FigureInteraction onWaveformCanvas={true}>
            <div data-testid="child-content">Child Content</div>
          </FigureInteraction>
        </TestWrapper>
      );

      expect(document.querySelector('.figureInteraction')).toBeInTheDocument();
      expect(document.querySelector('.visibleBar')).toBeInTheDocument();
      expect(document.querySelector('.userInputDiv')).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('renders without children', () => {
      render(
        <TestWrapper>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      expect(document.querySelector('.figureInteraction')).toBeInTheDocument();
    });
  });

  describe('Seekbar Position', () => {
    it('updates visible bar based on seekbar position', () => {
      const audioBuffer = createMockAudioBuffer(10);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          playerState={{ seekbarPercent: 50 }}
          analyzeSettings={{ minTime: 0, maxTime: 10 }}
        >
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const visibleBar = document.querySelector('.visibleBar') as HTMLElement;
      expect(visibleBar.style.width).toBe('50%');
    });

    it('handles seekbar position outside visible range', () => {
      const audioBuffer = createMockAudioBuffer(10);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          playerState={{ seekbarPercent: 80 }}
          analyzeSettings={{ minTime: 0, maxTime: 5 }} // Visible range is 0-5s, seekbar at 8s
        >
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const visibleBar = document.querySelector('.visibleBar') as HTMLElement;
      expect(visibleBar.style.width).toBe('100%');
    });

    it('handles seekbar position before visible range', () => {
      const audioBuffer = createMockAudioBuffer(10);
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          playerState={{ seekbarPercent: 10 }}
          analyzeSettings={{ minTime: 5, maxTime: 10 }} // Visible range is 5-10s, seekbar at 1s
        >
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const visibleBar = document.querySelector('.visibleBar') as HTMLElement;
      expect(visibleBar.style.width).toBe('0%');
    });
  });

  describe('Mouse Interaction - Drag Selection', () => {
    it('starts drag selection on left mouse down', async () => {
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 100, 
        clientY: 50 
      });

      // Should create selection div
      await waitFor(() => {
        expect(document.querySelector('div[style*="border: 1px solid red"]')).toBeInTheDocument();
      });
    });

    it('updates selection during mouse move', async () => {
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Start drag
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 100, 
        clientY: 50 
      });

      // Move mouse
      fireEvent.mouseMove(userInputDiv, { 
        clientX: 200, 
        clientY: 150 
      });

      // Selection should be updated
      await waitFor(() => {
        const selection = document.querySelector('div[style*="border: 1px solid red"]') as HTMLElement;
        expect(selection).toBeInTheDocument();
      });
    });

    it('applies selection on mouse up', async () => {
      const audioBuffer = createMockAudioBuffer();
      const mockSetMinTime = jest.fn();
      const mockSetMaxTime = jest.fn();
      const mockAnalyze = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ analyze: mockAnalyze }}
          analyzeSettings={{ 
            minTime: 0, 
            maxTime: 10,
            setMinTime: mockSetMinTime,
            setMaxTime: mockSetMaxTime 
          }}
        >
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Mock getBoundingClientRect
      Object.defineProperty(userInputDiv, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          width: 1000,
          height: 400,
        }),
      });

      // Start drag
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 200, 
        clientY: 100 
      });

      // End drag
      fireEvent.mouseUp(userInputDiv, { 
        clientX: 400, 
        clientY: 200 
      });

      // Should apply selection
      await waitFor(() => {
        expect(mockSetMinTime).toHaveBeenCalled();
        expect(mockSetMaxTime).toHaveBeenCalled();
        expect(mockAnalyze).toHaveBeenCalled();
      });
    });
  });

  describe('Click to Seek', () => {
    it('seeks to clicked position for small movements', async () => {
      const audioBuffer = createMockAudioBuffer(10);
      const mockSetSeekbarPercent = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          playerState={{ setSeekbarPercent: mockSetSeekbarPercent }}
          analyzeSettings={{ minTime: 0, maxTime: 10 }}
        >
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Mock getBoundingClientRect
      Object.defineProperty(userInputDiv, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          width: 1000,
          height: 400,
        }),
      });

      // Click at middle
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 500, 
        clientY: 200 
      });

      fireEvent.mouseUp(userInputDiv, { 
        clientX: 500, 
        clientY: 200 
      });

      // Should seek to 50% of the time range (5 seconds)
      await waitFor(() => {
        expect(mockSetSeekbarPercent).toHaveBeenCalledWith(50);
      });
    });
  });

  describe('Right Click Reset', () => {
    it('resets all ranges on right click', async () => {
      const audioBuffer = createMockAudioBuffer();
      const mockResetTime = jest.fn();
      const mockResetAmplitude = jest.fn();
      const mockResetFrequency = jest.fn();
      const mockAnalyze = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeState={{ analyze: mockAnalyze }}
          analyzeSettings={{
            resetToDefaultTimeRange: mockResetTime,
            resetToDefaultAmplitudeRange: mockResetAmplitude,
            resetToDefaultFrequencyRange: mockResetFrequency,
          }}
        >
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      fireEvent.mouseDown(userInputDiv, { 
        button: 2 // Right click
      });

      await waitFor(() => {
        expect(mockResetTime).toHaveBeenCalled();
        expect(mockResetAmplitude).toHaveBeenCalled();
        expect(mockResetFrequency).toHaveBeenCalled();
        expect(mockAnalyze).toHaveBeenCalled();
      });
    });

    it('resets only time range on Ctrl+right click', async () => {
      const audioBuffer = createMockAudioBuffer();
      const mockResetTime = jest.fn();
      const mockResetAmplitude = jest.fn();
      const mockResetFrequency = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{
            resetToDefaultTimeRange: mockResetTime,
            resetToDefaultAmplitudeRange: mockResetAmplitude,
            resetToDefaultFrequencyRange: mockResetFrequency,
          }}
        >
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      fireEvent.mouseDown(userInputDiv, { 
        button: 2,
        ctrlKey: true
      });

      await waitFor(() => {
        expect(mockResetTime).toHaveBeenCalled();
        expect(mockResetAmplitude).not.toHaveBeenCalled();
        expect(mockResetFrequency).not.toHaveBeenCalled();
      });
    });

    it('resets value ranges on Shift+right click', async () => {
      const audioBuffer = createMockAudioBuffer();
      const mockResetTime = jest.fn();
      const mockResetAmplitude = jest.fn();
      const mockResetFrequency = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{
            resetToDefaultTimeRange: mockResetTime,
            resetToDefaultAmplitudeRange: mockResetAmplitude,
            resetToDefaultFrequencyRange: mockResetFrequency,
          }}
        >
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      fireEvent.mouseDown(userInputDiv, { 
        button: 2,
        shiftKey: true
      });

      await waitFor(() => {
        expect(mockResetTime).not.toHaveBeenCalled();
        expect(mockResetAmplitude).toHaveBeenCalled();
        expect(mockResetFrequency).toHaveBeenCalled();
      });
    });
  });

  describe('Keyboard Modifiers', () => {
    it('constrains selection to time axis with Ctrl key', async () => {
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Start drag
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 100, 
        clientY: 50 
      });

      // Press Ctrl key during drag
      fireEvent.keyDown(window, { key: 'Control', ctrlKey: true });

      // Move mouse
      fireEvent.mouseMove(userInputDiv, { 
        clientX: 200, 
        clientY: 150 
      });

      // Selection should be constrained to horizontal
      await waitFor(() => {
        const selection = document.querySelector('div[style*="border: 1px solid red"]') as HTMLElement;
        expect(selection).toBeInTheDocument();
        // Height should be 100%
        expect(selection.style.height).toBe('100%');
      });

      // Release Ctrl key
      fireEvent.keyUp(window, { key: 'Control' });
    });

    it('constrains selection to value axis with Shift key', async () => {
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Start drag
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 100, 
        clientY: 50 
      });

      // Press Shift key during drag
      fireEvent.keyDown(window, { key: 'Shift', shiftKey: true });

      // Move mouse
      fireEvent.mouseMove(userInputDiv, { 
        clientX: 200, 
        clientY: 150 
      });

      // Selection should be constrained to vertical
      await waitFor(() => {
        const selection = document.querySelector('div[style*="border: 1px solid red"]') as HTMLElement;
        expect(selection).toBeInTheDocument();
        // Width should be 100%
        expect(selection.style.width).toBe('100%');
      });

      // Release Shift key
      fireEvent.keyUp(window, { key: 'Shift' });
    });
  });

  describe('Waveform vs Spectrogram Mode', () => {
    it('updates amplitude range in waveform mode', async () => {
      const audioBuffer = createMockAudioBuffer();
      const mockSetMinAmplitude = jest.fn();
      const mockSetMaxAmplitude = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{
            minAmplitude: -1,
            maxAmplitude: 1,
            setMinAmplitude: mockSetMinAmplitude,
            setMaxAmplitude: mockSetMaxAmplitude,
          }}
        >
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Mock getBoundingClientRect
      Object.defineProperty(userInputDiv, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          width: 1000,
          height: 400,
        }),
      });

      // Drag selection
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 100, 
        clientY: 100 
      });

      fireEvent.mouseUp(userInputDiv, { 
        clientX: 200, 
        clientY: 200 
      });

      await waitFor(() => {
        expect(mockSetMinAmplitude).toHaveBeenCalled();
        expect(mockSetMaxAmplitude).toHaveBeenCalled();
      });
    });

    it('updates frequency range in spectrogram mode', async () => {
      const audioBuffer = createMockAudioBuffer();
      const mockSetMinFrequency = jest.fn();
      const mockSetMaxFrequency = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{
            minFrequency: 0,
            maxFrequency: 22050,
            setMinFrequency: mockSetMinFrequency,
            setMaxFrequency: mockSetMaxFrequency,
            frequencyScale: 'linear',
          }}
        >
          <FigureInteraction onWaveformCanvas={false} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Mock getBoundingClientRect
      Object.defineProperty(userInputDiv, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          width: 1000,
          height: 400,
        }),
      });

      // Drag selection
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 100, 
        clientY: 100 
      });

      fireEvent.mouseUp(userInputDiv, { 
        clientX: 200, 
        clientY: 200 
      });

      await waitFor(() => {
        expect(mockSetMinFrequency).toHaveBeenCalled();
        expect(mockSetMaxFrequency).toHaveBeenCalled();
      });
    });
  });

  describe('Frequency Scale Handling', () => {
    it('handles linear frequency scale', async () => {
      const audioBuffer = createMockAudioBuffer();
      const mockSetMinFrequency = jest.fn();
      const mockSetMaxFrequency = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{
            minFrequency: 0,
            maxFrequency: 22050,
            setMinFrequency: mockSetMinFrequency,
            setMaxFrequency: mockSetMaxFrequency,
            frequencyScale: 'linear',
          }}
        >
          <FigureInteraction onWaveformCanvas={false} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Mock getBoundingClientRect
      Object.defineProperty(userInputDiv, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          width: 1000,
          height: 400,
        }),
      });

      // Drag selection
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 100, 
        clientY: 100 
      });

      fireEvent.mouseUp(userInputDiv, { 
        clientX: 200, 
        clientY: 200 
      });

      await waitFor(() => {
        expect(mockSetMinFrequency).toHaveBeenCalled();
        expect(mockSetMaxFrequency).toHaveBeenCalled();
      });
    });

    it('handles logarithmic frequency scale', async () => {
      const audioBuffer = createMockAudioBuffer();
      const mockSetMinFrequency = jest.fn();
      const mockSetMaxFrequency = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{
            minFrequency: 10,
            maxFrequency: 22050,
            setMinFrequency: mockSetMinFrequency,
            setMaxFrequency: mockSetMaxFrequency,
            frequencyScale: 'log',
          }}
        >
          <FigureInteraction onWaveformCanvas={false} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Mock getBoundingClientRect
      Object.defineProperty(userInputDiv, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          width: 1000,
          height: 400,
        }),
      });

      // Drag selection
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 100, 
        clientY: 100 
      });

      fireEvent.mouseUp(userInputDiv, { 
        clientX: 200, 
        clientY: 200 
      });

      await waitFor(() => {
        expect(mockSetMinFrequency).toHaveBeenCalled();
        expect(mockSetMaxFrequency).toHaveBeenCalled();
      });
    });

    it('handles mel frequency scale', async () => {
      const audioBuffer = createMockAudioBuffer();
      const mockSetMinFrequency = jest.fn();
      const mockSetMaxFrequency = jest.fn();
      
      render(
        <TestWrapper 
          vscodeState={{ audioBuffer }}
          analyzeSettings={{
            minFrequency: 0,
            maxFrequency: 22050,
            setMinFrequency: mockSetMinFrequency,
            setMaxFrequency: mockSetMaxFrequency,
            frequencyScale: 'mel',
          }}
        >
          <FigureInteraction onWaveformCanvas={false} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Mock getBoundingClientRect
      Object.defineProperty(userInputDiv, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          width: 1000,
          height: 400,
        }),
      });

      // Drag selection
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 100, 
        clientY: 100 
      });

      fireEvent.mouseUp(userInputDiv, { 
        clientX: 200, 
        clientY: 200 
      });

      await waitFor(() => {
        expect(mockSetMinFrequency).toHaveBeenCalled();
        expect(mockSetMaxFrequency).toHaveBeenCalled();
      });
    });
  });

  describe('Context Menu Prevention', () => {
    it('prevents default context menu', () => {
      render(
        <TestWrapper>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(contextMenuEvent, 'preventDefault');
      
      fireEvent(userInputDiv, contextMenuEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing audio buffer gracefully', () => {
      expect(() => {
        render(
          <TestWrapper vscodeState={{ audioBuffer: null }}>
            <FigureInteraction onWaveformCanvas={true} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles mouse events without audio buffer', () => {
      render(
        <TestWrapper vscodeState={{ audioBuffer: null }}>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      expect(() => {
        fireEvent.mouseDown(userInputDiv, { button: 0 });
        fireEvent.mouseMove(userInputDiv, { clientX: 100, clientY: 100 });
        fireEvent.mouseUp(userInputDiv, { button: 0 });
      }).not.toThrow();
    });

    it('handles rapid mouse events', () => {
      const audioBuffer = createMockAudioBuffer();
      
      render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Rapid mouse events
      fireEvent.mouseDown(userInputDiv, { button: 0, clientX: 100, clientY: 100 });
      fireEvent.mouseMove(userInputDiv, { clientX: 110, clientY: 110 });
      fireEvent.mouseMove(userInputDiv, { clientX: 120, clientY: 120 });
      fireEvent.mouseUp(userInputDiv, { clientX: 130, clientY: 130 });
      
      expect(document.querySelector('.figureInteraction')).toBeInTheDocument();
    });
  });

  describe('Event Cleanup', () => {
    it('removes keyboard event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(
        <TestWrapper>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('cleans up selection div on unmount', () => {
      const audioBuffer = createMockAudioBuffer();
      
      const { unmount } = render(
        <TestWrapper vscodeState={{ audioBuffer }}>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      // Start drag to create selection div
      fireEvent.mouseDown(userInputDiv, { 
        button: 0, 
        clientX: 100, 
        clientY: 50 
      });

      // Unmount while dragging
      unmount();

      // Should not throw or leave dangling elements
      expect(document.querySelector('div[style*="border: 1px solid red"]')).not.toBeInTheDocument();
    });
  });
});