import React, { useEffect } from 'react';
import { usePlayerSettings } from '../../hooks/usePlayerSettings';
import { useAnalyzeSettings } from '../../hooks/useAnalyzeSettings';
import { PlayerProvider } from '../../contexts/PlayerContext';
import { InfoTable, AudioInfo } from './InfoTable';
import { Player } from './Player';
import { Config } from '../../../config';

interface WebViewInnerProps {
  config: Config;
  audioContext: AudioContext;
  audioBuffer: AudioBuffer;
  audioInfo: AudioInfo | null;
}

export function WebViewInner({ config, audioContext, audioBuffer, audioInfo }: WebViewInnerProps) {
  const playerSettings = usePlayerSettings();
  const analyzeSettings = useAnalyzeSettings();

  // Initialize settings from config
  useEffect(() => {
    if (config.playerDefault && audioBuffer) {
      playerSettings.initializeFromDefault(config.playerDefault, audioBuffer);
    }
  }, [config.playerDefault, audioBuffer, playerSettings]);

  useEffect(() => {
    if (config.analyzeDefault && audioBuffer) {
      analyzeSettings.initializeFromDefault(config.analyzeDefault, audioBuffer);
    }
  }, [config.analyzeDefault, audioBuffer, analyzeSettings]);

  return (
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
  );
}