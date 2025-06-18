import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import { useAnalyze } from '../../hooks/useAnalyze';
import { useAnalyzeSettings } from '../../hooks/useAnalyzeSettings';
import { useVSCode } from '../../hooks/useVSCode';
import { FrequencyScale } from '../../services/analyzeSettingsService';
import AnalyzeService from '../../services/analyzeService';
import './FigureInteraction.css';

interface FigureInteractionProps {
  onWaveformCanvas: boolean;
  children?: React.ReactNode;
}

export const FigureInteraction: React.FC<FigureInteractionProps> = ({
  onWaveformCanvas,
  children,
}) => {
  const { audioBuffer } = useVSCode();
  const { seekbarPercent, setSeekbarPercent } = usePlayer();
  const { analyze } = useAnalyze();
  const {
    minTime,
    setMinTime,
    maxTime,
    setMaxTime,
    minAmplitude,
    setMinAmplitude,
    maxAmplitude,
    setMaxAmplitude,
    minFrequency,
    setMinFrequency,
    maxFrequency,
    setMaxFrequency,
    frequencyScale,
    resetToDefaultTimeRange,
    resetToDefaultAmplitudeRange,
    resetToDefaultFrequencyRange,
  } = useAnalyzeSettings();

  const containerRef = useRef<HTMLDivElement>(null);
  const userInputRef = useRef<HTMLDivElement>(null);
  const visibleBarRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isTimeAxisOnly, setIsTimeAxisOnly] = useState(false);
  const [isValueAxisOnly, setIsValueAxisOnly] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });

  // Update seekbar position
  useEffect(() => {
    if (!audioBuffer || !visibleBarRef.current) return;

    const percentInFullRange = seekbarPercent;
    const sec = (percentInFullRange * audioBuffer.duration) / 100;
    const percentInFigureRange = ((sec - minTime) / (maxTime - minTime)) * 100;

    if (percentInFigureRange < 0) {
      visibleBarRef.current.style.width = '0%';
    } else if (percentInFigureRange > 100) {
      visibleBarRef.current.style.width = '100%';
    } else {
      visibleBarRef.current.style.width = `${percentInFigureRange}%`;
    }
  }, [seekbarPercent, audioBuffer, minTime, maxTime]);

  const updateSelectionDiv = useCallback(() => {
    if (!selectionRef.current || !userInputRef.current) return;

    const rect = userInputRef.current.getBoundingClientRect();
    const selection = selectionRef.current;

    if (isTimeAxisOnly) {
      selection.style.left = `${Math.min(dragStart.x, dragCurrent.x) - rect.left}px`;
      selection.style.top = '0%';
      selection.style.width = `${Math.abs(dragStart.x - dragCurrent.x)}px`;
      selection.style.height = '100%';
    } else if (isValueAxisOnly) {
      selection.style.left = '0%';
      selection.style.top = `${Math.min(dragStart.y, dragCurrent.y) - rect.top}px`;
      selection.style.width = '100%';
      selection.style.height = `${Math.abs(dragStart.y - dragCurrent.y)}px`;
    } else {
      selection.style.left = `${Math.min(dragStart.x, dragCurrent.x) - rect.left}px`;
      selection.style.top = `${Math.min(dragStart.y, dragCurrent.y) - rect.top}px`;
      selection.style.width = `${Math.abs(dragStart.x - dragCurrent.x)}px`;
      selection.style.height = `${Math.abs(dragStart.y - dragCurrent.y)}px`;
    }
  }, [dragStart, dragCurrent, isTimeAxisOnly, isValueAxisOnly]);

  const applySelectedRange = useCallback((
    mouseUpX: number,
    mouseUpY: number,
    mouseDownX: number,
    mouseDownY: number,
  ) => {
    if (!userInputRef.current || !audioBuffer) return;

    const rect = userInputRef.current.getBoundingClientRect();
    const minX = Math.min(mouseUpX, mouseDownX) - rect.left;
    const maxX = Math.max(mouseUpX, mouseDownX) - rect.left;
    const minY = Math.min(mouseUpY, mouseDownY) - rect.top;
    const maxY = Math.max(mouseUpY, mouseDownY) - rect.top;

    // Update time range
    if (!isValueAxisOnly) {
      const timeRange = maxTime - minTime;
      const newMinTime = (minX / rect.width) * timeRange + minTime;
      const newMaxTime = (maxX / rect.width) * timeRange + minTime;
      setMinTime(newMinTime);
      setMaxTime(newMaxTime);
    }

    // Update value axis range
    if (!isTimeAxisOnly) {
      if (onWaveformCanvas) {
        // Waveform: amplitude range
        const amplitudeRange = maxAmplitude - minAmplitude;
        const newMinAmplitude = (1 - maxY / rect.height) * amplitudeRange + minAmplitude;
        const newMaxAmplitude = (1 - minY / rect.height) * amplitudeRange + minAmplitude;
        setMinAmplitude(newMinAmplitude);
        setMaxAmplitude(newMaxAmplitude);
      } else {
        // Spectrogram: frequency range
        let newMinFrequency, newMaxFrequency;
        const frequencyRange = maxFrequency - minFrequency;

        switch (frequencyScale) {
          case FrequencyScale.Linear:
            newMinFrequency = (1 - maxY / rect.height) * frequencyRange + minFrequency;
            newMaxFrequency = (1 - minY / rect.height) * frequencyRange + minFrequency;
            break;
          case FrequencyScale.Log:
            const logRange = Math.log10(maxFrequency) - Math.log10(minFrequency);
            newMinFrequency = Math.pow(10, (1 - maxY / rect.height) * logRange) + minFrequency;
            newMaxFrequency = Math.pow(10, (1 - minY / rect.height) * logRange) + minFrequency;
            break;
          case FrequencyScale.Mel:
            const melRange = AnalyzeService.hzToMel(maxFrequency) - AnalyzeService.hzToMel(minFrequency);
            newMinFrequency = AnalyzeService.melToHz((1 - maxY / rect.height) * melRange) + minFrequency;
            newMaxFrequency = AnalyzeService.melToHz((1 - minY / rect.height) * melRange) + minFrequency;
            break;
          default:
            newMinFrequency = (1 - maxY / rect.height) * frequencyRange + minFrequency;
            newMaxFrequency = (1 - minY / rect.height) * frequencyRange + minFrequency;
        }
        setMinFrequency(newMinFrequency);
        setMaxFrequency(newMaxFrequency);
      }
    }

    // Trigger analysis
    analyze();
  }, [onWaveformCanvas, audioBuffer, minTime, maxTime, minAmplitude, maxAmplitude,
      minFrequency, maxFrequency, frequencyScale, isTimeAxisOnly, isValueAxisOnly,
      setMinTime, setMaxTime, setMinAmplitude, setMaxAmplitude, setMinFrequency,
      setMaxFrequency, analyze]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!userInputRef.current || !audioBuffer) return;

    // Handle existing drag state
    if (isDragging && selectionRef.current) {
      setIsDragging(false);
      if (containerRef.current && selectionRef.current.parentNode === containerRef.current) {
        containerRef.current.removeChild(selectionRef.current);
      }
      applySelectedRange(dragStart.x, dragStart.y, event.clientX, event.clientY);
      return;
    }

    const mousePos = { x: event.clientX, y: event.clientY };
    setDragStart(mousePos);

    // Left click - start dragging
    if (event.button === 0) {
      setIsDragging(true);
      
      // Create selection div
      if (containerRef.current && !selectionRef.current) {
        const selection = document.createElement('div');
        selection.style.position = 'absolute';
        selection.style.border = '1px solid red';
        selection.style.backgroundColor = 'rgba(255, 0, 0, 0)';
        selection.style.pointerEvents = 'none';
        containerRef.current.appendChild(selection);
        selectionRef.current = selection;
      }
      return;
    }

    // Right click - reset ranges
    if (event.button === 2) {
      if (event.ctrlKey) {
        resetToDefaultTimeRange();
      } else if (event.shiftKey) {
        resetToDefaultAmplitudeRange();
        resetToDefaultFrequencyRange();
      } else {
        resetToDefaultTimeRange();
        resetToDefaultAmplitudeRange();
        resetToDefaultFrequencyRange();
      }
      analyze();
    }
  }, [isDragging, audioBuffer, dragStart, applySelectedRange, analyze,
      resetToDefaultTimeRange, resetToDefaultAmplitudeRange, resetToDefaultFrequencyRange]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !selectionRef.current) return;

    setDragCurrent({ x: event.clientX, y: event.clientY });
  }, [isDragging]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !selectionRef.current || !userInputRef.current || !audioBuffer) return;

    setIsDragging(false);

    // Remove selection div
    if (containerRef.current && selectionRef.current.parentNode === containerRef.current) {
      containerRef.current.removeChild(selectionRef.current);
    }
    selectionRef.current = null;

    const rect = userInputRef.current.getBoundingClientRect();
    const mouseUpX = event.clientX;
    const mouseUpY = event.clientY;

    // Check if it's a click (small movement)
    if (Math.abs(dragStart.x - mouseUpX) < 3 && Math.abs(dragStart.y - mouseUpY) < 3) {
      // Seek to clicked position
      const xPercentInFigureRange = ((mouseUpX - rect.left) / rect.width) * 100;
      const sec = (xPercentInFigureRange / 100) * (maxTime - minTime) + minTime;
      const percentInFullRange = (sec / audioBuffer.duration) * 100;
      setSeekbarPercent(percentInFullRange);
      return;
    }

    // Apply drag selection
    applySelectedRange(mouseUpX, mouseUpY, dragStart.x, dragStart.y);
  }, [isDragging, audioBuffer, dragStart, maxTime, minTime, setSeekbarPercent, applySelectedRange]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  // Handle keyboard events for modifier keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isDragging || !selectionRef.current) return;
      if (!event.ctrlKey && !event.shiftKey) return;

      if (event.ctrlKey) {
        setIsTimeAxisOnly(true);
        setIsValueAxisOnly(false);
      }
      if (event.shiftKey) {
        setIsTimeAxisOnly(false);
        setIsValueAxisOnly(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== 'Shift' && event.key !== 'Control') return;
      
      setIsTimeAxisOnly(false);
      setIsValueAxisOnly(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDragging]);

  // Update selection div when drag state changes
  useEffect(() => {
    if (isDragging) {
      updateSelectionDiv();
    }
  }, [isDragging, dragCurrent, isTimeAxisOnly, isValueAxisOnly, updateSelectionDiv]);

  return (
    <div ref={containerRef} className="figureInteraction">
      {children}
      <div ref={visibleBarRef} className="visibleBar" />
      <div
        ref={userInputRef}
        className="userInputDiv"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
};