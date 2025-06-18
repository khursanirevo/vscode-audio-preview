import React, { createContext, useReducer, useCallback, ReactNode } from 'react';
import { PlayerDefault } from '../../config';
import { getValueInRange, getLimitedValueInRange } from '../../util';

export interface PlayerSettingsState {
  sampleRate: number;
  volumeUnitDb: boolean;
  initialVolumeDb: number;
  initialVolume: number;
  enableSpacekeyPlay: boolean;
  enableSeekToPlay: boolean;
  enableHpf: boolean;
  hpfFrequency: number;
  enableLpf: boolean;
  lpfFrequency: number;
  matchFilterFrequencyToSpectrogram: boolean;
}

export type PlayerSettingsAction =
  | { type: 'SET_SAMPLE_RATE'; payload: number }
  | { type: 'SET_VOLUME_UNIT_DB'; payload: boolean }
  | { type: 'SET_INITIAL_VOLUME_DB'; payload: number }
  | { type: 'SET_INITIAL_VOLUME'; payload: number }
  | { type: 'SET_ENABLE_SPACEKEY_PLAY'; payload: boolean }
  | { type: 'SET_ENABLE_SEEK_TO_PLAY'; payload: boolean }
  | { type: 'SET_ENABLE_HPF'; payload: boolean }
  | { type: 'SET_HPF_FREQUENCY'; payload: number }
  | { type: 'SET_ENABLE_LPF'; payload: boolean }
  | { type: 'SET_LPF_FREQUENCY'; payload: number }
  | { type: 'SET_MATCH_FILTER_FREQUENCY_TO_SPECTROGRAM'; payload: boolean }
  | { type: 'INITIALIZE_FROM_DEFAULT'; payload: { defaultSetting: PlayerDefault; audioBuffer: AudioBuffer } };

export interface PlayerSettingsContextType extends PlayerSettingsState {
  setVolumeUnitDb: (value: boolean) => void;
  setInitialVolumeDb: (value: number) => void;
  setInitialVolume: (value: number) => void;
  setEnableSpacekeyPlay: (value: boolean) => void;
  setEnableSeekToPlay: (value: boolean) => void;
  setEnableHpf: (value: boolean) => void;
  setHpfFrequency: (value: number) => void;
  setEnableLpf: (value: boolean) => void;
  setLpfFrequency: (value: number) => void;
  setMatchFilterFrequencyToSpectrogram: (value: boolean) => void;
  initializeFromDefault: (defaultSetting: PlayerDefault, audioBuffer: AudioBuffer) => void;
}

// Constants
export const VOLUME_DB_MAX = 0.0;
export const VOLUME_DB_MIN = -80.0;
export const VOLUME_MAX = 100;
export const VOLUME_MIN = 0;
export const FILTER_FREQUENCY_MIN = 10;
export const FILTER_FREQUENCY_HPF_DEFAULT = 100;
export const FILTER_FREQUENCY_LPF_DEFAULT = 10000;

function playerSettingsReducer(state: PlayerSettingsState, action: PlayerSettingsAction): PlayerSettingsState {
  switch (action.type) {
    case 'SET_SAMPLE_RATE':
      return { ...state, sampleRate: action.payload };
    
    case 'SET_VOLUME_UNIT_DB':
      return { ...state, volumeUnitDb: action.payload ?? false };
    
    case 'SET_INITIAL_VOLUME_DB':
      return {
        ...state,
        initialVolumeDb: getValueInRange(
          action.payload,
          VOLUME_DB_MIN,
          VOLUME_DB_MAX,
          VOLUME_DB_MAX
        ),
      };
    
    case 'SET_INITIAL_VOLUME':
      return {
        ...state,
        initialVolume: getValueInRange(
          action.payload,
          VOLUME_MIN,
          VOLUME_MAX,
          VOLUME_MAX
        ),
      };
    
    case 'SET_ENABLE_SPACEKEY_PLAY':
      return { ...state, enableSpacekeyPlay: action.payload ?? true };
    
    case 'SET_ENABLE_SEEK_TO_PLAY':
      return { ...state, enableSeekToPlay: action.payload ?? true };
    
    case 'SET_ENABLE_HPF':
      return { ...state, enableHpf: action.payload ?? false };
    
    case 'SET_HPF_FREQUENCY':
      return {
        ...state,
        hpfFrequency: getLimitedValueInRange(
          action.payload,
          FILTER_FREQUENCY_MIN,
          state.sampleRate / 2,
          FILTER_FREQUENCY_HPF_DEFAULT
        ),
      };
    
    case 'SET_ENABLE_LPF':
      return { ...state, enableLpf: action.payload ?? false };
    
    case 'SET_LPF_FREQUENCY':
      return {
        ...state,
        lpfFrequency: getLimitedValueInRange(
          action.payload,
          FILTER_FREQUENCY_MIN,
          state.sampleRate / 2,
          FILTER_FREQUENCY_LPF_DEFAULT
        ),
      };
    
    case 'SET_MATCH_FILTER_FREQUENCY_TO_SPECTROGRAM':
      return { ...state, matchFilterFrequencyToSpectrogram: action.payload ?? false };
    
    case 'INITIALIZE_FROM_DEFAULT':
      const { defaultSetting, audioBuffer } = action.payload;
      return {
        ...state,
        sampleRate: audioBuffer.sampleRate,
        volumeUnitDb: defaultSetting.volumeUnitDb ?? false,
        initialVolumeDb: getValueInRange(
          defaultSetting.initialVolumeDb,
          VOLUME_DB_MIN,
          VOLUME_DB_MAX,
          VOLUME_DB_MAX
        ),
        initialVolume: getValueInRange(
          defaultSetting.initialVolume,
          VOLUME_MIN,
          VOLUME_MAX,
          VOLUME_MAX
        ),
        enableSpacekeyPlay: defaultSetting.enableSpacekeyPlay ?? true,
        enableSeekToPlay: defaultSetting.enableSeekToPlay ?? true,
        enableHpf: defaultSetting.enableHpf ?? false,
        hpfFrequency: getLimitedValueInRange(
          defaultSetting.hpfFrequency,
          FILTER_FREQUENCY_MIN,
          audioBuffer.sampleRate / 2,
          FILTER_FREQUENCY_HPF_DEFAULT
        ),
        enableLpf: defaultSetting.enableLpf ?? false,
        lpfFrequency: getLimitedValueInRange(
          defaultSetting.lpfFrequency,
          FILTER_FREQUENCY_MIN,
          audioBuffer.sampleRate / 2,
          FILTER_FREQUENCY_LPF_DEFAULT
        ),
        matchFilterFrequencyToSpectrogram: defaultSetting.matchFilterFrequencyToSpectrogram ?? false,
      };
    
    default:
      return state;
  }
}

