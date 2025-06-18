import React, { createContext, useReducer, useCallback, useEffect, useRef, ReactNode } from 'react';
import { usePlayerSettings } from '../hooks/usePlayerSettings';

export interface PlayerState {
  isPlaying: boolean;
  currentSec: number;
  volume: number;
  seekbarValue: number;
}

export type PlayerAction =
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_CURRENT_SEC'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_SEEKBAR_VALUE'; payload: number }
  | { type: 'UPDATE_SEEKBAR'; payload: { value: number; pos: number } }
  | { type: 'RESET' };

export interface PlayerContextType extends PlayerState {
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  onSeekbarInput: (value: number) => void;
  seekbarPercent: number;
  setSeekbarPercent: (value: number) => void;
}

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    
    case 'SET_CURRENT_SEC':
      return { ...state, currentSec: action.payload };
    
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    
    case 'SET_SEEKBAR_VALUE':
      return { ...state, seekbarValue: action.payload };
    
    case 'UPDATE_SEEKBAR':
      return { 
        ...state, 
        seekbarValue: action.payload.value,
        currentSec: action.payload.pos 
      };
    
    case 'RESET':
      return {
        isPlaying: false,
        currentSec: 0,
        volume: 1,
        seekbarValue: 0,
      };
    
    default:
      return state;
  }
}

const initialState: PlayerState = {
  isPlaying: false,
  currentSec: 0,
  volume: 1,
  seekbarValue: 0,
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export { PlayerContext };

export interface PlayerProviderProps {
  audioContext: AudioContext;
  audioBuffer: AudioBuffer;
  children: ReactNode;
}

export function PlayerProvider({ audioContext, audioBuffer, children }: PlayerProviderProps) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const playerSettings = usePlayerSettings();
  
  // Audio nodes refs
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const hpfNodeRef = useRef<BiquadFilterNode | null>(null);
  const lpfNodeRef = useRef<BiquadFilterNode | null>(null);
  const lastStartAcTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number>(0);

  // Initialize audio nodes
  useEffect(() => {
    // Initialize gain node
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    // Initialize high-pass filter
    const hpfNode = audioContext.createBiquadFilter();
    hpfNode.type = 'highpass';
    hpfNode.Q.value = Math.SQRT1_2; // butterworth
    hpfNodeRef.current = hpfNode;

    // Initialize low-pass filter
    const lpfNode = audioContext.createBiquadFilter();
    lpfNode.type = 'lowpass';
    lpfNode.Q.value = Math.SQRT1_2; // butterworth
    lpfNodeRef.current = lpfNode;

    return () => {
      // Cleanup audio nodes
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      gainNode.disconnect();
      hpfNode.disconnect();
      lpfNode.disconnect();
    };
  }, [audioContext]);

  // Update volume when gain node is available
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = state.volume;
    }
  }, [state.volume]);

  // Animation frame tick function
  const tick = useCallback(() => {
    if (!audioBuffer || !state.isPlaying) return;

    const current = state.currentSec + audioContext.currentTime - lastStartAcTimeRef.current;
    const seekbarValue = (100 * current) / audioBuffer.duration;

    dispatch({ 
      type: 'UPDATE_SEEKBAR', 
      payload: { value: seekbarValue, pos: current } 
    });

    // Pause if finished playing
    if (current > audioBuffer.duration) {
      pause();
      dispatch({ type: 'SET_CURRENT_SEC', payload: 0 });
      dispatch({ type: 'SET_SEEKBAR_VALUE', payload: 0 });
      return;
    }

    if (state.isPlaying) {
      animationFrameIdRef.current = requestAnimationFrame(tick);
    }
  }, [state.isPlaying, state.currentSec, audioContext, audioBuffer]);

  const play = useCallback(() => {
    if (!audioBuffer || !gainNodeRef.current || !hpfNodeRef.current || !lpfNodeRef.current) {
      return;
    }

    // Connect nodes
    let lastNode = gainNodeRef.current;

    lpfNodeRef.current.disconnect();
    if (playerSettings.enableLpf) {
      lpfNodeRef.current.frequency.value = playerSettings.lpfFrequency;
      lpfNodeRef.current.connect(lastNode);
      lastNode = lpfNodeRef.current;
    }

    hpfNodeRef.current.disconnect();
    if (playerSettings.enableHpf) {
      hpfNodeRef.current.frequency.value = playerSettings.hpfFrequency;
      hpfNodeRef.current.connect(lastNode);
      lastNode = hpfNodeRef.current;
    }

    // Create new audio buffer source node
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(lastNode);
    sourceRef.current = source;

    // Start playing
    dispatch({ type: 'SET_PLAYING', payload: true });
    lastStartAcTimeRef.current = audioContext.currentTime;
    source.start(audioContext.currentTime, state.currentSec);

    // Start animation frame updates
    animationFrameIdRef.current = requestAnimationFrame(tick);
  }, [
    audioContext, 
    audioBuffer, 
    state.currentSec, 
    playerSettings.enableHpf,
    playerSettings.hpfFrequency,
    playerSettings.enableLpf,
    playerSettings.lpfFrequency,
    tick
  ]);

  const pause = useCallback(() => {
    if (!sourceRef.current) return;

    // Stop animation frame
    cancelAnimationFrame(animationFrameIdRef.current);

    // Stop audio source
    sourceRef.current.stop();
    const newCurrentSec = state.currentSec + audioContext.currentTime - lastStartAcTimeRef.current;
    dispatch({ type: 'SET_CURRENT_SEC', payload: newCurrentSec });
    dispatch({ type: 'SET_PLAYING', payload: false });
    sourceRef.current = null;
  }, [state.currentSec, audioContext]);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
  }, []);

  const onSeekbarInput = useCallback((value: number) => {
    if (!audioBuffer) return;

    const resumeRequired = state.isPlaying;

    if (state.isPlaying) {
      pause();
    }

    // Update seek position
    const newCurrentSec = (value * audioBuffer.duration) / 100;
    dispatch({ type: 'SET_CURRENT_SEC', payload: newCurrentSec });
    dispatch({ type: 'SET_SEEKBAR_VALUE', payload: value });

    // Restart from selected position if needed
    if (resumeRequired || playerSettings.enableSeekToPlay) {
      // We need to delay the play call to allow state to update
      setTimeout(() => play(), 0);
    }
  }, [audioBuffer, state.isPlaying, playerSettings.enableSeekToPlay, pause, play]);

  // Handle filter setting changes
  useEffect(() => {
    if (state.isPlaying) {
      pause();
      setTimeout(() => play(), 0);
    }
  }, [
    playerSettings.enableHpf,
    playerSettings.hpfFrequency,
    playerSettings.enableLpf,
    playerSettings.lpfFrequency,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isPlaying) {
        pause();
      }
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  const setSeekbarPercent = useCallback((value: number) => {
    onSeekbarInput(value);
  }, [onSeekbarInput]);

  const contextValue: PlayerContextType = {
    ...state,
    play,
    pause,
    setVolume,
    onSeekbarInput,
    seekbarPercent: state.seekbarValue,
    setSeekbarPercent,
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
}