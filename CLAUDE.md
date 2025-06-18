# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a VS Code extension called "audio-preview" that allows users to play and preview audio files directly in VS Code. It supports multiple audio formats (wav, mp3, aac, ogg, flac, opus, m4a, sph) and provides features like waveform visualization, spectrogram analysis, and audio playback controls.

## Development Commands

### Build & Development
- `npm run webpack` - Build in development mode
- `npm run webpack-dev` - Build in development mode with watch
- `npm run vscode:prepublish` - Build for production (used for publishing)
- Press F5 - Launch extension in Extension Development Host

### Testing
- `npm run test` - Run Jest tests
- Tests are configured with jsdom environment and jest-canvas-mock

### Code Quality
- `npm run lint` - Run ESLint on TypeScript/JavaScript files
- `npm run format` - Format code with Prettier
- `npm run lint-check` - Lint with exit code for CI
- `npm run format-check` - Check formatting with exit code for CI

### Special Build Requirements
The decoder component requires Docker for building WebAssembly:
1. `docker build -t audio-decoder ./src/decoder/`
2. `docker run --rm -v ${pwd}/src/decoder:/build -it audio-decoder make`

## Architecture

### Extension Structure
- **Extension Entry**: `src/extension.ts` - Main extension activation
- **Custom Editor**: `src/audioPreviewEditor.ts` - Implements VS Code CustomEditorProvider for audio files
- **Webview Frontend**: `src/webview/index.tsx` - React entry point for the webview UI

### Key Components
- **Document Model**: AudioPreviewDocument handles file reading and watching
- **Webview Communication**: Message passing between extension and webview via `src/message.ts`
- **Audio Processing**: WebAssembly decoder in `src/decoder/` for audio file processing
- **UI Components**: React-based architecture in `src/webview/components/react/`

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
- **ExtMessage**: Extension → Webview messages (CONFIG, DATA, RELOAD)
- **WebviewMessage**: Webview → Extension messages (CONFIG request, DATA request, WRITE_WAV, ERROR)
- Type-safe discriminated unions in `src/messageTypes.ts`
- Migration utilities in `src/messageMigration.ts` for backward compatibility

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
- Jest with jsdom for DOM testing
- Canvas mocking for visualization tests
- React Testing Library integration ready
- Component-level unit tests with `.test.ts` files alongside components

### Type Safety
- Comprehensive TypeScript throughout
- Shared types in `src/webview/types/index.ts`
- Interface definitions for all contexts and props
- Strict ESLint configuration for code quality