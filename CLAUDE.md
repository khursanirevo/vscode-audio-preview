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
- **Webview Frontend**: `src/webview/index.ts` - Entry point for the webview UI

### Key Components
- **Document Model**: AudioPreviewDocument handles file reading and watching
- **Webview Communication**: Message passing between extension and webview via `src/message.ts`
- **Audio Processing**: WebAssembly decoder in `src/decoder/` for audio file processing
- **UI Components**: Component-based architecture in `src/webview/components/`

### Build Configuration
The project uses Webpack with three configurations:
1. **extensionConfig** - Node.js extension bundle
2. **webviewConfig** - Web bundle for webview UI
3. **webExtensionConfig** - Web extension support

### Settings & Configuration
- Extension contributes custom editor for audio file types
- Configurable via VS Code settings: `WavPreview.autoAnalyze`, `WavPreview.playerDefault`, `WavPreview.analyzeDefault`
- Settings schema defined in `src/config.ts`

### Component System
- Service-based architecture with dedicated services for player, analyzer, and settings
- Event-driven communication between components
- Component lifecycle managed through dispose pattern

### Testing Strategy
- Jest with jsdom for DOM testing
- Canvas mocking for visualization tests
- Component-level unit tests with `.test.ts` files alongside components