import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Polyline, Stop } from 'react-native-svg';

import { Brand, Fonts } from '@/constants/theme';
import {
  CARD_ASPECT,
  DESIGN_WIDTH,
  useCardStats,
  usePlottedRoute,
  type TemplateProps,
} from './common';

const BG = '#0A0E1A';
const GRID = 'rgba(120, 160, 255, 0.10)';

/** Template 3, Big map: the route fills the whole card, with text kept small around it. */
export const BigMapCard = forwardRef<View, TemplateProps>(function BigMapCard(
  { data, width },
  ref,
) {
  const u = width / DESIGN_WIDTH;
  const height = width * CARD_ASPECT;
  const s = useCardStats(data);

  const mapBox = { width: 360 * u, height: 470 * u };
  const plotted = usePlottedRoute(data.route, mapBox.width, mapBox.height, 36 * u);

  // Faint street-grid look behind the route.
  const gridLines: number[] = [];
  for (let i = 1; i < 9; i++) gridLines.push(i);

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {gridLines.map((i) => (
          <Polyline
            key={`v${i}`}
            points={`${(width / 9) * i},0 ${(width / 9) * i},${height}`}
            stroke={GRID}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 15 }, (_, i) => i + 1).map((i) => (
          <Polyline
            key={`h${i}`}
            points={`0,${(height / 16) * i} ${width},${(height / 16) * i}`}
            stroke={GRID}
            strokeWidth={1}
          />
        ))}
      </Svg>

      <View style={[styles.mapArea, { top: 96 * u, width: mapBox.width, height: mapBox.height }]}>
        {plotted ? (
          <Svg width={mapBox.width} height={mapBox.height}>
            <Defs>
              <LinearGradient id="trail" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#7AA2FF" />
                <Stop offset="1" stopColor={Brand.accent} />
              </LinearGradient>
            </Defs>
            <Polyline
              points={plotted.points}
              fill="none"
              stroke="url(#trail)"
              strokeOpacity={0.22}
              strokeWidth={26 * u}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points={plotted.points}
              fill="none"
              stroke="url(#trail)"
              strokeWidth={7 * u}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={plotted.end.x} cy={plotted.end.y} r={10 * u} fill={Brand.accent} />
            <Circle cx={plotted.end.x} cy={plotted.end.y} r={4 * u} fill={BG} />
          </Svg>
        ) : (
          <Text style={[styles.dim, { fontSize: 14 * u }]}>Route hidden on short rides</Text>
        )}
      </View>

      <View style={[styles.header, { paddingHorizontal: 20 * u, paddingTop: 44 * u }]}>
        <View style={[styles.nameRow, { gap: 10 * u }]}>
          {data.photoUri ? (
            <Image
              source={{ uri: data.photoUri }}
              style={{ width: 38 * u, height: 38 * u, borderRadius: 19 * u }}
            />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { fontSize: 20 * u }]} numberOfLines={1}>
              {data.vehicleName}
            </Text>
            <Text style={[styles.dim, { fontSize: 12 * u }]}>
              {s.userName ? `${s.userName} · ${s.date}` : s.date}
            </Text>
          </View>
          <Text style={[styles.brand, { fontSize: 11 * u, letterSpacing: 3 * u }]}>ROLLA</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingHorizontal: 20 * u, paddingBottom: 40 * u }]}>
        <View style={styles.distanceRow}>
          <Text style={[styles.distance, { fontSize: 58 * u, lineHeight: 62 * u }]}>
            {s.distance}
          </Text>
          <Text style={[styles.dim, { fontSize: 16 * u, marginLeft: 6 * u }]}>
            {s.distanceUnit}
          </Text>
        </View>
        <View style={[styles.side, { gap: 4 * u }]}>
          <Text style={[styles.sideText, { fontSize: 14 * u }]}>{s.time}</Text>
          <Text style={[styles.sideText, { fontSize: 14 * u }]}>
            {s.avg} <Text style={styles.dim}>avg</Text>
          </Text>
          <Text style={[styles.sideText, { fontSize: 14 * u }]}>
            {s.max} <Text style={styles.dim}>max</Text>
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: BG, overflow: 'hidden' },
  mapArea: { position: 'absolute', left: 0, alignItems: 'center', justifyContent: 'center' },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { color: '#FFFFFF', fontFamily: Fonts.rounded, fontWeight: '700' },
  dim: { color: 'rgba(255, 255, 255, 0.55)', fontFamily: Fonts.rounded },
  brand: { color: Brand.accent, fontWeight: '700' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  distanceRow: { flexDirection: 'row', alignItems: 'baseline' },
  distance: { color: '#FFFFFF', fontFamily: Fonts.rounded, fontWeight: '800' },
  side: { alignItems: 'flex-end', paddingBottom: 6 },
  sideText: { color: '#FFFFFF', fontFamily: Fonts.rounded, fontWeight: '600' },
});
