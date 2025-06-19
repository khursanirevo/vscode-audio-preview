import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AnalyzeContext, AnalyzeProvider } from './AnalyzeContext';
import { useAnalyze } from '../hooks/useAnalyze';
import { mockAudioBuffer } from '../../__tests__/mocks/audioContext';

describe('AnalyzeContext', () => {
  const mockAudioBufferInstance = mockAudioBuffer({
    sampleRate: 44100,
    numberOfChannels: 2,
    length: 441000,
  });

  const mockAnalyzeSettings = {
    waveformVerticalScale: 1.0,
    spectrogramVerticalScale: 1.0,
    windowSize: 1024,
    hopSize: 512,
    minFrequency: 0,
    maxFrequency: 22050,
    minTime: 0,
    maxTime: 10,
    minAmplitude: -1,
    maxAmplitude: 1,
    spectrogramAmplitudeRange: 60,
    frequencyScale: 0, // Linear
    melFilterNum: 128,
  };

  describe('AnalyzeProvider', () => {
    it('should provide analyze context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.lastAnalyzeTime).toBeNull();
      expect(result.current.analyze).toBeDefined();
      expect(result.current.getSpectrogram).toBeDefined();
      expect(result.current.getMelSpectrogram).toBeDefined();
      expect(result.current.getSpectrogramColor).toBeDefined();
      expect(result.current.roundToNearestNiceNumber).toBeDefined();
      expect(result.current.hzToMel).toBeDefined();
      expect(result.current.melToHz).toBeDefined();
    });
  });

  describe('Analysis Functions', () => {
    it('should provide analysis function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.lastAnalyzeTime).toBeNull();
      expect(typeof result.current.analyze).toBe('function');
    });

    it('should generate spectrogram data', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const spectrogram = result.current.getSpectrogram(0, mockAnalyzeSettings, mockAudioBufferInstance);
      
      expect(Array.isArray(spectrogram)).toBe(true);
      expect(spectrogram.length).toBeGreaterThan(0);
    });

    it('should generate mel spectrogram data', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const melSpectrogram = result.current.getMelSpectrogram(0, mockAnalyzeSettings, mockAudioBufferInstance);
      
      expect(Array.isArray(melSpectrogram)).toBe(true);
      expect(melSpectrogram.length).toBeGreaterThan(0);
    });

    it('should generate spectrogram colors', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const color = result.current.getSpectrogramColor(0.5, 1.0);
      
      expect(typeof color).toBe('string');
      expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/); // RGB color format
    });
  });

  describe('Utility Functions', () => {
    it('should round to nearest nice number', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const [rounded, digit] = result.current.roundToNearestNiceNumber(123.456);
      
      expect(typeof rounded).toBe('number');
      expect(typeof digit).toBe('number');
      expect(rounded).toBeGreaterThan(0);
    });

    it('should handle zero input in rounding', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const [rounded, digit] = result.current.roundToNearestNiceNumber(0);
      
      expect(rounded).toBe(0);
      expect(digit).toBe(0);
    });

    it('should handle negative input in rounding', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const [rounded, digit] = result.current.roundToNearestNiceNumber(-10);
      
      expect(rounded).toBe(0);
      expect(digit).toBe(0);
    });
  });

  describe('Frequency Scale Conversions', () => {
    it('should convert Hz to Mel scale', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const mel = result.current.hzToMel(1000);
      
      expect(typeof mel).toBe('number');
      expect(mel).toBeGreaterThan(0);
    });

    it('should convert Mel to Hz scale', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const hz = result.current.melToHz(1000);
      
      expect(typeof hz).toBe('number');
      expect(hz).toBeGreaterThan(0);
    });

    it('should have bidirectional Hz/Mel conversion', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const originalHz = 440; // A4 note
      const mel = result.current.hzToMel(originalHz);
      const convertedHz = result.current.melToHz(mel);
      
      expect(convertedHz).toBeCloseTo(originalHz, 2);
    });
  });

  describe('Analysis State Management', () => {
    it('should track analyzing state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.lastAnalyzeTime).toBeNull();

      // Note: analyze function is not implemented yet, so state remains null
      expect(result.current.lastAnalyzeTime).toBeNull();
    });

    it('should provide analyze functionality', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      // Function should exist but implementation is pending
      expect(typeof result.current.analyze).toBe('function');
      expect(result.current.lastAnalyzeTime).toBeNull();
    });
  });

  describe('Spectrogram Generation', () => {
    it('should handle different channels', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const spectrogramCh0 = result.current.getSpectrogram(0, mockAnalyzeSettings, mockAudioBufferInstance);
      const spectrogramCh1 = result.current.getSpectrogram(1, mockAnalyzeSettings, mockAudioBufferInstance);
      
      expect(spectrogramCh0).toBeDefined();
      expect(spectrogramCh1).toBeDefined();
      expect(Array.isArray(spectrogramCh0)).toBe(true);
      expect(Array.isArray(spectrogramCh1)).toBe(true);
    });

    it('should handle window size changes', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const settings1024 = { ...mockAnalyzeSettings, windowSize: 1024 };
      const settings2048 = { ...mockAnalyzeSettings, windowSize: 2048 };
      
      const spec1024 = result.current.getSpectrogram(0, settings1024, mockAudioBufferInstance);
      const spec2048 = result.current.getSpectrogram(0, settings2048, mockAudioBufferInstance);
      
      expect(spec1024).toBeDefined();
      expect(spec2048).toBeDefined();
      // Different window sizes should potentially give different results
    });
  });

  describe('Color Generation', () => {
    it('should generate valid colors for different amplitudes', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      const testAmplitudes = [0, 0.25, 0.5, 0.75, 1.0];
      
      testAmplitudes.forEach(amp => {
        const color = result.current.getSpectrogramColor(amp, 1.0);
        expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
      });
    });

    it('should handle edge cases in color generation', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnalyzeProvider>{children}</AnalyzeProvider>
      );
      
      const { result } = renderHook(() => useAnalyze(), { wrapper });
      
      // Test with zero range
      const colorZeroRange = result.current.getSpectrogramColor(0.5, 0);
      expect(colorZeroRange).toMatch(/^rgb\(\d+,\d+,\d+\)$/);

      // Test with negative values
      const colorNegative = result.current.getSpectrogramColor(-0.5, 1.0);
      expect(colorNegative).toMatch(/^rgb\(\d+,\d+,\d+\)$/);

      // Test with values > range
      const colorOverRange = result.current.getSpectrogramColor(2.0, 1.0);
      expect(colorOverRange).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
    });
  });
});