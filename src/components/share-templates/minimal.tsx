import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { Fonts } from '@/constants/theme';
import {
  CARD_ASPECT,
  DESIGN_WIDTH,
  useCardStats,
  usePlottedRoute,
  type TemplateProps,
} from './common';

const PAPER = '#F3EFE6';
const INK = '#1B1B1B';
const SOFT = 'rgba(27, 27, 27, 0.55)';

/** Template 4, Minimal: warm paper, serif type, a hairline route and plenty of air. */
export const MinimalCard = forwardRef<View, TemplateProps>(function MinimalCard(
  { data, width },
  ref,
) {
  const u = width / DESIGN_WIDTH;
  const height = width * CARD_ASPECT;
  const s = useCardStats(data);

  const routeBox = { width: 280 * u, height: (s.extraCount > 0 ? 200 : 240) * u };
  const plotted = usePlottedRoute(data.route, routeBox.width, routeBox.height, 16 * u);

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height }]}>
      <Text style={[styles.brand, { fontSize: 11 * u, letterSpacing: 6 * u, marginTop: 52 * u }]}>
        ROLLA
      </Text>

      <View style={{ alignItems: 'center', marginTop: 34 * u, paddingHorizontal: 24 * u }}>
        {data.photoUri ? (
          <Image
            source={{ uri: data.photoUri }}
            style={{ width: 46 * u, height: 46 * u, borderRadius: 23 * u, marginBottom: 10 * u }}
          />
        ) : null}
        <Text style={[styles.name, { fontSize: 30 * u }]} numberOfLines={2}>
          {data.vehicleName}
        </Text>
        <Text style={[styles.soft, { fontSize: 13 * u, marginTop: 6 * u }]}>
          {s.userName ? `${s.userName}, ${s.date}` : s.date}
        </Text>
      </View>

      <View style={[styles.routeArea, { height: routeBox.height, marginTop: 20 * u }]}>
        {plotted ? (
          <Svg width={routeBox.width} height={routeBox.height}>
            <Polyline
              points={plotted.points}
              fill="none"
              stroke={INK}
              strokeWidth={2 * u}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={plotted.end.x} cy={plotted.end.y} r={4.5 * u} fill={INK} />
          </Svg>
        ) : (
          <Text style={[styles.softItalic, { fontSize: 14 * u }]}>Route hidden on short rides</Text>
        )}
      </View>

      <View style={{ alignItems: 'center', marginTop: 'auto', marginBottom: 46 * u }}>
        <Text style={[styles.distance, { fontSize: 84 * u, lineHeight: 88 * u }]}>
          {s.distance}
        </Text>
        <Text style={[styles.soft, { fontSize: 14 * u, letterSpacing: 4 * u }]}>
          {s.distanceUnit.toUpperCase()}
        </Text>
        <View style={[styles.rule, { width: 40 * u, marginVertical: 18 * u }]} />
        <Text style={[styles.line, { fontSize: 15 * u }]}>
          {s.time} · {s.avg} avg · {s.max} max
        </Text>
        {s.extraCount > 0 ? (
          <Text style={[styles.line, { fontSize: 15 * u, marginTop: 6 * u }]}>
            {[s.elevation ? `${s.elevation} climb` : null, s.calories ? `${s.calories} kcal` : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: PAPER, overflow: 'hidden', alignItems: 'stretch' },
  brand: { color: INK, textAlign: 'center', fontWeight: '600' },
  name: { color: INK, fontFamily: Fonts.serif, fontStyle: 'italic', textAlign: 'center' },
  soft: { color: SOFT, fontFamily: Fonts.serif, textAlign: 'center' },
  softItalic: { color: SOFT, fontFamily: Fonts.serif, fontStyle: 'italic' },
  routeArea: { alignItems: 'center', justifyContent: 'center' },
  distance: { color: INK, fontFamily: Fonts.serif, fontWeight: '300' },
  rule: { height: 1, backgroundColor: INK },
  line: { color: INK, fontFamily: Fonts.serif },
});
