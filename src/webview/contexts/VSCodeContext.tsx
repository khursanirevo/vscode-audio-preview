import React, { createContext, useCallback, useEffect, useState, useRef, ReactNode } from 'react';
import { ExtMessage, WebviewMessage, PostMessage, isExtConfigMessage, isExtDataMessage, isExtReloadMessage } from '../../messageTypes';
import { Config } from '../../config';
import { EventType } from '../events';
import Decoder from '../decoder';
import createAudioContext from '../createAudioContext';

export interface vscode {
  postMessage(message: WebviewMessage): void;
}

declare function acquireVsCodeApi(): vscode;

// Global variable to ensure VS Code API is only acquired once
let vscodeApiInstance: vscode | null = null;

function getVSCodeApi(): vscode {
  if (!vscodeApiInstance) {
    vscodeApiInstance = acquireVsCodeApi();
  }
  return vscodeApiInstance;
}

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
  const [isDataComplete, setIsDataComplete] = useState(false);
  
  // Use refs to avoid recreating handleMessage
  const fileDataRef = useRef<Uint8Array | null>(null);
  const isLoadingRef = useRef(true);

  // Initialize VS Code API only once
  const [vscode] = useState(() => getVSCodeApi());

  const postMessage = useCallback<PostMessage>((message: WebviewMessage) => {
    vscode.postMessage(message);
  }, [vscode]);

  // Handle messages from extension
  const handleMessage = useCallback((event: MessageEvent<ExtMessage>) => {
    const msg = event.data;
    
    switch (msg.type) {
      case 'EXT_CONFIG':
        if (isExtConfigMessage(msg)) {
          setConfig(msg.payload);
          // Request initial data
          postMessage({
            type: 'WV_DATA',
            payload: { start: 0, end: 500000 },
          });
        }
        break;

      case 'EXT_DATA':
        if (isExtDataMessage(msg)) {
          // Initialize fileData if first chunk
          if (!fileDataRef.current) {
            console.log('start receiving data');
            const newData = new Uint8Array(msg.payload.wholeLength);
            fileDataRef.current = newData;
            setFileData(newData);
          }

          // Update fileData with new chunk
          console.log(
            `received data: ${msg.payload.start} ~ ${msg.payload.end} / ${msg.payload.wholeLength}`
          );
          const samples = new Uint8Array(msg.payload.samples);
          if (fileDataRef.current) {
            fileDataRef.current.set(samples, msg.payload.start);
            // Only update state for first and last chunk to avoid excessive re-renders
            if (msg.payload.start === 0 || msg.payload.end >= msg.payload.wholeLength) {
              setFileData(new Uint8Array(fileDataRef.current));
            }
          }

          // Request next chunk if not complete
          if (msg.payload.end < msg.payload.wholeLength) {
            postMessage({
              type: 'WV_DATA',
              payload: { start: msg.payload.end, end: msg.payload.end + 3000000 },
            });
          } else {
            console.log('finish receiving data');
            isLoadingRef.current = false;
            setIsLoading(false);
            setIsDataComplete(true);
          }
        }
        break;

      case 'EXT_RELOAD':
        // Reset state for reload
        setConfig(null);
        setFileData(null);
        fileDataRef.current = null;
        setIsLoading(true);
        isLoadingRef.current = true;
        setIsDataComplete(false);
        setError(null);
        postMessage({ type: 'WV_CONFIG' });
        break;

      default:
        console.warn('Unknown message type:', msg);
    }
  }, [postMessage]);

  // Set up message listener
  useEffect(() => {
    window.addEventListener(EventType.VSCODE_MESSAGE, handleMessage);
    
    // Request initial config
    postMessage({ type: 'WV_CONFIG' });

    return () => {
      window.removeEventListener(EventType.VSCODE_MESSAGE, handleMessage);
    };
  }, [handleMessage, postMessage]);

  // Process file data to create audio buffer
  useEffect(() => {
    if (!fileDataRef.current || !isDataComplete) return;

    async function processAudio() {
      try {
        console.log('Creating decoder...');
        const decoder = await Decoder.create(fileDataRef.current!);

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
  }, [isDataComplete]);

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

