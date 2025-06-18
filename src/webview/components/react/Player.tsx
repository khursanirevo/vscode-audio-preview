import React, { useEffect, useCallback, useState } from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import { usePlayerSettings } from '../../hooks/usePlayerSettings';
import '../player/playerComponent.css';

export function Player() {
  const player = usePlayer();
  const playerSettings = usePlayerSettings();
  const [displayVolume, setDisplayVolume] = useState<string>('100');

  // Update volume display when settings change
  useEffect(() => {
    if (playerSettings.state.volumeUnitDb) {
      setDisplayVolume(playerSettings.state.initialVolumeDb.toFixed(1));
    } else {
      setDisplayVolume(playerSettings.state.initialVolume.toString());
    }
  }, [playerSettings.state.volumeUnitDb, playerSettings.state.initialVolumeDb, playerSettings.state.initialVolume]);

  // Handle play/pause button click
  const handlePlayPause = useCallback(() => {
    if (player.state.isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  // Handle volume change
  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    
    if (playerSettings.state.volumeUnitDb) {
      // Convert dB setting to linear gain
      // -80 dB is treated as mute
      const voldb = value;
      const vollin = voldb === -80 ? 0 : Math.pow(10, voldb / 20);
      player.setVolume(vollin);
      setDisplayVolume(vollin === 0 ? 'muted' : voldb.toFixed(1) + ' dB');
    } else {
      // Convert seekbar value(0~100) to volume(0~1)
      player.setVolume(value / 100);
      setDisplayVolume(value.toString());
    }
  }, [player, playerSettings.state.volumeUnitDb]);

  // Handle seek bar input
  const handleSeekbarInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    player.onSeekbarInput(value);
    // Reset the input value to 100 to handle duplicate inputs
    event.target.value = '100';
  }, [player]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!playerSettings.state.enableSpacekeyPlay) {
      return undefined; // No cleanup needed
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.code !== 'Space') {
        return;
      }
      event.preventDefault();
      handlePlayPause();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playerSettings.state.enableSpacekeyPlay, handlePlayPause]);

  // Volume bar configuration
  const volumeBarProps = playerSettings.state.volumeUnitDb
    ? {
        value: playerSettings.state.initialVolumeDb,
        min: -80,
        max: 0,
        step: 0.5,
      }
    : {
        value: playerSettings.state.initialVolume,
        min: 0,
        max: 100,
        step: 1,
      };

  return (
    <div className="playerComponent">
      <button 
        className="playButton"
        onClick={handlePlayPause}
        style={{ display: 'block' }}
      >
        {player.state.isPlaying ? 'pause' : 'play'}
      </button>

      <div className="volumeText">
        volume {displayVolume}
      </div>
      <input
        type="range"
        className="volumeBar"
        {...volumeBarProps}
        onChange={handleVolumeChange}
      />

      <div className="seekPosText">
        position {player.state.currentSec.toFixed(3)} s
      </div>
      
      <div className="seekBarBox">
        <input
          type="range"
          className="seekBar"
          value={player.state.seekbarValue}
          min={0}
          max={100}
          readOnly
        />
        <input
          type="range"
          className="userInputSeekBar inputSeekBar"
          defaultValue={100}
          min={0}
          max={100}
          onChange={handleSeekbarInput}
        />
      </div>
    </div>
  );
}