import type { SQLiteDatabase } from 'expo-sqlite';

const LATEST_VERSION = 1;

/** Types every user starts with. Users can add their own on top of these. */
export const DEFAULT_VEHICLE_TYPES = [
  'Bicycle',
  'Electric bike',
  'Skateboard',
  'Scooter',
  'Electric scooter',
  'Roller skates',
] as const;

/**
 * Runs on every app launch (SQLiteProvider `onInit`), before any screen renders.
 * Uses `PRAGMA user_version` so each schema step runs only once.
 */
export async function migrate(db: SQLiteDatabase) {
  // Foreign keys are a per-connection setting, so this runs on every launch.
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  if (version >= LATEST_VERSION) return;

  if (version === 0) {
    await db.execAsync('PRAGMA journal_mode = WAL');
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE vehicle_types (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL UNIQUE COLLATE NOCASE,
          is_custom INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE vehicles (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          type_id INTEGER NOT NULL REFERENCES vehicle_types(id),
          brand_model TEXT,
          photo_uri TEXT,
          archived INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        );
      `);

      for (const name of DEFAULT_VEHICLE_TYPES) {
        await db.runAsync('INSERT INTO vehicle_types (name, is_custom) VALUES (?, 0)', name);
      }
    });
    version = 1;
  }

  // Later schema steps go here as `if (version === 1) { ... version = 2; }`.

  await db.execAsync(`PRAGMA user_version = ${LATEST_VERSION}`);
}
