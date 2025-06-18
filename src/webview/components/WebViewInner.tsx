import React, { useEffect } from 'react';
import { usePlayerSettings } from '../hooks/usePlayerSettings';
import { useAnalyzeSettings } from '../hooks/useAnalyzeSettings';
import { PlayerProvider } from '../contexts/PlayerContext';
import { InfoTable, AudioInfo } from './InfoTable';
import { Player } from './Player';
import { SettingTab } from './SettingTab';
import { Analyzer } from './Analyzer';
import { Config } from '../../config';

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
        <SettingTab />
      </div>
      
      <div id="analyzer">
        <Analyzer autoAnalyze={config.autoAnalyze} />
      </div>
    </PlayerProvider>
  );
}