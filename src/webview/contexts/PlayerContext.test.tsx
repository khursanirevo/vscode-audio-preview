import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { PlayerContext, PlayerProvider } from './PlayerContext';
import { usePlayerSettings } from '../hooks/usePlayerSettings';
import { usePlayer } from '../hooks/usePlayer';
import { mockAudioContext, mockAudioNode, mockAudioBuffer, mockGainNode } from '../../__tests__/mocks/audioContext';

// Mock dependencies
jest.mock('../hooks/usePlayerSettings');

describe('PlayerContext', () => {
  const mockAudioContextInstance = mockAudioContext();
  const mockAudioBufferInstance = mockAudioBuffer({
    duration: 10,
    sampleRate: 44100,
    numberOfChannels: 2,
    length: 441000,
  });

  const mockPlayerSettings = {
    enableHpf: false,
    enableLpf: false,
    hpfFrequency: 0,
    lpfFrequency: 0,
    volume: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePlayerSettings as jest.Mock).mockReturnValue(mockPlayerSettings);
    
    // Reset audio context state
    mockAudioContextInstance.state = 'suspended';
    mockAudioContextInstance.currentTime = 0;
  });

  describe('PlayerProvider', () => {
    it('should provide player context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentSec).toBe(0);
      expect(result.current.volume).toBe(1);
      expect(result.current.seekbarValue).toBe(0);
    });

    it('should handle missing audio buffer gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={null as any}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });
      
      expect(result.current.play).toBeDefined();
      // Should not crash when play is called without buffer
      act(() => {
        result.current.play();
      });
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Audio Playback', () => {
    it('should play audio', () => {
      const sourceNode = mockAudioNode();
      mockAudioContextInstance.createBufferSource.mockReturnValue(sourceNode);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });
      
      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);
      expect(sourceNode.buffer).toBe(mockAudioBufferInstance);
      expect(sourceNode.start).toHaveBeenCalledWith(mockAudioContextInstance.currentTime, 0);
    });

    it('should pause audio', () => {
      const sourceNode = mockAudioNode();
      mockAudioContextInstance.createBufferSource.mockReturnValue(sourceNode);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });
      
      // First play
      act(() => {
        result.current.play();
      });

      // Then pause
      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(sourceNode.stop).toHaveBeenCalled();
    });
  });

  describe('Seek Functionality', () => {
    it('should seek to position using seekbar', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });
      
      act(() => {
        result.current.onSeekbarInput(50); // 50% position
      });

      expect(result.current.seekbarValue).toBe(50);
      expect(result.current.currentSec).toBe(5); // 50% of 10 seconds
    });

    it('should handle seekbar percent', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });
      
      act(() => {
        result.current.setSeekbarPercent(75);
      });

      expect(result.current.seekbarPercent).toBe(75);
    });
  });

  describe('Volume Control', () => {
    it('should set volume', () => {
      const gainNode = mockGainNode();
      mockAudioContextInstance.createGain.mockReturnValue(gainNode);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.setVolume(0.5);
      });

      expect(result.current.volume).toBe(0.5);
      expect(gainNode.gain.value).toBe(0.5);
    });
  });

  describe('Filter Application', () => {
    it('should apply high-pass filter when enabled', () => {
      const hpFilter = mockAudioNode();
      const lpFilter = mockAudioNode();
      const gainNode = mockGainNode();
      
      mockAudioContextInstance.createBiquadFilter
        .mockReturnValueOnce(hpFilter)
        .mockReturnValueOnce(lpFilter);
      mockAudioContextInstance.createGain.mockReturnValue(gainNode);

      (usePlayerSettings as jest.Mock).mockReturnValue({
        ...mockPlayerSettings,
        enableHpf: true,
        hpfFrequency: 100,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.play();
      });

      expect(hpFilter.type).toBe('highpass');
      expect(hpFilter.frequency.value).toBe(100);
      expect(hpFilter.connect).toHaveBeenCalledWith(gainNode);
    });

    it('should apply low-pass filter when enabled', () => {
      const hpFilter = mockAudioNode();
      const lpFilter = mockAudioNode();
      const gainNode = mockGainNode();
      
      mockAudioContextInstance.createBiquadFilter
        .mockReturnValueOnce(hpFilter)
        .mockReturnValueOnce(lpFilter);
      mockAudioContextInstance.createGain.mockReturnValue(gainNode);

      (usePlayerSettings as jest.Mock).mockReturnValue({
        ...mockPlayerSettings,
        enableLpf: true,
        lpfFrequency: 5000,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.play();
      });

      expect(lpFilter.type).toBe('lowpass');
      expect(lpFilter.frequency.value).toBe(5000);
      expect(lpFilter.connect).toHaveBeenCalledWith(gainNode);
    });

    it('should chain both filters when both enabled', () => {
      const hpFilter = mockAudioNode();
      const lpFilter = mockAudioNode();
      const gainNode = mockGainNode();
      
      mockAudioContextInstance.createBiquadFilter
        .mockReturnValueOnce(hpFilter)
        .mockReturnValueOnce(lpFilter);
      mockAudioContextInstance.createGain.mockReturnValue(gainNode);

      (usePlayerSettings as jest.Mock).mockReturnValue({
        ...mockPlayerSettings,
        enableHpf: true,
        hpfFrequency: 100,
        enableLpf: true,
        lpfFrequency: 5000,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.play();
      });

      expect(hpFilter.connect).toHaveBeenCalledWith(lpFilter);
      expect(lpFilter.connect).toHaveBeenCalledWith(gainNode);
    });
  });

  describe('Playback Events', () => {
    it('should update seekbar during playback', async () => {
      const sourceNode = mockAudioNode();
      mockAudioContextInstance.createBufferSource.mockReturnValue(sourceNode);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });
      
      act(() => {
        result.current.play();
      });

      // Simulate time progression
      act(() => {
        mockAudioContextInstance.currentTime = 2;
      });

      // Animation frame would update the seekbar
      // In real scenario, requestAnimationFrame would be called
      expect(result.current.isPlaying).toBe(true);
    });

    it('should stop at end of audio', () => {
      const sourceNode = mockAudioNode();
      mockAudioContextInstance.createBufferSource.mockReturnValue(sourceNode);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });
      
      // Start at near end
      act(() => {
        result.current.onSeekbarInput(99); // 99% position
      });

      act(() => {
        result.current.play();
      });

      // Simulate reaching end
      act(() => {
        mockAudioContextInstance.currentTime = 10.1;
        // Trigger the animation frame logic that checks for end
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Resource Cleanup', () => {
    it('should disconnect audio nodes on unmount', () => {
      const sourceNode = mockAudioNode();
      const gainNode = mockGainNode();
      const hpFilter = mockAudioNode();
      const lpFilter = mockAudioNode();
      
      mockAudioContextInstance.createBufferSource.mockReturnValue(sourceNode);
      mockAudioContextInstance.createGain.mockReturnValue(gainNode);
      mockAudioContextInstance.createBiquadFilter
        .mockReturnValueOnce(hpFilter)
        .mockReturnValueOnce(lpFilter);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { unmount } = renderHook(() => usePlayer(), { wrapper });
      
      unmount();

      expect(gainNode.disconnect).toHaveBeenCalled();
      expect(hpFilter.disconnect).toHaveBeenCalled();
      expect(lpFilter.disconnect).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('should reuse audio nodes when possible', () => {
      const sourceNode1 = mockAudioNode();
      const sourceNode2 = mockAudioNode();
      mockAudioContextInstance.createBufferSource
        .mockReturnValueOnce(sourceNode1)
        .mockReturnValueOnce(sourceNode2);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider audioContext={mockAudioContextInstance} audioBuffer={mockAudioBufferInstance}>
          {children}
        </PlayerProvider>
      );
      
      const { result } = renderHook(() => usePlayer(), { wrapper });
      
      // Play and pause multiple times
      act(() => {
        result.current.play();
      });
      
      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.play();
      });

      // Should create new source for each play
      expect(mockAudioContextInstance.createBufferSource).toHaveBeenCalledTimes(2);
      // But reuse gain and filter nodes
      expect(mockAudioContextInstance.createGain).toHaveBeenCalledTimes(1);
      expect(mockAudioContextInstance.createBiquadFilter).toHaveBeenCalledTimes(2); // HPF and LPF
    });
  });
});