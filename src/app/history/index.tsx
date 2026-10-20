import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassPanel } from '@/components/glass-panel';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { listSessions, type SessionListItem } from '@/db/sessions';
import {
  distanceUnitLabel,
  formatDistance,
  formatDuration,
  formatSpeed,
  speedUnitLabel,
} from '@/tracking/format';
import { formatSessionDate } from '@/tracking/format-date';

const { text, textSecondary } = Colors.dark;

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);

  // Reload whenever the tab or this screen regains focus (a new session, or one deleted).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listSessions(db).then((list) => {
        if (!cancelled) setSessions(list);
      });
      return () => {
        cancelled = true;
      };
    }, [db]),
  );

  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => String(item.id)}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <GlassPanel>
          <Text style={styles.title}>No sessions yet</Text>
          <Text style={styles.secondary}>
            Record your first ride from the Record tab. It will show up here.
          </Text>
        </GlassPanel>
      }
      renderItem={({ item }) => {
        const avgSpeedMs = item.durationS > 0 ? item.distanceM / item.durationS : 0;
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/history/[id]', params: { id: String(item.id) } })
            }>
            {({ pressed }) => (
              <GlassPanel style={pressed && styles.pressed}>
                <View style={styles.headerRow}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.vehicleName}
                  </Text>
                  <Text style={styles.secondary}>{formatSessionDate(item.startedAt)}</Text>
                </View>
                <View style={styles.distanceRow}>
                  <Text style={styles.distance}>{formatDistance(item.distanceM)}</Text>
                  <Text style={styles.secondary}>{distanceUnitLabel()}</Text>
                </View>
                <Text style={styles.secondary}>
                  {formatDuration(item.durationS)} · {formatSpeed(avgSpeedMs)} {speedUnitLabel()} avg
                </Text>
              </GlassPanel>
            )}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  separator: {
    height: Spacing.two,
  },
  pressed: {
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  title: {
    flexShrink: 1,
    color: text,
    fontSize: 17,
    fontWeight: '600',
  },
  secondary: {
    color: textSecondary,
    fontSize: 15,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  distance: {
    color: text,
    fontSize: 28,
    fontWeight: '600',
  },
});
