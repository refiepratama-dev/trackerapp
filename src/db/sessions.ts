import type { SQLiteDatabase } from 'expo-sqlite';

import type { Coordinate } from '@/tracking/geo';

export type NewSessionInput = {
  vehicleId: number;
  startedAt: number;
  durationS: number;
  distanceM: number;
  maxSpeedMs: number;
  route: Coordinate[];
};

export type Session = NewSessionInput & { id: number };

/** Saves a finished session. Short sessions are always saved. Returns the new id. */
export async function createSession(db: SQLiteDatabase, input: NewSessionInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO sessions (vehicle_id, started_at, duration_s, distance_m, max_speed_ms, route)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.vehicleId,
    input.startedAt,
    Math.round(input.durationS),
    input.distanceM,
    input.maxSpeedMs,
    JSON.stringify(input.route.map((p) => [p.latitude, p.longitude])),
  );
  return result.lastInsertRowId;
}

/** The vehicle used in the most recent session, or null when there are no sessions yet. */
export async function getLastUsedVehicleId(db: SQLiteDatabase): Promise<number | null> {
  const row = await db.getFirstAsync<{ vehicle_id: number }>(
    'SELECT vehicle_id FROM sessions ORDER BY started_at DESC, id DESC LIMIT 1',
  );
  return row?.vehicle_id ?? null;
}
