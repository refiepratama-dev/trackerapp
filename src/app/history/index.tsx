import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { GlassPanel } from '@/components/glass-panel';
import { Brand, BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import { deleteSession, listSessions, type SessionListItem } from '@/db/sessions';
import {
  distanceUnitLabel,
  formatDistance,
  formatDuration,
  formatSpeed,
  speedUnitLabel,
} from '@/tracking/format';
import { formatSessionDate } from '@/tracking/format-date';

const { text, textSecondary } = Colors.dark;

const ACTION_WIDTH = 88;

/** Delete button that fades and slides in as the card is pulled aside. */
function DeleteAction({
  progress,
  label,
  onPress,
}: {
  progress: SharedValue<number>;
  label: string;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.6, 1], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [24, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View style={[styles.deleteWrap, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.deleteAction}
        onPress={onPress}>
        <SymbolView name="trash" size={22} weight="semibold" tintColor="#FFFFFF" />
        <Text style={styles.deleteLabel}>Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { settings } = useSettings();
  const unit = settings.unit;
  const [sessions, setSessions] = useState<SessionListItem[]>([]);

  // Rows by session id, and the id of the row whose Delete button is showing (if any).
  const rows = useRef(new Map<number, SwipeableMethods>());
  const openId = useRef<number | null>(null);

  const closeAll = useCallback(() => {
    rows.current.forEach((row) => row.close());
    openId.current = null;
  }, []);

  // Reload whenever the tab or this screen regains focus (a new session, or one deleted).
  // Leaving the screen (another page or tab) closes any open row.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listSessions(db).then((list) => {
        if (!cancelled) setSessions(list);
      });
      return () => {
        cancelled = true;
        closeAll();
      };
    }, [db, closeAll]),
  );

  const confirmDelete = (item: SessionListItem, closeRow: () => void) => {
    Alert.alert('Delete this session?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel', onPress: closeRow },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(db, item.id);
          setSessions((current) => current.filter((session) => session.id !== item.id));
        },
      },
    ]);
  };

  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => String(item.id)}
      contentInsetAdjustmentBehavior="automatic"
      onScrollBeginDrag={closeAll}
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
          // Swiping the card to the left reveals the Delete button on its right.
          <ReanimatedSwipeable
            ref={(row) => {
              if (row) rows.current.set(item.id, row);
              else rows.current.delete(item.id);
            }}
            friction={2}
            rightThreshold={40}
            overshootRight={false}
            onSwipeableWillOpen={() => {
              // Only one row can show its Delete button at a time.
              rows.current.forEach((row, id) => {
                if (id !== item.id) row.close();
              });
              openId.current = item.id;
            }}
            onSwipeableClose={() => {
              if (openId.current === item.id) openId.current = null;
            }}
            renderRightActions={(progress, _translation, swipeable) => (
              <DeleteAction
                progress={progress}
                label={`Delete session of ${item.vehicleName}`}
                onPress={() => confirmDelete(item, swipeable.close)}
              />
            )}>
            {/* Opaque layer under the translucent card, so the red button never shows through it. */}
            <View style={styles.cardBacking}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  // A tap while a row is open only closes it, like iOS Mail.
                  if (openId.current !== null) {
                    closeAll();
                    return;
                  }
                  router.push({ pathname: '/history/[id]', params: { id: String(item.id) } });
                }}>
                {({ pressed }) => (
                  <GlassPanel style={pressed && styles.pressed}>
                    <View style={styles.headerRow}>
                      <Text style={styles.title} numberOfLines={1}>
                        {item.vehicleName}
                      </Text>
                      <Text style={styles.secondary}>{formatSessionDate(item.startedAt)}</Text>
                    </View>
                    <View style={styles.distanceRow}>
                      <Text style={styles.distance}>{formatDistance(item.distanceM, unit)}</Text>
                      <Text style={styles.secondary}>{distanceUnitLabel(unit)}</Text>
                    </View>
                    <Text style={styles.secondary}>
                      {formatDuration(item.durationS)} · {formatSpeed(avgSpeedMs, unit)}{' '}
                      {speedUnitLabel(unit)} avg
                    </Text>
                  </GlassPanel>
                )}
              </Pressable>
            </View>
          </ReanimatedSwipeable>
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
  cardBacking: {
    borderRadius: Spacing.four,
    backgroundColor: Colors.dark.background,
  },
  deleteWrap: {
    width: ACTION_WIDTH + Spacing.two,
    paddingLeft: Spacing.two,
  },
  deleteAction: {
    flex: 1,
    borderRadius: Spacing.four,
    backgroundColor: Brand.alert,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  deleteLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
