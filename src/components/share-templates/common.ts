import { useMemo } from 'react';

import { useSettings } from '@/context/settings-context';
import { plotRoute, ROUTE_PRIVACY_TRIM_M, trimRoute } from '@/share/trim-route';
import type { Coordinate } from '@/tracking/geo';
import {
  distanceUnitLabel,
  elevationUnitLabel,
  formatDistance,
  formatElevation,
  formatDuration,
  formatSpeed,
  speedUnitLabel,
} from '@/tracking/format';
import { formatSessionDate } from '@/tracking/format-date';

/** Everything a share card shows. */
export type ShareCardData = {
  vehicleName: string;
  /** Full address of the vehicle's photo; cards have no picture without it. */
  photoUri?: string | null;
  startedAt: number;
  distanceM: number;
  durationS: number;
  maxSpeedMs: number;
  route: Coordinate[];
  /** Total climb in meters; left out of the card when null or missing. */
  elevationGainM?: number | null;
  /** Estimated kilocalories; left out of the card when null or missing. */
  caloriesKcal?: number | null;
};

/** Every template is designed on a 360 x 640 grid (9:16, Instagram Story) and scaled to `width`. */
export const DESIGN_WIDTH = 360;
export const CARD_ASPECT = 16 / 9;

export type TemplateProps = {
  data: ShareCardData;
  width: number;
};

/** Texts shared by all templates, already formatted for the user's unit. */
export function useCardStats(data: ShareCardData) {
  const { settings } = useSettings();
  const unit = settings.unit;
  const avgSpeedMs = data.durationS > 0 ? data.distanceM / data.durationS : 0;
  return {
    userName: settings.userName,
    date: formatSessionDate(data.startedAt),
    distance: formatDistance(data.distanceM, unit),
    distanceUnit: distanceUnitLabel(unit),
    time: formatDuration(data.durationS),
    avgLabel: `Avg ${speedUnitLabel(unit)}`,
    avg: formatSpeed(avgSpeedMs, unit),
    maxLabel: `Max ${speedUnitLabel(unit)}`,
    max: formatSpeed(data.maxSpeedMs, unit),
    /** Climb with its unit, e.g. "42 m"; null when there is no altitude data. */
    elevation:
      data.elevationGainM != null
        ? `${formatElevation(data.elevationGainM, unit)} ${elevationUnitLabel(unit)}`
        : null,
    /** Calories as "~312"; null when no body weight was set. */
    calories: data.caloriesKcal != null ? `~${data.caloriesKcal}` : null,
    /** How many of the two optional stats are present (0 to 2). */
    extraCount: (data.elevationGainM != null ? 1 : 0) + (data.caloriesKcal != null ? 1 : 0),
  };
}

/**
 * The route projected into a box. The start and end are cut for privacy unless the user turned
 * that off in Settings; null when too little route is left to draw.
 */
export function usePlottedRoute(route: Coordinate[], width: number, height: number, pad: number) {
  const { settings } = useSettings();
  const trimMeters = settings.hideRouteEnds ? ROUTE_PRIVACY_TRIM_M : 0;
  return useMemo(
    () => plotRoute(trimRoute(route, trimMeters), width, height, pad),
    [route, trimMeters, width, height, pad],
  );
}
