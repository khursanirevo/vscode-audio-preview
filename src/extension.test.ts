/**
 * Extension activation tests
 */

import * as vscode from "vscode";
import { activate } from "./extension";
import { AudioPreviewEditorProvider } from "./audioPreviewEditor";

// Mock the audioPreviewEditor module
jest.mock("./audioPreviewEditor", () => ({
  AudioPreviewEditorProvider: {
    register: jest.fn(() => ({ dispose: jest.fn() })),
  },
}));

describe("Extension Activation", () => {
  let mockContext: vscode.ExtensionContext;
  let mockExtension: vscode.Extension<any>;

  beforeEach(() => {
    // Create mock extension context
    mockContext = (vscode as any).createMockExtensionContext();

    // Create mock extension
    mockExtension = {
      id: "sukumo28.wav-preview",
      extensionUri: vscode.Uri.file("/mock/extension/path"),
      extensionPath: "/mock/extension/path",
      extensionKind: vscode.ExtensionKind.Workspace,
      packageJSON: {
        name: "wav-preview",
        version: "1.0.0",
        contributes: {},
      },
      isActive: true,
      exports: undefined,
      activate: jest.fn(),
    };

    // Mock vscode.extensions.getExtension
    (vscode.extensions.getExtension as jest.Mock).mockReturnValue(
      mockExtension,
    );

    // Mock console methods
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("activate function", () => {
    it("should activate successfully", () => {
      expect(() => activate(mockContext)).not.toThrow();
    });

    it("should get extension information", () => {
      activate(mockContext);

      expect(vscode.extensions.getExtension).toHaveBeenCalledWith(
        "sukumo28.wav-preview",
      );
    });

    it("should log extension metadata", () => {
      activate(mockContext);

      expect(console.log).toHaveBeenCalledWith("version", "1.0.0");
      expect(console.log).toHaveBeenCalledWith(
        "extension.extensionKind",
        vscode.ExtensionKind.Workspace,
      );
      expect(console.log).toHaveBeenCalledWith(
        "vscode.env.uiKind",
        expect.any(Number),
      );
      expect(console.log).toHaveBeenCalledWith(
        "vscode.env.remoteName",
        undefined,
      );
    });

    it("should register AudioPreviewEditorProvider", () => {
      activate(mockContext);

      expect(AudioPreviewEditorProvider.register).toHaveBeenCalledWith(
        mockContext,
      );
    });

    it("should add editor provider to subscriptions", () => {
      const mockDisposable = { dispose: jest.fn() };
      (AudioPreviewEditorProvider.register as jest.Mock).mockReturnValue(
        mockDisposable,
      );

      activate(mockContext);

      expect(mockContext.subscriptions).toContain(mockDisposable);
    });

    it("should handle missing extension gracefully", () => {
      (vscode.extensions.getExtension as jest.Mock).mockReturnValue(undefined);

      expect(() => activate(mockContext)).not.toThrow();
      expect(console.log).toHaveBeenCalledWith("version", undefined);
      expect(console.log).toHaveBeenCalledWith(
        "extension.extensionKind",
        undefined,
      );
    });

    it("should handle extension without packageJSON", () => {
      const extensionWithoutPackageJSON = {
        ...mockExtension,
        packageJSON: undefined as any,
      };
      (vscode.extensions.getExtension as jest.Mock).mockReturnValue(
        extensionWithoutPackageJSON,
      );

      expect(() => activate(mockContext)).not.toThrow();
      expect(console.log).toHaveBeenCalledWith("version", undefined);
    });

    it("should handle extension without version in packageJSON", () => {
      const extensionWithoutVersion = {
        ...mockExtension,
        packageJSON: {},
      };
      (vscode.extensions.getExtension as jest.Mock).mockReturnValue(
        extensionWithoutVersion,
      );

      expect(() => activate(mockContext)).not.toThrow();
      expect(console.log).toHaveBeenCalledWith("version", undefined);
    });
  });

  describe("Extension Environment", () => {
    it("should log UI kind correctly", () => {
      // Mock different UI kinds
      Object.defineProperty(vscode.env, "uiKind", {
        value: vscode.UIKind.Desktop,
        writable: true,
      });

      activate(mockContext);

      expect(console.log).toHaveBeenCalledWith(
        "vscode.env.uiKind",
        vscode.UIKind.Desktop,
      );
    });

    it("should log remote name correctly", () => {
      Object.defineProperty(vscode.env, "remoteName", {
        value: "ssh-remote",
        writable: true,
      });

      activate(mockContext);

      expect(console.log).toHaveBeenCalledWith(
        "vscode.env.remoteName",
        "ssh-remote",
      );
    });

    it("should handle undefined remote name", () => {
      Object.defineProperty(vscode.env, "remoteName", {
        value: undefined,
        writable: true,
      });

      activate(mockContext);

      expect(console.log).toHaveBeenCalledWith(
        "vscode.env.remoteName",
        undefined,
      );
    });
  });

  describe("Extension Registration Failure", () => {
    it("should handle registration failure gracefully", () => {
      const error = new Error("Registration failed");
      (AudioPreviewEditorProvider.register as jest.Mock).mockImplementation(
        () => {
          throw error;
        },
      );

      expect(() => activate(mockContext)).toThrow("Registration failed");
    });

    it("should not add to subscriptions if registration fails", () => {
      const error = new Error("Registration failed");
      (AudioPreviewEditorProvider.register as jest.Mock).mockImplementation(
        () => {
          throw error;
        },
      );

      try {
        activate(mockContext);
      } catch (e) {
        // Expected to throw
      }

      expect(mockContext.subscriptions).toHaveLength(0);
    });
  });

  describe("Extension Metadata Validation", () => {
    beforeEach(() => {
      // Reset the mock to its default behavior
      (AudioPreviewEditorProvider.register as jest.Mock).mockReturnValue({
        dispose: jest.fn(),
      });
    });

    it("should validate extension ID correctly", () => {
      activate(mockContext);

      expect(vscode.extensions.getExtension).toHaveBeenCalledWith(
        "sukumo28.wav-preview",
      );
    });

    it("should handle different extension kinds", () => {
      const testCases = [
        vscode.ExtensionKind.UI,
        vscode.ExtensionKind.Workspace,
      ];

      testCases.forEach((kind) => {
        jest.clearAllMocks();

        const extensionWithKind = {
          ...mockExtension,
          extensionKind: kind,
        };
        (vscode.extensions.getExtension as jest.Mock).mockReturnValue(
          extensionWithKind,
        );

        activate(mockContext);

        expect(console.log).toHaveBeenCalledWith(
          "extension.extensionKind",
          kind,
        );
      });
    });

    it("should handle extension with valid packageJSON structure", () => {
      const complexPackageJSON = {
        name: "wav-preview",
        version: "2.1.0",
        displayName: "Audio Preview",
        description: "Preview audio files in VS Code",
        contributes: {
          customEditors: [
            {
              viewType: "audioPreview",
              displayName: "Audio Preview",
              selector: [
                { filenamePattern: "*.wav" },
                { filenamePattern: "*.mp3" },
              ],
            },
          ],
        },
      };

      const extensionWithComplexPackageJSON = {
        ...mockExtension,
        packageJSON: complexPackageJSON,
      };
      (vscode.extensions.getExtension as jest.Mock).mockReturnValue(
        extensionWithComplexPackageJSON,
      );

      activate(mockContext);

      expect(console.log).toHaveBeenCalledWith("version", "2.1.0");
      expect(console.log).toHaveBeenCalledWith(
        "extension.extensionKind",
        vscode.ExtensionKind.Workspace,
      );
    });
  });
});
