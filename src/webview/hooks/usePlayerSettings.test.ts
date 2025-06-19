import { renderHook } from "@testing-library/react";
import { usePlayerSettings } from "./usePlayerSettings";
import { PlayerSettingsContext } from "../contexts/PlayerSettingsContext";
import React from "react";

describe("usePlayerSettings Hook", () => {
  const mockPlayerSettingsValue = {
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
    setVolumeUnitDb: jest.fn(),
    setInitialVolumeDb: jest.fn(),
    setInitialVolume: jest.fn(),
    setEnableSpacekeyPlay: jest.fn(),
    setEnableSeekToPlay: jest.fn(),
    setEnableHpf: jest.fn(),
    setHpfFrequency: jest.fn(),
    setEnableLpf: jest.fn(),
    setLpfFrequency: jest.fn(),
    setMatchFilterFrequencyToSpectrogram: jest.fn(),
    initializeFromDefault: jest.fn(),
  };

  it("should return PlayerSettings context value when within provider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        PlayerSettingsContext.Provider,
        { value: mockPlayerSettingsValue },
        children,
      );

    const { result } = renderHook(() => usePlayerSettings(), { wrapper });

    expect(result.current).toBe(mockPlayerSettingsValue);
    expect(result.current.sampleRate).toBe(44100);
    expect(result.current.enableHpf).toBe(false);
    expect(result.current.enableLpf).toBe(false);
    expect(result.current.setEnableHpf).toBe(
      mockPlayerSettingsValue.setEnableHpf,
    );
  });

  it("should throw error when used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      renderHook(() => usePlayerSettings());
    }).toThrow(
      "usePlayerSettings must be used within a PlayerSettingsProvider",
    );

    consoleError.mockRestore();
  });

  it("should throw error with undefined context", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        PlayerSettingsContext.Provider,
        { value: undefined },
        children,
      );

    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      renderHook(() => usePlayerSettings(), { wrapper });
    }).toThrow(
      "usePlayerSettings must be used within a PlayerSettingsProvider",
    );

    consoleError.mockRestore();
  });

  it("should provide access to all player settings", () => {
    const fullContext = {
      sampleRate: 48000,
      volumeUnitDb: true,
      initialVolumeDb: -12,
      initialVolume: 75,
      enableSpacekeyPlay: false,
      enableSeekToPlay: false,
      enableHpf: true,
      hpfFrequency: 120,
      enableLpf: true,
      lpfFrequency: 12000,
      matchFilterFrequencyToSpectrogram: false,
      setVolumeUnitDb: jest.fn(),
      setInitialVolumeDb: jest.fn(),
      setInitialVolume: jest.fn(),
      setEnableSpacekeyPlay: jest.fn(),
      setEnableSeekToPlay: jest.fn(),
      setEnableHpf: jest.fn(),
      setHpfFrequency: jest.fn(),
      setEnableLpf: jest.fn(),
      setLpfFrequency: jest.fn(),
      setMatchFilterFrequencyToSpectrogram: jest.fn(),
      initializeFromDefault: jest.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        PlayerSettingsContext.Provider,
        { value: fullContext },
        children,
      );

    const { result } = renderHook(() => usePlayerSettings(), { wrapper });

    expect(result.current.sampleRate).toBe(48000);
    expect(result.current.volumeUnitDb).toBe(true);
    expect(result.current.initialVolumeDb).toBe(-12);
    expect(result.current.initialVolume).toBe(75);
    expect(result.current.enableSpacekeyPlay).toBe(false);
    expect(result.current.enableSeekToPlay).toBe(false);
    expect(result.current.enableHpf).toBe(true);
    expect(result.current.hpfFrequency).toBe(120);
    expect(result.current.enableLpf).toBe(true);
    expect(result.current.lpfFrequency).toBe(12000);
    expect(result.current.matchFilterFrequencyToSpectrogram).toBe(false);
  });

  it("should provide access to all setter functions", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        PlayerSettingsContext.Provider,
        { value: mockPlayerSettingsValue },
        children,
      );

    const { result } = renderHook(() => usePlayerSettings(), { wrapper });

    expect(typeof result.current.setVolumeUnitDb).toBe("function");
    expect(typeof result.current.setInitialVolumeDb).toBe("function");
    expect(typeof result.current.setInitialVolume).toBe("function");
    expect(typeof result.current.setEnableSpacekeyPlay).toBe("function");
    expect(typeof result.current.setEnableSeekToPlay).toBe("function");
    expect(typeof result.current.setEnableHpf).toBe("function");
    expect(typeof result.current.setHpfFrequency).toBe("function");
    expect(typeof result.current.setEnableLpf).toBe("function");
    expect(typeof result.current.setLpfFrequency).toBe("function");
    expect(typeof result.current.setMatchFilterFrequencyToSpectrogram).toBe(
      "function",
    );
    expect(typeof result.current.initializeFromDefault).toBe("function");
  });

  it("should maintain function references", () => {
    const setEnableHpf = jest.fn();
    const setHpfFrequency = jest.fn();
    const setEnableLpf = jest.fn();
    const initializeFromDefault = jest.fn();

    const context = {
      ...mockPlayerSettingsValue,
      setEnableHpf,
      setHpfFrequency,
      setEnableLpf,
      initializeFromDefault,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        PlayerSettingsContext.Provider,
        { value: context },
        children,
      );

    const { result } = renderHook(() => usePlayerSettings(), { wrapper });

    expect(result.current.setEnableHpf).toBe(setEnableHpf);
    expect(result.current.setHpfFrequency).toBe(setHpfFrequency);
    expect(result.current.setEnableLpf).toBe(setEnableLpf);
    expect(result.current.initializeFromDefault).toBe(initializeFromDefault);
  });

  it("should expose volume and filter settings", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        PlayerSettingsContext.Provider,
        { value: mockPlayerSettingsValue },
        children,
      );

    const { result } = renderHook(() => usePlayerSettings(), { wrapper });

    // Volume settings
    expect(typeof result.current.volumeUnitDb).toBe("boolean");
    expect(typeof result.current.initialVolumeDb).toBe("number");
    expect(typeof result.current.initialVolume).toBe("number");

    // Filter settings
    expect(typeof result.current.enableHpf).toBe("boolean");
    expect(typeof result.current.hpfFrequency).toBe("number");
    expect(typeof result.current.enableLpf).toBe("boolean");
    expect(typeof result.current.lpfFrequency).toBe("number");

    // Playback settings
    expect(typeof result.current.enableSpacekeyPlay).toBe("boolean");
    expect(typeof result.current.enableSeekToPlay).toBe("boolean");
    expect(typeof result.current.matchFilterFrequencyToSpectrogram).toBe(
      "boolean",
    );
  });
});