const initialState: PlayerSettingsState = {
  sampleRate: 44100,
  volumeUnitDb: false,
  initialVolumeDb: VOLUME_DB_MAX,
  initialVolume: VOLUME_MAX,
  enableSpacekeyPlay: true,
  enableSeekToPlay: true,
  enableHpf: false,
  hpfFrequency: FILTER_FREQUENCY_HPF_DEFAULT,
  enableLpf: false,
  lpfFrequency: FILTER_FREQUENCY_LPF_DEFAULT,
  matchFilterFrequencyToSpectrogram: false,
};

const PlayerSettingsContext = createContext<PlayerSettingsContextType | undefined>(undefined);

export { PlayerSettingsContext };

export interface PlayerSettingsProviderProps {
  children: ReactNode;
}

export function PlayerSettingsProvider({ children }: PlayerSettingsProviderProps) {
  const [state, dispatch] = useReducer(playerSettingsReducer, initialState);

  const setVolumeUnitDb = useCallback((value: boolean) => {
    dispatch({ type: 'SET_VOLUME_UNIT_DB', payload: value });
  }, []);

  const setInitialVolumeDb = useCallback((value: number) => {
    dispatch({ type: 'SET_INITIAL_VOLUME_DB', payload: value });
  }, []);

  const setInitialVolume = useCallback((value: number) => {
    dispatch({ type: 'SET_INITIAL_VOLUME', payload: value });
  }, []);

  const setEnableSpacekeyPlay = useCallback((value: boolean) => {
    dispatch({ type: 'SET_ENABLE_SPACEKEY_PLAY', payload: value });
  }, []);

  const setEnableSeekToPlay = useCallback((value: boolean) => {
    dispatch({ type: 'SET_ENABLE_SEEK_TO_PLAY', payload: value });
  }, []);

  const setEnableHpf = useCallback((value: boolean) => {
    dispatch({ type: 'SET_ENABLE_HPF', payload: value });
  }, []);

  const setHpfFrequency = useCallback((value: number) => {
    dispatch({ type: 'SET_HPF_FREQUENCY', payload: value });
  }, []);

  const setEnableLpf = useCallback((value: boolean) => {
    dispatch({ type: 'SET_ENABLE_LPF', payload: value });
  }, []);

  const setLpfFrequency = useCallback((value: number) => {
    dispatch({ type: 'SET_LPF_FREQUENCY', payload: value });
  }, []);

  const setMatchFilterFrequencyToSpectrogram = useCallback((value: boolean) => {
    dispatch({ type: 'SET_MATCH_FILTER_FREQUENCY_TO_SPECTROGRAM', payload: value });
  }, []);

  const initializeFromDefault = useCallback((defaultSetting: PlayerDefault, audioBuffer: AudioBuffer) => {
    dispatch({ type: 'INITIALIZE_FROM_DEFAULT', payload: { defaultSetting, audioBuffer } });
  }, []);

  const contextValue: PlayerSettingsContextType = {
    ...state,
    setVolumeUnitDb,
    setInitialVolumeDb,
    setInitialVolume,
    setEnableSpacekeyPlay,
    setEnableSeekToPlay,
    setEnableHpf,
    setHpfFrequency,
    setEnableLpf,
    setLpfFrequency,
    setMatchFilterFrequencyToSpectrogram,
    initializeFromDefault,
  };

  return (
    <PlayerSettingsContext.Provider value={contextValue}>
      {children}
    </PlayerSettingsContext.Provider>
  );
}