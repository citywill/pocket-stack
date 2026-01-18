import { useState, useEffect, createContext, useContext } from 'react';
import { pb } from '@/lib/pocketbase';

interface SettingsContextType {
  settings: Record<string, any>;
  siteName: string;
  contactEmail: string;
  footerText: string;
  loading: boolean;
  refresh: () => Promise<void>;
  get: (key: string, defaultValue?: any) => any;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('system_settings').getFullList({
        requestKey: null // Disable auto-cancellation
      });

      const newSettings: Record<string, any> = {};
      records.forEach(record => {
        newSettings[record.key] = record.value;
      });
      setSettings(newSettings);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Fetch settings error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 当 siteName 改变时，更新 document.title
  useEffect(() => {
    const siteName = settings['site_name'] || 'Pocket Stack';
    document.title = siteName;
  }, [settings]);

  const get = (key: string, defaultValue?: any) => {
    return settings[key] ?? defaultValue;
  };

  const value = {
    settings,
    siteName: settings['site_name'] || '',
    contactEmail: settings['contact_email'] || '',
    footerText: settings['footer_text'] || '',
    loading,
    refresh: fetchSettings,
    get
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
