import React, { useRef, useEffect } from 'react';
import { useAnalyzeSettings } from '../../hooks/useAnalyzeSettings';
import { useAnalyze } from '../../hooks/useAnalyze';
import { FrequencyScale } from '../../types';
import './AnalyzeSettings.css';

const WINDOW_SIZE_OPTIONS = [
  { value: 0, label: '256' },
  { value: 1, label: '512' },
  { value: 2, label: '1024' },
  { value: 3, label: '2048' },
  { value: 4, label: '4096' },
  { value: 5, label: '8192' },
  { value: 6, label: '16384' },
  { value: 7, label: '32768' },
];

const FREQUENCY_SCALE_OPTIONS = [
  { value: FrequencyScale.Linear, label: 'Linear' },
  { value: FrequencyScale.Log, label: 'Log' },
  { value: FrequencyScale.Mel, label: 'Mel' },
];

export const AnalyzeSettings: React.FC = () => {
  const {
    waveformVisible,
    setWaveformVisible,
    spectrogramVisible,
    setSpectrogramVisible,
    windowSizeIndex,
    setWindowSizeIndex,
    frequencyScale,
    setFrequencyScale,
    melFilterNum,
    setMelFilterNum,
    minFrequency,
    setMinFrequency,
    maxFrequency,
    setMaxFrequency,
    minTime,
    setMinTime,
    maxTime,
    setMaxTime,
    minAmplitude,
    setMinAmplitude,
    maxAmplitude,
    setMaxAmplitude,
    spectrogramAmplitudeRange,
    setSpectrogramAmplitudeRange,
  } = useAnalyzeSettings();

  const { getSpectrogramColor } = useAnalyze();

  const colorCanvasRef = useRef<HTMLCanvasElement>(null);
  const colorAxisCanvasRef = useRef<HTMLCanvasElement>(null);

  const updateColorBar = () => {
    const colorCanvas = colorCanvasRef.current;
    const colorAxisCanvas = colorAxisCanvasRef.current;
    
    if (!colorCanvas || !colorAxisCanvas || !getSpectrogramColor) return;

    const colorContext = colorCanvas.getContext('2d', { alpha: false });
    const colorAxisContext = colorAxisCanvas.getContext('2d', { alpha: false });
    
    if (!colorContext || !colorAxisContext) return;

    // Clear axis label
    colorAxisContext.clearRect(0, 0, colorAxisCanvas.width, colorAxisCanvas.height);
    
    // Draw axis label
    colorAxisContext.font = '15px Arial';
    colorAxisContext.fillStyle = 'white';
    for (let i = 0; i < 10; i++) {
      const amp = (i * spectrogramAmplitudeRange) / 10;
      const x = (i * colorAxisCanvas.width) / 10;
      colorAxisContext.fillText(`${amp} dB`, x, colorAxisCanvas.height);
    }
    
    // Draw color
    for (let i = 0; i < 100; i++) {
      const amp = (i * spectrogramAmplitudeRange) / 100;
      const x = (i * colorCanvas.width) / 100;
      colorContext.fillStyle = getSpectrogramColor(amp, spectrogramAmplitudeRange);
      colorContext.fillRect(x, 0, colorCanvas.width / 100, colorCanvas.height);
    }
  };

  useEffect(() => {
    updateColorBar();
  }, [spectrogramAmplitudeRange, getSpectrogramColor]);

  return (
    <div className="analyzeSetting">
      <h3>Common Settings</h3>
      <div>
        time range:
        <input
          className="analyzeSetting__input"
          type="number"
          step="0.1"
          value={minTime}
          onChange={(e) => setMinTime(Number(e.target.value))}
        />
        s ~
        <input
          className="analyzeSetting__input"
          type="number"
          step="0.1"
          value={maxTime}
          onChange={(e) => setMaxTime(Number(e.target.value))}
        />
        s
      </div>

      <h3>WaveForm Settings</h3>
      <div>
        <input
          type="checkbox"
          checked={waveformVisible}
          onChange={(e) => setWaveformVisible(e.target.checked)}
        />
        visible
      </div>
      <div>
        waveform amplitude range:
        <input
          className="analyzeSetting__input"
          type="number"
          step="0.1"
          value={minAmplitude}
          onChange={(e) => setMinAmplitude(Number(e.target.value))}
        />
        {' '}~{' '}
        <input
          className="analyzeSetting__input"
          type="number"
          step="0.1"
          value={maxAmplitude}
          onChange={(e) => setMaxAmplitude(Number(e.target.value))}
        />
      </div>

      <h3>Spectrogram Settings</h3>
      <div>
        <input
          type="checkbox"
          checked={spectrogramVisible}
          onChange={(e) => setSpectrogramVisible(e.target.checked)}
        />
        visible
      </div>
      <div>
        window size:
        <select
          className="analyzeSetting__select"
          value={windowSizeIndex}
          onChange={(e) => setWindowSizeIndex(Number(e.target.value))}
        >
          {WINDOW_SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        frequency scale:
        <select
          className="analyzeSetting__select"
          value={frequencyScale}
          onChange={(e) => setFrequencyScale(Number(e.target.value))}
        >
          {FREQUENCY_SCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        mel filter num:
        <input
          className="analyzeSetting__input"
          type="number"
          step="10"
          value={melFilterNum}
          onChange={(e) => setMelFilterNum(Number(e.target.value))}
        />
      </div>
      <div>
        frequency range:
        <input
          className="analyzeSetting__input"
          type="number"
          step="1000"
          value={minFrequency}
          onChange={(e) => setMinFrequency(Number(e.target.value))}
        />
        Hz ~
        <input
          className="analyzeSetting__input"
          type="number"
          step="1000"
          value={maxFrequency}
          onChange={(e) => setMaxFrequency(Number(e.target.value))}
        />
        Hz
      </div>
      <div>
        <div>
          spectrogram amplitude range:
          <input
            className="analyzeSetting__input"
            type="number"
            step="10"
            value={spectrogramAmplitudeRange}
            onChange={(e) => setSpectrogramAmplitudeRange(Number(e.target.value))}
          />
          dB ~ 0 dB
        </div>
        <div>
          color:
          <canvas
            ref={colorAxisCanvasRef}
            className="analyzeSetting__canvas"
            width="800"
            height="40"
          />
          <canvas
            ref={colorCanvasRef}
            className="analyzeSetting__canvas"
            width="100"
            height="5"
          />
        </div>
      </div>
    </div>
  );
};