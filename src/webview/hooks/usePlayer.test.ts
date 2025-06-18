import { renderHook } from '@testing-library/react';
import { usePlayer } from './usePlayer';
import { PlayerContext } from '../contexts/PlayerContext';
import React from 'react';

describe('usePlayer Hook', () => {
  const mockPlayerValue = {
    isPlaying: false,
    currentSec: 0,
    volume: 1,
    seekbarValue: 0,
    play: jest.fn(),
    pause: jest.fn(),
    setVolume: jest.fn(),
    onSeekbarInput: jest.fn(),
    seekbarPercent: 0,
    setSeekbarPercent: jest.fn(),
  };

  it('should return Player context value when within provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(PlayerContext.Provider, { value: mockPlayerValue }, children);

    const { result } = renderHook(() => usePlayer(), { wrapper });

    expect(result.current).toBe(mockPlayerValue);
    expect(result.current.play).toBe(mockPlayerValue.play);
    expect(result.current.pause).toBe(mockPlayerValue.pause);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentSec).toBe(0);
  });

  it('should throw error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => usePlayer());
    }).toThrow('usePlayer must be used within a PlayerProvider');

    consoleError.mockRestore();
  });

  it('should throw error with undefined context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(PlayerContext.Provider, { value: undefined }, children);

    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => usePlayer(), { wrapper });
    }).toThrow('usePlayer must be used within a PlayerProvider');

    consoleError.mockRestore();
  });

  it('should provide access to all player functionality', () => {
    const fullContext = {
      isPlaying: true,
      currentSec: 5.5,
      volume: 0.8,
      seekbarValue: 50,
      play: jest.fn(),
      pause: jest.fn(),
      setVolume: jest.fn(),
      onSeekbarInput: jest.fn(),
      seekbarPercent: 50,
      setSeekbarPercent: jest.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(PlayerContext.Provider, { value: fullContext }, children);

    const { result } = renderHook(() => usePlayer(), { wrapper });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentSec).toBe(5.5);
    expect(result.current.volume).toBe(0.8);
    expect(result.current.seekbarValue).toBe(50);
    expect(result.current.seekbarPercent).toBe(50);
    expect(typeof result.current.play).toBe('function');
    expect(typeof result.current.pause).toBe('function');
    expect(typeof result.current.setVolume).toBe('function');
    expect(typeof result.current.onSeekbarInput).toBe('function');
    expect(typeof result.current.setSeekbarPercent).toBe('function');
  });

  it('should maintain function references', () => {
    const play = jest.fn();
    const pause = jest.fn();
    const setVolume = jest.fn();

    const context = {
      ...mockPlayerValue,
      play,
      pause,
      setVolume,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(PlayerContext.Provider, { value: context }, children);

    const { result } = renderHook(() => usePlayer(), { wrapper });

    expect(result.current.play).toBe(play);
    expect(result.current.pause).toBe(pause);
    expect(result.current.setVolume).toBe(setVolume);
  });
});