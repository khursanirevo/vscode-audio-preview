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

// Simple test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="test-wrapper">{children}</div>;
};

// Mock functions that need to be tracked
const mockSetSeekbarPercent = jest.fn();
const mockAnalyze = jest.fn();
const mockSetMinTime = jest.fn();
const mockSetMaxTime = jest.fn();
const mockSetMinAmplitude = jest.fn();
const mockSetMaxAmplitude = jest.fn();
const mockSetMinFrequency = jest.fn();
const mockSetMaxFrequency = jest.fn();
const mockResetToDefaultTimeRange = jest.fn();
const mockResetToDefaultAmplitudeRange = jest.fn();
const mockResetToDefaultFrequencyRange = jest.fn();

// Mock contexts that can be updated
let mockVSCodeContext: any = {
  audioBuffer: null,
};

let mockPlayerContext = {
  seekbarPercent: 0,
  setSeekbarPercent: mockSetSeekbarPercent,
};

let mockAnalyzeContext = {
  analyze: mockAnalyze,
};

let mockAnalyzeSettings = {
  minTime: 0,
  maxTime: 1,
  setMinTime: mockSetMinTime,
  setMaxTime: mockSetMaxTime,
  minAmplitude: -1,
  maxAmplitude: 1,
  setMinAmplitude: mockSetMinAmplitude,
  setMaxAmplitude: mockSetMaxAmplitude,
  minFrequency: 0,
  maxFrequency: 22050,
  setMinFrequency: mockSetMinFrequency,
  setMaxFrequency: mockSetMaxFrequency,
  frequencyScale: 'linear' as const,
  resetToDefaultTimeRange: mockResetToDefaultTimeRange,
  resetToDefaultAmplitudeRange: mockResetToDefaultAmplitudeRange,
  resetToDefaultFrequencyRange: mockResetToDefaultFrequencyRange,
};

// Mock the hooks
jest.mock('../hooks/useVSCode', () => ({
  useVSCode: () => mockVSCodeContext,
}));

jest.mock('../hooks/usePlayer', () => ({
  usePlayer: () => mockPlayerContext,
}));

jest.mock('../hooks/useAnalyze', () => ({
  useAnalyze: () => mockAnalyzeContext,
}));

jest.mock('../hooks/useAnalyzeSettings', () => ({
  useAnalyzeSettings: () => mockAnalyzeSettings,
}));

