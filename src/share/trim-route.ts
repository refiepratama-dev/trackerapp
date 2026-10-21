import { haversineMeters, type Coordinate } from '@/tracking/geo';

/** Hidden at both ends of a shared route so the card does not reveal where you live or park. */
export const ROUTE_PRIVACY_TRIM_M = 150;

/**
 * Removes the first and last `trimMeters` of the route (measured along the path).
 * Returns an empty list when too little is left to draw a line.
 */
export function trimRoute(route: Coordinate[], trimMeters = ROUTE_PRIVACY_TRIM_M): Coordinate[] {
  if (route.length < 2) return [];

  // Distance travelled along the route up to each point.
  const along: number[] = [0];
  for (let i = 1; i < route.length; i++) {
    along.push(along[i - 1] + haversineMeters(route[i - 1], route[i]));
  }
  const total = along[along.length - 1];
  if (total <= trimMeters * 2) return [];

  const kept = route.filter((_, i) => along[i] >= trimMeters && along[i] <= total - trimMeters);
  return kept.length >= 2 ? kept : [];
}

export type PlottedRoute = {
  /** SVG "points" attribute value */
  points: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
};

/**
 * Projects the route into a `width` x `height` box (with `padding`), keeping its true shape.
 * Uses an equirectangular projection, which is accurate enough at the scale of a ride.
 */
export function plotRoute(
  route: Coordinate[],
  width: number,
  height: number,
  padding: number,
): PlottedRoute | null {
  if (route.length < 2) return null;

  const meanLat = route.reduce((sum, p) => sum + p.latitude, 0) / route.length;
  const lonScale = Math.cos((meanLat * Math.PI) / 180);
  const xs = route.map((p) => p.longitude * lonScale);
  const ys = route.map((p) => -p.latitude);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1e-9);
  const spanY = Math.max(maxY - minY, 1e-9);

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scale = Math.min(innerW / spanX, innerH / spanY);
  const offsetX = padding + (innerW - spanX * scale) / 2;
  const offsetY = padding + (innerH - spanY * scale) / 2;

  const mapped = route.map((_, i) => ({
    x: offsetX + (xs[i] - minX) * scale,
    y: offsetY + (ys[i] - minY) * scale,
  }));

  return {
    points: mapped.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    start: mapped[0],
    end: mapped[mapped.length - 1],
  };
}
