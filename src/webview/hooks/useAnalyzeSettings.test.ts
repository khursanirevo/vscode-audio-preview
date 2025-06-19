import { renderHook } from "@testing-library/react";
import { useAnalyzeSettings } from "./useAnalyzeSettings";
import {
  AnalyzeSettingsContext,
  AnalyzeSettingsContextType,
} from "../contexts/AnalyzeSettingsContext";
import React from "react";

describe("useAnalyzeSettings Hook", () => {
  // Create a minimal mock that satisfies the interface
  const createMockAnalyzeSettings = (): AnalyzeSettingsContextType => ({
    // State properties
    sampleRate: 44100,
    duration: 10,
    minAmplitudeOfAudioBuffer: -1,
    maxAmplitudeOfAudioBuffer: 1,
    autoCalcHopSize: true,
    waveformVisible: true,
    waveformVerticalScale: 1,
    spectrogramVisible: true,
    spectrogramVerticalScale: 1,
    windowSizeIndex: 10,
    windowSize: 1024,
    hopSize: 512,
    minFrequency: 0,
    maxFrequency: 22050,
    minTime: 0,
    maxTime: 10,
    minAmplitude: -1,
    maxAmplitude: 1,
    spectrogramAmplitudeRange: 2,
    frequencyScale: 0, // Linear
    melFilterNum: 40,

    // Setter functions
    setAutoCalcHopSize: jest.fn(),
    setWaveformVisible: jest.fn(),
    setWaveformVerticalScale: jest.fn(),
    setSpectrogramVisible: jest.fn(),
    setSpectrogramVerticalScale: jest.fn(),
    setWindowSizeIndex: jest.fn(),
    setMinFrequency: jest.fn(),
    setMaxFrequency: jest.fn(),
    setMinTime: jest.fn(),
    setMaxTime: jest.fn(),
    setMinAmplitude: jest.fn(),
    setMaxAmplitude: jest.fn(),
    setSpectrogramAmplitudeRange: jest.fn(),
    setFrequencyScale: jest.fn(),
    setMelFilterNum: jest.fn(),
    resetToDefaultTimeRange: jest.fn(),
    resetToDefaultAmplitudeRange: jest.fn(),
    resetToDefaultFrequencyRange: jest.fn(),
    initializeFromDefault: jest.fn(),
    toProps: jest.fn().mockReturnValue({
      waveformVerticalScale: 1,
      spectrogramVerticalScale: 1,
      windowSize: 1024,
      hopSize: 512,
      minFrequency: 0,
      maxFrequency: 22050,
      minTime: 0,
      maxTime: 10,
      minAmplitude: -1,
      maxAmplitude: 1,
      spectrogramAmplitudeRange: 2,
      frequencyScale: 0,
      melFilterNum: 40,
    }),
  });

  it("should return AnalyzeSettings context value when within provider", () => {
    const mockValue = createMockAnalyzeSettings();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        AnalyzeSettingsContext.Provider,
        { value: mockValue },
        children,
      );

    const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });

    expect(result.current).toBe(mockValue);
    expect(result.current.waveformVisible).toBe(true);
    expect(result.current.spectrogramVisible).toBe(true);
    expect(result.current.windowSizeIndex).toBe(10);
    expect(result.current.windowSize).toBe(1024);
  });

  it("should throw error when used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      renderHook(() => useAnalyzeSettings());
    }).toThrow(
      "useAnalyzeSettings must be used within a AnalyzeSettingsProvider",
    );

    consoleError.mockRestore();
  });

  it("should throw error with undefined context", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        AnalyzeSettingsContext.Provider,
        { value: undefined },
        children,
      );

    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      renderHook(() => useAnalyzeSettings(), { wrapper });
    }).toThrow(
      "useAnalyzeSettings must be used within a AnalyzeSettingsProvider",
    );

    consoleError.mockRestore();
  });

  it("should provide access to all analyze settings state", () => {
    const mockValue = createMockAnalyzeSettings();
    mockValue.waveformVisible = false;
    mockValue.spectrogramVisible = true;
    mockValue.windowSizeIndex = 12;
    mockValue.frequencyScale = 1; // Log scale

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        AnalyzeSettingsContext.Provider,
        { value: mockValue },
        children,
      );

    const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });

    expect(result.current.waveformVisible).toBe(false);
    expect(result.current.spectrogramVisible).toBe(true);
    expect(result.current.windowSizeIndex).toBe(12);
    expect(result.current.frequencyScale).toBe(1);
  });

  it("should provide access to setter functions", () => {
    const mockValue = createMockAnalyzeSettings();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        AnalyzeSettingsContext.Provider,
        { value: mockValue },
        children,
      );

    const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });

    expect(typeof result.current.setWaveformVisible).toBe("function");
    expect(typeof result.current.setSpectrogramVisible).toBe("function");
    expect(typeof result.current.setWindowSizeIndex).toBe("function");
    expect(typeof result.current.setFrequencyScale).toBe("function");
    expect(typeof result.current.initializeFromDefault).toBe("function");
  });

  it("should provide utility functions", () => {
    const mockValue = createMockAnalyzeSettings();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        AnalyzeSettingsContext.Provider,
        { value: mockValue },
        children,
      );

    const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });

    expect(typeof result.current.toProps).toBe("function");
    expect(typeof result.current.resetToDefaultTimeRange).toBe("function");
    expect(typeof result.current.resetToDefaultAmplitudeRange).toBe("function");
    expect(typeof result.current.resetToDefaultFrequencyRange).toBe("function");
  });

  it("should maintain function references", () => {
    const setWaveformVisible = jest.fn();
    const setWindowSizeIndex = jest.fn();
    const toProps = jest.fn();

    const mockValue = createMockAnalyzeSettings();
    mockValue.setWaveformVisible = setWaveformVisible;
    mockValue.setWindowSizeIndex = setWindowSizeIndex;
    mockValue.toProps = toProps;

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        AnalyzeSettingsContext.Provider,
        { value: mockValue },
        children,
      );

    const { result } = renderHook(() => useAnalyzeSettings(), { wrapper });

    expect(result.current.setWaveformVisible).toBe(setWaveformVisible);
    expect(result.current.setWindowSizeIndex).toBe(setWindowSizeIndex);
    expect(result.current.toProps).toBe(toProps);
  });
});
