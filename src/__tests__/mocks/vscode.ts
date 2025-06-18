/**
 * Comprehensive VS Code API mocks for testing
 */

// Mock EventEmitter
class MockEventEmitter<T> {
  private listeners: ((data: T) => void)[] = [];

  constructor(public event?: (listener: (data: T) => void) => { dispose(): void }) {
    if (!this.event) {
      this.event = (listener: (data: T) => void) => {
        this.listeners.push(listener);
        return { dispose: () => this.removeListener(listener) };
      };
    }
  }

  fire(data: T): void {
    this.listeners.forEach(listener => listener(data));
  }

  private removeListener(listener: (data: T) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  dispose(): void {
    this.listeners = [];
  }
}

// Mock URI
const mockUri = {
  file: (path: string) => ({ 
    scheme: 'file', 
    path, 
    fsPath: path,
    authority: '',
    query: '',
    fragment: '',
    toString: () => `file://${path}`,
    toJSON: () => ({ scheme: 'file', path }),
    with: (change: any) => mockUri.file(change.path || path)
  }),
  parse: (value: string) => ({
    scheme: value.startsWith('file://') ? 'file' : 'untitled',
    path: value.replace('file://', ''),
    fsPath: value.replace('file://', ''),
    authority: '',
    query: '',
    fragment: '',
    toString: () => value,
    toJSON: () => ({ scheme: 'file', path: value }),
    with: (change: any) => mockUri.parse(change.path || value)
  })
};

// Mock Disposable
const mockDisposable = {
  from: (...disposables: any[]) => ({
    dispose: () => disposables.forEach(d => d?.dispose?.())
  })
};

// Mock WebviewPanel
const createMockWebviewPanel = () => ({
  webview: {
    html: '',
    options: {},
    cspSource: 'vscode-webview:',
    asWebviewUri: (uri: any) => uri,
    postMessage: jest.fn(),
    onDidReceiveMessage: jest.fn(() => ({ dispose: jest.fn() }))
  },
  viewType: 'audioPreview',
  title: 'Audio Preview',
  iconPath: undefined as any,
  options: {},
  viewColumn: 1,
  active: true,
  visible: true,
  onDidDispose: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeViewState: jest.fn(() => ({ dispose: jest.fn() })),
  reveal: jest.fn(),
  dispose: jest.fn()
});

// Mock TextDocument
const createMockTextDocument = (uri: any, content = '') => ({
  uri,
  fileName: uri.fsPath,
  isUntitled: uri.scheme === 'untitled',
  languageId: 'audio',
  version: 1,
  isDirty: false,
  isClosed: false,
  save: jest.fn(),
  eol: 1,
  lineCount: 1,
  lineAt: jest.fn(),
  offsetAt: jest.fn(),
  positionAt: jest.fn(),
  getText: jest.fn(() => content),
  getWordRangeAtPosition: jest.fn(),
  validateRange: jest.fn(),
  validatePosition: jest.fn()
});

// Mock workspace
const mockWorkspace = {
  fs: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn(),
    createDirectory: jest.fn(),
    delete: jest.fn()
  },
  openTextDocument: jest.fn(),
  createFileSystemWatcher: jest.fn(() => ({
    onDidChange: jest.fn(() => ({ dispose: jest.fn() })),
    onDidCreate: jest.fn(() => ({ dispose: jest.fn() })),
    onDidDelete: jest.fn(() => ({ dispose: jest.fn() })),
    dispose: jest.fn()
  })),
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn(),
    has: jest.fn(),
    inspect: jest.fn()
  })),
  workspaceFolders: [] as any[],
  onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
  onDidOpenTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  onDidCloseTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  onDidSaveTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  textDocuments: [] as any[],
  workspaceFile: undefined as any,
  name: undefined as any,
  isTrusted: true
};

// Mock window
const mockWindow = {
  createWebviewPanel: jest.fn(createMockWebviewPanel),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showOpenDialog: jest.fn(),
  showSaveDialog: jest.fn(),
  activeTextEditor: undefined as any,
  visibleTextEditors: [] as any[],
  onDidChangeActiveTextEditor: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeVisibleTextEditors: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeTextEditorSelection: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeTextEditorVisibleRanges: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeTextEditorOptions: jest.fn(() => ({ dispose: jest.fn() })),
  createStatusBarItem: jest.fn(() => ({
    text: '',
    tooltip: '',
    color: undefined,
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn()
  }))
};

// Mock commands
const mockCommands = {
  registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  executeCommand: jest.fn(),
  getCommands: jest.fn(() => Promise.resolve([])),
  registerTextEditorCommand: jest.fn(() => ({ dispose: jest.fn() }))
};

// Mock ExtensionContext
const createMockExtensionContext = () => ({
  subscriptions: [] as any[],
  workspaceState: {
    get: jest.fn(),
    update: jest.fn(),
    keys: jest.fn(() => [])
  },
  globalState: {
    get: jest.fn(),
    update: jest.fn(),
    keys: jest.fn(() => []),
    setKeysForSync: jest.fn()
  },
  extensionPath: '/mock/extension/path',
  extensionUri: mockUri.file('/mock/extension/path'),
  environmentVariableCollection: {
    persistent: true,
    replace: jest.fn(),
    append: jest.fn(),
    prepend: jest.fn(),
    get: jest.fn(),
    forEach: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn()
  },
  asAbsolutePath: jest.fn((relativePath: string) => `/mock/extension/path/${relativePath}`),
  storagePath: '/mock/storage/path',
  globalStoragePath: '/mock/global/storage/path',
  logPath: '/mock/log/path',
  extensionMode: 3 // Development
});

// Mock FileSystemProvider methods for CustomDocument
const createMockCustomDocument = (uri: any, mockData?: Uint8Array) => ({
  uri,
  dispose: jest.fn(),
  _mockData: mockData || new Uint8Array([1, 2, 3, 4])
});

// Export all mocks
export const vscode = {
  Uri: mockUri,
  Disposable: mockDisposable,
  workspace: mockWorkspace,
  window: mockWindow,
  commands: mockCommands,
  EventEmitter: MockEventEmitter,
  
  // Enums and constants
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
    Active: -1,
    Beside: -2
  },
  
  WebviewPanelTargetArea: {
    Main: 1,
    AuxiliaryBar: 2
  },

  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3
  },

  ExtensionMode: {
    Production: 1,
    Development: 2,
    Test: 3
  },

  // Test helpers
  __createMockExtensionContext: createMockExtensionContext,
  __createMockWebviewPanel: createMockWebviewPanel,
  __createMockTextDocument: createMockTextDocument,
  __createMockCustomDocument: createMockCustomDocument,
  __resetAllMocks: () => {
    jest.clearAllMocks();
    // Reset any additional state if needed
  }
};

// Individual exports for named imports
export const Uri = vscode.Uri;
export const Disposable = vscode.Disposable;
export const workspace = vscode.workspace;
export const window = vscode.window;
export const commands = vscode.commands;
export const EventEmitter = vscode.EventEmitter;
export const ViewColumn = vscode.ViewColumn;
export const WebviewPanelTargetArea = vscode.WebviewPanelTargetArea;
export const ConfigurationTarget = vscode.ConfigurationTarget;
export const ExtensionMode = vscode.ExtensionMode;
export const env = { uiKind: 1, remoteName: undefined }; // Mock env
export const extensions = { getExtension: jest.fn() }; // Mock extensions

// Add environment mock
Object.assign(vscode, {
  env: { uiKind: 1, remoteName: undefined },
  extensions: { getExtension: jest.fn() }
});

// Set up global mock
(global as any).vscode = vscode;

export default vscode;