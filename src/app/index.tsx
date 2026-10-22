import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { use, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassPanel } from '@/components/glass-panel';
import { PrimaryButton } from '@/components/primary-button';
import { RouteMap } from '@/components/route-map';
import { ShareCardModal } from '@/components/share-card-modal';
import { SessionStatsPanel, Stat } from '@/components/session-stats';
import { Brand, BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import { TabBarContext } from '@/context/tab-bar-context';
import { createSession, getLastUsedVehicleId } from '@/db/sessions';
import { listActiveVehicles, type Vehicle } from '@/db/vehicles';
import type { Coordinate } from '@/tracking/geo';
import {
  distanceUnitLabel,
  formatDistance,
  formatDuration,
  formatSpeed,
  speedUnitLabel,
} from '@/tracking/format';
import { useRecorder } from '@/tracking/use-recorder';
import { photoUriFor } from '@/vehicles/photo';

type Summary = {
  vehicleName: string;
  photoUri: string | null;
  startedAt: number;
  distanceM: number;
  durationS: number;
  maxSpeedMs: number;
  route: Coordinate[];
};

export default function RecordScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [permission, requestPermission, refreshPermission] = Location.useForegroundPermissions();
  const recorder = useRecorder();
  const { setTabBarHidden } = use(TabBarContext);

  // Focus mode: hide the tab bar while a session is running, and bring it back when
  // the session ends or the user leaves this tab.
  const recording = recorder.phase !== 'idle';
  useFocusEffect(
    useCallback(() => {
      setTabBarHidden(recording);
      return () => setTabBarHidden(false);
    }, [recording, setTabBarHidden]),
  );

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Reload the garage whenever this tab is shown. Keep the selection if that vehicle still exists;
  // otherwise preselect the last used vehicle, or the first one.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [list, lastUsed] = await Promise.all([
          listActiveVehicles(db),
          getLastUsedVehicleId(db),
        ]);
        if (cancelled) return;
        setVehicles(list);
        setSelectedId((current) => {
          if (current !== null && list.some((v) => v.id === current)) return current;
          if (lastUsed !== null && list.some((v) => v.id === lastUsed)) return lastUsed;
          return list[0]?.id ?? null;
        });
      })();
      return () => {
        cancelled = true;
      };
    }, [db]),
  );

  // The user can change the permission in iOS Settings and come back: read it again each time.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermission();
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const selected = vehicles.find((v) => v.id === selectedId) ?? null;

  const explainLocation = () => {
    Alert.alert(
      'Location access needed',
      'Allow location while using the app, and keep Precise Location on, then try again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  };

  const startRecording = async () => {
    // Check the real permission now, not the value remembered from earlier.
    let current = await Location.getForegroundPermissionsAsync();
    if (!current.granted && current.canAskAgain) current = await requestPermission();
    if (!current.granted) {
      explainLocation();
      return;
    }
    try {
      await recorder.start();
    } catch {
      Alert.alert(
        'Could not start GPS',
        'Check that Location Services are on and that this app is allowed to use your precise location.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

  const finish = async () => {
    if (!selected) return;
    const result = recorder.finish();
    try {
      await createSession(db, { vehicleId: selected.id, ...result });
    } catch {
      Alert.alert('Could not save', 'The session could not be saved to your phone.');
    }
    setSummary({
      vehicleName: selected.name,
      photoUri: photoUriFor(selected.photoFile),
      startedAt: result.startedAt,
      distanceM: result.distanceM,
      durationS: result.durationS,
      maxSpeedMs: result.maxSpeedMs,
      route: result.route,
    });
  };

  if (summary) {
    return <SummaryView summary={summary} onDone={() => setSummary(null)} />;
  }

  if (recorder.phase !== 'idle') {
    return (
      <RecordingView vehicleName={selected?.name ?? ''} recorder={recorder} onFinish={finish} />
    );
  }

  if (permission === null) return <Screen />;

  if (!permission.granted) {
    return (
      <Screen title="Record">
        <GlassPanel>
          <Text style={styles.panelTitle}>Location access needed</Text>
          <Text style={styles.secondary}>
            Rolla uses your location to measure distance, speed and draw your route. It is only used
            while you record.
          </Text>
        </GlassPanel>
        {permission.canAskAgain ? (
          <PrimaryButton label="Allow location" onPress={() => requestPermission()} />
        ) : (
          <PrimaryButton label="Open Settings" onPress={() => Linking.openSettings()} />
        )}
      </Screen>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Screen title="Record">
        <GlassPanel>
          <Text style={styles.panelTitle}>Add a vehicle first</Text>
          <Text style={styles.secondary}>
            Sessions are recorded for one of your vehicles. Create one in the Garage.
          </Text>
        </GlassPanel>
        <PrimaryButton label="Go to Garage" onPress={() => router.navigate('/garage')} />
      </Screen>
    );
  }

  return (
    <Screen title="Record">
      <View style={styles.group}>
        <Text style={styles.label}>Vehicle</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {vehicles.map((v) => {
            const active = v.id === selectedId;
            return (
              <Pressable
                key={v.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedId(v.id)}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{v.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <GlassPanel>
        <Text style={styles.secondary}>
          Keep the app open while you ride. Recording pauses if you lock the screen or switch apps.
        </Text>
      </GlassPanel>

      <View style={styles.spacer} />
      <PrimaryButton label="Start" disabled={!selected} onPress={startRecording} />
    </Screen>
  );
}

function RecordingView({
  vehicleName,
  recorder,
  onFinish,
}: {
  vehicleName: string;
  recorder: ReturnType<typeof useRecorder>;
  onFinish: () => void;
}) {
  const { settings } = useSettings();
  const unit = settings.unit;
  const paused = recorder.phase === 'paused';
  const insets = useSafeAreaInsets();
  const avgSpeedMs = recorder.elapsedS > 0 ? recorder.distanceM / recorder.elapsedS : 0;

  return (
    <View style={styles.fill}>
      <RouteMap route={recorder.route} live />

      <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="none">
        <GlassPanel style={styles.vehicleChip}>
          <Text style={styles.chipLabel}>{paused ? `${vehicleName} · Paused` : vehicleName}</Text>
        </GlassPanel>
      </SafeAreaView>

      <GlassPanel style={[styles.statsPanel, { bottom: insets.bottom + Spacing.three }]}>
        {recorder.route.length === 0 && (
          <Text style={styles.secondary}>
            {recorder.elapsedS >= 15
              ? 'Still no GPS fix. Go outside and make sure Precise Location is on for this app.'
              : 'Looking for GPS signal…'}
          </Text>
        )}
        <View style={styles.distanceRow}>
          <Text style={styles.display}>{formatDistance(recorder.distanceM, unit)}</Text>
          <Text style={styles.displayUnit}>{distanceUnitLabel(unit)}</Text>
        </View>
        <View style={styles.statsRow}>
          <Stat label="Time" value={formatDuration(recorder.elapsedS)} />
          <Stat label={`Avg ${speedUnitLabel(unit)}`} value={formatSpeed(avgSpeedMs, unit)} />
        </View>
        <View style={styles.buttonRow}>
          {paused ? (
            <PrimaryButton label="Resume" style={styles.flex} onPress={() => recorder.resume()} />
          ) : (
            <PrimaryButton
              label="Pause"
              tone="alert"
              style={styles.flex}
              onPress={() => recorder.pause()}
            />
          )}
          <PrimaryButton label="Finish" tone="glass" style={styles.flex} onPress={onFinish} />
        </View>
      </GlassPanel>
    </View>
  );
}

function SummaryView({ summary, onDone }: { summary: Summary; onDone: () => void }) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <Screen title={summary.vehicleName}>
      {summary.route.length > 1 ? (
        <View style={styles.summaryMap}>
          <RouteMap route={summary.route} />
        </View>
      ) : (
        <GlassPanel>
          <Text style={styles.panelTitle}>No route recorded</Text>
          <Text style={styles.secondary}>
            You did not move far enough, or the GPS signal was too weak. Try again outdoors.
          </Text>
        </GlassPanel>
      )}
      <SessionStatsPanel
        distanceM={summary.distanceM}
        durationS={summary.durationS}
        maxSpeedMs={summary.maxSpeedMs}
      />
      <PrimaryButton label="Share card" onPress={() => setShareOpen(true)} />
      <PrimaryButton label="Done" tone="glass" onPress={onDone} />
      <ShareCardModal visible={shareOpen} data={summary} onClose={() => setShareOpen(false)} />
    </Screen>
  );
}

function Screen({ title, children }: { title?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </SafeAreaView>
    </View>
  );
}

const text = Colors.dark.text;
const textSecondary = Colors.dark.textSecondary;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  fill: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  title: {
    color: text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
  },
  panelTitle: {
    color: text,
    fontSize: 17,
    fontWeight: '600',
  },
  secondary: {
    color: textSecondary,
    fontSize: 15,
  },
  label: {
    color: textSecondary,
    fontSize: 13,
  },
  group: {
    gap: Spacing.two,
  },
  chips: {
    gap: Spacing.two,
  },
  chip: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.backgroundElement,
  },
  chipActive: {
    backgroundColor: Brand.accent,
  },
  chipLabel: {
    color: text,
    fontSize: 15,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: Brand.onAccent,
  },
  spacer: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: Spacing.three,
    right: Spacing.three,
    alignItems: 'flex-start',
  },
  vehicleChip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 16, 18, 0.7)',
  },
  statsPanel: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
    backgroundColor: 'rgba(15, 16, 18, 0.8)',
  },
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
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  summaryMap: {
    height: 260,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Brand.glassBorder,
  },
});
