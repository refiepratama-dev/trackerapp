import type { SQLiteDatabase } from 'expo-sqlite';

import type { DistanceUnit } from '@/tracking/format';

export type Settings = {
  /** Shown on share cards. Empty means not set. */
  userName: string;
  unit: DistanceUnit;
};

export const DEFAULT_SETTINGS: Settings = { userName: '', unit: 'km' };

export async function loadSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
  );
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    userName: stored.userName ?? DEFAULT_SETTINGS.userName,
    unit: stored.unit === 'mi' ? 'mi' : 'km',
  };
}

/** Saves only the given fields. */
export async function saveSettings(db: SQLiteDatabase, patch: Partial<Settings>): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        key,
        String(value),
      );
    }
  });
}
