import { useContext } from 'react';
import { AnalyzeSettingsContext, AnalyzeSettingsContextType } from '../contexts/AnalyzeSettingsContext';

export function useAnalyzeSettings(): AnalyzeSettingsContextType {
  const context = useContext(AnalyzeSettingsContext);
  if (context === undefined) {
    throw new Error('useAnalyzeSettings must be used within a AnalyzeSettingsProvider');
  }
  return context;
}