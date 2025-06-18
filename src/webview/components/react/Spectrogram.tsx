import React, { useRef, useEffect } from 'react';
import { useAnalyze } from '../../hooks/useAnalyze';
import { AnalyzeSettingsProps } from '../../contexts/AnalyzeSettingsContext';
import { FrequencyScale } from '../../types';
import '../../styles/figure.css';

export interface SpectrogramProps {
  width?: number;
  height?: number;
  settings?: AnalyzeSettingsProps;
  sampleRate?: number;
  audioBuffer?: AudioBuffer;
  ch?: number;
  numOfCh?: number;
  channelIndex: number;
  numberOfChannels: number;
}

export function Spectrogram({
  channelIndex,
  numberOfChannels,
}: SpectrogramProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const axisCanvasRef = useRef<HTMLCanvasElement>(null);
  const analyze = useAnalyze();

  // Draw time axis helper
  const drawTimeAxis = (
    axisCanvas: HTMLCanvasElement,
    axisContext: CanvasRenderingContext2D,
    settings: AnalyzeSettingsProps
  ) => {
    axisContext.font = '20px Arial';

    const [niceT, digit] = analyze.roundToNearestNiceNumber(
      (settings.maxTime - settings.minTime) / 10
    );
    const dx = width / (settings.maxTime - settings.minTime);
    const t0 = Math.ceil(settings.minTime / niceT) * niceT;
    const numAxis = Math.floor((settings.maxTime - settings.minTime) / niceT);
    
    for (let i = 0; i <= numAxis; i++) {
      const t = t0 + niceT * i;
      const x = (t - settings.minTime) * dx;

      axisContext.fillStyle = 'rgb(245,130,32)';
      if (width * (5 / 100) < x && x < width * (95 / 100)) {
        axisContext.fillText(`${t.toFixed(digit)}`, x, 18);
      }

      axisContext.fillStyle = 'rgb(180,120,20)';
      for (let j = 0; j < height; j++) {
        axisContext.fillRect(x, j, 1, 1);
      }
    }
  };

  // Draw channel label helper
  const drawChannelLabel = (
    axisContext: CanvasRenderingContext2D,
    ch: number,
    numOfCh: number
  ) => {
    axisContext.font = '20px Arial';

    if (numOfCh > 1) {
      let channelText = '';
      if (numOfCh === 2) {
        channelText = ch === 0 ? 'Lch' : 'Rch';
      } else {
        channelText = 'ch' + String(ch + 1);
      }

      axisContext.fillStyle = 'rgb(220, 220, 220)';
      axisContext.fillText(channelText, 60, 18);
    }
  };

  useEffect(() => {
    const mainCanvas = mainCanvasRef.current;
    const axisCanvas = axisCanvasRef.current;
    if (!mainCanvas || !axisCanvas) return;

    const context = mainCanvas.getContext('2d', { alpha: false });
    const axisContext = axisCanvas.getContext('2d');
    if (!context || !axisContext) return;

    // Clear canvases
    context.clearRect(0, 0, width, height);
    axisContext.clearRect(0, 0, width, height);

    // Adjust settings for log scale if needed
    const adjustedSettings = { ...settings };
    if (settings.frequencyScale === FrequencyScale.Log && settings.minFrequency < 1) {
      adjustedSettings.minFrequency = 1;
    }

    switch (settings.frequencyScale) {
      case FrequencyScale.Linear:
        drawLinearAxis();
        drawLinearSpectrogram();
        break;
      case FrequencyScale.Log:
        drawLogAxis();
        drawLogSpectrogram();
        break;
      case FrequencyScale.Mel:
        drawMelAxis();
        drawMelSpectrogram();
        break;
    }

    // Draw linear axis
    function drawLinearAxis() {
      drawTimeAxis(axisCanvas, axisContext, adjustedSettings);

      axisContext.font = '20px Arial';
      const minFreq = adjustedSettings.minFrequency;
      const maxFreq = adjustedSettings.maxFrequency;
      const scale = (maxFreq - minFreq) / height;
      const numAxes = Math.round(10 * adjustedSettings.spectrogramVerticalScale);
      
      for (let i = 0; i < numAxes; i++) {
        axisContext.fillStyle = 'rgb(245,130,32)';
        const freq = minFreq + (i * (maxFreq - minFreq)) / numAxes;
        const y = height - (freq - minFreq) / scale;
        axisContext.fillText(`${Math.trunc(freq)}`, 4, y - 4);

        axisContext.fillStyle = 'rgb(180,120,20)';
        for (let j = 0; j < width; j++) {
          axisContext.fillRect(j, y, 2, 2);
        }
      }

      drawChannelLabel(axisContext, ch, numOfCh);
    }

    // Draw linear spectrogram
    function drawLinearSpectrogram() {
      const spectrogram = analyze.getSpectrogram(ch, adjustedSettings, audioBuffer);
      const wholeSampleNum = (adjustedSettings.maxTime - adjustedSettings.minTime) * sampleRate;
      const rectWidth = (width * adjustedSettings.hopSize) / wholeSampleNum;
      const rectHeight = height / spectrogram[0].length;

      for (let i = 0; i < spectrogram.length; i++) {
        const x = i * rectWidth;
        for (let j = 0; j < spectrogram[i].length; j++) {
          const y = height - (j + 1) * rectHeight;
          const value = spectrogram[i][j];
          context.fillStyle = analyze.getSpectrogramColor(
            value,
            adjustedSettings.spectrogramAmplitudeRange
          );
          context.fillRect(x, y, rectWidth, rectHeight);
        }
      }
    }

    // Draw log axis
    function drawLogAxis() {
      drawTimeAxis(axisCanvas, axisContext, adjustedSettings);

      axisContext.font = '20px Arial';
      const logMin = Math.log10(adjustedSettings.minFrequency + Number.EPSILON);
      const logMax = Math.log10(adjustedSettings.maxFrequency + Number.EPSILON);
      const scale = (logMax - logMin) / height;
      const numAxes = Math.round(10 * adjustedSettings.spectrogramVerticalScale);
      
      for (let i = 0; i < numAxes; i++) {
        axisContext.fillStyle = 'rgb(245,130,32)';
        const logFreq = logMin + (i * (logMax - logMin)) / numAxes;
        const f = Math.pow(10, logFreq);
        const y = height - (logFreq - logMin) / scale;
        axisContext.fillText(`${Math.trunc(f)}`, 4, y - 4);

        axisContext.fillStyle = 'rgb(180,120,20)';
        for (let j = 0; j < width; j++) {
          axisContext.fillRect(j, y, 2, 2);
        }
      }

      drawChannelLabel(axisContext, ch, numOfCh);
    }

    // Draw log spectrogram
    function drawLogSpectrogram() {
      const spectrogram = analyze.getSpectrogram(ch, adjustedSettings, audioBuffer);
      const wholeSampleNum = (adjustedSettings.maxTime - adjustedSettings.minTime) * sampleRate;
      const rectWidth = (width * adjustedSettings.hopSize) / wholeSampleNum;

      const df = sampleRate / adjustedSettings.windowSize;
      const logMin = Math.log10(adjustedSettings.minFrequency + Number.EPSILON);
      const logMax = Math.log10(adjustedSettings.maxFrequency + Number.EPSILON);
      const scale = (logMax - logMin) / height;

      for (let i = 0; i < spectrogram.length; i++) {
        const x = i * rectWidth;
        for (let j = 0; j < spectrogram[i].length; j++) {
          const freq = j * df;
          const logFreq = Math.log10(freq + Number.EPSILON);
          const logPrevFreq = Math.log10((j - 1) * df + Number.EPSILON);
          const y = height - (logFreq - logMin) / scale;
          const rectHeight = (logFreq - logPrevFreq) / scale;

          const value = spectrogram[i][j];
          context.fillStyle = analyze.getSpectrogramColor(
            value,
            adjustedSettings.spectrogramAmplitudeRange
          );
          context.fillRect(x, y, rectWidth, rectHeight);
        }
      }
    }

    // Draw mel axis
    function drawMelAxis() {
      drawTimeAxis(axisCanvas, axisContext, adjustedSettings);

      axisContext.font = '20px Arial';
      const numAxes = Math.round(10 * adjustedSettings.spectrogramVerticalScale);
      
      for (let i = 0; i < numAxes; i++) {
        axisContext.fillStyle = 'rgb(245,130,32)';
        const y = Math.round((i * height) / numAxes);
        const maxMel = analyze.hzToMel(adjustedSettings.maxFrequency);
        const minMel = analyze.hzToMel(adjustedSettings.minFrequency);
        const mel = ((numAxes - i) * (maxMel - minMel)) / numAxes + minMel;
        const f = analyze.melToHz(mel);
        axisContext.fillText(`${Math.trunc(f)}`, 4, y - 4);

        axisContext.fillStyle = 'rgb(180,120,20)';
        for (let j = 0; j < width; j++) {
          axisContext.fillRect(j, y, 2, 2);
        }
      }

      drawChannelLabel(axisContext, ch, numOfCh);
    }

    // Draw mel spectrogram
    function drawMelSpectrogram() {
      const spectrogram = analyze.getMelSpectrogram(ch, adjustedSettings, audioBuffer);
      const wholeSampleNum = (adjustedSettings.maxTime - adjustedSettings.minTime) * sampleRate;
      const rectWidth = (width * adjustedSettings.hopSize) / wholeSampleNum;
      const rectHeight = height / spectrogram[0].length;

      for (let i = 0; i < spectrogram.length; i++) {
        const x = i * rectWidth;
        for (let j = 0; j < spectrogram[i].length; j++) {
          const y = height - (j + 1) * rectHeight;
          const value = spectrogram[i][j];
          context.fillStyle = analyze.getSpectrogramColor(
            value,
            adjustedSettings.spectrogramAmplitudeRange
          );
          context.fillRect(x, y, rectWidth, rectHeight);
        }
      }
    }
  }, [
    width,
    height,
    settings,
    sampleRate,
    audioBuffer,
    ch,
    numOfCh,
    analyze,
  ]);

  return (
    <div className="canvasBox">
      <canvas
        ref={mainCanvasRef}
        className="mainCanvas"
        width={width}
        height={height}
      />
      <canvas
        ref={axisCanvasRef}
        className="axisCanvas"
        width={width}
        height={height}
      />
    </div>
  );
}