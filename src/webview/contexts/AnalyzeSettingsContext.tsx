import React, { createContext, useReducer, useCallback, ReactNode } from 'react';
import { AnalyzeDefault } from '../../config';
import { getRangeValues, getValueInEnum, getValueInRange } from '../../util';

export enum WindowSizeIndex {
  W256 = 0,
  W512 = 1,
  W1024 = 2,
  W2048 = 3,
  W4096 = 4,
  W8192 = 5,
  W16384 = 6,
  W32768 = 7,
}

export enum FrequencyScale {
  Linear = 0,
  Log = 1,
  Mel = 2,
}

export interface AnalyzeSettingsState {
  sampleRate: number;
  duration: number;
  minAmplitudeOfAudioBuffer: number;
  maxAmplitudeOfAudioBuffer: number;
  autoCalcHopSize: boolean;
  waveformVisible: boolean;
  waveformVerticalScale: number;
  spectrogramVisible: boolean;
  spectrogramVerticalScale: number;
  windowSizeIndex: number;
  windowSize: number;
  hopSize: number;
  minFrequency: number;
  maxFrequency: number;
  minTime: number;
  maxTime: number;
  minAmplitude: number;
  maxAmplitude: number;
  spectrogramAmplitudeRange: number;
  frequencyScale: FrequencyScale;
  melFilterNum: number;
}

export interface AnalyzeSettingsProps {
  waveformVerticalScale: number;
  spectrogramVerticalScale: number;
  windowSize: number;
  hopSize: number;
  minFrequency: number;
  maxFrequency: number;
  minTime: number;
  maxTime: number;
  minAmplitude: number;
  maxAmplitude: number;
  spectrogramAmplitudeRange: number;
  frequencyScale: number;
  melFilterNum: number;
}

export type AnalyzeSettingsAction =
  | { type: 'SET_AUTO_CALC_HOP_SIZE'; payload: boolean }
  | { type: 'SET_WAVEFORM_VISIBLE'; payload: boolean }
  | { type: 'SET_WAVEFORM_VERTICAL_SCALE'; payload: number }
  | { type: 'SET_SPECTROGRAM_VISIBLE'; payload: boolean }
  | { type: 'SET_SPECTROGRAM_VERTICAL_SCALE'; payload: number }
  | { type: 'SET_WINDOW_SIZE_INDEX'; payload: number }
  | { type: 'SET_MIN_FREQUENCY'; payload: number }
  | { type: 'SET_MAX_FREQUENCY'; payload: number }
  | { type: 'SET_MIN_TIME'; payload: number }
  | { type: 'SET_MAX_TIME'; payload: number }
  | { type: 'SET_MIN_AMPLITUDE'; payload: number }
  | { type: 'SET_MAX_AMPLITUDE'; payload: number }
  | { type: 'SET_SPECTROGRAM_AMPLITUDE_RANGE'; payload: number }
  | { type: 'SET_FREQUENCY_SCALE'; payload: FrequencyScale }
  | { type: 'SET_MEL_FILTER_NUM'; payload: number }
  | { type: 'RESET_TO_DEFAULT_TIME_RANGE' }
  | { type: 'RESET_TO_DEFAULT_AMPLITUDE_RANGE'; payload: AnalyzeDefault }
  | { type: 'RESET_TO_DEFAULT_FREQUENCY_RANGE'; payload: AnalyzeDefault }
  | { type: 'INITIALIZE_FROM_DEFAULT'; payload: { defaultSetting: AnalyzeDefault; audioBuffer: AudioBuffer } };

export interface AnalyzeSettingsContextType {
  state: AnalyzeSettingsState;
  setAutoCalcHopSize: (value: boolean) => void;
  setWaveformVisible: (value: boolean) => void;
  setWaveformVerticalScale: (value: number) => void;
  setSpectrogramVisible: (value: boolean) => void;
  setSpectrogramVerticalScale: (value: number) => void;
  setWindowSizeIndex: (value: number) => void;
  setMinFrequency: (value: number) => void;
  setMaxFrequency: (value: number) => void;
  setMinTime: (value: number) => void;
  setMaxTime: (value: number) => void;
  setMinAmplitude: (value: number) => void;
  setMaxAmplitude: (value: number) => void;
  setSpectrogramAmplitudeRange: (value: number) => void;
  setFrequencyScale: (value: FrequencyScale) => void;
  setMelFilterNum: (value: number) => void;
  resetToDefaultTimeRange: () => void;
  resetToDefaultAmplitudeRange: (defaultSetting: AnalyzeDefault) => void;
  resetToDefaultFrequencyRange: (defaultSetting: AnalyzeDefault) => void;
  initializeFromDefault: (defaultSetting: AnalyzeDefault, audioBuffer: AudioBuffer) => void;
  toProps: () => AnalyzeSettingsProps;
}

