import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Polyline, Rect, Stop } from 'react-native-svg';

import { Fonts } from '@/constants/theme';
import {
  CARD_ASPECT,
  DESIGN_WIDTH,
  useCardStats,
  usePlottedRoute,
  type TemplateProps,
} from './common';

const CYAN = '#2DF3FF';
const PINK = '#FF3DCB';
const SKY_TOP = '#12002E';
const SKY_BOTTOM = '#4A0E5C';

/** Template 5, Neon retro: synthwave sun and perspective grid, monospace type with a glow. */
export const NeonCard = forwardRef<View, TemplateProps>(function NeonCard({ data, width }, ref) {
  const u = width / DESIGN_WIDTH;
  const height = width * CARD_ASPECT;
  const s = useCardStats(data);

  const horizon = 405 * u;
  const sunR = 112 * u;
  const sunY = 330 * u;

  const routeBox = { width: 300 * u, height: 220 * u };
  const plotted = usePlottedRoute(data.route, routeBox.width, routeBox.height, 18 * u);

  const spokes = Array.from({ length: 15 }, (_, i) => i - 7);
  const rungs = Array.from({ length: 8 }, (_, i) => i);
  const slits = [0, 1, 2, 3, 4];

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={SKY_TOP} />
            <Stop offset="1" stopColor={SKY_BOTTOM} />
          </LinearGradient>
          <LinearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFE14D" />
            <Stop offset="1" stopColor={PINK} />
          </LinearGradient>
          <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2A0646" />
            <Stop offset="1" stopColor="#0A0014" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#sky)" />
        <Circle cx={width / 2} cy={sunY} r={sunR} fill="url(#sun)" />
        {slits.map((i) => (
          <Rect
            key={`slit${i}`}
            x={width / 2 - sunR}
            y={sunY + 10 * u + i * 17 * u}
            width={sunR * 2}
            height={(2 + i * 1.6) * u}
            fill={SKY_BOTTOM}
          />
        ))}
        <Rect x="0" y={horizon} width={width} height={height - horizon} fill="url(#ground)" />
        <Line x1="0" y1={horizon} x2={width} y2={horizon} stroke={PINK} strokeWidth={2 * u} />
        {spokes.map((i) => (
          <Line
            key={`spoke${i}`}
            x1={width / 2 + i * 8 * u}
            y1={horizon}
            x2={width / 2 + i * 70 * u}
            y2={height}
            stroke={PINK}
            strokeOpacity={0.55}
            strokeWidth={1.2 * u}
          />
        ))}
        {rungs.map((i) => {
          const y = horizon + (height - horizon) * Math.pow((i + 1) / 8, 2);
          return (
            <Line
              key={`rung${i}`}
              x1="0"
              y1={y}
              x2={width}
              y2={y}
              stroke={PINK}
              strokeOpacity={0.55}
              strokeWidth={1.2 * u}
            />
          );
        })}
      </Svg>

      <View style={{ paddingHorizontal: 20 * u, paddingTop: 44 * u }}>
        <Text style={[styles.brand, { fontSize: 12 * u, letterSpacing: 5 * u }]}>ROLLA</Text>
        <View style={[styles.nameRow, { gap: 10 * u, marginTop: 8 * u }]}>
          {data.photoUri ? (
            <Image
              source={{ uri: data.photoUri }}
              style={{
                width: 44 * u,
                height: 44 * u,
                borderRadius: 22 * u,
                borderWidth: 2 * u,
                borderColor: CYAN,
              }}
            />
          ) : null}
          <Text
            style={[
              styles.name,
              { fontSize: 26 * u, textShadowRadius: 12 * u, letterSpacing: 1 * u },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}>
            {data.vehicleName.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.sub, { fontSize: 11 * u, marginTop: 4 * u }]}>
          {(s.userName ? `${s.userName} // ${s.date}` : s.date).toUpperCase()}
        </Text>
      </View>

      <View style={[styles.routeArea, { top: 150 * u, left: 30 * u, ...routeBox }]}>
        {plotted ? (
          <Svg width={routeBox.width} height={routeBox.height}>
            <Polyline
              points={plotted.points}
              fill="none"
              stroke={CYAN}
              strokeOpacity={0.3}
              strokeWidth={14 * u}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points={plotted.points}
              fill="none"
              stroke={CYAN}
              strokeWidth={4 * u}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={plotted.end.x} cy={plotted.end.y} r={7 * u} fill="#FFFFFF" />
          </Svg>
        ) : (
          <Text style={[styles.sub, { fontSize: 11 * u }]}>ROUTE HIDDEN ON SHORT RIDES</Text>
        )}
      </View>

      <View style={[styles.stats, { left: 20 * u, right: 20 * u, bottom: 36 * u }]}>
        <View style={[styles.statsBox, { padding: 14 * u, borderWidth: 2 * u, gap: 8 * u }]}>
          <View style={styles.distanceRow}>
            <Text style={[styles.distance, { fontSize: 50 * u, lineHeight: 54 * u }]}>
              {s.distance}
            </Text>
            <Text style={[styles.sub, { fontSize: 16 * u, marginLeft: 6 * u }]}>
              {s.distanceUnit.toUpperCase()}
            </Text>
          </View>
          <View style={styles.row}>
            <Stat u={u} label="TIME" value={s.time} />
            <Stat u={u} label="AVG" value={s.avg} />
            <Stat u={u} label="MAX" value={s.max} />
          </View>
        </View>
      </View>
    </View>
  );
});

function Stat({ u, label, value }: { u: number; label: string; value: string }) {
  return (
    <View>
      <Text style={[styles.statValue, { fontSize: 18 * u }]}>{value}</Text>
      <Text style={[styles.sub, { fontSize: 10 * u, letterSpacing: 2 * u }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: SKY_TOP, overflow: 'hidden' },
  brand: { color: PINK, fontFamily: Fonts.mono, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: {
    flex: 1,
    color: CYAN,
    fontFamily: Fonts.mono,
    fontWeight: '800',
    textShadowColor: CYAN,
    textShadowOffset: { width: 0, height: 0 },
  },
  sub: { color: 'rgba(255, 255, 255, 0.8)', fontFamily: Fonts.mono },
  routeArea: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  stats: { position: 'absolute' },
  statsBox: {
    backgroundColor: 'rgba(10, 0, 20, 0.78)',
    borderColor: CYAN,
    borderRadius: 4,
  },
  distanceRow: { flexDirection: 'row', alignItems: 'baseline' },
  distance: {
    color: '#FFFFFF',
    fontFamily: Fonts.mono,
    fontWeight: '800',
    textShadowColor: PINK,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { color: CYAN, fontFamily: Fonts.mono, fontWeight: '700' },
});
