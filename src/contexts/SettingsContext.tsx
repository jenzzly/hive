import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPlatformConfig } from '../services/settingsService';
import type { Currency, PlatformSettings, Language } from '../types';

interface SettingsContextType {
  settings: PlatformSettings | null;
  defaultCurrency: Currency;
  defaultLanguage: Language;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const config = await getPlatformConfig();
      setSettings(config);
    } catch (err) {
      console.error('Failed to load platform settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const defaultCurrency: Currency = settings?.defaultCurrency || 'USD';
  const defaultLanguage: Language = settings?.defaultLanguage || 'en';

  return (
    <SettingsContext.Provider value={{ settings, defaultCurrency, defaultLanguage, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
