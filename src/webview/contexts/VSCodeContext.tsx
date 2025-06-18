import React, { createContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { ExtMessage, ExtMessageType, WebviewMessage, WebviewMessageType, PostMessage } from '../../message';
import { Config } from '../../config';
import { EventType } from '../events';
import Decoder from '../decoder';
import createAudioContext from '../createAudioContext';

export interface vscode {
  postMessage(message: WebviewMessage): void;
}

declare function acquireVsCodeApi(): vscode;

export interface VSCodeContextType {
  postMessage: PostMessage;
  config: Config | null;
  fileData: Uint8Array | null;
  audioBuffer: AudioBuffer | null;
  isLoading: boolean;
  error: string | null;
}

const VSCodeContext = createContext<VSCodeContextType | undefined>(undefined);

export { VSCodeContext };

export interface VSCodeProviderProps {
  children: ReactNode;
}

export function VSCodeProvider({ children }: VSCodeProviderProps) {
  const [config, setConfig] = useState<Config | null>(null);
  const [fileData, setFileData] = useState<Uint8Array | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize VS Code API
  const vscode = acquireVsCodeApi();

  const postMessage = useCallback<PostMessage>((message: WebviewMessage) => {
    vscode.postMessage(message);
  }, [vscode]);

  // Handle messages from extension
  const handleMessage = useCallback((event: MessageEvent<ExtMessage>) => {
    const msg = event.data;
    
    switch (msg.type) {
      case ExtMessageType.CONFIG:
        if (ExtMessageType.isCONFIG(msg)) {
          setConfig(msg.data);
          // Request initial data
          postMessage({
            type: WebviewMessageType.DATA,
            data: { start: 0, end: 500000 },
          });
        }
        break;

      case ExtMessageType.DATA:
        if (ExtMessageType.isDATA(msg)) {
          // Initialize fileData if first chunk
          if (!fileData) {
            console.log('start receiving data');
            setFileData(new Uint8Array(msg.data.wholeLength));
          }

          // Update fileData with new chunk
          console.log(
            `received data: ${msg.data.start} ~ ${msg.data.end} / ${msg.data.wholeLength}`
          );
          const samples = new Uint8Array(msg.data.samples);
          setFileData(currentData => {
            if (currentData) {
              currentData.set(samples, msg.data.start);
              return new Uint8Array(currentData); // Create new instance to trigger re-render
            }
            return currentData;
          });

          // Request next chunk if not complete
          if (msg.data.end < msg.data.wholeLength) {
            postMessage({
              type: WebviewMessageType.DATA,
              data: { start: msg.data.end, end: msg.data.end + 3000000 },
            });
          } else {
            console.log('finish receiving data');
            setIsLoading(false);
          }
        }
        break;

      case ExtMessageType.RELOAD:
        // Reset state for reload
        setConfig(null);
        setFileData(null);
        setIsLoading(true);
        setError(null);
        postMessage({ type: WebviewMessageType.CONFIG });
        break;

      default:
        console.warn('Unknown message type:', msg);
    }
  }, [postMessage, fileData]);

  // Set up message listener
  useEffect(() => {
    window.addEventListener(EventType.VSCODE_MESSAGE, handleMessage);
    
    // Request initial config
    postMessage({ type: WebviewMessageType.CONFIG });

    return () => {
      window.removeEventListener(EventType.VSCODE_MESSAGE, handleMessage);
    };
  }, [handleMessage, postMessage]);

  // Process file data to create audio buffer
  useEffect(() => {
    if (!fileData || isLoading) return;

    async function processAudio() {
      try {
        console.log('Creating decoder...');
        const decoder = await Decoder.create(fileData);

        // Read header info
        console.log('Reading audio info...');
        decoder.readAudioInfo();

        // Decode audio
        console.log('Decoding audio...');
        decoder.decode();

        // Create audio context and buffer
        console.log('Creating audio context and buffer...');
        const context = createAudioContext(decoder.sampleRate);
        const buffer = context.createBuffer(
          decoder.numChannels,
          decoder.length,
          decoder.sampleRate
        );

        // Copy decoded samples to audio buffer
        for (let ch = 0; ch < decoder.numChannels; ch++) {
          const samples = Float32Array.from(decoder.samples[ch]);
          buffer.copyToChannel(samples, ch);
        }

        setAudioBuffer(buffer);

        // Clean up decoder
        decoder.dispose();
        console.log('Audio processing complete');
      } catch (err) {
        console.error('Error processing audio:', err);
        setError(`Error processing audio: ${err}`);
      }
    }

    processAudio();
  }, [fileData, isLoading]);

  const contextValue: VSCodeContextType = {
    postMessage,
    config,
    fileData,
    audioBuffer,
    isLoading,
    error,
  };

  return (
    <VSCodeContext.Provider value={contextValue}>
      {children}
    </VSCodeContext.Provider>
  );
}

