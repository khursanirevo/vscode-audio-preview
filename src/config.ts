export interface Config {
  autoAnalyze: boolean;
  playerDefault: PlayerDefault;
  analyzeDefault: AnalyzeDefault;
}

export type PlayerDefault = {
  volumeUnitDb?: boolean;
  initialVolumeDb?: number;
  initialVolume?: number;
  enableSpacekeyPlay?: boolean;
  enableSeekToPlay?: boolean;
  enableHpf?: boolean;
  hpfFrequency?: number;
  enableLpf?: boolean;
  lpfFrequency?: number;
  matchFilterFrequencyToSpectrogram?: boolean;
  playbackRate?: number;
};

export type AnalyzeDefault = {
  fftSize?: number;
  windowFunction?: "hann" | "hamming" | "blackman" | "rectangular";
  frequencyScale?: "linear" | "log" | number;
  minFrequency?: number;
  maxFrequency?: number;
  minDb?: number;
  maxDb?: number;
  waveformVisible?: boolean;
  waveformVerticalScale?: number;
  spectrogramVisible?: boolean;
  spectrogramVerticalScale?: number;
  windowSizeIndex?: number;
  melFilterNum?: number;
  minAmplitude?: number;
  maxAmplitude?: number;
  spectrogramAmplitudeRange?: number;
};
