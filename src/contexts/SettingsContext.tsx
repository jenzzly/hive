import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPlatformConfig, type PlatformConfig } from '../services/settingsService';
import type { Currency } from '../types';

interface SettingsContextType {
  settings: PlatformConfig | null;
  defaultCurrency: Currency;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PlatformConfig | null>(null);
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

  return (
    <SettingsContext.Provider value={{ settings, defaultCurrency, loading, refreshSettings }}>
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
