// Types and enums extracted from services for React components

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

// Canvas size constants
export const canvasSizes = {
  waveformWidth: 1000,
  waveformHeight: 200,
  waveformVerticalScaleMax: 2.0,
  waveformVerticalScaleMin: 0.2,
  spectrogramWidth: 1800,
  spectrogramHeight: 600,
  spectrogramVerticalScaleMax: 2.0,
  spectrogramVerticalScaleMin: 0.2,
} as const;