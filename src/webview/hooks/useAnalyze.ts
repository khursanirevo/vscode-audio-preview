import { useContext } from 'react';
import { AnalyzeContext, AnalyzeContextType } from '../contexts/AnalyzeContext';

export function useAnalyze(): AnalyzeContextType {
  const context = useContext(AnalyzeContext);
  if (context === undefined) {
    throw new Error('useAnalyze must be used within a AnalyzeProvider');
  }
  return context;
}