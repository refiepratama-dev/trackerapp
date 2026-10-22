import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { VehicleAvatar } from '@/components/vehicle-avatar';
import { Brand, Spacing } from '@/constants/theme';
import { createVehicle, listVehicleTypes, type VehicleType } from '@/db/vehicles';
import { useTheme } from '@/hooks/use-theme';
import { deletePhotoFile, photoUriFor, pickVehiclePhoto } from '@/vehicles/photo';

const NEW_TYPE = 'new' as const;

export default function NewVehicleScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();

  const [types, setTypes] = useState<VehicleType[]>([]);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<number | typeof NEW_TYPE | null>(null);
  const [customType, setCustomType] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const savedRef = useRef(false);
  const photoFileRef = useRef<string | null>(null);

  useEffect(() => {
    listVehicleTypes(db).then((list) => {
      setTypes(list);
      setSelected((current) => current ?? list[0]?.id ?? null);
    });
  }, [db]);

  // A photo picked but never saved should not stay on the phone.
  useEffect(
    () => () => {
      if (!savedRef.current) deletePhotoFile(photoFileRef.current);
    },
    [],
  );

  const choosePhoto = async () => {
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
      deletePhotoFile(photoFileRef.current);
      photoFileRef.current = result.fileName;
      setPhotoFile(result.fileName);
    } catch {
      Alert.alert('Could not pick photo', 'Something went wrong. Please try again.');
    }
  };

  const typeValid = selected === NEW_TYPE ? customType.trim().length > 0 : selected !== null;
  const canSave = name.trim().length > 0 && typeValid && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await createVehicle(db, {
        name,
        typeId: typeof selected === 'number' ? selected : undefined,
        customTypeName: selected === NEW_TYPE ? customType : undefined,
        brandModel,
        photoFile,
      });
      savedRef.current = true;
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Could not save', 'Something went wrong. Please try again.');
    }
  };

  const chips: { key: string; label: string; value: number | typeof NEW_TYPE }[] = [
    ...types.map((t) => ({ key: String(t.id), label: t.name, value: t.id })),
    { key: NEW_TYPE, label: '+ New type', value: NEW_TYPE },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.photoRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose vehicle photo"
          onPress={choosePhoto}>
          <VehicleAvatar name={name || '?'} photoUri={photoUriFor(photoFile)} size={88} />
        </Pressable>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {photoFile ? 'Tap to change photo' : 'Add a photo (optional)'}
        </Text>
      </View>

      <TextField
        label="Name"
        placeholder="e.g. Wasp Queen"
        value={name}
        onChangeText={setName}
        maxLength={30}
        returnKeyType="done"
      />

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Type</Text>
        <View style={styles.chips}>
          {chips.map((chip) => {
            const active = selected === chip.value;
            return (
              <Pressable
                key={chip.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelected(chip.value)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? Brand.accent : theme.backgroundElement },
                ]}>
                <Text style={[styles.chipLabel, { color: active ? Brand.onAccent : theme.text }]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {selected === NEW_TYPE && (
        <TextField
          label="Type name"
          placeholder="e.g. Surf Board"
          value={customType}
          onChangeText={setCustomType}
          maxLength={24}
        />
      )}

      <TextField
        label="Brand / model (optional)"
        placeholder="e.g. Pacific"
        value={brandModel}
        onChangeText={setBrandModel}
        maxLength={40}
      />

      <PrimaryButton label="Save" disabled={!canSave} onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  photoRow: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  group: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
});
