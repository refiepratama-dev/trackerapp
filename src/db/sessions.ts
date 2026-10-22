import type { SQLiteDatabase } from 'expo-sqlite';

import type { Coordinate } from '@/tracking/geo';

export type NewSessionInput = {
  vehicleId: number;
  startedAt: number;
  durationS: number;
  distanceM: number;
  maxSpeedMs: number;
  route: Coordinate[];
  /** Total climb in meters, if the phone reported altitude. */
  elevationGainM?: number | null;
  /** Estimated kilocalories, if the user has set a body weight. */
  caloriesKcal?: number | null;
};

/** A session as shown in the History list. The route is left out to keep the list light. */
export type SessionListItem = {
  id: number;
  vehicleId: number;
  vehicleName: string;
  /** Photo file name of the vehicle (see `src/vehicles/photo.ts`), if it has one. */
  vehiclePhoto: string | null;
  startedAt: number;
  durationS: number;
  distanceM: number;
  maxSpeedMs: number;
};

export type SessionDetail = SessionListItem & {
  route: Coordinate[];
  /** Total climb in meters; null for sessions without altitude data. */
  elevationGainM: number | null;
  /** Estimated kilocalories; null when no body weight was set at the time. */
  caloriesKcal: number | null;
};

/** Saves a finished session. Short sessions are always saved. Returns the new id. */
export async function createSession(db: SQLiteDatabase, input: NewSessionInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO sessions (vehicle_id, started_at, duration_s, distance_m, max_speed_ms, route,
                           elevation_gain_m, calories_kcal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.vehicleId,
    input.startedAt,
    Math.round(input.durationS),
    input.distanceM,
    input.maxSpeedMs,
    JSON.stringify(input.route.map((p) => [p.latitude, p.longitude])),
    input.elevationGainM ?? null,
    input.caloriesKcal ?? null,
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

/** All sessions, newest first. Sessions of archived vehicles are included. */
export async function listSessions(db: SQLiteDatabase): Promise<SessionListItem[]> {
  const rows = await db.getAllAsync<{
    id: number;
    vehicle_id: number;
    vehicle_name: string;
    vehicle_photo: string | null;
    started_at: number;
    duration_s: number;
    distance_m: number;
    max_speed_ms: number;
  }>(
    `SELECT s.id, s.vehicle_id, v.name AS vehicle_name, v.photo_uri AS vehicle_photo,
            s.started_at, s.duration_s, s.distance_m, s.max_speed_ms
       FROM sessions s
       JOIN vehicles v ON v.id = s.vehicle_id
      ORDER BY s.started_at DESC, s.id DESC`,
  );
  return rows.map((row) => ({
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    vehiclePhoto: row.vehicle_photo,
    startedAt: row.started_at,
    durationS: row.duration_s,
    distanceM: row.distance_m,
    maxSpeedMs: row.max_speed_ms,
  }));
}

export async function getSession(db: SQLiteDatabase, id: number): Promise<SessionDetail | null> {
  const row = await db.getFirstAsync<{
    id: number;
    vehicle_id: number;
    vehicle_name: string;
    vehicle_photo: string | null;
    started_at: number;
    duration_s: number;
    distance_m: number;
    max_speed_ms: number;
    route: string;
    elevation_gain_m: number | null;
    calories_kcal: number | null;
  }>(
    `SELECT s.id, s.vehicle_id, v.name AS vehicle_name, v.photo_uri AS vehicle_photo,
            s.started_at, s.duration_s, s.distance_m, s.max_speed_ms, s.route,
            s.elevation_gain_m, s.calories_kcal
       FROM sessions s
       JOIN vehicles v ON v.id = s.vehicle_id
      WHERE s.id = ?`,
    id,
  );
  if (!row) return null;

  let route: Coordinate[] = [];
  try {
    const points = JSON.parse(row.route) as [number, number][];
    route = points.map(([latitude, longitude]) => ({ latitude, longitude }));
  } catch {
    // A damaged route should not hide the rest of the session.
  }

  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    vehiclePhoto: row.vehicle_photo,
    startedAt: row.started_at,
    durationS: row.duration_s,
    distanceM: row.distance_m,
    maxSpeedMs: row.max_speed_ms,
    route,
    elevationGainM: row.elevation_gain_m,
    caloriesKcal: row.calories_kcal,
  };
}

export async function deleteSession(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM sessions WHERE id = ?', id);
}
