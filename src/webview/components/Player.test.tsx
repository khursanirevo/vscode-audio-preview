import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Player } from './Player';
import { PlayerProvider } from '../contexts/PlayerContext';
import { PlayerSettingsProvider } from '../contexts/PlayerSettingsContext';

// Mock CSS import
jest.mock('./Player.css', () => ({}));

// Create test wrapper with required providers
const TestWrapper = ({ children, playerSettings = {}, playerState = {} }: {
  children: React.ReactNode;
  playerSettings?: any;
  playerState?: any;
}) => {
  // Mock contexts
  const mockPlayerSettings = {
    volumeUnitDb: false,
    initialVolume: 100,
    initialVolumeDb: 0,
    enableSpacekeyPlay: true,
    hpfCutoff: 0,
    lpfCutoff: 0,
    setVolumeUnitDb: jest.fn(),
    setInitialVolume: jest.fn(),
    setInitialVolumeDb: jest.fn(),
    setEnableSpacekeyPlay: jest.fn(),
    setHpfCutoff: jest.fn(),
    setLpfCutoff: jest.fn(),
    ...playerSettings,
  };

  const mockPlayer = {
    isPlaying: false,
    currentSec: 0,
    seekbarValue: 0,
    play: jest.fn(),
    pause: jest.fn(),
    setVolume: jest.fn(),
    onSeekbarInput: jest.fn(),
    ...playerState,
  };

  return (
    <div data-testid="mock-provider">
      {React.cloneElement(children as React.ReactElement, {
        ...children,
        'data-mock-player': mockPlayer,
        'data-mock-player-settings': mockPlayerSettings,
      })}
    </div>
  );
};

// Mock the hooks
jest.mock('../hooks/usePlayer', () => ({
  usePlayer: () => {
    const element = document.querySelector('[data-mock-player]') as any;
    return element?.['data-mock-player'] || {
      isPlaying: false,
      currentSec: 0,
      seekbarValue: 0,
      play: jest.fn(),
      pause: jest.fn(),
      setVolume: jest.fn(),
      onSeekbarInput: jest.fn(),
    };
  },
}));

jest.mock('../hooks/usePlayerSettings', () => ({
  usePlayerSettings: () => {
    const element = document.querySelector('[data-mock-player-settings]') as any;
    return element?.['data-mock-player-settings'] || {
      volumeUnitDb: false,
      initialVolume: 100,
      initialVolumeDb: 0,
      enableSpacekeyPlay: true,
      hpfCutoff: 0,
      lpfCutoff: 0,
      setVolumeUnitDb: jest.fn(),
      setInitialVolume: jest.fn(),
      setInitialVolumeDb: jest.fn(),
      setEnableSpacekeyPlay: jest.fn(),
      setHpfCutoff: jest.fn(),
      setLpfCutoff: jest.fn(),
    };
  },
}));

