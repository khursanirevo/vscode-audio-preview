import React, { useRef, useEffect } from 'react';
import { useAnalyze } from '../hooks/useAnalyze';
import { useAnalyzeSettings } from '../hooks/useAnalyzeSettings';
import { useVSCode } from '../hooks/useVSCode';
import { canvasSizes } from '../types';
import '../styles/figure.css';

export interface WaveformProps {
  channelIndex: number;
  numberOfChannels: number;
}

export function Waveform({
  channelIndex,
  numberOfChannels,
}: WaveformProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const axisCanvasRef = useRef<HTMLCanvasElement>(null);
  const analyze = useAnalyze();
  const analyzeSettings = useAnalyzeSettings();
  const { audioBuffer } = useVSCode();
  
  const width = canvasSizes.waveformWidth;
  const height = canvasSizes.waveformHeight;
  const sampleRate = audioBuffer?.sampleRate || 44100;
  const channelData = audioBuffer?.getChannelData(channelIndex);
  const ch = channelIndex;
  const numOfCh = numberOfChannels;

  const MIN_DATA_POINTS_PER_PIXEL = 5;
  const WAVEFORM_CANVAS_WIDTH = 1000; // From AnalyzeSettingsService

  useEffect(() => {
    const mainCanvas = mainCanvasRef.current;
    const axisCanvas = axisCanvasRef.current;
    if (!mainCanvas || !axisCanvas || !channelData || !analyzeSettings) return;

    const context = mainCanvas.getContext('2d', { alpha: false });
    const axisContext = axisCanvas.getContext('2d');
    if (!context || !axisContext) return;

    // Clear canvases
    context.clearRect(0, 0, width, height);
    axisContext.clearRect(0, 0, width, height);

    // Set styles
    context.fillStyle = 'rgb(160,60,200)';
    context.strokeStyle = 'rgb(160,60,200)';
    axisContext.font = '12px Arial';

    // Draw horizontal axis
    const [niceT, digitT] = analyze.roundToNearestNiceNumber(
      (analyzeSettings.maxTime - analyzeSettings.minTime) / 10
    );
    const dx = width / (analyzeSettings.maxTime - analyzeSettings.minTime);
    const t0 = Math.ceil(analyzeSettings.minTime / niceT) * niceT;
    const numTAxis = Math.floor((analyzeSettings.maxTime - analyzeSettings.minTime) / niceT);
    
    for (let i = 0; i <= numTAxis; i++) {
      const t = t0 + niceT * i;
      const x = (t - analyzeSettings.minTime) * dx;

      axisContext.fillStyle = 'rgb(245,130,32)';
      if (width * (5 / 100) < x && x < width * (95 / 100)) {
        axisContext.fillText(`${t.toFixed(digitT)}`, x, 10);
      } // don't draw near the edge

      axisContext.fillStyle = 'rgb(180,120,20)';
      for (let j = 0; j < height; j++) {
        axisContext.fillRect(x, j, 1, 1);
      }
    }

    // Draw vertical axis
    const [niceA, digitA] = analyze.roundToNearestNiceNumber(
      (analyzeSettings.maxAmplitude - analyzeSettings.minAmplitude) /
        (10 * analyzeSettings.waveformVerticalScale)
    );
    const dy = height / (analyzeSettings.maxAmplitude - analyzeSettings.minAmplitude);
    const a0 = Math.ceil(analyzeSettings.minAmplitude / niceA) * niceA;
    const numAAxis = Math.floor(
      (analyzeSettings.maxAmplitude - analyzeSettings.minAmplitude) / niceA
    );
    
    for (let i = 0; i <= numAAxis; i++) {
      const a = a0 + niceA * i;
      const y = height - (a - analyzeSettings.minAmplitude) * dy;

      axisContext.fillStyle = 'rgb(245,130,32)';
      if (12 < y && y < height) {
        axisContext.fillText(`${a.toFixed(digitA)}`, 4, y - 2);
      } // don't draw near the edge

      axisContext.fillStyle = 'rgb(180,120,20)';
      if (12 < y && y < height) {
        // don't draw on the horizontal axis
        for (let j = 0; j < width; j++) {
          axisContext.fillRect(j, y, 1, 1);
        }
      }
    }

    const startIndex = Math.floor(analyzeSettings.minTime * sampleRate);
    const endIndex = Math.floor(analyzeSettings.maxTime * sampleRate);
    
    // Limit data size for performance
    const step = Math.ceil((endIndex - startIndex) / 200000);
    const data = channelData
      .slice(startIndex, endIndex)
      .filter((_, i) => i % step === 0);

    // Draw waveform
    for (let i = 0; i < data.length; i++) {
      // Convert data to fit within the vertical axis range
      const d =
        (data[i] - analyzeSettings.minAmplitude) /
        (analyzeSettings.maxAmplitude - analyzeSettings.minAmplitude);

      const x = (i / data.length) * width;
      const y = height * (1 - d);

      if (
        data.length >
        WAVEFORM_CANVAS_WIDTH * MIN_DATA_POINTS_PER_PIXEL
      ) {
        context.fillRect(x, y, 1, 1);
      } else {
        if (i === 0) {
          context.beginPath();
          context.moveTo(x, y);
        } else if (i === data.length - 1) {
          context.lineTo(x, y);
          context.stroke();
        } else {
          context.lineTo(x, y);
        }
      }
    }

    // Draw channel label
    if (numOfCh > 1) {
      let channelText = '';
      if (numOfCh === 2) {
        channelText = ch === 0 ? 'Lch' : 'Rch';
      } else {
        channelText = 'ch' + String(ch + 1);
      }

      axisContext.font = '12px Arial';
      axisContext.fillStyle = 'rgb(220, 220, 220)';
      axisContext.fillText(channelText, 33, 10);
    }
  }, [
    width,
    height,
    analyzeSettings,
    sampleRate,
    channelData,
    ch,
    numOfCh,
    analyze,
    channelIndex,
    numberOfChannels,
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