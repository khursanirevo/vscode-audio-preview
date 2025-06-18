import React, { useEffect, useState, useCallback } from 'react';
import { VSCodeProvider } from '../../contexts/VSCodeContext';
import { useVSCode } from '../../hooks/useVSCode';
import { PlayerSettingsProvider } from '../../contexts/PlayerSettingsContext';
import { PlayerProvider } from '../../contexts/PlayerContext';
import { InfoTable, AudioInfo } from './InfoTable';
import { Player } from './Player';
import Decoder from '../../decoder';

interface WebViewAppProps {
  createAudioContext: (sampleRate: number) => AudioContext;
  createDecoder: (fileData: Uint8Array) => Promise<Decoder>;
}

function WebViewContent({ createAudioContext, createDecoder }: WebViewAppProps) {
  const { config, fileData, isLoading, error } = useVSCode();
  const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process audio data when fileData is ready
  const processAudioData = useCallback(async () => {
    if (!fileData || !config || isProcessing) return;

    setIsProcessing(true);
    try {
      console.log('Creating decoder...');
      const decoder = await createDecoder(fileData);

      // Read header info
      console.log('Reading audio info...');
      decoder.readAudioInfo();
      
      const initialAudioInfo: AudioInfo = {
        numChannels: decoder.numChannels,
        sampleRate: decoder.sampleRate,
        fileSize: decoder.fileSize,
        format: decoder.format,
        encoding: decoder.encoding,
      };
      setAudioInfo(initialAudioInfo);

      // Decode audio
      console.log('Decoding audio...');
      decoder.decode();

      // Add duration info
      const completeAudioInfo: AudioInfo = {
        ...initialAudioInfo,
        duration: decoder.duration,
      };
      setAudioInfo(completeAudioInfo);

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

      setAudioContext(context);
      setAudioBuffer(buffer);

      // Clean up decoder
      decoder.dispose();
      console.log('Audio processing complete');
    } catch (err) {
      console.error('Error processing audio:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [fileData, config, createDecoder, createAudioContext, isProcessing]);

  useEffect(() => {
    processAudioData();
  }, [processAudioData]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!config || !fileData) {
    return <div>Waiting for data...</div>;
  }

  if (isProcessing) {
    return <div>Processing audio...</div>;
  }

  if (!audioContext || !audioBuffer) {
    return <div>Preparing audio...</div>;
  }

  return (
    <PlayerSettingsProvider>
      <PlayerProvider audioContext={audioContext} audioBuffer={audioBuffer}>
        <div id="infoTable">
          <InfoTable audioInfo={audioInfo} />
        </div>
        
        <div id="player">
          <Player />
        </div>
        
        <div id="settingTab">
          {/* TODO: Implement settings component */}
          <div>Settings (TODO)</div>
        </div>
        
        <div id="analyzer">
          {/* TODO: Implement analyzer component */}
          <div>Analyzer (TODO)</div>
        </div>
      </PlayerProvider>
    </PlayerSettingsProvider>
  );
}

export interface WebViewProps {
  createAudioContext: (sampleRate: number) => AudioContext;
  createDecoder: (fileData: Uint8Array) => Promise<Decoder>;
}

export function WebView({ createAudioContext, createDecoder }: WebViewProps) {
  return (
    <VSCodeProvider>
      <WebViewContent 
        createAudioContext={createAudioContext}
        createDecoder={createDecoder}
      />
    </VSCodeProvider>
  );
}