import { ElevationGain } from '@/tracking/elevation';

export type Coordinate = { latitude: number; longitude: number };

/** One GPS fix, reduced to what the tracker needs. */
export type Fix = Coordinate & {
  /** ms since epoch */
  timestamp: number;
  /** horizontal accuracy in meters, null when unknown */
  accuracy: number | null;
  /** speed in m/s from the OS, null or negative when unknown */
  speed: number | null;
  /** altitude in meters, null when unknown */
  altitude?: number | null;
  /** vertical accuracy in meters, null or negative when unknown */
  altitudeAccuracy?: number | null;
};

export type TrackSnapshot = {
  distanceM: number;
  maxSpeedMs: number;
  route: Coordinate[];
  /** Total climb in meters; null when the phone gave no usable altitude. */
  elevationGainM: number | null;
};

/** Fixes less accurate than this (meters) are ignored. */
export const MAX_ACCURACY_M = 30;
/** Moves smaller than this (meters) are treated as GPS jitter. */
export const MIN_STEP_M = 3;
/** Implied speeds above this (m/s, ~144 km/h) are treated as a GPS glitch. */
export const MAX_PLAUSIBLE_SPEED_MS = 40;

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Turns a stream of GPS fixes into distance, max speed and a route.
 * Pure logic with no React or native dependencies, so it is easy to test.
 */
export class Tracker {
  private prev: Fix | null = null;
  private distanceM = 0;
  private maxSpeedMs = 0;
  private route: Coordinate[] = [];
  private elevation = new ElevationGain();

  /** Returns true when the fix was accepted and the snapshot changed. */
  addFix(fix: Fix): boolean {
    if (fix.accuracy !== null && fix.accuracy > MAX_ACCURACY_M) return false;

    if (!this.prev) {
      this.prev = fix;
      this.route.push({ latitude: fix.latitude, longitude: fix.longitude });
      this.elevation.add(fix.altitude ?? null, fix.altitudeAccuracy ?? null);
      return true;
    }

    const step = haversineMeters(this.prev, fix);
    if (step < MIN_STEP_M) return false;

    const dtSeconds = (fix.timestamp - this.prev.timestamp) / 1000;
    const impliedSpeed = dtSeconds > 0 ? step / dtSeconds : 0;
    if (impliedSpeed > MAX_PLAUSIBLE_SPEED_MS) return false;

    const osSpeed = fix.speed !== null && fix.speed >= 0 ? fix.speed : null;
    const speed = Math.min(osSpeed ?? impliedSpeed, MAX_PLAUSIBLE_SPEED_MS);

    this.distanceM += step;
    this.maxSpeedMs = Math.max(this.maxSpeedMs, speed);
    this.route.push({ latitude: fix.latitude, longitude: fix.longitude });
    this.elevation.add(fix.altitude ?? null, fix.altitudeAccuracy ?? null);
    this.prev = fix;
    return true;
  }

  /** Call after a pause so the gap travelled while paused is not counted. */
  breakSegment() {
    this.prev = null;
  }

  snapshot(): TrackSnapshot {
    return {
      distanceM: this.distanceM,
      maxSpeedMs: this.maxSpeedMs,
      route: [...this.route],
      elevationGainM: this.elevation.total(),
    };
  }
}
