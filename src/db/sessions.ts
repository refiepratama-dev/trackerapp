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

/**
 * All sessions, newest first. Sessions of archived vehicles are included.
 * Pass a vehicle id to get only that vehicle's sessions.
 */
export async function listSessions(
  db: SQLiteDatabase,
  vehicleId?: number,
): Promise<SessionListItem[]> {
  const rows = await db.getAllAsync<{
    id: number;
    vehicle_id: number;
    vehicle_name: string;
    started_at: number;
    duration_s: number;
    distance_m: number;
    max_speed_ms: number;
  }>(
    `SELECT s.id, s.vehicle_id, v.name AS vehicle_name,
            s.started_at, s.duration_s, s.distance_m, s.max_speed_ms
       FROM sessions s
       JOIN vehicles v ON v.id = s.vehicle_id
      WHERE (? IS NULL OR s.vehicle_id = ?)
      ORDER BY s.started_at DESC, s.id DESC`,
    vehicleId ?? null,
    vehicleId ?? null,
  );
  return rows.map((row) => ({
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
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
    started_at: number;
    duration_s: number;
    distance_m: number;
    max_speed_ms: number;
    route: string;
    elevation_gain_m: number | null;
    calories_kcal: number | null;
  }>(
    `SELECT s.id, s.vehicle_id, v.name AS vehicle_name,
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

export type VehicleRecord = { sessionId: number; value: number; startedAt: number };

export type VehicleStats = {
  sessionCount: number;
  totalDistanceM: number;
  totalDurationS: number;
  /** Total climb in meters; 0 when no session had altitude data. */
  totalClimbM: number;
  /** Null when the vehicle has no sessions (or none qualifies). */
  longestRide: VehicleRecord | null;
  topSpeed: VehicleRecord | null;
  /** Best average speed in m/s. Rides under `MIN_RECORD_DISTANCE_M` are ignored. */
  bestAverageSpeed: VehicleRecord | null;
};

/** Very short sessions give silly averages (GPS jitter), so they never count as a speed record. */
export const MIN_RECORD_DISTANCE_M = 500;

/** Totals and personal records for one vehicle, from all of its sessions. */
export async function getVehicleStats(
  db: SQLiteDatabase,
  vehicleId: number,
): Promise<VehicleStats> {
  const totals = await db.getFirstAsync<{
    n: number;
    distance: number | null;
    duration: number | null;
    climb: number | null;
  }>(
    `SELECT COUNT(*) AS n, SUM(distance_m) AS distance, SUM(duration_s) AS duration,
            SUM(elevation_gain_m) AS climb
       FROM sessions WHERE vehicle_id = ?`,
    vehicleId,
  );

  const record = async (valueSql: string, where = ''): Promise<VehicleRecord | null> => {
    const row = await db.getFirstAsync<{ id: number; value: number; started_at: number }>(
      `SELECT id, ${valueSql} AS value, started_at FROM sessions
        WHERE vehicle_id = ? ${where}
        ORDER BY value DESC, started_at DESC LIMIT 1`,
      vehicleId,
    );
    return row && row.value > 0
      ? { sessionId: row.id, value: row.value, startedAt: row.started_at }
      : null;
  };

  return {
    sessionCount: totals?.n ?? 0,
    totalDistanceM: totals?.distance ?? 0,
    totalDurationS: totals?.duration ?? 0,
    totalClimbM: totals?.climb ?? 0,
    longestRide: await record('distance_m'),
    topSpeed: await record('max_speed_ms'),
    bestAverageSpeed: await record(
      'distance_m * 1.0 / duration_s',
      `AND duration_s > 0 AND distance_m >= ${MIN_RECORD_DISTANCE_M}`,
    ),
  };
}
