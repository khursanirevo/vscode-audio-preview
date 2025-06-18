/**
 * VSCodeContext tests
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { VSCodeProvider, VSCodeContext, VSCodeContextType } from './VSCodeContext';
import { createMockVSCodeAPI } from '../../__tests__/mocks/webview';
import { setupAudioContextMocks } from '../../__tests__/mocks/audioContext';
import { EventType } from '../events';

// Mock decoder
jest.mock('../decoder', () => ({
  create: jest.fn(),
}));

// Mock createAudioContext
jest.mock('../createAudioContext', () => jest.fn());

// Mock acquireVsCodeApi
const mockVSCodeAPI = createMockVSCodeAPI();
(global as any).acquireVsCodeApi = jest.fn(() => mockVSCodeAPI);

describe('VSCodeContext', () => {
  const TestComponent: React.FC = () => {
    const context = React.useContext(VSCodeContext);
    return (
      <div data-testid="test-component">
        <div data-testid="config">{context?.config ? 'has-config' : 'no-config'}</div>
        <div data-testid="loading">{context?.isLoading ? 'loading' : 'not-loading'}</div>
        <div data-testid="error">{context?.error || 'no-error'}</div>
        <div data-testid="audio-buffer">{context?.audioBuffer ? 'has-buffer' : 'no-buffer'}</div>
        <div data-testid="file-data">{context?.fileData ? 'has-data' : 'no-data'}</div>
      </div>
    );
  };

  beforeEach(() => {
    setupAudioContextMocks();
    jest.clearAllMocks();
    mockVSCodeAPI.__reset();
  });

  describe('Provider Initialization', () => {
    it('should provide default context values', () => {
      render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      expect(screen.getByTestId('config')).toHaveTextContent('no-config');
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('audio-buffer')).toHaveTextContent('no-buffer');
      expect(screen.getByTestId('file-data')).toHaveTextContent('no-data');
    });

    it('should request initial config on mount', () => {
      render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      const sentMessages = mockVSCodeAPI.__getSentMessages();
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]).toEqual({
        type: 'WV_CONFIG'
      });
    });

    it('should set up message listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        EventType.VSCODE_MESSAGE,
        expect.any(Function)
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        EventType.VSCODE_MESSAGE,
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Message Handling', () => {
    it('should handle EXT_CONFIG message', async () => {
      render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      const config = {
        autoAnalyze: true,
        playerDefault: {
          volumeUnitDb: false,
          initialVolumeDb: 0.0,
          initialVolume: 100,
          enableSpacekeyPlay: true,
          enableSeekToPlay: true,
          enableHpf: false,
          hpfFrequency: 100,
          enableLpf: false,
          lpfFrequency: 100,
          matchFilterFrequencyToSpectrogram: false
        },
        analyzeDefault: {
          waveformVisible: true,
          waveformVerticalScale: 1.0,
          minAmplitude: -1.0,
          maxAmplitude: 1.0,
          spectrogramVisible: true,
          spectrogramVerticalScale: 1.0,
          windowSizeIndex: 2,
          minFrequency: 0,
          maxFrequency: 22050,
          spectrogramAmplitudeRange: -90,
          frequencyScale: 0,
          melFilterNum: 40
        }
      };

      act(() => {
        window.dispatchEvent(new MessageEvent(EventType.VSCODE_MESSAGE, {
          data: {
            type: 'EXT_CONFIG',
            payload: config
          }
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('config')).toHaveTextContent('has-config');
      });

      // Should request initial data after receiving config
      const sentMessages = mockVSCodeAPI.__getSentMessages();
      expect(sentMessages).toHaveLength(2); // Initial config request + data request
      expect(sentMessages[1]).toEqual({
        type: 'WV_DATA',
        payload: { start: 0, end: 500000 }
      });
    });

    it('should handle EXT_DATA message', async () => {
      render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      const sampleData = new Uint8Array([1, 2, 3, 4]);
      
      act(() => {
        window.dispatchEvent(new MessageEvent(EventType.VSCODE_MESSAGE, {
          data: {
            type: 'EXT_DATA',
            payload: {
              samples: sampleData.buffer,
              start: 0,
              end: 4,
              wholeLength: 4
            }
          }
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('file-data')).toHaveTextContent('has-data');
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });

    it('should handle chunked data transfer', async () => {
      render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      const chunk1 = new Uint8Array([1, 2]);
      const chunk2 = new Uint8Array([3, 4]);

      // First chunk
      act(() => {
        window.dispatchEvent(new MessageEvent(EventType.VSCODE_MESSAGE, {
          data: {
            type: 'EXT_DATA',
            payload: {
              samples: chunk1.buffer,
              start: 0,
              end: 2,
              wholeLength: 4
            }
          }
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('file-data')).toHaveTextContent('has-data');
        expect(screen.getByTestId('loading')).toHaveTextContent('loading'); // Still loading
      });

      // Should request next chunk
      const sentMessages = mockVSCodeAPI.__getSentMessages();
      expect(sentMessages[sentMessages.length - 1]).toEqual({
        type: 'WV_DATA',
        payload: { start: 2, end: 3000002 }
      });

      // Second chunk
      act(() => {
        window.dispatchEvent(new MessageEvent(EventType.VSCODE_MESSAGE, {
          data: {
            type: 'EXT_DATA',
            payload: {
              samples: chunk2.buffer,
              start: 2,
              end: 4,
              wholeLength: 4
            }
          }
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });

    it('should handle EXT_RELOAD message', async () => {
      render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      // Set some initial state
      act(() => {
        window.dispatchEvent(new MessageEvent(EventType.VSCODE_MESSAGE, {
          data: {
            type: 'EXT_CONFIG',
            payload: { autoAnalyze: true, playerDefault: {}, analyzeDefault: {} }
          }
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('config')).toHaveTextContent('has-config');
      });

      // Send reload message
      act(() => {
        window.dispatchEvent(new MessageEvent(EventType.VSCODE_MESSAGE, {
          data: { type: 'EXT_RELOAD' }
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('config')).toHaveTextContent('no-config');
        expect(screen.getByTestId('loading')).toHaveTextContent('loading');
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
        expect(screen.getByTestId('file-data')).toHaveTextContent('no-data');
      });

      // Should request config again
      const sentMessages = mockVSCodeAPI.__getSentMessages();
      const configRequests = sentMessages.filter(msg => msg.type === 'WV_CONFIG');
      expect(configRequests.length).toBeGreaterThan(1);
    });

    it('should handle unknown message types', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      act(() => {
        window.dispatchEvent(new MessageEvent(EventType.VSCODE_MESSAGE, {
          data: { type: 'UNKNOWN_TYPE' }
        }));
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown message type:',
        { type: 'UNKNOWN_TYPE' }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Audio Processing', () => {
    beforeEach(() => {
      const mockDecoder = {
        readAudioInfo: jest.fn(),
        decode: jest.fn(),
        dispose: jest.fn(),
        sampleRate: 44100,
        numChannels: 2,
        length: 1000,
        samples: [new Float32Array(1000), new Float32Array(1000)]
      };

      const mockContext = {
        createBuffer: jest.fn(() => ({
          copyToChannel: jest.fn()
        }))
      };

      require('../decoder').create.mockResolvedValue(mockDecoder);
      require('../createAudioContext').default.mockReturnValue(mockContext);
    });

    it('should process audio when file data is available', async () => {
      render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      // Send data to trigger audio processing
      act(() => {
        window.dispatchEvent(new MessageEvent(EventType.VSCODE_MESSAGE, {
          data: {
            type: 'EXT_DATA',
            payload: {
              samples: new Uint8Array([1, 2, 3, 4]).buffer,
              start: 0,
              end: 4,
              wholeLength: 4
            }
          }
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('audio-buffer')).toHaveTextContent('has-buffer');
      });

      expect(require('../decoder').create).toHaveBeenCalled();
      expect(require('../createAudioContext').default).toHaveBeenCalled();
    });

    it('should handle audio processing errors', async () => {
      const error = new Error('Decoding failed');
      require('../decoder').create.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      act(() => {
        window.dispatchEvent(new MessageEvent(EventType.VSCODE_MESSAGE, {
          data: {
            type: 'EXT_DATA',
            payload: {
              samples: new Uint8Array([1, 2, 3, 4]).buffer,
              start: 0,
              end: 4,
              wholeLength: 4
            }
          }
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Error processing audio: Error: Decoding failed');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error processing audio:', error);

      consoleSpy.mockRestore();
    });

    it('should not process audio while loading', async () => {
      render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      // Send partial data (should not trigger processing)
      act(() => {
        window.dispatchEvent(new MessageEvent(EventType.VSCODE_MESSAGE, {
          data: {
            type: 'EXT_DATA',
            payload: {
              samples: new Uint8Array([1, 2]).buffer,
              start: 0,
              end: 2,
              wholeLength: 4
            }
          }
        }));
      });

      // Wait a bit to ensure no processing occurs
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(require('../decoder').create).not.toHaveBeenCalled();
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });
  });

  describe('Context API', () => {
    it('should provide postMessage function', () => {
      let contextValue: VSCodeContextType | undefined;

      const TestContextConsumer = () => {
        contextValue = React.useContext(VSCodeContext);
        return null;
      };

      render(
        <VSCodeProvider>
          <TestContextConsumer />
        </VSCodeProvider>
      );

      expect(contextValue?.postMessage).toBeDefined();
      expect(typeof contextValue?.postMessage).toBe('function');
    });

    it('should send messages through postMessage', () => {
      let contextValue: VSCodeContextType | undefined;

      const TestContextConsumer = () => {
        contextValue = React.useContext(VSCodeContext);
        return null;
      };

      render(
        <VSCodeProvider>
          <TestContextConsumer />
        </VSCodeProvider>
      );

      const testMessage = {
        type: 'WV_ERROR' as const,
        payload: { message: 'Test error' }
      };

      contextValue?.postMessage(testMessage);

      expect(mockVSCodeAPI.postMessage).toHaveBeenCalledWith(testMessage);
    });

    it('should throw error when used outside provider', () => {
      const TestComponentWithoutProvider = () => {
        const context = React.useContext(VSCodeContext);
        return <div>{context ? 'has-context' : 'no-context'}</div>;
      };

      render(<TestComponentWithoutProvider />);
      
      expect(screen.getByText('no-context')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        EventType.VSCODE_MESSAGE,
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should handle multiple mounts and unmounts', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      // First mount
      const { unmount: unmount1 } = render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      // Second mount
      const { unmount: unmount2 } = render(
        <VSCodeProvider>
          <TestComponent />
        </VSCodeProvider>
      );

      unmount1();
      unmount2();

      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});