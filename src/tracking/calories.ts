/**
 * Rough calorie estimate from MET values (Compendium of Physical Activities):
 * calories = MET x body weight (kg) x hours. It is an estimate, not a measurement.
 */

const FIXED_MET: Record<string, number> = {
  'electric bike': 4.0,
  skateboard: 5.0,
  scooter: 4.5,
  'electric scooter': 2.5,
  'roller skates': 7.0,
};

/** Used for custom vehicle types. */
const DEFAULT_MET = 4.0;

/** Cycling effort grows quickly with speed, so it is picked from the average speed. */
function bicycleMet(avgKmh: number): number {
  if (avgKmh < 16) return 4.0;
  if (avgKmh < 19.3) return 6.8;
  if (avgKmh < 22.5) return 8.0;
  if (avgKmh < 25.8) return 10.0;
  return 12.0;
}

export type CalorieInput = {
  /** Vehicle type name, e.g. "Bicycle". */
  typeName: string;
  /** Body weight in kg; null or 0 when the user has not set it. */
  weightKg: number | null;
  /** Moving time in seconds (time spent paused is not included). */
  durationS: number;
  distanceM: number;
};

/** Estimated kilocalories, or null when the weight is unknown or there was no moving time. */
export function estimateCalories({
  typeName,
  weightKg,
  durationS,
  distanceM,
}: CalorieInput): number | null {
  if (!weightKg || weightKg <= 0 || durationS <= 0) return null;

  const key = typeName.trim().toLowerCase();
  const avgKmh = (distanceM / durationS) * 3.6;
  const met = key === 'bicycle' ? bicycleMet(avgKmh) : (FIXED_MET[key] ?? DEFAULT_MET);

  return Math.round(met * weightKg * (durationS / 3600));
}
