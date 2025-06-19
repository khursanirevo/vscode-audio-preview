import { renderHook } from "@testing-library/react";
import { useVSCode } from "./useVSCode";
import { VSCodeContext, VSCodeContextType } from "../contexts/VSCodeContext";
import { Config } from "../../config";
import React from "react";

describe("useVSCode Hook", () => {
  const mockVSCodeValue: VSCodeContextType = {
    postMessage: jest.fn(),
    config: {
      autoAnalyze: true,
      playerDefault: undefined,
      analyzeDefault: undefined,
    } as Config,
    fileData: new Uint8Array([1, 2, 3]),
    audioBuffer: null,
    isLoading: false,
    error: null,
  };

  it("should return VSCode context value when within provider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        VSCodeContext.Provider,
        { value: mockVSCodeValue },
        children,
      );

    const { result } = renderHook(() => useVSCode(), { wrapper });

    expect(result.current).toBe(mockVSCodeValue);
    expect(result.current.postMessage).toBe(mockVSCodeValue.postMessage);
    expect(result.current.config).toBe(mockVSCodeValue.config);
    expect(result.current.fileData).toBe(mockVSCodeValue.fileData);
  });

  it("should throw error when used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      renderHook(() => useVSCode());
    }).toThrow("useVSCode must be used within a VSCodeProvider");

    consoleError.mockRestore();
  });

  it("should throw error with undefined context", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        VSCodeContext.Provider,
        { value: undefined },
        children,
      );

    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      renderHook(() => useVSCode(), { wrapper });
    }).toThrow("useVSCode must be used within a VSCodeProvider");

    consoleError.mockRestore();
  });

  it("should provide access to all context properties", () => {
    const fullContext: VSCodeContextType = {
      postMessage: jest.fn(),
      config: {
        autoAnalyze: false,
        playerDefault: undefined,
        analyzeDefault: undefined,
      } as Config,
      fileData: new Uint8Array([4, 5, 6, 7]),
      audioBuffer: {} as AudioBuffer,
      isLoading: true,
      error: "Test error",
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        VSCodeContext.Provider,
        { value: fullContext },
        children,
      );

    const { result } = renderHook(() => useVSCode(), { wrapper });

    expect(result.current.postMessage).toBe(fullContext.postMessage);
    expect(result.current.config).toBe(fullContext.config);
    expect(result.current.fileData).toBe(fullContext.fileData);
    expect(result.current.audioBuffer).toBe(fullContext.audioBuffer);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe("Test error");
  });
});
