import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Polyline, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Brand, Colors } from '@/constants/theme';
import {
  CARD_ASPECT,
  DESIGN_WIDTH,
  useCardStats,
  usePlottedRoute,
  type TemplateProps,
} from './common';

/** Template 1, Classic: dark card with a glowing route, big distance and a glass stats panel. */
export const ClassicCard = forwardRef<View, TemplateProps>(function ClassicCard(
  { data, width },
  ref,
) {
  const u = width / DESIGN_WIDTH;
  const height = width * CARD_ASPECT;
  const s = useCardStats(data);

  const routeBox = { width: 320 * u, height: 250 * u };
  const plotted = usePlottedRoute(data.route, routeBox.width, routeBox.height, 20 * u);

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="38%" rx="70%" ry="45%">
            <Stop offset="0" stopColor={Brand.accent} stopOpacity="0.16" />
            <Stop offset="1" stopColor={Brand.accent} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#glow)" />
      </Svg>

      <View style={{ paddingHorizontal: 20 * u, paddingTop: 44 * u }}>
        <Text style={[styles.brand, { fontSize: 13 * u, letterSpacing: 3 * u }]}>ROLLA</Text>
        <View style={[styles.vehicleRow, { gap: 14 * u, marginTop: 8 * u }]}>
          {data.photoUri ? (
            <Image
              source={{ uri: data.photoUri }}
              style={{ width: 64 * u, height: 64 * u, borderRadius: 32 * u }}
            />
          ) : null}
          <Text
            style={[styles.vehicle, { fontSize: 40 * u, lineHeight: 46 * u }]}
            numberOfLines={2}>
            {data.vehicleName}
          </Text>
        </View>
        <Text style={[styles.secondary, { fontSize: 15 * u, marginTop: 4 * u }]}>
          {s.userName ? `${s.userName} · ${s.date}` : s.date}
        </Text>
      </View>

      <View style={[styles.routeArea, { marginHorizontal: 20 * u, height: routeBox.height }]}>
        {plotted ? (
          <Svg width={routeBox.width} height={routeBox.height}>
            <Polyline
              points={plotted.points}
              fill="none"
              stroke={Brand.accent}
              strokeOpacity={0.25}
              strokeWidth={12 * u}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points={plotted.points}
              fill="none"
              stroke={Brand.accent}
              strokeWidth={4 * u}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={plotted.end.x} cy={plotted.end.y} r={6 * u} fill={Brand.accent} />
          </Svg>
        ) : (
          <Text style={[styles.secondary, { fontSize: 14 * u }]}>Route hidden on short rides</Text>
        )}
      </View>

      <View
        style={[
          styles.stats,
          {
            marginHorizontal: 20 * u,
            marginTop: 'auto',
            marginBottom: 40 * u,
            padding: 20 * u,
            borderRadius: 28 * u,
            gap: 12 * u,
          },
        ]}>
        <View style={styles.distanceRow}>
          <Text style={[styles.distance, { fontSize: 64 * u, lineHeight: 70 * u }]}>
            {s.distance}
          </Text>
          <Text style={[styles.secondary, { fontSize: 18 * u, marginLeft: 8 * u }]}>
            {s.distanceUnit}
          </Text>
        </View>
        <View style={styles.row}>
          <Stat u={u} label="Time" value={s.time} />
          <Stat u={u} label={s.avgLabel} value={s.avg} />
          <Stat u={u} label={s.maxLabel} value={s.max} />
        </View>
      </View>
    </View>
  );
});

function Stat({ u, label, value }: { u: number; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { fontSize: 22 * u }]}>{value}</Text>
      <Text style={[styles.secondary, { fontSize: 12 * u }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.dark.background, overflow: 'hidden' },
  brand: { color: Brand.accent, fontWeight: '700' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center' },
  vehicle: { flex: 1, color: Colors.dark.text, fontWeight: '700' },
  secondary: { color: Colors.dark.textSecondary },
  routeArea: { alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  stats: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Brand.glassBorder,
  },
  distanceRow: { flexDirection: 'row', alignItems: 'baseline' },
  distance: { color: Colors.dark.text, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { gap: 2 },
  statValue: { color: Colors.dark.text, fontWeight: '600' },
});
