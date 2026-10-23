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

const FEET_PER_METER = 3.28084;
const POUNDS_PER_KG = 2.20462;

/** Climb as a whole number: meters for km, feet for miles. */
export function formatElevation(meters: number, unit: DistanceUnit = 'km'): string {
  return Math.round(unit === 'km' ? meters : meters * FEET_PER_METER).toString();
}

export function elevationUnitLabel(unit: DistanceUnit = 'km'): string {
  return unit === 'km' ? 'm' : 'ft';
}

/** Body weight for display: kg for km, lb for miles, one decimal at most. */
export function formatWeight(kg: number, unit: DistanceUnit = 'km'): string {
  const value = unit === 'km' ? kg : kg * POUNDS_PER_KG;
  return String(Math.round(value * 10) / 10);
}

/** Parses typed body weight (in kg or lb) to kg. Returns null when empty or out of range. */
export function parseWeightInput(text: string, unit: DistanceUnit = 'km'): number | null {
  const value = Number(text.trim().replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return null;
  const kg = unit === 'km' ? value : value / POUNDS_PER_KG;
  return kg >= 20 && kg <= 300 ? kg : null;
}
