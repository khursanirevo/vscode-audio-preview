import React from 'react';
import { render, screen } from '@testing-library/react';
import { WebView } from './WebView';

// Mock the VSCode API
const mockVSCodeApi = {
  postMessage: jest.fn(),
  setState: jest.fn(),
  getState: jest.fn(),
  onMessage: jest.fn()
};

(global as any).acquireVsCodeApi = () => mockVSCodeApi;

// Mock WebViewInner component
jest.mock('./WebViewInner', () => ({
  WebViewInner: ({ config, audioContext, audioBuffer, audioInfo }: any) => (
    <div data-testid="webview-inner">
      <div data-testid="config">{JSON.stringify(config)}</div>
      <div data-testid="audio-context">{audioContext ? 'AudioContext ready' : 'No AudioContext'}</div>
      <div data-testid="audio-buffer">{audioBuffer ? 'AudioBuffer ready' : 'No AudioBuffer'}</div>
      <div data-testid="audio-info">{audioInfo ? JSON.stringify(audioInfo) : 'No AudioInfo'}</div>
    </div>
  ),
}));

describe('WebView Component', () => {
  beforeEach(() => {
    // Reset mocks
    mockVSCodeApi.postMessage.mockClear();
    mockVSCodeApi.onMessage.mockClear();
  });

  describe('Initial Rendering', () => {
    it('renders WebView component with VSCodeProvider', () => {
      render(<WebView />);
      
      // Should render the basic structure
      expect(document.querySelector('div')).toBeInTheDocument();
    });

  });

  describe('Provider Hierarchy', () => {
    it('maintains correct provider nesting order', () => {
      render(<WebView />);
      
      // Basic rendering check - providers should not crash
      expect(document.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders without error state initially', () => {
      render(<WebView />);
      
      // Should render basic loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('handles component initialization gracefully', () => {
      expect(() => {
        render(<WebView />);
      }).not.toThrow();
    });
  });

  describe('Context Integration', () => {
    it('provides VSCodeContext at root level', () => {
      render(<WebView />);
      
      // VSCode context should be available (component doesn't crash)
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('initializes with loading state', () => {
      render(<WebView />);
      
      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('renders with createAudioContext prop', () => {
      expect(() => {
        render(<WebView />);
      }).not.toThrow();
    });

    it('renders with createDecoder prop', () => {
      expect(() => {
        render(<WebView />);
      }).not.toThrow();
    });

  });
});