import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { Brand } from '@/constants/theme';
import {
  CARD_ASPECT,
  DESIGN_WIDTH,
  useCardStats,
  usePlottedRoute,
  type TemplateProps,
} from './common';

const INK = Brand.onAccent;

/** Template 2, Poster: full lime sheet, enormous black distance, thick line, ruled stat rows. */
export const PosterCard = forwardRef<View, TemplateProps>(function PosterCard(
  { data, width },
  ref,
) {
  const u = width / DESIGN_WIDTH;
  const height = width * CARD_ASPECT;
  const s = useCardStats(data);

  const routeBox = { width: 320 * u, height: 170 * u };
  const plotted = usePlottedRoute(data.route, routeBox.width, routeBox.height, 14 * u);

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height, padding: 20 * u }]}>
      <View style={[styles.topRow, { paddingTop: 24 * u }]}>
        <Text style={[styles.tiny, { fontSize: 12 * u, letterSpacing: 5 * u }]}>ROLLA</Text>
        <Text style={[styles.tiny, { fontSize: 12 * u, letterSpacing: 1 * u }]}>
          {s.date.toUpperCase()}
        </Text>
      </View>

      <View style={[styles.nameRow, { gap: 10 * u, marginTop: 18 * u }]}>
        {data.photoUri ? (
          <Image
            source={{ uri: data.photoUri }}
            style={{ width: 44 * u, height: 44 * u, borderRadius: 8 * u }}
          />
        ) : null}
        <Text
          style={[styles.name, { fontSize: 26 * u, letterSpacing: -0.5 * u }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}>
          {data.vehicleName.toUpperCase()}
        </Text>
      </View>
      {s.userName ? (
        <Text style={[styles.tiny, { fontSize: 12 * u, marginTop: 4 * u, letterSpacing: 1 * u }]}>
          {s.userName.toUpperCase()}
        </Text>
      ) : null}

      <Text
        style={[
          styles.huge,
          { fontSize: 150 * u, lineHeight: 150 * u, letterSpacing: -6 * u, marginTop: 10 * u },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.35}>
        {s.distance}
      </Text>
      <Text style={[styles.unit, { fontSize: 16 * u, letterSpacing: 8 * u }]}>
        {s.distanceUnit === 'mi' ? 'MILES' : 'KILOMETERS'}
      </Text>

      <View style={[styles.routeArea, { height: routeBox.height, marginTop: 10 * u }]}>
        {plotted ? (
          <Svg width={routeBox.width} height={routeBox.height}>
            <Polyline
              points={plotted.points}
              fill="none"
              stroke={INK}
              strokeWidth={9 * u}
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <Circle cx={plotted.end.x} cy={plotted.end.y} r={9 * u} fill={INK} />
          </Svg>
        ) : (
          <Text style={[styles.tiny, { fontSize: 12 * u }]}>ROUTE HIDDEN ON SHORT RIDES</Text>
        )}
      </View>

      <View style={{ marginTop: 'auto', marginBottom: 20 * u }}>
        <Row u={u} label="TIME" value={s.time} />
        <Row u={u} label={s.avgLabel.toUpperCase()} value={s.avg} />
        <Row u={u} label={s.maxLabel.toUpperCase()} value={s.max} last />
      </View>
    </View>
  );
});

function Row({
  u,
  label,
  value,
  last,
}: {
  u: number;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.statRow,
        {
          paddingVertical: 10 * u,
          borderTopWidth: 3 * u,
          borderBottomWidth: last ? 3 * u : 0,
        },
      ]}>
      <Text style={[styles.tiny, { fontSize: 13 * u, letterSpacing: 3 * u }]}>{label}</Text>
      <Text style={[styles.statValue, { fontSize: 30 * u }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Brand.accent, overflow: 'hidden' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tiny: { color: INK, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, color: INK, fontWeight: '900' },
  huge: { color: INK, fontWeight: '900', fontVariant: ['tabular-nums'] },
  unit: { color: INK, fontWeight: '800' },
  routeArea: { alignItems: 'center', justifyContent: 'center' },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: INK,
  },
  statValue: { color: INK, fontWeight: '900', fontVariant: ['tabular-nums'] },
});
