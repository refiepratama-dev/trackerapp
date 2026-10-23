import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { GlassPanel } from '@/components/glass-panel';
import { PrimaryButton } from '@/components/primary-button';
import { SwipeActions, useSwipeRows } from '@/components/swipe-actions';
import { VehicleAvatar } from '@/components/vehicle-avatar';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import {
  countVehicleSessions,
  listActiveVehicles,
  removeVehicle,
  type Vehicle,
} from '@/db/vehicles';
import { useTheme } from '@/hooks/use-theme';

export default function GarageScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const swipe = useSwipeRows<number>();
  const { closeAll } = swipe;

  // Reload whenever the tab or this screen regains focus (e.g. after saving or editing).
  // Leaving the screen closes any open row.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listActiveVehicles(db).then((list) => {
        if (!cancelled) setVehicles(list);
      });
      return () => {
        cancelled = true;
        closeAll();
      };
    }, [db, closeAll]),
  );

  const edit = (vehicle: Vehicle) => {
    closeAll();
    router.push({ pathname: '/garage/edit', params: { id: String(vehicle.id) } });
  };

  const confirmDelete = async (vehicle: Vehicle, closeRow: () => void) => {
    const sessions = await countVehicleSessions(db, vehicle.id);
    const message =
      sessions > 0
        ? `It disappears from your garage. Its ${sessions} past ${
            sessions === 1 ? 'session stays' : 'sessions stay'
          } in History.`
        : 'This cannot be undone.';
    Alert.alert(`Delete ${vehicle.name}?`, message, [
      { text: 'Cancel', style: 'cancel', onPress: closeRow },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeVehicle(db, vehicle.id);
          setVehicles((current) => current.filter((v) => v.id !== vehicle.id));
        },
      },
    ]);
  };

  return (
    <FlatList
      data={vehicles}
      keyExtractor={(item) => String(item.id)}
      contentInsetAdjustmentBehavior="automatic"
      onScrollBeginDrag={closeAll}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <GlassPanel>
          <Text style={[styles.title, { color: theme.text }]}>No vehicles yet</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Add your first ride and give it a name. It will show up on every share card.
          </Text>
        </GlassPanel>
      }
      ListFooterComponent={
        <View style={styles.footer}>
          <PrimaryButton label="Add vehicle" onPress={() => router.push('/garage/new')} />
        </View>
      }
      renderItem={({ item }) => (
        // Tapping opens the vehicle's profile; swiping left reveals Edit and Delete on the right.
        <ReanimatedSwipeable
          ref={swipe.register(item.id)}
          friction={2}
          rightThreshold={40}
          overshootRight={false}
          onSwipeableWillOpen={() => swipe.handleWillOpen(item.id)}
          onSwipeableClose={() => swipe.handleClose(item.id)}
          renderRightActions={(progress, _translation, swipeable) => (
            <SwipeActions
              progress={progress}
              actions={[
                {
                  label: 'Edit',
                  symbol: 'pencil',
                  tone: 'edit',
                  accessibilityLabel: `Edit ${item.name}`,
                  onPress: () => {
                    swipeable.close();
                    edit(item);
                  },
                },
                {
                  label: 'Delete',
                  symbol: 'trash',
                  tone: 'delete',
                  accessibilityLabel: `Delete ${item.name}`,
                  onPress: () => confirmDelete(item, swipeable.close),
                },
              ]}
            />
          )}>
          {/* Opaque layer under the translucent card, so the buttons never show through it. */}
          <View style={styles.cardBacking}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.name}`}
              onPress={() => {
                // A tap while a row is open only closes it, like iOS Mail.
                if (swipe.consumeTap()) return;
                router.push({ pathname: '/garage/[id]', params: { id: String(item.id) } });
              }}>
              {({ pressed }) => (
                <GlassPanel style={[styles.card, pressed && styles.pressed]}>
                  <VehicleAvatar name={item.name} size={56} />
                  <View style={styles.info}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.body, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.brandModel ? `${item.typeName} · ${item.brandModel}` : item.typeName}
                    </Text>
                  </View>
                </GlassPanel>
              )}
            </Pressable>
          </View>
        </ReanimatedSwipeable>
      )}
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
  cardBacking: {
    borderRadius: Spacing.four,
    backgroundColor: Colors.dark.background,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.8,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
  },
  footer: {
    marginTop: Spacing.four,
  },
});
