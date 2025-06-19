/**
 * AudioPreviewEditor tests
 */

import * as vscode from "vscode";
import { AudioPreviewEditorProvider } from "./audioPreviewEditor";

// Mock the util module
jest.mock("./util", () => ({
  getNonce: jest.fn(() => "mock-nonce-123"),
}));

describe("AudioPreviewEditor", () => {
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    mockContext = (vscode as any).createMockExtensionContext();
    jest.clearAllMocks();
  });

  describe("AudioPreviewEditorProvider", () => {
    describe("register", () => {
      it("should register custom editor provider", () => {
        const mockDisposable = { dispose: jest.fn() };
        (
          vscode.window.registerCustomEditorProvider as jest.Mock
        ).mockReturnValue(mockDisposable);

        const result = AudioPreviewEditorProvider.register(mockContext);

        expect(vscode.window.registerCustomEditorProvider).toHaveBeenCalledWith(
          "wavPreview.audioPreview",
          expect.any(AudioPreviewEditorProvider),
          {
            supportsMultipleEditorsPerDocument: false,
            webviewOptions: {
              retainContextWhenHidden: true,
            },
          },
        );
        expect(result).toBe(mockDisposable);
      });

      it("should create AudioPreviewEditorProvider with context", () => {
        AudioPreviewEditorProvider.register(mockContext);

        expect(vscode.window.registerCustomEditorProvider).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            _context: mockContext,
          }),
          expect.any(Object),
        );
      });

      it("should return disposable that can be used for cleanup", () => {
        const mockDisposable = { dispose: jest.fn() };
        (
          vscode.window.registerCustomEditorProvider as jest.Mock
        ).mockReturnValue(mockDisposable);

        const result = AudioPreviewEditorProvider.register(mockContext);
        result.dispose();

        expect(mockDisposable.dispose).toHaveBeenCalledTimes(1);
      });
    });

    describe("provider configuration", () => {
      it("should use correct viewType", () => {
        AudioPreviewEditorProvider.register(mockContext);

        expect(vscode.window.registerCustomEditorProvider).toHaveBeenCalledWith(
          "wavPreview.audioPreview",
          expect.anything(),
          expect.anything(),
        );
      });

      it("should configure webview options correctly", () => {
        AudioPreviewEditorProvider.register(mockContext);

        const [, , options] = (
          vscode.window.registerCustomEditorProvider as jest.Mock
        ).mock.calls[0];
        expect(options).toEqual({
          supportsMultipleEditorsPerDocument: false,
          webviewOptions: {
            retainContextWhenHidden: true,
          },
        });
      });

      it("should not support multiple editors per document", () => {
        AudioPreviewEditorProvider.register(mockContext);

        const [, , options] = (
          vscode.window.registerCustomEditorProvider as jest.Mock
        ).mock.calls[0];
        expect(options.supportsMultipleEditorsPerDocument).toBe(false);
      });

      it("should retain webview context when hidden", () => {
        AudioPreviewEditorProvider.register(mockContext);

        const [, , options] = (
          vscode.window.registerCustomEditorProvider as jest.Mock
        ).mock.calls[0];
        expect(options.webviewOptions.retainContextWhenHidden).toBe(true);
      });
    });
  });

  describe("Provider Instance", () => {
    let provider: AudioPreviewEditorProvider;

    beforeEach(() => {
      provider = new (AudioPreviewEditorProvider as any)(mockContext);
    });

    it("should create provider with context", () => {
      expect(provider["_context"]).toBe(mockContext);
    });

    it("should initialize webviews collection", () => {
      expect(provider["webviews"]).toBeDefined();
    });

    it("should implement CustomReadonlyEditorProvider interface", () => {
      // Check that provider has required methods
      expect(typeof provider.openCustomDocument).toBe("function");
      expect(typeof provider.resolveCustomEditor).toBe("function");
    });
  });

  describe("Error Handling", () => {
    it("should handle registration failure gracefully", () => {
      const error = new Error("Registration failed");
      (
        vscode.window.registerCustomEditorProvider as jest.Mock
      ).mockImplementation(() => {
        throw error;
      });

      expect(() => AudioPreviewEditorProvider.register(mockContext)).toThrow(
        "Registration failed",
      );
    });

    it("should handle missing context gracefully", () => {
      // Reset the mock to normal behavior
      const mockDisposable = { dispose: jest.fn() };
      (vscode.window.registerCustomEditorProvider as jest.Mock).mockReturnValue(
        mockDisposable,
      );

      const nullContext = null as any;

      expect(() =>
        AudioPreviewEditorProvider.register(nullContext),
      ).not.toThrow();
      expect(vscode.window.registerCustomEditorProvider).toHaveBeenCalled();
    });
  });

  describe("Integration", () => {
    it("should register with correct VS Code API calls", () => {
      const mockDisposable = { dispose: jest.fn() };
      (vscode.window.registerCustomEditorProvider as jest.Mock).mockReturnValue(
        mockDisposable,
      );

      const result = AudioPreviewEditorProvider.register(mockContext);

      expect(vscode.window.registerCustomEditorProvider).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toBe(mockDisposable);
    });

    it("should work with VS Code extension lifecycle", () => {
      const _disposables: vscode.Disposable[] = [];

      // Simulate extension activation
      const editorProvider = AudioPreviewEditorProvider.register(mockContext);
      mockContext.subscriptions.push(editorProvider);

      // Simulate extension deactivation
      mockContext.subscriptions.forEach((disposable) => disposable.dispose());

      expect(editorProvider.dispose).toHaveBeenCalled();
    });
  });

  describe("ViewType Consistency", () => {
    it("should use consistent viewType across registrations", () => {
      AudioPreviewEditorProvider.register(mockContext);
      const firstCall = (
        vscode.window.registerCustomEditorProvider as jest.Mock
      ).mock.calls[0];

      jest.clearAllMocks();

      AudioPreviewEditorProvider.register(mockContext);
      const secondCall = (
        vscode.window.registerCustomEditorProvider as jest.Mock
      ).mock.calls[0];

      expect(firstCall[0]).toBe(secondCall[0]);
      expect(firstCall[0]).toBe("wavPreview.audioPreview");
    });

    it("should use viewType that matches package.json configuration", () => {
      AudioPreviewEditorProvider.register(mockContext);

      const viewType = (vscode.window.registerCustomEditorProvider as jest.Mock)
        .mock.calls[0][0];

      // This viewType should match what's configured in package.json
      expect(viewType).toMatch(/^wavPreview\./);
      expect(viewType).toContain("audioPreview");
    });
  });
});
