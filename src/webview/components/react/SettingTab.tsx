import React, { useState } from 'react';
import { PlayerSettings } from './PlayerSettings';
import { AnalyzeSettings } from './AnalyzeSettings';
import { EasyCut } from './EasyCut';
import './SettingTab.css';

type TabType = 'hide' | 'player' | 'analyze' | 'easyCut';

export const SettingTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('hide');

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  const getButtonClass = (tab: TabType) => {
    return `settingTab__button ${
      activeTab === tab ? 'settingTab__button--active' : ''
    }`;
  };

  return (
    <div className="settingTab">
      <div className="settingTab__menu">
        <div>Setting</div>
        <button
          className={getButtonClass('hide')}
          onClick={() => handleTabClick('hide')}
        >
          hide
        </button>
        <button
          className={getButtonClass('player')}
          onClick={() => handleTabClick('player')}
        >
          player
        </button>
        <button
          className={getButtonClass('analyze')}
          onClick={() => handleTabClick('analyze')}
        >
          analyze
        </button>
        <button
          className={getButtonClass('easyCut')}
          onClick={() => handleTabClick('easyCut')}
        >
          easyCut
        </button>
      </div>
      <div className="settingTab__content">
        <div style={{ display: activeTab === 'player' ? 'block' : 'none' }}>
          <PlayerSettings />
        </div>
        <div style={{ display: activeTab === 'analyze' ? 'block' : 'none' }}>
          <AnalyzeSettings />
        </div>
        <div style={{ display: activeTab === 'easyCut' ? 'block' : 'none' }}>
          <EasyCut />
        </div>
      </div>
    </div>
  );
};