// Constants
export const WAVEFORM_CANVAS_WIDTH = 1000;
export const WAVEFORM_CANVAS_HEIGHT = 200;
export const WAVEFORM_CANVAS_VERTICAL_SCALE_MAX = 2.0;
export const WAVEFORM_CANVAS_VERTICAL_SCALE_MIN = 0.2;
export const SPECTROGRAM_CANVAS_WIDTH = 1800;
export const SPECTROGRAM_CANVAS_HEIGHT = 600;
export const SPECTROGRAM_CANVAS_VERTICAL_SCALE_MAX = 2.0;
export const SPECTROGRAM_CANVAS_VERTICAL_SCALE_MIN = 0.2;

function calcHopSize(state: AnalyzeSettingsState): number {
  const minRectWidth = (2 * state.windowSize) / 1024;
  const fullSampleNum = (state.maxTime - state.minTime) * state.sampleRate;
  const enoughHopSize = Math.trunc(
    (minRectWidth * fullSampleNum) / SPECTROGRAM_CANVAS_WIDTH
  );
  const minHopSize = state.windowSize / 32;
  return Math.max(enoughHopSize, minHopSize);
}

function analyzeSettingsReducer(state: AnalyzeSettingsState, action: AnalyzeSettingsAction): AnalyzeSettingsState {
  switch (action.type) {
    case 'SET_AUTO_CALC_HOP_SIZE':
      return { ...state, autoCalcHopSize: action.payload };
    
    case 'SET_WAVEFORM_VISIBLE':
      return { ...state, waveformVisible: action.payload ?? true };
    
    case 'SET_WAVEFORM_VERTICAL_SCALE':
      return {
        ...state,
        waveformVerticalScale: getValueInRange(
          action.payload,
          WAVEFORM_CANVAS_VERTICAL_SCALE_MIN,
          WAVEFORM_CANVAS_VERTICAL_SCALE_MAX,
          1.0
        ),
      };
    
    case 'SET_SPECTROGRAM_VISIBLE':
      return { ...state, spectrogramVisible: action.payload ?? true };
    
    case 'SET_SPECTROGRAM_VERTICAL_SCALE':
      return {
        ...state,
        spectrogramVerticalScale: getValueInRange(
          action.payload,
          SPECTROGRAM_CANVAS_VERTICAL_SCALE_MIN,
          SPECTROGRAM_CANVAS_VERTICAL_SCALE_MAX,
          1.0
        ),
      };
    
    case 'SET_WINDOW_SIZE_INDEX':
      const windowSizeIndex = getValueInEnum(
        action.payload,
        WindowSizeIndex,
        WindowSizeIndex.W1024
      );
      const windowSize = 2 ** (windowSizeIndex + 8);
      const hopSize = state.autoCalcHopSize ? calcHopSize({ ...state, windowSize }) : state.hopSize;
      return { ...state, windowSizeIndex, windowSize, hopSize };
    
    case 'SET_MIN_FREQUENCY':
      const [minFrequency] = getRangeValues(
        action.payload,
        state.maxFrequency,
        0,
        state.sampleRate / 2,
        0,
        state.sampleRate / 2
      );
      return { ...state, minFrequency };
    
    case 'SET_MAX_FREQUENCY':
      const [, maxFrequency] = getRangeValues(
        state.minFrequency,
        action.payload,
        0,
        state.sampleRate / 2,
        0,
        state.sampleRate / 2
      );
      return { ...state, maxFrequency };
    
    case 'SET_MIN_TIME':
      const [minTime] = getRangeValues(
        action.payload,
        state.maxTime,
        0,
        state.duration,
        0,
        state.duration
      );
      return { ...state, minTime };
    
    case 'SET_MAX_TIME':
      const [, maxTime] = getRangeValues(
        state.minTime,
        action.payload,
        0,
        state.duration,
        0,
        state.duration
      );
      return { ...state, maxTime };
    
    case 'SET_MIN_AMPLITUDE':
      const [minAmplitude] = getRangeValues(
        action.payload,
        state.maxAmplitude,
        -100,
        100,
        state.minAmplitudeOfAudioBuffer,
        state.maxAmplitudeOfAudioBuffer
      );
      return { ...state, minAmplitude };
    
    case 'SET_MAX_AMPLITUDE':
      const [, maxAmplitude] = getRangeValues(
        state.minAmplitude,
        action.payload,
        -100,
        100,
        state.minAmplitudeOfAudioBuffer,
        state.maxAmplitudeOfAudioBuffer
      );
      return { ...state, maxAmplitude };
    
    case 'SET_SPECTROGRAM_AMPLITUDE_RANGE':
      const [spectrogramAmplitudeRange] = getRangeValues(
        action.payload,
        0,
        -1000,
        0,
        -90,
        0
      );
      return { ...state, spectrogramAmplitudeRange };
    
    case 'SET_FREQUENCY_SCALE':
      const frequencyScale = getValueInEnum(
        action.payload,
        FrequencyScale,
        FrequencyScale.Linear
      );
      return { ...state, frequencyScale };
    
    case 'SET_MEL_FILTER_NUM':
      return {
        ...state,
        melFilterNum: getValueInRange(Math.trunc(action.payload), 20, 200, 40),
      };
    
    case 'RESET_TO_DEFAULT_TIME_RANGE':
      return { ...state, minTime: 0, maxTime: state.duration };
    
    case 'RESET_TO_DEFAULT_AMPLITUDE_RANGE':
      return {
        ...state,
        minAmplitude: action.payload.minAmplitude,
        maxAmplitude: action.payload.maxAmplitude,
      };
    
    case 'RESET_TO_DEFAULT_FREQUENCY_RANGE':
      return {
        ...state,
        minFrequency: action.payload.minFrequency,
        maxFrequency: action.payload.maxFrequency,
      };
    
    case 'INITIALIZE_FROM_DEFAULT':
      const { defaultSetting, audioBuffer } = action.payload;
      
      // Calculate min & max amplitude
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const chData = audioBuffer.getChannelData(ch);
        for (let i = 0; i < chData.length; i++) {
          const v = chData[i];
          if (v < min) min = v;
          if (max < v) max = v;
        }
      }
      
      const newWindowSizeIndex = getValueInEnum(
        defaultSetting.windowSizeIndex,
        WindowSizeIndex,
        WindowSizeIndex.W1024
      );
      const newWindowSize = 2 ** (newWindowSizeIndex + 8);
      
      const newState = {
        ...state,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        minAmplitudeOfAudioBuffer: min,
        maxAmplitudeOfAudioBuffer: max,
        waveformVisible: defaultSetting.waveformVisible ?? true,
        waveformVerticalScale: getValueInRange(
          defaultSetting.waveformVerticalScale,
          WAVEFORM_CANVAS_VERTICAL_SCALE_MIN,
          WAVEFORM_CANVAS_VERTICAL_SCALE_MAX,
          1.0
        ),
        spectrogramVisible: defaultSetting.spectrogramVisible ?? true,
        spectrogramVerticalScale: getValueInRange(
          defaultSetting.spectrogramVerticalScale,
          SPECTROGRAM_CANVAS_VERTICAL_SCALE_MIN,
          SPECTROGRAM_CANVAS_VERTICAL_SCALE_MAX,
          1.0
        ),
        windowSizeIndex: newWindowSizeIndex,
        windowSize: newWindowSize,
        frequencyScale: getValueInEnum(
          defaultSetting.frequencyScale,
          FrequencyScale,
          FrequencyScale.Linear
        ),
        melFilterNum: getValueInRange(Math.trunc(defaultSetting.melFilterNum), 20, 200, 40),
        minFrequency: defaultSetting.minFrequency,
        maxFrequency: defaultSetting.maxFrequency,
        minTime: 0,
        maxTime: audioBuffer.duration,
        minAmplitude: defaultSetting.minAmplitude,
        maxAmplitude: defaultSetting.maxAmplitude,
        spectrogramAmplitudeRange: defaultSetting.spectrogramAmplitudeRange,
      };
      
      // Calculate hop size after other values are set
      newState.hopSize = calcHopSize(newState);
      
      return newState;
    
    default:
      return state;
  }
}

