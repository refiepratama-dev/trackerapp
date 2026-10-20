import * as Location from 'expo-location';
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

/** About 650 m across: close enough to see streets, wide enough to see where you are heading. */
const LIVE_SPAN_DEGREES = 0.006;

/** Apple Maps (dark) with the route as a lime line. */
export function RouteMap({ route, live = false, style }: RouteMapProps) {
  const mapRef = useRef<MapView>(null);

  // Without this the live map starts zoomed out to a whole country until the first GPS fix arrives.
  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    (async () => {
      const position =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      if (cancelled || !position) return;
      mapRef.current?.animateToRegion(
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: LIVE_SPAN_DEGREES,
          longitudeDelta: LIVE_SPAN_DEGREES,
        },
        0,
      );
    })().catch(() => {
      // No position yet: the map keeps following the user once a fix arrives.
    });
    return () => {
      cancelled = true;
    };
  }, [live]);

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
