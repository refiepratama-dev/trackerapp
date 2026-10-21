import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from '@/db/settings';

type SettingsContextValue = {
  settings: Settings;
  /** Updates the screen right away, then saves to the database. */
  update: (patch: Partial<Settings>) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  update: async () => {},
});

/** Loads the settings once at launch. Must sit inside SQLiteProvider. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSettings(db).then((loaded) => {
      if (!cancelled) setSettings(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const update = useCallback(
    async (patch: Partial<Settings>) => {
      setSettings((current) => (current ? { ...current, ...patch } : current));
      await saveSettings(db, patch);
    },
    [db],
  );

  const value = useMemo(() => (settings ? { settings, update } : null), [settings, update]);

  // A few milliseconds at launch, hidden behind the splash screen.
  if (!value) return null;

  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettings() {
  return use(SettingsContext);
}