const initialState: AnalyzeSettingsState = {
  sampleRate: 44100,
  duration: 0,
  minAmplitudeOfAudioBuffer: -1,
  maxAmplitudeOfAudioBuffer: 1,
  autoCalcHopSize: true,
  waveformVisible: true,
  waveformVerticalScale: 1.0,
  spectrogramVisible: true,
  spectrogramVerticalScale: 1.0,
  windowSizeIndex: WindowSizeIndex.W1024,
  windowSize: 1024,
  hopSize: 256,
  minFrequency: 0,
  maxFrequency: 22050,
  minTime: 0,
  maxTime: 0,
  minAmplitude: -1,
  maxAmplitude: 1,
  spectrogramAmplitudeRange: -90,
  frequencyScale: FrequencyScale.Linear,
  melFilterNum: 40,
};

const AnalyzeSettingsContext = createContext<AnalyzeSettingsContextType | undefined>(undefined);

export { AnalyzeSettingsContext };

export interface AnalyzeSettingsProviderProps {
  children: ReactNode;
}

export function AnalyzeSettingsProvider({ children }: AnalyzeSettingsProviderProps) {
  const [state, dispatch] = useReducer(analyzeSettingsReducer, initialState);

  const setAutoCalcHopSize = useCallback((value: boolean) => {
    dispatch({ type: 'SET_AUTO_CALC_HOP_SIZE', payload: value });
  }, []);

  const setWaveformVisible = useCallback((value: boolean) => {
    dispatch({ type: 'SET_WAVEFORM_VISIBLE', payload: value });
  }, []);

  const setWaveformVerticalScale = useCallback((value: number) => {
    dispatch({ type: 'SET_WAVEFORM_VERTICAL_SCALE', payload: value });
  }, []);

  const setSpectrogramVisible = useCallback((value: boolean) => {
    dispatch({ type: 'SET_SPECTROGRAM_VISIBLE', payload: value });
  }, []);

  const setSpectrogramVerticalScale = useCallback((value: number) => {
    dispatch({ type: 'SET_SPECTROGRAM_VERTICAL_SCALE', payload: value });
  }, []);

  const setWindowSizeIndex = useCallback((value: number) => {
    dispatch({ type: 'SET_WINDOW_SIZE_INDEX', payload: value });
  }, []);

  const setMinFrequency = useCallback((value: number) => {
    dispatch({ type: 'SET_MIN_FREQUENCY', payload: value });
  }, []);

  const setMaxFrequency = useCallback((value: number) => {
    dispatch({ type: 'SET_MAX_FREQUENCY', payload: value });
  }, []);

  const setMinTime = useCallback((value: number) => {
    dispatch({ type: 'SET_MIN_TIME', payload: value });
  }, []);

  const setMaxTime = useCallback((value: number) => {
    dispatch({ type: 'SET_MAX_TIME', payload: value });
  }, []);

  const setMinAmplitude = useCallback((value: number) => {
    dispatch({ type: 'SET_MIN_AMPLITUDE', payload: value });
  }, []);

  const setMaxAmplitude = useCallback((value: number) => {
    dispatch({ type: 'SET_MAX_AMPLITUDE', payload: value });
  }, []);

  const setSpectrogramAmplitudeRange = useCallback((value: number) => {
    dispatch({ type: 'SET_SPECTROGRAM_AMPLITUDE_RANGE', payload: value });
  }, []);

  const setFrequencyScale = useCallback((value: FrequencyScale) => {
    dispatch({ type: 'SET_FREQUENCY_SCALE', payload: value });
  }, []);

  const setMelFilterNum = useCallback((value: number) => {
    dispatch({ type: 'SET_MEL_FILTER_NUM', payload: value });
  }, []);

  const resetToDefaultTimeRange = useCallback(() => {
    dispatch({ type: 'RESET_TO_DEFAULT_TIME_RANGE' });
  }, []);

  const resetToDefaultAmplitudeRange = useCallback((defaultSetting: AnalyzeDefault) => {
    dispatch({ type: 'RESET_TO_DEFAULT_AMPLITUDE_RANGE', payload: defaultSetting });
  }, []);

  const resetToDefaultFrequencyRange = useCallback((defaultSetting: AnalyzeDefault) => {
    dispatch({ type: 'RESET_TO_DEFAULT_FREQUENCY_RANGE', payload: defaultSetting });
  }, []);

  const initializeFromDefault = useCallback((defaultSetting: AnalyzeDefault, audioBuffer: AudioBuffer) => {
    dispatch({ type: 'INITIALIZE_FROM_DEFAULT', payload: { defaultSetting, audioBuffer } });
  }, []);

  const toProps = useCallback((): AnalyzeSettingsProps => {
    return {
      waveformVerticalScale: state.waveformVerticalScale,
      spectrogramVerticalScale: state.spectrogramVerticalScale,
      windowSize: state.windowSize,
      hopSize: state.hopSize,
      minFrequency: state.minFrequency,
      maxFrequency: state.maxFrequency,
      minTime: state.minTime,
      maxTime: state.maxTime,
      minAmplitude: state.minAmplitude,
      maxAmplitude: state.maxAmplitude,
      spectrogramAmplitudeRange: state.spectrogramAmplitudeRange,
      frequencyScale: state.frequencyScale,
      melFilterNum: state.melFilterNum,
    };
  }, [state]);

  const contextValue: AnalyzeSettingsContextType = {
    state,
    setAutoCalcHopSize,
    setWaveformVisible,
    setWaveformVerticalScale,
    setSpectrogramVisible,
    setSpectrogramVerticalScale,
    setWindowSizeIndex,
    setMinFrequency,
    setMaxFrequency,
    setMinTime,
    setMaxTime,
    setMinAmplitude,
    setMaxAmplitude,
    setSpectrogramAmplitudeRange,
    setFrequencyScale,
    setMelFilterNum,
    resetToDefaultTimeRange,
    resetToDefaultAmplitudeRange,
    resetToDefaultFrequencyRange,
    initializeFromDefault,
    toProps,
  };

  return (
    <AnalyzeSettingsContext.Provider value={contextValue}>
      {children}
    </AnalyzeSettingsContext.Provider>
  );
}