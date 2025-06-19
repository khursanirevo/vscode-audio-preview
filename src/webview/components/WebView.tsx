import React from 'react';
import { VSCodeProvider } from '../contexts/VSCodeContext';
import { useVSCode } from '../hooks/useVSCode';
import { PlayerSettingsProvider } from '../contexts/PlayerSettingsContext';
import { PlayerProvider } from '../contexts/PlayerContext';
import { AnalyzeSettingsProvider } from '../contexts/AnalyzeSettingsContext';
import { AnalyzeProvider } from '../contexts/AnalyzeContext';
import { AudioInfo } from './InfoTable';
import { WebViewInner } from './WebViewInner';

function WebViewContent() {
  const { config, audioBuffer, isLoading, error } = useVSCode();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!config || !audioBuffer) {
    return <div>Waiting for audio data...</div>;
  }

  // Create audio info from audio buffer
  const audioInfo: AudioInfo = {
    numChannels: audioBuffer.numberOfChannels,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration,
    // TODO: These values should come from config or extension
    fileSize: 0,
    format: '',
    encoding: '',
  };

  // Create audio context for the player
  const audioContext = new AudioContext({ sampleRate: audioBuffer.sampleRate });

  return (
    <PlayerSettingsProvider>
      <AnalyzeSettingsProvider>
        <AnalyzeProvider>
          <WebViewInner 
            config={config}
            audioContext={audioContext}
            audioBuffer={audioBuffer}
            audioInfo={audioInfo}
          />
        </AnalyzeProvider>
      </AnalyzeSettingsProvider>
    </PlayerSettingsProvider>
  );
}

export function WebView() {
  return (
    <VSCodeProvider>
      <WebViewContent />
    </VSCodeProvider>
  );
}