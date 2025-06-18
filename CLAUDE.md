# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a VS Code extension called "audio-preview" that allows users to play and preview audio files directly in VS Code. It supports multiple audio formats (wav, mp3, aac, ogg, flac, opus, m4a, sph) and provides features like waveform visualization, spectrogram analysis, and audio playback controls.

The extension uses a custom editor provider to handle audio files and renders a React-based webview UI for interaction. It includes advanced features like interactive graph selection (drag to analyze specific ranges), filter controls, and audio segment export functionality.

## Development Commands

### Build & Development
- `npm run webpack` - Build in development mode
- `npm run webpack-dev` - Build in development mode with watch
- `npm run vscode:prepublish` - Build for production (used for publishing)
- Press F5 - Launch extension in Extension Development Host

### Testing
- `npm run test` - Run Jest tests (full test suite with 177+ tests)
- `npm run test -- --testPathPattern="filename"` - Run specific test file
- `npm run test -- --coverage` - Run tests with coverage report
- Tests are configured with jsdom environment and jest-canvas-mock
- Coverage thresholds: 80% lines, 85% functions, 80% branches, 80% statements

### Code Quality
- `npm run lint` - Run ESLint on TypeScript/JavaScript files
- `npm run format` - Format code with Prettier
- `npm run lint-check` - Lint with exit code for CI
- `npm run format-check` - Check formatting with exit code for CI

### Special Build Requirements
The decoder component requires Docker for building WebAssembly:
1. `docker build -t audio-decoder ./src/decoder/`
2. `docker run --rm -v ${pwd}/src/decoder:/build -it audio-decoder make`

### Debugging & Development
- Press F5 to launch extension in Extension Development Host
- Use F12 or Shift+Ctrl+I to open VS Code DevTools for debugging webview issues
- Extension logs appear in VS Code DevTools console

## Architecture

### Extension Structure
- **Extension Entry**: `src/extension.ts` - Main extension activation
- **Custom Editor**: `src/audioPreviewEditor.ts` - Implements VS Code CustomEditorProvider for audio files
- **Webview Frontend**: `src/webview/index.tsx` - React entry point for the webview UI

### Key Components
- **Document Model**: AudioPreviewDocument handles file reading and watching
- **Webview Communication**: Type-safe message passing between extension and webview via `src/messageTypes.ts`
- **Audio Processing**: WebAssembly decoder in `src/decoder/` for audio file processing
- **UI Components**: React-based architecture in `src/webview/components/`

### Build Configuration
The project uses Webpack with three configurations:
1. **extensionConfig** - Node.js extension bundle
2. **webviewConfig** - Web bundle for webview UI (React + TypeScript)
3. **webExtensionConfig** - Web extension support

### Settings & Configuration
- Extension contributes custom editor for audio file types
- Configurable via VS Code settings: `WavPreview.autoAnalyze`, `WavPreview.playerDefault`, `WavPreview.analyzeDefault`
- Settings schema defined in `src/config.ts`

### React Architecture
The webview uses a modern React architecture with:

#### Context Providers (Hierarchical)
- **VSCodeContext**: Root context managing VS Code API communication and audio buffer
- **PlayerSettingsContext**: Player configuration and filter settings
- **AnalyzeSettingsContext**: Analysis configuration (FFT, frequency scales, display ranges)
- **AnalyzeContext**: Audio analysis operations (FFT, spectrogram generation)
- **PlayerContext**: Audio playback state and controls

#### Custom Hooks
- **useVSCode**: Access VS Code API and audio buffer
- **usePlayerSettings**: Player configuration management
- **useAnalyzeSettings**: Analysis settings management  
- **useAnalyze**: Audio analysis operations
- **usePlayer**: Audio playback controls

#### Component Structure
- **WebView.tsx**: Root component with provider hierarchy
- **WebViewInner.tsx**: Main content layout
- **Player.tsx**: Audio playback controls
- **Analyzer.tsx**: Waveform and spectrogram display
- **Waveform.tsx**: Canvas-based waveform visualization
- **Spectrogram.tsx**: Canvas-based spectrogram with multiple frequency scales
- **FigureInteraction.tsx**: Mouse/touch interaction for zoom, pan, seek
- **Settings Components**: PlayerSettings.tsx, AnalyzeSettings.tsx, SettingTab.tsx
- **EasyCut.tsx**: Audio segment export functionality

### Message System
The extension uses a type-safe discriminated union message system defined in `src/messageTypes.ts`:

#### Extension → Webview Messages (ExtMessage)
- `'EXT_CONFIG'` - Send configuration to webview
- `'EXT_DATA'` - Send audio data chunks
- `'EXT_RELOAD'` - Trigger webview reload

#### Webview → Extension Messages (WebviewMessage)
- `'WV_CONFIG'` - Request configuration
- `'WV_DATA'` - Request audio data chunk
- `'WV_WRITE_WAV'` - Export audio file
- `'WV_ERROR'` - Report error to extension

