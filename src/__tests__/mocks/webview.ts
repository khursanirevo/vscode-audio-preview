/**
 * Webview communication mocks for testing
 */

import type { ExtMessage, WebviewMessage } from "../../messageTypes";

// Mock message posting functionality
export class MockWebviewMessageHandler {
  private messageListeners: ((message: any) => void)[] = [];
  private sentMessages: WebviewMessage[] = [];

  // Mock the webview's postMessage function
  postMessage = jest.fn((message: WebviewMessage) => {
    this.sentMessages.push(message);
    // Simulate async message delivery
    setTimeout(() => {
      this.messageListeners.forEach((listener) => listener(message));
    }, 0);
  });

  // Mock the message event listener
  onMessage = jest.fn((listener: (message: any) => void) => {
    this.messageListeners.push(listener);
    return {
      dispose: () => {
        const index = this.messageListeners.indexOf(listener);
        if (index > -1) {
          this.messageListeners.splice(index, 1);
        }
      },
    };
  });

  // Helper to simulate receiving messages from webview
  simulateWebviewMessage(message: WebviewMessage) {
    // Simulate the VS Code API receiving a message
    this.messageListeners.forEach((listener) => listener({ data: message }));
  }

  // Test helpers
  getSentMessages(): WebviewMessage[] {
    return [...this.sentMessages];
  }

  getLastSentMessage(): WebviewMessage | undefined {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  getSentMessagesByType<T extends WebviewMessage["type"]>(
    type: T,
  ): Extract<WebviewMessage, { type: T }>[] {
    return this.sentMessages.filter((msg) => msg.type === type) as Extract<
      WebviewMessage,
      { type: T }
    >[];
  }

  clearSentMessages() {
    this.sentMessages = [];
  }

  reset() {
    this.messageListeners = [];
    this.sentMessages = [];
    this.postMessage.mockClear();
    this.onMessage.mockClear();
  }
}

// Mock VS Code API object that webview receives
export const createMockVSCodeAPI = () => {
  const messageHandler = new MockWebviewMessageHandler();

  return {
    postMessage: messageHandler.postMessage,
    getState: jest.fn(() => null),
    setState: jest.fn(),

    // Test helpers - not part of real VS Code API
    messageHandler: messageHandler,
    simulateMessage: messageHandler.simulateWebviewMessage.bind(messageHandler),
    getSentMessages: messageHandler.getSentMessages.bind(messageHandler),
    getLastSentMessage: messageHandler.getLastSentMessage.bind(messageHandler),
    getSentMessagesByType:
      messageHandler.getSentMessagesByType.bind(messageHandler),
    clearSentMessages: messageHandler.clearSentMessages.bind(messageHandler),
    reset: messageHandler.reset.bind(messageHandler),
  };
};

// Mock HTML content generator
export const createMockWebviewHTML = (
  webviewUri: any,
  stylesUri: any,
  scriptUri: any,
  nonce: string,
  cspSource: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${cspSource} data:;">
    <link href="${stylesUri}" rel="stylesheet">
    <title>Audio Preview</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>
`;

// Mock webview panel for testing
export const createMockWebviewPanel = () => {
  const messageHandler = new MockWebviewMessageHandler();

  return {
    webview: {
      html: "",
      options: {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [] as any[],
      },
      cspSource: "vscode-webview:",
      asWebviewUri: jest.fn((uri: any) => ({
        ...uri,
        scheme: "vscode-webview",
        toString: () => `vscode-webview://${uri.path}`,
      })),
      postMessage: messageHandler.postMessage,
      onDidReceiveMessage: messageHandler.onMessage,
    },
    viewType: "audioPreview",
    title: "Audio Preview",
    iconPath: undefined as any,
    options: {},
    viewColumn: 1,
    active: true,
    visible: true,
    onDidDispose: jest.fn(() => ({ dispose: jest.fn() })),
    onDidChangeViewState: jest.fn(() => ({ dispose: jest.fn() })),
    reveal: jest.fn(),
    dispose: jest.fn(),

    // Test helpers
    messageHandler: messageHandler,
    simulateWebviewMessage:
      messageHandler.simulateWebviewMessage.bind(messageHandler),
    getSentMessages: messageHandler.getSentMessages.bind(messageHandler),
    reset: messageHandler.reset.bind(messageHandler),
  };
};

// Mock webview collection for testing
export class MockWebviewCollection {
  private webviews = new Map<string, any>();

  add(uri: any, webview: any) {
    this.webviews.set(uri.toString(), webview);
  }

  get(uri: any) {
    return this.webviews.get(uri.toString());
  }

  delete(uri: any) {
    this.webviews.delete(uri.toString());
  }

  clear() {
    this.webviews.clear();
  }

  size() {
    return this.webviews.size;
  }

  keys() {
    return Array.from(this.webviews.keys());
  }

  dispose() {
    this.webviews.forEach((webview) => {
      if (webview.dispose) {
        webview.dispose();
      }
    });
    this.clear();
  }
}

// Message simulation helpers
export const simulateConfigMessage = (config: any): ExtMessage => ({
  type: "EXT_CONFIG",
  payload: config,
});

export const simulateDataMessage = (
  samples: ArrayBufferLike,
  start: number,
  end: number,
  wholeLength: number,
): ExtMessage => ({
  type: "EXT_DATA",
  payload: { samples, start, end, wholeLength },
});

export const simulateReloadMessage = (): ExtMessage => ({
  type: "EXT_RELOAD",
});

export const simulateWebviewConfigRequest = (): WebviewMessage => ({
  type: "WV_CONFIG",
});

export const simulateWebviewDataRequest = (
  start: number,
  end: number,
): WebviewMessage => ({
  type: "WV_DATA",
  payload: { start, end },
});

export const simulateWebviewWriteWav = (
  samples: ArrayBufferLike,
  filename: string,
): WebviewMessage => ({
  type: "WV_WRITE_WAV",
  payload: { samples, filename },
});

export const simulateWebviewError = (message: string): WebviewMessage => ({
  type: "WV_ERROR",
  payload: { message },
});

export default {
  MockWebviewMessageHandler,
  MockWebviewCollection,
  createMockVSCodeAPI,
  createMockWebviewHTML,
  createMockWebviewPanel,
  simulateConfigMessage,
  simulateDataMessage,
  simulateReloadMessage,
  simulateWebviewConfigRequest,
  simulateWebviewDataRequest,
  simulateWebviewWriteWav,
  simulateWebviewError,
};
