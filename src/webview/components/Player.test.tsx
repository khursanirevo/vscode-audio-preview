import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Player } from './Player';
import { PlayerProvider } from '../contexts/PlayerContext';
import { PlayerSettingsProvider } from '../contexts/PlayerSettingsContext';

// Mock CSS import
jest.mock('./Player.css', () => ({}));

// Simple test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="test-wrapper">{children}</div>;
};

// Mock functions that need to be tracked
const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockSetVolume = jest.fn();
const mockOnSeekbarInput = jest.fn();
const mockSetVolumeUnitDb = jest.fn();
const mockSetInitialVolume = jest.fn();
const mockSetInitialVolumeDb = jest.fn();
const mockSetEnableSpacekeyPlay = jest.fn();
const mockSetHpfCutoff = jest.fn();
const mockSetLpfCutoff = jest.fn();

// Mock contexts that can be updated
let mockPlayerContext = {
  isPlaying: false,
  currentSec: 0,
  seekbarValue: 0,
  play: mockPlay,
  pause: mockPause,
  setVolume: mockSetVolume,
  onSeekbarInput: mockOnSeekbarInput,
};

let mockPlayerSettingsContext = {
  volumeUnitDb: false,
  initialVolume: 100,
  initialVolumeDb: 0,
  enableSpacekeyPlay: true,
  hpfCutoff: 0,
  lpfCutoff: 0,
  setVolumeUnitDb: mockSetVolumeUnitDb,
  setInitialVolume: mockSetInitialVolume,
  setInitialVolumeDb: mockSetInitialVolumeDb,
  setEnableSpacekeyPlay: mockSetEnableSpacekeyPlay,
  setHpfCutoff: mockSetHpfCutoff,
  setLpfCutoff: mockSetLpfCutoff,
};

// Mock the hooks
jest.mock('../hooks/usePlayer', () => ({
  usePlayer: () => mockPlayerContext,
}));

jest.mock('../hooks/usePlayerSettings', () => ({
  usePlayerSettings: () => mockPlayerSettingsContext,
}));

// Helper function to update mock contexts
const updateMockContexts = (playerState = {}, playerSettingsState = {}) => {
  mockPlayerContext = { ...mockPlayerContext, ...playerState };
  mockPlayerSettingsContext = { ...mockPlayerSettingsContext, ...playerSettingsState };
};

