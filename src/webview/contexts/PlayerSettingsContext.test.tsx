import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { PlayerSettingsContext, PlayerSettingsProvider } from './PlayerSettingsContext';
import { usePlayerSettings } from '../hooks/usePlayerSettings';
import { mockAudioBuffer } from '../../__tests__/mocks/audioContext';

describe('PlayerSettingsContext', () => {
  const mockAudioBufferInstance = mockAudioBuffer({
    duration: 10,
    sampleRate: 44100,
    numberOfChannels: 2,
    length: 441000,
  });

  const mockPlayerDefault = {
    sampleRate: 44100,
    volumeUnitDb: false,
    initialVolumeDb: -6,
    initialVolume: 50,
    enableSpacekeyPlay: true,
    enableSeekToPlay: true,
    enableHpf: false,
    hpfFrequency: 80,
    enableLpf: false,
    lpfFrequency: 8000,
    matchFilterFrequencyToSpectrogram: true,
  };

  describe('PlayerSettingsProvider', () => {
    it('should provide default settings', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      expect(result.current.sampleRate).toBe(44100);
      expect(result.current.enableHpf).toBe(false);
      expect(result.current.enableLpf).toBe(false);
      expect(result.current.volumeUnitDb).toBe(false);
      expect(result.current.enableSpacekeyPlay).toBe(true);
    });

    it('should handle undefined defaults', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={undefined}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.sampleRate).toBeGreaterThan(0);
    });
  });

  describe('Settings Management', () => {
    it('should update volume unit setting', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      expect(result.current.volumeUnitDb).toBe(false);

      act(() => {
        result.current.setVolumeUnitDb(true);
      });

      expect(result.current.volumeUnitDb).toBe(true);
    });

    it('should update volume in dB', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      act(() => {
        result.current.setInitialVolumeDb(-12);
      });

      expect(result.current.initialVolumeDb).toBe(-12);
    });

    it('should update volume in linear scale', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      act(() => {
        result.current.setInitialVolume(75);
      });

      expect(result.current.initialVolume).toBe(75);
    });

    it('should validate volume dB range', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      // Test upper bound (0 dB max)
      act(() => {
        result.current.setInitialVolumeDb(10);
      });
      expect(result.current.initialVolumeDb).toBeLessThanOrEqual(0);

      // Test lower bound (-80 dB min)
      act(() => {
        result.current.setInitialVolumeDb(-100);
      });
      expect(result.current.initialVolumeDb).toBeGreaterThanOrEqual(-80);
    });

    it('should validate linear volume range', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      // Test upper bound (100 max)
      act(() => {
        result.current.setInitialVolume(150);
      });
      expect(result.current.initialVolume).toBeLessThanOrEqual(100);

      // Test lower bound (0 min)
      act(() => {
        result.current.setInitialVolume(-10);
      });
      expect(result.current.initialVolume).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Filter Settings', () => {
    it('should enable/disable high-pass filter', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      act(() => {
        result.current.setEnableHpf(true);
      });

      expect(result.current.enableHpf).toBe(true);
    });

    it('should set high-pass filter frequency', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      act(() => {
        result.current.setHpfFrequency(120);
      });

      expect(result.current.hpfFrequency).toBe(120);
    });

    it('should enable/disable low-pass filter', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      act(() => {
        result.current.setEnableLpf(true);
      });

      expect(result.current.enableLpf).toBe(true);
    });

    it('should set low-pass filter frequency', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      act(() => {
        result.current.setLpfFrequency(12000);
      });

      expect(result.current.lpfFrequency).toBe(12000);
    });

    it('should validate filter frequency ranges', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      // Test negative frequency
      act(() => {
        result.current.setHpfFrequency(-100);
      });
      expect(result.current.hpfFrequency).toBeGreaterThanOrEqual(0);

      // Test very high frequency (should be limited by Nyquist)
      act(() => {
        result.current.setLpfFrequency(50000);
      });
      expect(result.current.lpfFrequency).toBeLessThanOrEqual(22050); // Nyquist for 44.1kHz
    });
  });

  describe('Playback Settings', () => {
    it('should enable/disable spacebar play', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      act(() => {
        result.current.setEnableSpacekeyPlay(false);
      });

      expect(result.current.enableSpacekeyPlay).toBe(false);
    });

    it('should enable/disable seek to play', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      act(() => {
        result.current.setEnableSeekToPlay(false);
      });

      expect(result.current.enableSeekToPlay).toBe(false);
    });

    it('should toggle filter frequency matching', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      act(() => {
        result.current.setMatchFilterFrequencyToSpectrogram(false);
      });

      expect(result.current.matchFilterFrequencyToSpectrogram).toBe(false);
    });
  });

  describe('Initialization', () => {
    it('should initialize from default settings', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={undefined}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      const customDefaults = {
        ...mockPlayerDefault,
        enableHpf: true,
        hpfFrequency: 200,
        initialVolume: 80,
      };

      act(() => {
        result.current.initializeFromDefault(customDefaults, mockAudioBufferInstance);
      });

      expect(result.current.enableHpf).toBe(true);
      expect(result.current.hpfFrequency).toBe(200);
      expect(result.current.initialVolume).toBe(80);
      expect(result.current.sampleRate).toBe(mockAudioBufferInstance.sampleRate);
    });

    it('should sync sample rate with audio buffer', () => {
      const customBuffer = mockAudioBuffer({
        sampleRate: 48000,
        duration: 5,
        numberOfChannels: 1,
        length: 240000,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      act(() => {
        result.current.initializeFromDefault(mockPlayerDefault, customBuffer);
      });

      expect(result.current.sampleRate).toBe(48000);
    });
  });

  describe('State Management', () => {
    it('should notify consumers of settings changes', () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        const settings = usePlayerSettings();
        renderCount++;
        return <div>{settings.enableHpf}</div>;
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );

      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      const initialRenderCount = renderCount;

      act(() => {
        result.current.setEnableHpf(true);
      });

      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });

    it('should maintain state consistency', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      // Make multiple changes
      act(() => {
        result.current.setEnableHpf(true);
        result.current.setHpfFrequency(150);
        result.current.setEnableLpf(true);
        result.current.setLpfFrequency(10000);
      });

      expect(result.current.enableHpf).toBe(true);
      expect(result.current.hpfFrequency).toBe(150);
      expect(result.current.enableLpf).toBe(true);
      expect(result.current.lpfFrequency).toBe(10000);
    });
  });

  describe('Volume Conversion', () => {
    it('should handle dB to linear volume conversion', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      // Set volume in dB
      act(() => {
        result.current.setInitialVolumeDb(-6); // -6dB ≈ 50% linear
      });

      // Should maintain consistency between dB and linear representations
      expect(result.current.initialVolumeDb).toBe(-6);
      expect(result.current.initialVolume).toBeGreaterThan(0);
      expect(result.current.initialVolume).toBeLessThan(100);
    });

    it('should handle edge cases in volume conversion', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerSettingsProvider playerDefault={mockPlayerDefault}>
          {children}
        </PlayerSettingsProvider>
      );
      
      const { result } = renderHook(() => usePlayerSettings(), { wrapper });
      
      // Test 0 dB (maximum)
      act(() => {
        result.current.setInitialVolumeDb(0);
      });
      expect(result.current.initialVolumeDb).toBe(0);

      // Test very low dB (minimum)
      act(() => {
        result.current.setInitialVolumeDb(-80);
      });
      expect(result.current.initialVolumeDb).toBe(-80);
    });
  });
});