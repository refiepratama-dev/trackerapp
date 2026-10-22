import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassPanel } from '@/components/glass-panel';
import { PrimaryButton } from '@/components/primary-button';
import { VehicleAvatar } from '@/components/vehicle-avatar';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { archiveVehicle, listActiveVehicles, setVehiclePhoto, type Vehicle } from '@/db/vehicles';
import { useTheme } from '@/hooks/use-theme';
import { deletePhotoFile, photoUriFor, pickVehiclePhoto } from '@/vehicles/photo';

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

  const choosePhoto = async (vehicle: Vehicle) => {
    try {
      const result = await pickVehiclePhoto();
      if (result.status === 'denied') {
        Alert.alert(
          'Photos are off',
          'Allow photo access for this app in Settings to pick a vehicle photo.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      if (result.status !== 'picked') return;
      deletePhotoFile(await setVehiclePhoto(db, vehicle.id, result.fileName));
      await load();
    } catch {
      Alert.alert('Could not set photo', 'Something went wrong. Please try again.');
    }
  };

  const removePhoto = async (vehicle: Vehicle) => {
    deletePhotoFile(await setVehiclePhoto(db, vehicle.id, null));
    await load();
  };

  const openPhotoMenu = (vehicle: Vehicle) => {
    if (!vehicle.photoFile) {
      choosePhoto(vehicle);
      return;
    }
    Alert.alert(vehicle.name, undefined, [
      { text: 'Choose new photo', onPress: () => choosePhoto(vehicle) },
      { text: 'Remove photo', style: 'destructive', onPress: () => removePhoto(vehicle) },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change photo of ${item.name}`}
            onPress={() => openPhotoMenu(item)}>
            <VehicleAvatar name={item.name} photoUri={photoUriFor(item.photoFile)} size={56} />
          </Pressable>
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