describe('Player Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock contexts to defaults
    mockPlayerContext = {
      isPlaying: false,
      currentSec: 0,
      seekbarValue: 0,
      play: mockPlay,
      pause: mockPause,
      setVolume: mockSetVolume,
      onSeekbarInput: mockOnSeekbarInput,
    };
    mockPlayerSettingsContext = {
      volumeUnitDb: false,
      initialVolume: 100,
      initialVolumeDb: 0,
      enableSpacekeyPlay: true,
      hpfCutoff: 0,
      lpfCutoff: 0,
      setVolumeUnitDb: mockSetVolumeUnitDb,
      setInitialVolume: mockSetInitialVolume,
      setInitialVolumeDb: mockSetInitialVolumeDb,
      setEnableSpacekeyPlay: mockSetEnableSpacekeyPlay,
      setHpfCutoff: mockSetHpfCutoff,
      setLpfCutoff: mockSetLpfCutoff,
    };
  });

  describe('Basic Rendering', () => {
    it('renders player controls', () => {
      render(<TestWrapper><Player /></TestWrapper>);

      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
      expect(screen.getByText(/volume 100/)).toBeInTheDocument();
      expect(screen.getByText(/position 0.000 s/)).toBeInTheDocument();
      expect(screen.getByDisplayValue('0')).toBeInTheDocument(); // seek bar
    });

    it('shows correct initial state', () => {
      updateMockContexts({
        isPlaying: false,
        currentSec: 0,
        seekbarValue: 0,
      });

      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toHaveTextContent('play');
      expect(screen.getByText('position 0.000 s')).toBeInTheDocument();
    });
  });

  describe('Play/Pause Functionality', () => {
    it('shows play button when not playing', () => {
      updateMockContexts({ isPlaying: false });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toHaveTextContent('play');
    });

    it('shows pause button when playing', () => {
      updateMockContexts({ isPlaying: true });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toHaveTextContent('pause');
    });

    it('calls play when play button is clicked', async () => {
      updateMockContexts({ isPlaying: false });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button'));
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    it('calls pause when pause button is clicked', async () => {
      updateMockContexts({ isPlaying: true });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button'));
      expect(mockPause).toHaveBeenCalledTimes(1);
    });
  });

  describe('Volume Control', () => {
    it('displays volume in percentage mode', () => {
      updateMockContexts({}, { volumeUnitDb: false, initialVolume: 75 });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByText('volume 75')).toBeInTheDocument();
    });

    it('displays volume in dB mode', () => {
      updateMockContexts({}, { volumeUnitDb: true, initialVolumeDb: -10.5 });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByText('volume -10.5')).toBeInTheDocument();
    });

    it('handles volume change in percentage mode', async () => {
      updateMockContexts({}, { volumeUnitDb: false });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      const volumeSlider = document.querySelector('.volumeBar') as HTMLInputElement;
      await user.type(volumeSlider, '75');
      
      // The onChange handler should be called
      fireEvent.change(volumeSlider, { target: { value: '75' } });
      expect(mockSetVolume).toHaveBeenCalledWith(0.75);
    });

    it('handles volume change in dB mode', async () => {
      updateMockContexts({}, { volumeUnitDb: true, initialVolumeDb: 0 });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      const volumeSlider = document.querySelector('.volumeBar') as HTMLInputElement;
      fireEvent.change(volumeSlider, { target: { value: '-20' } });
      
      // -20 dB should be converted to linear: 10^(-20/20) = 0.1
      expect(mockSetVolume).toHaveBeenCalledWith(0.1);
    });

    it('handles mute in dB mode', async () => {
      updateMockContexts({}, { volumeUnitDb: true });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      const volumeSlider = document.querySelector('.volumeBar') as HTMLInputElement;
      fireEvent.change(volumeSlider, { target: { value: '-80' } });
      
      // -80 dB should be treated as mute (0)
      expect(mockSetVolume).toHaveBeenCalledWith(0);
    });

    it('configures volume bar correctly for percentage mode', () => {
      updateMockContexts({}, { volumeUnitDb: false, initialVolume: 100 });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      const volumeSlider = document.querySelector('.volumeBar') as HTMLInputElement;
      expect(volumeSlider).toHaveAttribute('min', '0');
      expect(volumeSlider).toHaveAttribute('max', '100');
      expect(volumeSlider).toHaveAttribute('step', '1');
    });

    it('configures volume bar correctly for dB mode', () => {
      updateMockContexts({}, { volumeUnitDb: true, initialVolumeDb: -10 });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      const volumeSlider = screen.getByDisplayValue('-10');
      expect(volumeSlider).toHaveAttribute('min', '-80');
      expect(volumeSlider).toHaveAttribute('max', '0');
      expect(volumeSlider).toHaveAttribute('step', '0.5');
    });
  });

  describe('Seek Functionality', () => {
    it('displays current position', () => {
      updateMockContexts({ currentSec: 123.456 });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByText('position 123.456 s')).toBeInTheDocument();
    });

    it('displays seek bar value', () => {
      updateMockContexts({ seekbarValue: 45 });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('45')).toBeInTheDocument();
    });

    it('handles seek bar input', async () => {
      updateMockContexts({});
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      // Find the user input seek bar (not the readonly one)
      const seekBars = screen.getAllByDisplayValue('100');
      const userSeekBar = seekBars.find(el => 
        el.classList.contains('userInputSeekBar')
      ) || seekBars[seekBars.length - 1];

      fireEvent.change(userSeekBar, { target: { value: '75' } });
      
      expect(mockOnSeekbarInput).toHaveBeenCalledWith(75);
      expect(userSeekBar).toHaveValue('100'); // Should be reset to 100
    });

    it('renders both seek bars correctly', () => {
      render(<TestWrapper><Player /></TestWrapper>);

      const seekBars = screen.getAllByRole('slider');
      // Should have volume bar + readonly seek bar + user input seek bar
      expect(seekBars.length).toBeGreaterThanOrEqual(3);
      
      // Check for seek bar specific classes
      expect(document.querySelector('.seekBar')).toBeInTheDocument();
      expect(document.querySelector('.userInputSeekBar')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('handles spacebar play/pause when enabled', async () => {
      updateMockContexts({ isPlaying: false }, { enableSpacekeyPlay: true });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { code: 'Space' });
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    it('handles spacebar pause when playing', async () => {
      updateMockContexts({ isPlaying: true }, { enableSpacekeyPlay: true });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { code: 'Space' });
      expect(mockPause).toHaveBeenCalledTimes(1);
    });

    it('ignores spacebar when disabled', async () => {
      updateMockContexts({}, { enableSpacekeyPlay: false });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { code: 'Space' });
      expect(mockPlay).not.toHaveBeenCalled();
    });

    it('prevents default on spacebar', async () => {
      updateMockContexts({}, { enableSpacekeyPlay: true });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      const preventDefaultSpy = jest.fn();
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      event.preventDefault = preventDefaultSpy;
      
      window.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('ignores non-space keys', async () => {
      updateMockContexts({}, { enableSpacekeyPlay: true });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { code: 'Enter' });
      fireEvent.keyDown(window, { code: 'KeyA' });
      expect(mockPlay).not.toHaveBeenCalled();
    });

    it('ignores composing events', async () => {
      updateMockContexts({}, { enableSpacekeyPlay: true });
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { code: 'Space', isComposing: true });
      expect(mockPlay).not.toHaveBeenCalled();
    });
  });

  describe('Component Structure', () => {
    it('renders with correct CSS classes', () => {
      render(<TestWrapper><Player /></TestWrapper>);

      expect(document.querySelector('.playerComponent')).toBeInTheDocument();
      expect(document.querySelector('.playButton')).toBeInTheDocument();
      expect(document.querySelector('.volumeText')).toBeInTheDocument();
      expect(document.querySelector('.volumeBar')).toBeInTheDocument();
      expect(document.querySelector('.seekPosText')).toBeInTheDocument();
      expect(document.querySelector('.seekBarBox')).toBeInTheDocument();
    });

    it('has proper accessibility attributes', () => {
      render(<TestWrapper><Player /></TestWrapper>);

      // Play button should be accessible
      const playButton = screen.getByRole('button');
      expect(playButton).toBeInTheDocument();

      // Sliders should be accessible
      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBeGreaterThan(0);
    });
  });

  describe('Settings Integration', () => {
    it('updates display when volume unit changes', async () => {
      updateMockContexts({}, { volumeUnitDb: false, initialVolume: 80 });
      
      const { rerender } = render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByText('volume 80')).toBeInTheDocument();

      // Change to dB mode
      updateMockContexts({}, { volumeUnitDb: true, initialVolumeDb: -6.0 });
      
      rerender(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('volume -6.0')).toBeInTheDocument();
      });
    });

    it('updates volume bar configuration when unit changes', () => {
      updateMockContexts({}, { volumeUnitDb: false, initialVolume: 100 });
      
      const { rerender } = render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      let volumeSlider = document.querySelector('.volumeBar') as HTMLInputElement;
      expect(volumeSlider).toHaveAttribute('max', '100');

      updateMockContexts({}, { volumeUnitDb: true, initialVolumeDb: 0 });
      
      rerender(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      volumeSlider = document.querySelector('.volumeBar') as HTMLInputElement;
      expect(volumeSlider).toHaveAttribute('max', '0');
      expect(volumeSlider).toHaveAttribute('min', '-80');
    });
  });

  describe('Event Cleanup', () => {
    it('removes keyboard event listener on unmount', () => {
      updateMockContexts({}, { enableSpacekeyPlay: true });
      
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('does not add event listener when spacebar play is disabled', () => {
      updateMockContexts({}, { enableSpacekeyPlay: false });
      
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      render(
        <TestWrapper>
          <Player />
        </TestWrapper>
      );

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });
  });
});