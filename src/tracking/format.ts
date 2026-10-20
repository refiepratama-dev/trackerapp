export type DistanceUnit = 'km' | 'mi';

const METERS_PER_MILE = 1609.344;

export function formatDistance(meters: number, unit: DistanceUnit = 'km'): string {
  const value = unit === 'km' ? meters / 1000 : meters / METERS_PER_MILE;
  return value.toFixed(2);
}

export function distanceUnitLabel(unit: DistanceUnit = 'km'): string {
  return unit;
}

/** m/s to km/h or mph, one decimal. */
export function formatSpeed(metersPerSecond: number, unit: DistanceUnit = 'km'): string {
  const perHour = metersPerSecond * 3600;
  const value = unit === 'km' ? perHour / 1000 : perHour / METERS_PER_MILE;
  return value.toFixed(1);
}

export function speedUnitLabel(unit: DistanceUnit = 'km'): string {
  return unit === 'km' ? 'km/h' : 'mph';
}

/** 75 -> "1:15", 3725 -> "1:02:05" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}
