/**
 * Message type guards and payload validation tests
 */

import {
  ExtMessage,
  WebviewMessage,
  ExtDataPayload,
  WebviewDataPayload,
  WebviewWriteWavPayload,
  WebviewErrorPayload,
  isExtConfigMessage,
  isExtDataMessage,
  isExtReloadMessage,
  isWebviewConfigMessage,
  isWebviewDataMessage,
  isWebviewWriteWavMessage,
  isWebviewErrorMessage,
  PostMessage
} from './messageTypes';
import { Config } from './config';

describe('Message Types', () => {
  describe('ExtMessage Type Guards', () => {
    describe('isExtConfigMessage', () => {
      it('should return true for valid EXT_CONFIG message', () => {
        const mockConfig: Config = {
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
          },
          autoAnalyze: true
        };
        
        const message: ExtMessage = {
          type: 'EXT_CONFIG',
          payload: mockConfig
        };
        
        expect(isExtConfigMessage(message)).toBe(true);
      });

      it('should return false for non-EXT_CONFIG message', () => {
        const message: ExtMessage = { type: 'EXT_RELOAD' };
        expect(isExtConfigMessage(message)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const mockConfig: Config = {
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
          },
          autoAnalyze: true
        };
        
        const message: ExtMessage = {
          type: 'EXT_CONFIG',
          payload: mockConfig
        };
        
        if (isExtConfigMessage(message)) {
          // TypeScript should know message.payload is Config
          expect(message.payload.autoAnalyze).toBe(true);
          expect(typeof message.payload.playerDefault.initialVolume).toBe('number');
        }
      });
    });

    describe('isExtDataMessage', () => {
      it('should return true for valid EXT_DATA message', () => {
        const payload: ExtDataPayload = {
          samples: new ArrayBuffer(1024),
          start: 0,
          end: 1024,
          wholeLength: 2048
        };
        
        const message: ExtMessage = {
          type: 'EXT_DATA',
          payload
        };
        
        expect(isExtDataMessage(message)).toBe(true);
      });

      it('should return false for non-EXT_DATA message', () => {
        const message: ExtMessage = { type: 'EXT_RELOAD' };
        expect(isExtDataMessage(message)).toBe(false);
      });

      it('should handle message with autoAnalyze flag', () => {
        const payload: ExtDataPayload = {
          samples: new ArrayBuffer(1024),
          start: 0,
          end: 1024,
          wholeLength: 2048,
          autoAnalyze: true
        };
        
        const message: ExtMessage = {
          type: 'EXT_DATA',
          payload
        };
        
        expect(isExtDataMessage(message)).toBe(true);
        
        if (isExtDataMessage(message)) {
          expect(message.payload.autoAnalyze).toBe(true);
        }
      });

      it('should narrow type correctly', () => {
        const payload: ExtDataPayload = {
          samples: new ArrayBuffer(1024),
          start: 100,
          end: 200,
          wholeLength: 1024
        };
        
        const message: ExtMessage = {
          type: 'EXT_DATA',
          payload
        };
        
        if (isExtDataMessage(message)) {
          // TypeScript should know message.payload is ExtDataPayload
          expect(message.payload.start).toBe(100);
          expect(message.payload.end).toBe(200);
          expect(message.payload.samples).toBeInstanceOf(ArrayBuffer);
        }
      });
    });

    describe('isExtReloadMessage', () => {
      it('should return true for valid EXT_RELOAD message', () => {
        const message: ExtMessage = { type: 'EXT_RELOAD' };
        expect(isExtReloadMessage(message)).toBe(true);
      });

      it('should return false for non-EXT_RELOAD message', () => {
        const message: ExtMessage = {
          type: 'EXT_DATA',
          payload: {
            samples: new ArrayBuffer(1024),
            start: 0,
            end: 1024,
            wholeLength: 2048
          }
        };
        expect(isExtReloadMessage(message)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const message: ExtMessage = { type: 'EXT_RELOAD' };
        
        if (isExtReloadMessage(message)) {
          // TypeScript should know this is an EXT_RELOAD message
          expect(message.type).toBe('EXT_RELOAD');
          // Should not have payload property
          expect('payload' in message).toBe(false);
        }
      });
    });
  });

  describe('WebviewMessage Type Guards', () => {
    describe('isWebviewConfigMessage', () => {
      it('should return true for valid WV_CONFIG message', () => {
        const message: WebviewMessage = { type: 'WV_CONFIG' };
        expect(isWebviewConfigMessage(message)).toBe(true);
      });

      it('should return false for non-WV_CONFIG message', () => {
        const message: WebviewMessage = {
          type: 'WV_ERROR',
          payload: { message: 'Test error' }
        };
        expect(isWebviewConfigMessage(message)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const message: WebviewMessage = { type: 'WV_CONFIG' };
        
        if (isWebviewConfigMessage(message)) {
          expect(message.type).toBe('WV_CONFIG');
          expect('payload' in message).toBe(false);
        }
      });
    });

    describe('isWebviewDataMessage', () => {
      it('should return true for valid WV_DATA message', () => {
        const payload: WebviewDataPayload = {
          start: 0,
          end: 1024
        };
        
        const message: WebviewMessage = {
          type: 'WV_DATA',
          payload
        };
        
        expect(isWebviewDataMessage(message)).toBe(true);
      });

      it('should return false for non-WV_DATA message', () => {
        const message: WebviewMessage = { type: 'WV_CONFIG' };
        expect(isWebviewDataMessage(message)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const payload: WebviewDataPayload = {
          start: 100,
          end: 200
        };
        
        const message: WebviewMessage = {
          type: 'WV_DATA',
          payload
        };
        
        if (isWebviewDataMessage(message)) {
          expect(message.payload.start).toBe(100);
          expect(message.payload.end).toBe(200);
        }
      });

      it('should validate payload structure', () => {
        const payload = {
          start: 0,
          end: 1024
        };
        
        const message: WebviewMessage = {
          type: 'WV_DATA',
          payload
        };
        
        expect(isWebviewDataMessage(message)).toBe(true);
        
        if (isWebviewDataMessage(message)) {
          expect(typeof message.payload.start).toBe('number');
          expect(typeof message.payload.end).toBe('number');
        }
      });
    });

    describe('isWebviewWriteWavMessage', () => {
      it('should return true for valid WV_WRITE_WAV message', () => {
        const payload: WebviewWriteWavPayload = {
          filename: 'test.wav',
          samples: new ArrayBuffer(1024)
        };
        
        const message: WebviewMessage = {
          type: 'WV_WRITE_WAV',
          payload
        };
        
        expect(isWebviewWriteWavMessage(message)).toBe(true);
      });

      it('should return false for non-WV_WRITE_WAV message', () => {
        const message: WebviewMessage = { type: 'WV_CONFIG' };
        expect(isWebviewWriteWavMessage(message)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const payload: WebviewWriteWavPayload = {
          filename: 'export.wav',
          samples: new ArrayBuffer(2048)
        };
        
        const message: WebviewMessage = {
          type: 'WV_WRITE_WAV',
          payload
        };
        
        if (isWebviewWriteWavMessage(message)) {
          expect(message.payload.filename).toBe('export.wav');
          expect(message.payload.samples).toBeInstanceOf(ArrayBuffer);
          expect(message.payload.samples.byteLength).toBe(2048);
        }
      });

      it('should validate different ArrayBufferLike types', () => {
        const testCases = [
          new ArrayBuffer(1024),
          new Uint8Array(1024),
          new Float32Array(256)
        ];

        testCases.forEach(samples => {
          const payload: WebviewWriteWavPayload = {
            filename: 'test.wav',
            samples
          };
          
          const message: WebviewMessage = {
            type: 'WV_WRITE_WAV',
            payload
          };
          
          expect(isWebviewWriteWavMessage(message)).toBe(true);
          
          if (isWebviewWriteWavMessage(message)) {
            expect(message.payload.samples).toBe(samples);
          }
        });
      });
    });

    describe('isWebviewErrorMessage', () => {
      it('should return true for valid WV_ERROR message', () => {
        const payload: WebviewErrorPayload = {
          message: 'Test error message'
        };
        
        const message: WebviewMessage = {
          type: 'WV_ERROR',
          payload
        };
        
        expect(isWebviewErrorMessage(message)).toBe(true);
      });

      it('should return false for non-WV_ERROR message', () => {
        const message: WebviewMessage = { type: 'WV_CONFIG' };
        expect(isWebviewErrorMessage(message)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const payload: WebviewErrorPayload = {
          message: 'Audio decoding failed'
        };
        
        const message: WebviewMessage = {
          type: 'WV_ERROR',
          payload
        };
        
        if (isWebviewErrorMessage(message)) {
          expect(message.payload.message).toBe('Audio decoding failed');
          expect(typeof message.payload.message).toBe('string');
        }
      });

      it('should handle empty error message', () => {
        const payload: WebviewErrorPayload = {
          message: ''
        };
        
        const message: WebviewMessage = {
          type: 'WV_ERROR',
          payload
        };
        
        expect(isWebviewErrorMessage(message)).toBe(true);
        
        if (isWebviewErrorMessage(message)) {
          expect(message.payload.message).toBe('');
        }
      });
    });
  });

  describe('Message Payload Validation', () => {
    describe('ExtDataPayload', () => {
      it('should validate required fields', () => {
        const payload: ExtDataPayload = {
          samples: new ArrayBuffer(1024),
          start: 0,
          end: 1024,
          wholeLength: 2048
        };
        
        expect(payload.samples).toBeInstanceOf(ArrayBuffer);
        expect(typeof payload.start).toBe('number');
        expect(typeof payload.end).toBe('number');
        expect(typeof payload.wholeLength).toBe('number');
      });

      it('should handle optional autoAnalyze field', () => {
        const payloadWithAutoAnalyze: ExtDataPayload = {
          samples: new ArrayBuffer(1024),
          start: 0,
          end: 1024,
          wholeLength: 2048,
          autoAnalyze: true
        };
        
        expect(payloadWithAutoAnalyze.autoAnalyze).toBe(true);
        
        const payloadWithoutAutoAnalyze: ExtDataPayload = {
          samples: new ArrayBuffer(1024),
          start: 0,
          end: 1024,
          wholeLength: 2048
        };
        
        expect(payloadWithoutAutoAnalyze.autoAnalyze).toBeUndefined();
      });

      it('should validate range constraints', () => {
        const payload: ExtDataPayload = {
          samples: new ArrayBuffer(1024),
          start: 100,
          end: 200,
          wholeLength: 1024
        };
        
        expect(payload.start).toBeLessThan(payload.end);
        expect(payload.end).toBeLessThanOrEqual(payload.wholeLength);
        expect(payload.start).toBeGreaterThanOrEqual(0);
      });
    });

    describe('WebviewDataPayload', () => {
      it('should validate required fields', () => {
        const payload: WebviewDataPayload = {
          start: 0,
          end: 1024
        };
        
        expect(typeof payload.start).toBe('number');
        expect(typeof payload.end).toBe('number');
      });

      it('should validate range relationship', () => {
        const payload: WebviewDataPayload = {
          start: 100,
          end: 200
        };
        
        expect(payload.start).toBeLessThan(payload.end);
      });
    });

    describe('WebviewWriteWavPayload', () => {
      it('should validate required fields', () => {
        const payload: WebviewWriteWavPayload = {
          filename: 'test.wav',
          samples: new ArrayBuffer(1024)
        };
        
        expect(typeof payload.filename).toBe('string');
        expect(payload.samples).toBeInstanceOf(ArrayBuffer);
      });

      it('should handle different filename formats', () => {
        const testFilenames = [
          'simple.wav',
          'with-dashes.wav',
          'with spaces.wav',
          'with_underscores.wav',
          'UPPERCASE.WAV',
          'file.with.dots.wav'
        ];

        testFilenames.forEach(filename => {
          const payload: WebviewWriteWavPayload = {
            filename,
            samples: new ArrayBuffer(1024)
          };
          
          expect(payload.filename).toBe(filename);
          expect(typeof payload.filename).toBe('string');
        });
      });
    });

    describe('WebviewErrorPayload', () => {
      it('should validate required fields', () => {
        const payload: WebviewErrorPayload = {
          message: 'Error message'
        };
        
        expect(typeof payload.message).toBe('string');
      });

      it('should handle various error message types', () => {
        const testMessages = [
          'Simple error',
          'Error with numbers: 123',
          'Error with special characters: @#$%',
          'Multi-line\nerror\nmessage',
          '',
          'Very long error message that might contain detailed information about what went wrong during audio processing'
        ];

        testMessages.forEach(message => {
          const payload: WebviewErrorPayload = { message };
          expect(payload.message).toBe(message);
          expect(typeof payload.message).toBe('string');
        });
      });
    });
  });

  describe('PostMessage Type', () => {
    it('should be a function type that accepts WebviewMessage', () => {
      const mockPostMessage: PostMessage = jest.fn();
      
      const message: WebviewMessage = { type: 'WV_CONFIG' };
      mockPostMessage(message);
      
      expect(mockPostMessage).toHaveBeenCalledWith(message);
    });

    it('should work with all WebviewMessage types', () => {
      const mockPostMessage: PostMessage = jest.fn();
      
      const messages: WebviewMessage[] = [
        { type: 'WV_CONFIG' },
        { type: 'WV_DATA', payload: { start: 0, end: 1024 } },
        { type: 'WV_WRITE_WAV', payload: { filename: 'test.wav', samples: new ArrayBuffer(1024) } },
        { type: 'WV_ERROR', payload: { message: 'Test error' } }
      ];

      messages.forEach(message => {
        mockPostMessage(message);
      });
      
      expect(mockPostMessage).toHaveBeenCalledTimes(4);
      expect(mockPostMessage).toHaveBeenNthCalledWith(1, messages[0]);
      expect(mockPostMessage).toHaveBeenNthCalledWith(2, messages[1]);
      expect(mockPostMessage).toHaveBeenNthCalledWith(3, messages[2]);
      expect(mockPostMessage).toHaveBeenNthCalledWith(4, messages[3]);
    });
  });

  describe('Message Type Exhaustiveness', () => {
    it('should handle all ExtMessage types', () => {
      const messages: ExtMessage[] = [
        { type: 'EXT_CONFIG', payload: { playerDefault: {}, analyzeDefault: {}, autoAnalyze: false } as Config },
        { type: 'EXT_DATA', payload: { samples: new ArrayBuffer(1024), start: 0, end: 1024, wholeLength: 2048 } },
        { type: 'EXT_RELOAD' }
      ];

      messages.forEach(message => {
        const configMatch = isExtConfigMessage(message);
        const dataMatch = isExtDataMessage(message);
        const reloadMatch = isExtReloadMessage(message);
        
        // Exactly one should match
        const matches = [configMatch, dataMatch, reloadMatch].filter(Boolean);
        expect(matches).toHaveLength(1);
      });
    });

    it('should handle all WebviewMessage types', () => {
      const messages: WebviewMessage[] = [
        { type: 'WV_CONFIG' },
        { type: 'WV_DATA', payload: { start: 0, end: 1024 } },
        { type: 'WV_WRITE_WAV', payload: { filename: 'test.wav', samples: new ArrayBuffer(1024) } },
        { type: 'WV_ERROR', payload: { message: 'Test error' } }
      ];

      messages.forEach(message => {
        const configMatch = isWebviewConfigMessage(message);
        const dataMatch = isWebviewDataMessage(message);
        const writeMatch = isWebviewWriteWavMessage(message);
        const errorMatch = isWebviewErrorMessage(message);
        
        // Exactly one should match
        const matches = [configMatch, dataMatch, writeMatch, errorMatch].filter(Boolean);
        expect(matches).toHaveLength(1);
      });
    });
  });
});