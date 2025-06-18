import { renderHook } from '@testing-library/react';
import { useAnalyze } from './useAnalyze';
import { AnalyzeContext } from '../contexts/AnalyzeContext';
import React from 'react';

describe('useAnalyze Hook', () => {
  const mockAnalyzeValue = {
    isAnalyzing: false,
    lastAnalyzeTime: null as number | null,
    analyze: jest.fn(),
    getSpectrogram: jest.fn(),
    getMelSpectrogram: jest.fn(),
    getSpectrogramColor: jest.fn(),
    roundToNearestNiceNumber: jest.fn(),
    hzToMel: jest.fn(),
    melToHz: jest.fn(),
  };

  it('should return Analyze context value when within provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AnalyzeContext.Provider, { value: mockAnalyzeValue }, children);

    const { result } = renderHook(() => useAnalyze(), { wrapper });

    expect(result.current).toBe(mockAnalyzeValue);
    expect(result.current.analyze).toBe(mockAnalyzeValue.analyze);
    expect(result.current.getSpectrogram).toBe(mockAnalyzeValue.getSpectrogram);
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.lastAnalyzeTime).toBeNull();
  });

  it('should throw error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useAnalyze());
    }).toThrow('useAnalyze must be used within a AnalyzeProvider');

    consoleError.mockRestore();
  });

  it('should throw error with undefined context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AnalyzeContext.Provider, { value: undefined }, children);

    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useAnalyze(), { wrapper });
    }).toThrow('useAnalyze must be used within a AnalyzeProvider');

    consoleError.mockRestore();
  });

  it('should provide access to all analysis functionality', () => {
    const fullContext = {
      isAnalyzing: true,
      lastAnalyzeTime: 1234567890 as number | null,
      analyze: jest.fn(),
      getSpectrogram: jest.fn().mockReturnValue([[1, 2, 3]]),
      getMelSpectrogram: jest.fn().mockReturnValue([[4, 5, 6]]),
      getSpectrogramColor: jest.fn().mockReturnValue('#ff0000'),
      roundToNearestNiceNumber: jest.fn().mockReturnValue([100, 2]),
      hzToMel: jest.fn().mockReturnValue(1000),
      melToHz: jest.fn().mockReturnValue(440),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AnalyzeContext.Provider, { value: fullContext }, children);

    const { result } = renderHook(() => useAnalyze(), { wrapper });

    expect(result.current.isAnalyzing).toBe(true);
    expect(result.current.lastAnalyzeTime).toBe(1234567890);
    expect(typeof result.current.analyze).toBe('function');
    expect(typeof result.current.getSpectrogram).toBe('function');
    expect(typeof result.current.getMelSpectrogram).toBe('function');
    expect(typeof result.current.getSpectrogramColor).toBe('function');
    expect(typeof result.current.roundToNearestNiceNumber).toBe('function');
    expect(typeof result.current.hzToMel).toBe('function');
    expect(typeof result.current.melToHz).toBe('function');
  });

  it('should maintain function references', () => {
    const analyze = jest.fn();
    const getSpectrogram = jest.fn();
    const getSpectrogramColor = jest.fn();

    const context = {
      ...mockAnalyzeValue,
      analyze,
      getSpectrogram,
      getSpectrogramColor,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AnalyzeContext.Provider, { value: context }, children);

    const { result } = renderHook(() => useAnalyze(), { wrapper });

    expect(result.current.analyze).toBe(analyze);
    expect(result.current.getSpectrogram).toBe(getSpectrogram);
    expect(result.current.getSpectrogramColor).toBe(getSpectrogramColor);
  });

  it('should provide utility functions', () => {
    const roundToNearestNiceNumber = jest.fn().mockReturnValue([50, 1]);
    const hzToMel = jest.fn().mockReturnValue(999.5);
    const melToHz = jest.fn().mockReturnValue(439.8);

    const context = {
      ...mockAnalyzeValue,
      roundToNearestNiceNumber,
      hzToMel,
      melToHz,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AnalyzeContext.Provider, { value: context }, children);

    const { result } = renderHook(() => useAnalyze(), { wrapper });

    expect(result.current.roundToNearestNiceNumber).toBe(roundToNearestNiceNumber);
    expect(result.current.hzToMel).toBe(hzToMel);
    expect(result.current.melToHz).toBe(melToHz);
  });
});