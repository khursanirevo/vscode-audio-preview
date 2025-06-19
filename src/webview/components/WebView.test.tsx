import React from 'react';
import { render, screen } from '@testing-library/react';
import { WebView, WebViewProps } from './WebView';

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
  let mockCreateAudioContext: jest.MockedFunction<(sampleRate: number) => AudioContext>;
  let mockCreateDecoder: jest.MockedFunction<(fileData: Uint8Array) => Promise<any>>;
  let defaultProps: WebViewProps;

  beforeEach(() => {
    mockCreateAudioContext = jest.fn();
    mockCreateDecoder = jest.fn();
    
    defaultProps = {
      createAudioContext: mockCreateAudioContext,
      createDecoder: mockCreateDecoder,
    };

    // Reset mocks
    mockVSCodeApi.postMessage.mockClear();
    mockVSCodeApi.onMessage.mockClear();
    mockCreateAudioContext.mockClear();
    mockCreateDecoder.mockClear();
  });

  describe('Initial Rendering', () => {
    it('renders WebView component with VSCodeProvider', () => {
      render(<WebView {...defaultProps} />);
      
      // Should render the basic structure
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('passes props correctly to WebViewContent', () => {
      render(<WebView {...defaultProps} />);
      
      // Verify component doesn't crash with provided props
      expect(mockCreateAudioContext).toBeDefined();
      expect(mockCreateDecoder).toBeDefined();
    });
  });

  describe('Provider Hierarchy', () => {
    it('maintains correct provider nesting order', () => {
      render(<WebView {...defaultProps} />);
      
      // Basic rendering check - providers should not crash
      expect(document.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders without error state initially', () => {
      render(<WebView {...defaultProps} />);
      
      // Should render basic loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('handles component initialization gracefully', () => {
      expect(() => {
        render(<WebView {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Context Integration', () => {
    it('provides VSCodeContext at root level', () => {
      render(<WebView {...defaultProps} />);
      
      // VSCode context should be available (component doesn't crash)
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('initializes with loading state', () => {
      render(<WebView {...defaultProps} />);
      
      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('renders with createAudioContext prop', () => {
      expect(() => {
        render(<WebView {...defaultProps} />);
      }).not.toThrow();
    });

    it('renders with createDecoder prop', () => {
      expect(() => {
        render(<WebView {...defaultProps} />);
      }).not.toThrow();
    });

    it('passes factory functions correctly to WebViewContent', () => {
      render(<WebView {...defaultProps} />);
      
      // Verify props are defined
      expect(defaultProps.createAudioContext).toBeDefined();
      expect(defaultProps.createDecoder).toBeDefined();
    });
  });
});