#### Message Structure
- All messages use `{ type: string, payload?: object }` format
- Type guards available for safe message discrimination
- `PostMessage` type for webview → extension communication

### Audio Processing Pipeline
1. **File Loading**: Extension reads audio file as Uint8Array
2. **WASM Decoding**: WebAssembly decoder (`src/decoder/`) processes audio data
3. **AudioBuffer Creation**: Web Audio API buffer for playback and analysis
4. **Context Distribution**: Audio data distributed through React contexts
5. **Canvas Rendering**: Waveform and spectrogram drawn on HTML5 Canvas
6. **Interactive Controls**: Mouse/touch events for navigation and analysis

### Canvas Integration
Canvas components use React patterns:
- `useRef` for canvas element references
- `useEffect` for drawing operations
- Context hooks for data access
- Performance optimized with proper dependency arrays

### Testing Strategy
- **Comprehensive Test Suite**: 177+ tests across all major components
- **Jest Configuration**: jsdom environment with jest-canvas-mock for Canvas API testing
- **Test Infrastructure**: Complete mock system in `src/__tests__/mocks/` for VS Code API, Web Audio API, Canvas, and decoder
- **Test Categories**:
  - Unit tests: Extension activation, message types, configuration, disposable patterns
  - Integration tests: Context interactions, message flow, React provider hierarchies
  - Component tests: UI interactions, canvas rendering, user events, keyboard shortcuts
  - Utility tests: Mathematical functions (Hz-Mel conversion), audio context creation
- **Test File Pattern**: `.test.ts/.test.tsx` files alongside components
- **Mock Patterns**: Comprehensive mocking for VS Code API, audio processing, and canvas operations
- **Coverage Requirements**: Enforced thresholds ensure quality (80%+ lines, 85%+ functions)

### Type Safety
- Comprehensive TypeScript throughout
- Shared types in `src/webview/types/index.ts`
- Message type definitions in `src/messageTypes.ts`
- Interface definitions for all contexts and props
- Strict ESLint configuration for code quality

### File Association Configuration
The extension supports multiple audio formats. To set as default editor in VS Code:
```jsonc
"workbench.editorAssociations": {
    "*.wav": "wavPreview.audioPreview",
    "*.mp3": "wavPreview.audioPreview",
    "*.aac": "wavPreview.audioPreview",
    "*.ogg": "wavPreview.audioPreview",
    "*.flac": "wavPreview.audioPreview",
    "*.opus": "wavPreview.audioPreview",
    "*.m4a": "wavPreview.audioPreview",
    "*.sph": "wavPreview.audioPreview"
}
```

## Important Implementation Notes

### WebAssembly Integration
- Decoder module requires specific build process with Docker
- WASM module exposes `getAudioInfo` and `decodeAudio` functions
- File system operations through `module.FS` interface

### React Context Hierarchy
Provider nesting order is critical:
```
VSCodeProvider → PlayerSettingsProvider → AnalyzeSettingsProvider → AnalyzeProvider → PlayerProvider
```

### Canvas Performance
- Canvas operations are expensive - minimize redraws
- Use proper dependency arrays in useEffect hooks
- Canvas refs must check for null before operations

### Message Flow
1. Webview requests config via `'WV_CONFIG'`
2. Extension responds with `'EXT_CONFIG'` containing settings
3. Webview requests data chunks via `'WV_DATA'`
4. Extension streams data via multiple `'EXT_DATA'` messages
5. User interactions trigger analysis and export operations

### Interactive Features
- **Graph Selection**: Drag on waveform/spectrogram to analyze specific ranges
  - Ctrl+drag: select time range only
  - Shift+drag: select value range only
- **Range Reset**: Right-click to return to original range
  - Ctrl+right-click: reset time range only
  - Shift+right-click: reset value range only
- **Settings Tabs**: Player settings (filters), analyze settings (FFT, frequency scales), and EasyCut (export)

### Extension Configuration
The extension contributes these VS Code settings:
- `WavPreview.autoAnalyze`: Automatically analyze when opening files
- `WavPreview.playerDefault`: Default player settings (volume, filters)
- `WavPreview.analyzeDefault`: Default analysis settings (visibility, FFT window size)

### Disposable Pattern
The codebase uses a unified disposable pattern with:
- `IDisposable` interface for consistent resource cleanup
- `Disposable` base class with automatic disposal tracking
- `VSCodeDisposableAdapter` to bridge VS Code and custom disposables
- All major components implement proper cleanup to prevent memory leaks

### Test Development Guidelines
When adding new tests:
- Follow existing patterns in `src/__tests__/` for mocks and utilities
- Use `TestWrapper` components for context provider mocking
- Mock canvas operations using jest-canvas-mock patterns
- Include edge cases, error handling, and cleanup testing
- Maintain coverage thresholds (80%+ lines, 85%+ functions)
- Test files should be co-located with source files using `.test.ts/.test.tsx` pattern