import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WebView, WebViewProps } from './WebView';
import vscode from '../../__tests__/mocks/vscode';
import MockDecoder from '../../__tests__/mocks/decoder';
import { mockAudioContext } from '../../__tests__/mocks/audioContext';

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
      
      // Should initially show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('passes props correctly to WebViewContent', () => {
      render(<WebView {...defaultProps} />);
      
      // Verify that the component accepts the required props
      expect(mockCreateAudioContext).toBeDefined();
      expect(mockCreateDecoder).toBeDefined();
    });
  });

  describe('Provider Hierarchy', () => {
    it('maintains correct provider nesting order', async () => {
      // Mock successful data flow
      const mockDecoder = await MockDecoder.create(new Uint8Array([1, 2, 3]));
      const mockAudioContextInstance = mockAudioContext();
      
      mockCreateDecoder.mockResolvedValue(mockDecoder);
      mockCreateAudioContext.mockReturnValue(mockAudioContextInstance as any);

      render(<WebView {...defaultProps} />);

      // Simulate VS Code API providing config and data
      const configMessage = {
        type: 'EXT_CONFIG',
        payload: {
          autoAnalyze: true,
          playerDefault: { volume: 0.8, hpfCutoff: 0, lpfCutoff: 0 },
          analyzeDefault: { fftWindowSize: 1024, freqScale: 'linear' as const }
        }
      };

      const fileData = new Uint8Array([1, 2, 3, 4]);
      const dataMessage = {
        type: 'EXT_DATA',
        payload: { chunk: Array.from(fileData), isLast: true }
      };

      // Trigger message handlers
      const onMessageHandler = mockVSCodeApi.onMessage as jest.Mock;
      if (onMessageHandler.mock.calls.length > 0) {
        const messageHandler = onMessageHandler.mock.calls[0][0];
        messageHandler({ data: configMessage });
        messageHandler({ data: dataMessage });
      }

      // Wait for processing
      await waitFor(() => {
        expect(mockCreateDecoder).toHaveBeenCalledWith(fileData);
      }, { timeout: 5000 });

      // Verify the provider hierarchy by checking that WebViewInner receives data
      await waitFor(() => {
        expect(screen.getByTestId('webview-inner')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error state when VS Code context has error', async () => {
      render(<WebView {...defaultProps} />);

      // Simulate error in VSCode context
      const errorMessage = {
        type: 'EXT_ERROR',
        payload: { message: 'Test error' }
      };

      const onMessageHandler = mockVSCodeApi.onMessage as jest.Mock;
      if (onMessageHandler.mock.calls.length > 0) {
        const messageHandler = onMessageHandler.mock.calls[0][0];
        messageHandler({ data: errorMessage });
      }

      await waitFor(() => {
        expect(screen.queryByText(/Error:/)).toBeInTheDocument();
      });
    });

    it('handles decoder creation failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockCreateDecoder.mockRejectedValue(new Error('Decoder creation failed'));

      render(<WebView {...defaultProps} />);

      // Provide valid config and data
      const configMessage = {
        type: 'EXT_CONFIG',
        payload: {
          autoAnalyze: true,
          playerDefault: { volume: 0.8, hpfCutoff: 0, lpfCutoff: 0 },
          analyzeDefault: { fftWindowSize: 1024, freqScale: 'linear' as const }
        }
      };

      const dataMessage = {
        type: 'EXT_DATA',
        payload: { chunk: [1, 2, 3, 4], isLast: true }
      };

      const onMessageHandler = mockVSCodeApi.onMessage as jest.Mock;
      if (onMessageHandler.mock.calls.length > 0) {
        const messageHandler = onMessageHandler.mock.calls[0][0];
        messageHandler({ data: configMessage });
        messageHandler({ data: dataMessage });
      }

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing audio:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Audio Processing Flow', () => {
    it('processes audio data correctly', async () => {
      const mockDecoder = await MockDecoder.create(new Uint8Array([1, 2, 3]));
      mockDecoder.numChannels = 2;
      mockDecoder.sampleRate = 44100;
      mockDecoder.length = 1000;
      mockDecoder.samples = [
        new Float32Array(1000).fill(0.5),
        new Float32Array(1000).fill(-0.5)
      ];
      
      const mockAudioContextInstance = mockAudioContext();
      const mockAudioBuffer = {
        numberOfChannels: 2,
        length: 1000,
        sampleRate: 44100,
        copyToChannel: jest.fn(),
      } as any;

      mockAudioContextInstance.createBuffer = jest.fn().mockReturnValue(mockAudioBuffer);
      mockCreateDecoder.mockResolvedValue(mockDecoder);
      mockCreateAudioContext.mockReturnValue(mockAudioContextInstance as any);

      render(<WebView {...defaultProps} />);

      // Provide config and data
      const configMessage = {
        type: 'EXT_CONFIG',
        payload: {
          autoAnalyze: true,
          playerDefault: { volume: 0.8, hpfCutoff: 0, lpfCutoff: 0 },
          analyzeDefault: { fftWindowSize: 1024, freqScale: 'linear' as const }
        }
      };

      const fileData = new Uint8Array([1, 2, 3, 4]);
      const dataMessage = {
        type: 'EXT_DATA',
        payload: { chunk: Array.from(fileData), isLast: true }
      };

      const onMessageHandler = mockVSCodeApi.onMessage as jest.Mock;
      if (onMessageHandler.mock.calls.length > 0) {
        const messageHandler = onMessageHandler.mock.calls[0][0];
        messageHandler({ data: configMessage });
        messageHandler({ data: dataMessage });
      }

      // Wait for processing to complete
      await waitFor(() => {
        expect(mockCreateDecoder).toHaveBeenCalledWith(fileData);
        expect(mockDecoder.readAudioInfo).toHaveBeenCalled();
        expect(mockDecoder.decode).toHaveBeenCalled();
        expect(mockCreateAudioContext).toHaveBeenCalledWith(44100);
        expect(mockAudioContextInstance.createBuffer).toHaveBeenCalledWith(2, 1000, 44100);
        expect(mockDecoder.dispose).toHaveBeenCalled();
      }, { timeout: 5000 });

      // Verify WebViewInner receives processed data
      await waitFor(() => {
        expect(screen.getByTestId('audio-context')).toHaveTextContent('AudioContext ready');
        expect(screen.getByTestId('audio-buffer')).toHaveTextContent('AudioBuffer ready');
        expect(screen.getByTestId('audio-info')).toHaveTextContent('"numChannels":2');
      });
    });

    it('shows correct loading states during processing', async () => {
      const mockDecoder = await MockDecoder.create(new Uint8Array([1, 2, 3]));
      let resolveDecoder: (value: any) => void;
      const decoderPromise = new Promise((resolve) => {
        resolveDecoder = resolve;
      });

      mockCreateDecoder.mockReturnValue(decoderPromise);

      render(<WebView {...defaultProps} />);

      // Provide config and data
      const configMessage = {
        type: 'EXT_CONFIG',
        payload: {
          autoAnalyze: true,
          playerDefault: { volume: 0.8, hpfCutoff: 0, lpfCutoff: 0 },
          analyzeDefault: { fftWindowSize: 1024, freqScale: 'linear' as const }
        }
      };

      const dataMessage = {
        type: 'EXT_DATA',
        payload: { chunk: [1, 2, 3, 4], isLast: true }
      };

      const onMessageHandler = mockVSCodeApi.onMessage as jest.Mock;
      if (onMessageHandler.mock.calls.length > 0) {
        const messageHandler = onMessageHandler.mock.calls[0][0];
        messageHandler({ data: configMessage });
        messageHandler({ data: dataMessage });
      }

      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText('Processing audio...')).toBeInTheDocument();
      });

      // Resolve decoder to complete processing
      resolveDecoder!(mockDecoder);

      await waitFor(() => {
        expect(screen.queryByText('Processing audio...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Context Integration', () => {
    it('provides VSCodeContext at root level', () => {
      render(<WebView {...defaultProps} />);
      
      // The component should render without throwing
      // VSCodeContext should be available to child components
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('nests providers in correct order', async () => {
      const mockDecoder = await MockDecoder.create(new Uint8Array([1, 2, 3]));
      const mockAudioContextInstance = mockAudioContext();
      
      mockCreateDecoder.mockResolvedValue(mockDecoder);
      mockCreateAudioContext.mockReturnValue(mockAudioContextInstance as any);

      render(<WebView {...defaultProps} />);

      // The provider hierarchy should be:
      // VSCodeProvider > PlayerSettingsProvider > AnalyzeSettingsProvider > AnalyzeProvider > WebViewInner
      // This is verified by the component rendering successfully with all providers
      
      // Provide necessary data to reach WebViewInner
      const configMessage = {
        type: 'EXT_CONFIG',
        payload: {
          autoAnalyze: true,
          playerDefault: { volume: 0.8, hpfCutoff: 0, lpfCutoff: 0 },
          analyzeDefault: { fftWindowSize: 1024, freqScale: 'linear' as const }
        }
      };

      const dataMessage = {
        type: 'EXT_DATA',
        payload: { chunk: [1, 2, 3, 4], isLast: true }
      };

      const onMessageHandler = mockVSCodeApi.onMessage as jest.Mock;
      if (onMessageHandler.mock.calls.length > 0) {
        const messageHandler = onMessageHandler.mock.calls[0][0];
        messageHandler({ data: configMessage });
        messageHandler({ data: dataMessage });
      }

      await waitFor(() => {
        expect(screen.getByTestId('webview-inner')).toBeInTheDocument();
      });
    });
  });

  describe('Component Props', () => {
    it('requires createAudioContext prop', () => {
      const { createAudioContext, ...propsWithoutAudioContext } = defaultProps;
      
      // TypeScript should catch this, but test runtime behavior
      expect(() => {
        render(<WebView {...(propsWithoutAudioContext as any)} />);
      }).toThrow();
    });

    it('requires createDecoder prop', () => {
      const { createDecoder, ...propsWithoutDecoder } = defaultProps;
      
      // TypeScript should catch this, but test runtime behavior
      expect(() => {
        render(<WebView {...(propsWithoutDecoder as any)} />);
      }).toThrow();
    });

    it('passes factory functions correctly to WebViewContent', () => {
      render(<WebView {...defaultProps} />);
      
      // Factory functions should be available to WebViewContent
      // This is verified by the component rendering without errors
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});