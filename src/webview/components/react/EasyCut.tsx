import React, { useState } from 'react';
import { useAnalyzeSettings } from '../../hooks/useAnalyzeSettings';
import { useVSCode } from '../../hooks/useVSCode';
// No longer need to import WebviewMessageType
import { encodeToWav } from '../../encoder';
import './EasyCut.css';

export const EasyCut: React.FC = () => {
  const { audioBuffer, postMessage } = useVSCode();
  const { minTime, maxTime } = useAnalyzeSettings();
  
  const [filename, setFilename] = useState(() => `cut_${getTimeString()}`);

  const checkAndReplaceFilename = (name: string): string => {
    if (!name) {
      return `cut_${getTimeString()}.wav`;
    }
    return name.replace(/[<>:"/\\|?*]+/g, '_') + '.wav';
  };

  const handleCut = () => {
    if (!audioBuffer) return;

    const minIndex = Math.floor(minTime * audioBuffer.sampleRate);
    const maxIndex = Math.floor(maxTime * audioBuffer.sampleRate);

    const audioData: Float32Array[] = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      const channelData = audioBuffer.getChannelData(i);
      audioData.push(channelData.slice(minIndex, maxIndex));
    }

    const samples = encodeToWav(
      audioData,
      audioBuffer.sampleRate,
      audioBuffer.numberOfChannels,
    );

    const processedFilename = checkAndReplaceFilename(filename);

    postMessage({
      type: 'WV_WRITE_WAV',
      payload: {
        filename: processedFilename,
        samples,
      },
    });
  };

  return (
    <div className="easyCut">
      <p>Cut the currently selected range and save it to a wav file (experimental)</p>
      <div>
        filename:
        <input
          className="easyCut__input"
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
        />
        .wav
      </div>
      <button 
        className="easyCut__button"
        onClick={handleCut}
        disabled={!audioBuffer}
      >
        cut
      </button>
    </div>
  );
};

function getTimeString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hour = ('0' + date.getHours()).slice(-2);
  const minute = ('0' + date.getMinutes()).slice(-2);
  const second = ('0' + date.getSeconds()).slice(-2);
  return `${year}${month}${day}_${hour}${minute}${second}`;
}