// Helper function to update mock contexts
const updateMockContexts = (vscodeState = {}, playerState = {}, analyzeState = {}, analyzeSettingsState = {}) => {
  mockVSCodeContext = { ...mockVSCodeContext, ...vscodeState };
  mockPlayerContext = { ...mockPlayerContext, ...playerState };
  mockAnalyzeContext = { ...mockAnalyzeContext, ...analyzeState };
  mockAnalyzeSettings = { ...mockAnalyzeSettings, ...analyzeSettingsState };
};

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
    // Reset mock contexts to defaults
    mockVSCodeContext = {
      audioBuffer: null,
    };
    mockPlayerContext = {
      seekbarPercent: 0,
      setSeekbarPercent: mockSetSeekbarPercent,
    };
    mockAnalyzeContext = {
      analyze: mockAnalyze,
    };
    mockAnalyzeSettings = {
      minTime: 0,
      maxTime: 1,
      setMinTime: mockSetMinTime,
      setMaxTime: mockSetMaxTime,
      minAmplitude: -1,
      maxAmplitude: 1,
      setMinAmplitude: mockSetMinAmplitude,
      setMaxAmplitude: mockSetMaxAmplitude,
      minFrequency: 0,
      maxFrequency: 22050,
      setMinFrequency: mockSetMinFrequency,
      setMaxFrequency: mockSetMaxFrequency,
      frequencyScale: 'linear' as const,
      resetToDefaultTimeRange: mockResetToDefaultTimeRange,
      resetToDefaultAmplitudeRange: mockResetToDefaultAmplitudeRange,
      resetToDefaultFrequencyRange: mockResetToDefaultFrequencyRange,
    };
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
    it('updates visible bar based on seekbar position', async () => {
      const audioBuffer = createMockAudioBuffer(10);
      updateMockContexts(
        { audioBuffer },
        { seekbarPercent: 50 },
        {},
        { minTime: 0, maxTime: 10 }
      );
      
      render(
        <TestWrapper>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const visibleBar = document.querySelector('.visibleBar') as HTMLElement;
      
      await waitFor(() => {
        expect(visibleBar.style.width).toBe('50%');
      });
    });

    it('handles seekbar position outside visible range', async () => {
      const audioBuffer = createMockAudioBuffer(10);
      updateMockContexts(
        { audioBuffer },
        { seekbarPercent: 80 },
        {},
        { minTime: 0, maxTime: 5 } // Visible range is 0-5s, seekbar at 8s
      );
      
      render(
        <TestWrapper>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const visibleBar = document.querySelector('.visibleBar') as HTMLElement;
      
      await waitFor(() => {
        expect(visibleBar.style.width).toBe('100%');
      });
    });

    it('handles seekbar position before visible range', async () => {
      const audioBuffer = createMockAudioBuffer(10);
      updateMockContexts(
        { audioBuffer },
        { seekbarPercent: 10 },
        {},
        { minTime: 5, maxTime: 10 } // Visible range is 5-10s, seekbar at 1s
      );
      
      render(
        <TestWrapper>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const visibleBar = document.querySelector('.visibleBar') as HTMLElement;
      
      await waitFor(() => {
        expect(visibleBar.style.width).toBe('0%');
      });
    });
  });

  describe('Mouse Interaction - Drag Selection', () => {
    it('starts drag selection on left mouse down', async () => {
      const audioBuffer = createMockAudioBuffer();
      updateMockContexts({ audioBuffer });
      
      render(
        <TestWrapper>
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
      updateMockContexts({ audioBuffer });
      
      render(
        <TestWrapper>
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
      updateMockContexts(
        { audioBuffer },
        {},
        {},
        { minTime: 0, maxTime: 10 }
      );
      
      render(
        <TestWrapper>
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
      updateMockContexts(
        { audioBuffer },
        {},
        {},
        { minTime: 0, maxTime: 10 }
      );
      
      render(
        <TestWrapper>
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
      updateMockContexts({ audioBuffer });
      
      render(
        <TestWrapper>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      fireEvent.mouseDown(userInputDiv, { 
        button: 2 // Right click
      });

      await waitFor(() => {
        expect(mockResetToDefaultTimeRange).toHaveBeenCalled();
        expect(mockResetToDefaultAmplitudeRange).toHaveBeenCalled();
        expect(mockResetToDefaultFrequencyRange).toHaveBeenCalled();
        expect(mockAnalyze).toHaveBeenCalled();
      });
    });

    it('resets only time range on Ctrl+right click', async () => {
      const audioBuffer = createMockAudioBuffer();
      updateMockContexts({ audioBuffer });
      
      render(
        <TestWrapper>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      fireEvent.mouseDown(userInputDiv, { 
        button: 2,
        ctrlKey: true
      });

      await waitFor(() => {
        expect(mockResetToDefaultTimeRange).toHaveBeenCalled();
        expect(mockResetToDefaultAmplitudeRange).not.toHaveBeenCalled();
        expect(mockResetToDefaultFrequencyRange).not.toHaveBeenCalled();
      });
    });

    it('resets value ranges on Shift+right click', async () => {
      const audioBuffer = createMockAudioBuffer();
      updateMockContexts({ audioBuffer });
      
      render(
        <TestWrapper>
          <FigureInteraction onWaveformCanvas={true} />
        </TestWrapper>
      );

      const userInputDiv = document.querySelector('.userInputDiv') as HTMLElement;
      
      fireEvent.mouseDown(userInputDiv, { 
        button: 2,
        shiftKey: true
      });

      await waitFor(() => {
        expect(mockResetToDefaultTimeRange).not.toHaveBeenCalled();
        expect(mockResetToDefaultAmplitudeRange).toHaveBeenCalled();
        expect(mockResetToDefaultFrequencyRange).toHaveBeenCalled();
      });
    });
  });

  describe('Keyboard Modifiers', () => {
    it('constrains selection to time axis with Ctrl key', async () => {
      const audioBuffer = createMockAudioBuffer();
      updateMockContexts({ audioBuffer });
      
      render(
        <TestWrapper>
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
      updateMockContexts({ audioBuffer });
      
      render(
        <TestWrapper>
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
      updateMockContexts(
        { audioBuffer },
        {},
        {},
        { minAmplitude: -1, maxAmplitude: 1 }
      );
      
      render(
        <TestWrapper>
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
      updateMockContexts(
        { audioBuffer },
        {},
        {},
        { minFrequency: 0, maxFrequency: 22050, frequencyScale: 'linear' }
      );
      
      render(
        <TestWrapper>
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
      updateMockContexts(
        { audioBuffer },
        {},
        {},
        { minFrequency: 0, maxFrequency: 22050, frequencyScale: 'linear' }
      );
      
      render(
        <TestWrapper>
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
      updateMockContexts(
        { audioBuffer },
        {},
        {},
        { minFrequency: 10, maxFrequency: 22050, frequencyScale: 'log' }
      );
      
      render(
        <TestWrapper>
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
      updateMockContexts(
        { audioBuffer },
        {},
        {},
        { minFrequency: 0, maxFrequency: 22050, frequencyScale: 'mel' }
      );
      
      render(
        <TestWrapper>
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
      updateMockContexts({ audioBuffer: null });
      
      expect(() => {
        render(
          <TestWrapper>
            <FigureInteraction onWaveformCanvas={true} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles mouse events without audio buffer', () => {
      updateMockContexts({ audioBuffer: null });
      
      render(
        <TestWrapper>
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
      updateMockContexts({ audioBuffer });
      
      render(
        <TestWrapper>
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
      updateMockContexts({ audioBuffer });
      
      const { unmount } = render(
        <TestWrapper>
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