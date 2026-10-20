import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassPanel } from '@/components/glass-panel';
import { PrimaryButton } from '@/components/primary-button';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';
import { archiveVehicle, listActiveVehicles, type Vehicle } from '@/db/vehicles';
import { useTheme } from '@/hooks/use-theme';

export default function GarageScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const load = useCallback(async () => {
    setVehicles(await listActiveVehicles(db));
  }, [db]);

  // Reload whenever the tab or this screen regains focus (e.g. after saving a new vehicle).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmArchive = (vehicle: Vehicle) => {
    Alert.alert(
      `Archive ${vehicle.name}?`,
      'It disappears from your garage. Your past sessions stay in History.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            await archiveVehicle(db, vehicle.id);
            await load();
          },
        },
      ],
    );
  };

  return (
    <FlatList
      data={vehicles}
      keyExtractor={(item) => String(item.id)}
      contentInsetAdjustmentBehavior="automatic"
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
        <GlassPanel style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.brandModel ? `${item.typeName} · ${item.brandModel}` : item.typeName}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Archive ${item.name}`}
            hitSlop={8}
            onPress={() => confirmArchive(item)}>
            <Text style={[styles.archive, { color: theme.textSecondary }]}>Archive</Text>
          </Pressable>
        </GlassPanel>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: Brand.onAccent,
    fontSize: 20,
    fontWeight: '700',
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
  archive: {
    fontSize: 13,
  },
  footer: {
    marginTop: Spacing.four,
  },
});
