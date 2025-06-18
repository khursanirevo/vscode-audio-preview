import React, { useState, useEffect } from 'react';
import { useAnalyze } from '../hooks/useAnalyze';
import { useAnalyzeSettings } from '../hooks/useAnalyzeSettings';
import { useVSCode } from '../hooks/useVSCode';
import { Waveform } from './Waveform';
import { Spectrogram } from './Spectrogram';
import './Analyzer.css';

interface AnalyzerProps {
  autoAnalyze?: boolean;
}

export const Analyzer: React.FC<AnalyzerProps> = ({ autoAnalyze = false }) => {
  const { audioBuffer } = useVSCode();
  const { analyze, isAnalyzing, lastAnalyzeTime } = useAnalyze();
  const { waveformVisible, spectrogramVisible } = useAnalyzeSettings();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (autoAnalyze && audioBuffer && !hasAnalyzed) {
      handleAnalyze();
    }
  }, [autoAnalyze, audioBuffer, hasAnalyzed]);

  useEffect(() => {
    if (lastAnalyzeTime) {
      setHasAnalyzed(true);
      setShowResults(true);
    }
  }, [lastAnalyzeTime]);

  const handleAnalyze = () => {
    if (audioBuffer) {
      setShowResults(true);
      analyze();
    }
  };

  const renderChannelVisualization = (channelIndex: number) => {
    const numberOfChannels = audioBuffer?.numberOfChannels || 1;
    
    return (
      <div key={channelIndex}>
        {waveformVisible && (
          <div className="canvasBox">
            <Waveform 
              channelIndex={channelIndex}
              numberOfChannels={numberOfChannels}
            />
          </div>
        )}
        {spectrogramVisible && (
          <div className="canvasBox">
            <Spectrogram 
              channelIndex={channelIndex}
              numberOfChannels={numberOfChannels}
            />
          </div>
        )}
      </div>
    );
  };

  const renderAnalyzeResults = () => {
    if (!audioBuffer || !showResults) return null;

    const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, i) => i);
    
    return (
      <div className="analyzeResultBox">
        {channels.map(channelIndex => renderChannelVisualization(channelIndex))}
      </div>
    );
  };

  return (
    <div className="analyzerComponent">
      <button 
        className="analyzeButton"
        onClick={handleAnalyze}
        disabled={isAnalyzing || !audioBuffer}
        style={{ display: hasAnalyzed && !isAnalyzing ? 'block' : 'block' }}
      >
        {isAnalyzing ? 'Analyzing...' : 'analyze'}
      </button>
      {renderAnalyzeResults()}
    </div>
  );
};