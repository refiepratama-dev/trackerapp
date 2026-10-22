import { useMemo } from 'react';

import { useSettings } from '@/context/settings-context';
import { plotRoute, trimRoute } from '@/share/trim-route';
import type { Coordinate } from '@/tracking/geo';
import {
  distanceUnitLabel,
  formatDistance,
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
  };
}

/** The privacy-trimmed route projected into a box; null when the ride was too short. */
export function usePlottedRoute(route: Coordinate[], width: number, height: number, pad: number) {
  return useMemo(
    () => plotRoute(trimRoute(route), width, height, pad),
    [route, width, height, pad],
  );
}