describe('Player Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
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
      const playerState = {
        isPlaying: false,
        currentSec: 0,
        seekbarValue: 0,
      };

      render(
        <TestWrapper playerState={playerState}>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toHaveTextContent('play');
      expect(screen.getByText('position 0.000 s')).toBeInTheDocument();
    });
  });

  describe('Play/Pause Functionality', () => {
    it('shows play button when not playing', () => {
      const playerState = { isPlaying: false };
      
      render(
        <TestWrapper playerState={playerState}>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toHaveTextContent('play');
    });

    it('shows pause button when playing', () => {
      const playerState = { isPlaying: true };
      
      render(
        <TestWrapper playerState={playerState}>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toHaveTextContent('pause');
    });

    it('calls play when play button is clicked', async () => {
      const playMock = jest.fn();
      const playerState = { isPlaying: false, play: playMock };
      
      render(
        <TestWrapper playerState={playerState}>
          <Player />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button'));
      expect(playMock).toHaveBeenCalledTimes(1);
    });

    it('calls pause when pause button is clicked', async () => {
      const pauseMock = jest.fn();
      const playerState = { isPlaying: true, pause: pauseMock };
      
      render(
        <TestWrapper playerState={playerState}>
          <Player />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button'));
      expect(pauseMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Volume Control', () => {
    it('displays volume in percentage mode', () => {
      const playerSettings = { volumeUnitDb: false, initialVolume: 75 };
      
      render(
        <TestWrapper playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByText('volume 75')).toBeInTheDocument();
    });

    it('displays volume in dB mode', () => {
      const playerSettings = { volumeUnitDb: true, initialVolumeDb: -10.5 };
      
      render(
        <TestWrapper playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByText('volume -10.5')).toBeInTheDocument();
    });

    it('handles volume change in percentage mode', async () => {
      const setVolumeMock = jest.fn();
      const playerState = { setVolume: setVolumeMock };
      const playerSettings = { volumeUnitDb: false };
      
      render(
        <TestWrapper playerState={playerState} playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      const volumeSlider = screen.getByDisplayValue('100');
      await user.type(volumeSlider, '75');
      
      // The onChange handler should be called
      fireEvent.change(volumeSlider, { target: { value: '75' } });
      expect(setVolumeMock).toHaveBeenCalledWith(0.75);
    });

    it('handles volume change in dB mode', async () => {
      const setVolumeMock = jest.fn();
      const playerState = { setVolume: setVolumeMock };
      const playerSettings = { volumeUnitDb: true, initialVolumeDb: 0 };
      
      render(
        <TestWrapper playerState={playerState} playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      const volumeSlider = screen.getByDisplayValue('0');
      fireEvent.change(volumeSlider, { target: { value: '-20' } });
      
      // -20 dB should be converted to linear: 10^(-20/20) = 0.1
      expect(setVolumeMock).toHaveBeenCalledWith(0.1);
    });

    it('handles mute in dB mode', async () => {
      const setVolumeMock = jest.fn();
      const playerState = { setVolume: setVolumeMock };
      const playerSettings = { volumeUnitDb: true };
      
      render(
        <TestWrapper playerState={playerState} playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      const volumeSlider = screen.getByDisplayValue('0');
      fireEvent.change(volumeSlider, { target: { value: '-80' } });
      
      // -80 dB should be treated as mute (0)
      expect(setVolumeMock).toHaveBeenCalledWith(0);
    });

    it('configures volume bar correctly for percentage mode', () => {
      const playerSettings = { volumeUnitDb: false, initialVolume: 100 };
      
      render(
        <TestWrapper playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      const volumeSlider = screen.getByDisplayValue('100');
      expect(volumeSlider).toHaveAttribute('min', '0');
      expect(volumeSlider).toHaveAttribute('max', '100');
      expect(volumeSlider).toHaveAttribute('step', '1');
    });

    it('configures volume bar correctly for dB mode', () => {
      const playerSettings = { volumeUnitDb: true, initialVolumeDb: -10 };
      
      render(
        <TestWrapper playerSettings={playerSettings}>
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
      const playerState = { currentSec: 123.456 };
      
      render(
        <TestWrapper playerState={playerState}>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByText('position 123.456 s')).toBeInTheDocument();
    });

    it('displays seek bar value', () => {
      const playerState = { seekbarValue: 45 };
      
      render(
        <TestWrapper playerState={playerState}>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('45')).toBeInTheDocument();
    });

    it('handles seek bar input', async () => {
      const onSeekbarInputMock = jest.fn();
      const playerState = { onSeekbarInput: onSeekbarInputMock };
      
      render(
        <TestWrapper playerState={playerState}>
          <Player />
        </TestWrapper>
      );

      // Find the user input seek bar (not the readonly one)
      const seekBars = screen.getAllByDisplayValue('100');
      const userSeekBar = seekBars.find(el => 
        el.classList.contains('userInputSeekBar')
      ) || seekBars[seekBars.length - 1];

      fireEvent.change(userSeekBar, { target: { value: '75' } });
      
      expect(onSeekbarInputMock).toHaveBeenCalledWith(75);
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
      const playMock = jest.fn();
      const playerState = { isPlaying: false, play: playMock };
      const playerSettings = { enableSpacekeyPlay: true };
      
      render(
        <TestWrapper playerState={playerState} playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { code: 'Space' });
      expect(playMock).toHaveBeenCalledTimes(1);
    });

    it('handles spacebar pause when playing', async () => {
      const pauseMock = jest.fn();
      const playerState = { isPlaying: true, pause: pauseMock };
      const playerSettings = { enableSpacekeyPlay: true };
      
      render(
        <TestWrapper playerState={playerState} playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { code: 'Space' });
      expect(pauseMock).toHaveBeenCalledTimes(1);
    });

    it('ignores spacebar when disabled', async () => {
      const playMock = jest.fn();
      const playerState = { play: playMock };
      const playerSettings = { enableSpacekeyPlay: false };
      
      render(
        <TestWrapper playerState={playerState} playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { code: 'Space' });
      expect(playMock).not.toHaveBeenCalled();
    });

    it('prevents default on spacebar', async () => {
      const playerSettings = { enableSpacekeyPlay: true };
      
      render(
        <TestWrapper playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      const event = new KeyboardEvent('keydown', { code: 'Space' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      fireEvent.keyDown(window, event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('ignores non-space keys', async () => {
      const playMock = jest.fn();
      const playerState = { play: playMock };
      const playerSettings = { enableSpacekeyPlay: true };
      
      render(
        <TestWrapper playerState={playerState} playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { code: 'Enter' });
      fireEvent.keyDown(window, { code: 'KeyA' });
      expect(playMock).not.toHaveBeenCalled();
    });

    it('ignores composing events', async () => {
      const playMock = jest.fn();
      const playerState = { play: playMock };
      const playerSettings = { enableSpacekeyPlay: true };
      
      render(
        <TestWrapper playerState={playerSettings} playerSettings={playerSettings}>
          <Player />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { code: 'Space', isComposing: true });
      expect(playMock).not.toHaveBeenCalled();
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
      const { rerender } = render(
        <TestWrapper playerSettings={{ volumeUnitDb: false, initialVolume: 80 }}>
          <Player />
        </TestWrapper>
      );

      expect(screen.getByText('volume 80')).toBeInTheDocument();

      // Change to dB mode
      rerender(
        <TestWrapper playerSettings={{ volumeUnitDb: true, initialVolumeDb: -6.0 }}>
          <Player />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('volume -6.0')).toBeInTheDocument();
      });
    });

    it('updates volume bar configuration when unit changes', () => {
      const { rerender } = render(
        <TestWrapper playerSettings={{ volumeUnitDb: false, initialVolume: 100 }}>
          <Player />
        </TestWrapper>
      );

      let volumeSlider = screen.getByDisplayValue('100');
      expect(volumeSlider).toHaveAttribute('max', '100');

      rerender(
        <TestWrapper playerSettings={{ volumeUnitDb: true, initialVolumeDb: 0 }}>
          <Player />
        </TestWrapper>
      );

      volumeSlider = screen.getByDisplayValue('0');
      expect(volumeSlider).toHaveAttribute('max', '0');
      expect(volumeSlider).toHaveAttribute('min', '-80');
    });
  });

  describe('Event Cleanup', () => {
    it('removes keyboard event listener on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(
        <TestWrapper playerSettings={{ enableSpacekeyPlay: true }}>
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
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      render(
        <TestWrapper playerSettings={{ enableSpacekeyPlay: false }}>
          <Player />
        </TestWrapper>
      );

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });
  });
});