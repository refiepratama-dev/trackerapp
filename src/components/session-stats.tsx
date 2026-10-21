import { StyleSheet, Text, View } from 'react-native';

import { GlassPanel } from '@/components/glass-panel';
import { Colors, Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import {
  distanceUnitLabel,
  formatDistance,
  formatDuration,
  formatSpeed,
  speedUnitLabel,
} from '@/tracking/format';

const { text, textSecondary } = Colors.dark;

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type SessionStatsPanelProps = {
  distanceM: number;
  durationS: number;
  maxSpeedMs: number;
};

/** Big distance plus time, average and max speed. Used by the session summary and History detail. */
export function SessionStatsPanel({ distanceM, durationS, maxSpeedMs }: SessionStatsPanelProps) {
  const { settings } = useSettings();
  const unit = settings.unit;
  const avgSpeedMs = durationS > 0 ? distanceM / durationS : 0;

  return (
    <GlassPanel>
      <View style={styles.distanceRow}>
        <Text style={styles.display}>{formatDistance(distanceM, unit)}</Text>
        <Text style={styles.displayUnit}>{distanceUnitLabel(unit)}</Text>
      </View>
      <View style={styles.statsRow}>
        <Stat label="Time" value={formatDuration(durationS)} />
        <Stat label={`Avg ${speedUnitLabel(unit)}`} value={formatSpeed(avgSpeedMs, unit)} />
        <Stat label={`Max ${speedUnitLabel(unit)}`} value={formatSpeed(maxSpeedMs, unit)} />
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  display: {
    color: text,
    fontSize: 56,
    lineHeight: 62,
    fontWeight: '700',
  },
  displayUnit: {
    color: textSecondary,
    fontSize: 17,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  stat: {
    gap: Spacing.half,
  },
  statValue: {
    color: text,
    fontSize: 28,
    fontWeight: '600',
  },
  statLabel: {
    color: textSecondary,
    fontSize: 13,
  },
});
