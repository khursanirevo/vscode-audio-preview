import React, { useEffect } from 'react';
import { usePlayerSettings } from '../../hooks/usePlayerSettings';
import { useAnalyzeSettings } from '../../hooks/useAnalyzeSettings';
import { useAnalyze } from '../../hooks/useAnalyze';
import './PlayerSettings.css';

export const PlayerSettings: React.FC = () => {
  const {
    enableHpf,
    setEnableHpf,
    hpfFrequency,
    setHpfFrequency,
    enableLpf,
    setEnableLpf,
    lpfFrequency,
    setLpfFrequency,
    matchFilterFrequencyToSpectrogram,
    setMatchFilterFrequencyToSpectrogram,
  } = usePlayerSettings();

  const { minFrequency, maxFrequency } = useAnalyzeSettings();
  const { lastAnalyzeTime } = useAnalyze();

  // Update filter frequencies when analysis completes and match is enabled
  useEffect(() => {
    if (matchFilterFrequencyToSpectrogram && lastAnalyzeTime) {
      setHpfFrequency(minFrequency);
      setLpfFrequency(maxFrequency);
    }
  }, [lastAnalyzeTime, matchFilterFrequencyToSpectrogram, minFrequency, maxFrequency, setHpfFrequency, setLpfFrequency]);

  const handleMatchFilterChange = (checked: boolean) => {
    setMatchFilterFrequencyToSpectrogram(checked);
    
    if (checked) {
      setHpfFrequency(minFrequency);
      setLpfFrequency(maxFrequency);
    }
  };

  return (
    <div className="playerSetting">
      <h3>Filters</h3>
      <div>
        <input
          className="playerSetting__input"
          type="checkbox"
          checked={enableHpf}
          onChange={(e) => setEnableHpf(e.target.checked)}
        />
        high-pass:{' '}
        <input
          className="playerSetting__input"
          type="number"
          min="10"
          max="100000"
          step="10"
          value={hpfFrequency}
          readOnly={matchFilterFrequencyToSpectrogram}
          onChange={(e) => setHpfFrequency(Number(e.target.value))}
        />
        {' '}Hz
      </div>
      <div>
        <input
          className="playerSetting__input"
          type="checkbox"
          checked={enableLpf}
          onChange={(e) => setEnableLpf(e.target.checked)}
        />
        low-pass:{' '}
        <input
          className="playerSetting__input"
          type="number"
          min="10"
          max="100000"
          step="10"
          value={lpfFrequency}
          readOnly={matchFilterFrequencyToSpectrogram}
          onChange={(e) => setLpfFrequency(Number(e.target.value))}
        />
        {' '}Hz
      </div>
      <div>
        <input
          className="playerSetting__input"
          type="checkbox"
          checked={matchFilterFrequencyToSpectrogram}
          onChange={(e) => handleMatchFilterChange(e.target.checked)}
        />
        match to spectrogram frequency range
      </div>
    </div>
  );
};