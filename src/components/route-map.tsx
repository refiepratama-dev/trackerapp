import { useEffect, useRef } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';

import { Brand } from '@/constants/theme';
import type { Coordinate } from '@/tracking/geo';

type RouteMapProps = {
  route: Coordinate[];
  /** Follow the user's live position (recording) instead of fitting the whole route (summary). */
  live?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Apple Maps (dark) with the route as a lime line. */
export function RouteMap({ route, live = false, style }: RouteMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (live || route.length < 2) return;
    mapRef.current?.fitToCoordinates(route, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: false,
    });
  }, [live, route]);

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      userInterfaceStyle="dark"
      showsUserLocation={live}
      followsUserLocation={live}
      showsCompass={false}
      pitchEnabled={false}>
      {route.length > 1 && (
        <Polyline coordinates={route} strokeColor={Brand.accent} strokeWidth={5} />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
