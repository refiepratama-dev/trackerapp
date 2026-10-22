import type { SQLiteDatabase } from 'expo-sqlite';

import type { DistanceUnit } from '@/tracking/format';

export type Settings = {
  /** Shown on share cards. Empty means not set. */
  userName: string;
  unit: DistanceUnit;
  /** Body weight in kg, used only to estimate calories. Null means not set. */
  weightKg: number | null;
  /** File name of the profile photo (see `src/profile/photo.ts`). Null means no photo. */
  photoFile: string | null;
  /** Stop the timer automatically when the rider stops moving. */
  autoPause: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  userName: '',
  unit: 'km',
  weightKg: null,
  photoFile: null,
  autoPause: true,
};

function parseWeight(value: string | undefined): number | null {
  const kg = value === undefined ? NaN : Number(value);
  return Number.isFinite(kg) && kg > 0 ? kg : null;
}

export async function loadSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
  );
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    userName: stored.userName ?? DEFAULT_SETTINGS.userName,
    unit: stored.unit === 'mi' ? 'mi' : 'km',
    weightKg: parseWeight(stored.weightKg),
    photoFile: stored.photoFile || null,
    autoPause: stored.autoPause !== 'false',
  };
}

/** Saves only the given fields. */
export async function saveSettings(db: SQLiteDatabase, patch: Partial<Settings>): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (value === null) {
        // A cleared optional setting is removed rather than stored as text.
        await db.runAsync('DELETE FROM settings WHERE key = ?', key);
        continue;
      }
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        key,
        String(value),
      );
    }
  });
}
