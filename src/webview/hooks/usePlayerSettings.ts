import { useContext } from 'react';
import { PlayerSettingsContext, PlayerSettingsContextType } from '../contexts/PlayerSettingsContext';

export function usePlayerSettings(): PlayerSettingsContextType {
  const context = useContext(PlayerSettingsContext);
  if (context === undefined) {
    throw new Error('usePlayerSettings must be used within a PlayerSettingsProvider');
  }
  return context;
}