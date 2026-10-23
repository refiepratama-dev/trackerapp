import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassPanel } from '@/components/glass-panel';
import { Stat } from '@/components/session-stats';
import { VehicleAvatar } from '@/components/vehicle-avatar';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import {
  getVehicleStats,
  listSessions,
  type SessionListItem,
  type VehicleRecord,
  type VehicleStats,
} from '@/db/sessions';
import { getVehicle, type Vehicle } from '@/db/vehicles';
import {
  distanceUnitLabel,
  elevationUnitLabel,
  formatDistance,
  formatDuration,
  formatElevation,
  formatSpeed,
  speedUnitLabel,
} from '@/tracking/format';
import { formatSessionDate } from '@/tracking/format-date';

const { text, textSecondary } = Colors.dark;

export default function VehicleProfileScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { settings } = useSettings();
  const unit = settings.unit;
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicleId = Number(id);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Reload on focus so the numbers are fresh after editing the vehicle or deleting a session.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([
        getVehicle(db, vehicleId),
        getVehicleStats(db, vehicleId),
        listSessions(db, vehicleId),
      ]).then(([v, s, list]) => {
        if (cancelled) return;
        setVehicle(v);
        setStats(s);
        setSessions(list);
        setLoaded(true);
      });
      return () => {
        cancelled = true;
      };
    }, [db, vehicleId]),
  );

  const openSession = (sessionId: number) =>
    router.push({ pathname: '/garage/session/[id]', params: { id: String(sessionId) } });

  if (!loaded) return <View style={styles.screen} />;

  if (!vehicle || !stats) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <GlassPanel>
            <Text style={styles.title}>Vehicle not found</Text>
            <Text style={styles.secondary}>It may have been deleted.</Text>
          </GlassPanel>
        </View>
      </View>
    );
  }

  const speedLabel = speedUnitLabel(unit);
  const records: { label: string; value: string; record: VehicleRecord | null }[] = [
    {
      label: 'Longest ride',
      value: `${formatDistance(stats.longestRide?.value ?? 0, unit)} ${distanceUnitLabel(unit)}`,
      record: stats.longestRide,
    },
    {
      label: 'Top speed',
      value: `${formatSpeed(stats.topSpeed?.value ?? 0, unit)} ${speedLabel}`,
      record: stats.topSpeed,
    },
    {
      label: 'Best average speed',
      value: `${formatSpeed(stats.bestAverageSpeed?.value ?? 0, unit)} ${speedLabel}`,
      record: stats.bestAverageSpeed,
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen
        options={{
          title: vehicle.name,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${vehicle.name}`}
              hitSlop={8}
              onPress={() =>
                router.push({ pathname: '/garage/edit', params: { id: String(vehicle.id) } })
              }>
              <Text style={styles.headerButton}>Edit</Text>
            </Pressable>
          ),
        }}
      />

      <View style={styles.header}>
        <VehicleAvatar name={vehicle.name} size={72} />
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={2}>
            {vehicle.name}
          </Text>
          <Text style={styles.secondary} numberOfLines={1}>
            {vehicle.brandModel ? `${vehicle.typeName} · ${vehicle.brandModel}` : vehicle.typeName}
          </Text>
        </View>
      </View>

      {stats.sessionCount === 0 ? (
        <GlassPanel>
          <Text style={styles.title}>No rides yet</Text>
          <Text style={styles.secondary}>
            Record a session with {vehicle.name} and its totals and records will show up here.
          </Text>
        </GlassPanel>
      ) : (
        <>
          <GlassPanel>
            <Text style={styles.sectionLabel}>All time</Text>
            <View style={styles.distanceRow}>
              <Text style={styles.display}>{formatDistance(stats.totalDistanceM, unit)}</Text>
              <Text style={styles.displayUnit}>{distanceUnitLabel(unit)}</Text>
            </View>
            <View style={styles.statsRow}>
              <Stat label="Rides" value={String(stats.sessionCount)} />
              <Stat label="Time" value={formatDuration(stats.totalDurationS)} />
              {stats.totalClimbM > 0 ? (
                <Stat
                  label={`Climb ${elevationUnitLabel(unit)}`}
                  value={formatElevation(stats.totalClimbM, unit)}
                />
              ) : null}
            </View>
          </GlassPanel>

          <Text style={styles.sectionLabel}>Personal records</Text>
          {records.map(({ label, value, record }) =>
            record ? (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${value}. Open session`}
                onPress={() => openSession(record.sessionId)}>
                {({ pressed }) => (
                  <GlassPanel style={[styles.recordRow, pressed && styles.pressed]}>
                    <View style={styles.recordText}>
                      <Text style={styles.secondary}>{label}</Text>
                      <Text style={styles.recordValue}>{value}</Text>
                    </View>
                    <Text style={styles.secondary}>{formatSessionDate(record.startedAt)}</Text>
                  </GlassPanel>
                )}
              </Pressable>
            ) : null,
          )}
          {stats.bestAverageSpeed === null ? (
            <Text style={styles.hint}>
              Best average speed counts rides of at least 500 m, so short test rides do not count.
            </Text>
          ) : null}

          <Text style={styles.sectionLabel}>Rides</Text>
          {sessions.map((session) => (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              onPress={() => openSession(session.id)}>
              {({ pressed }) => (
                <GlassPanel style={[styles.recordRow, pressed && styles.pressed]}>
                  <View style={styles.recordText}>
                    <Text style={styles.recordValue}>
                      {formatDistance(session.distanceM, unit)} {distanceUnitLabel(unit)}
                    </Text>
                    <Text style={styles.secondary}>{formatDuration(session.durationS)}</Text>
                  </View>
                  <Text style={styles.secondary}>{formatSessionDate(session.startedAt)}</Text>
                </GlassPanel>
              )}
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.half,
  },
  headerButton: {
    color: Brand.accent,
    fontSize: 17,
    fontWeight: '600',
  },
  name: {
    color: text,
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    color: text,
    fontSize: 17,
    fontWeight: '600',
  },
  secondary: {
    color: textSecondary,
    fontSize: 15,
  },
  hint: {
    color: textSecondary,
    fontSize: 13,
  },
  sectionLabel: {
    color: textSecondary,
    fontSize: 13,
    marginTop: Spacing.one,
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
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  recordText: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  recordValue: {
    color: text,
    fontSize: 22,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
