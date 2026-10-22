import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { VehicleAvatar } from '@/components/vehicle-avatar';
import { Brand, Spacing } from '@/constants/theme';
import {
  listVehicleTypes,
  type NewVehicleInput,
  type Vehicle,
  type VehicleType,
} from '@/db/vehicles';
import { useTheme } from '@/hooks/use-theme';
import { deletePhotoFile, photoUriFor, pickVehiclePhoto } from '@/vehicles/photo';

const NEW_TYPE = 'new' as const;

type VehicleFormProps = {
  /** The vehicle being edited; leave out to add a new one. */
  initial?: Vehicle;
  submitLabel: string;
  /** Saves the values. Throw to keep the form open and show an error. */
  onSubmit: (values: NewVehicleInput) => Promise<void>;
};

/** The form behind both "New vehicle" and "Edit vehicle". */
export function VehicleForm({ initial, submitLabel, onSubmit }: VehicleFormProps) {
  const db = useSQLiteContext();
  const theme = useTheme();

  const [types, setTypes] = useState<VehicleType[]>([]);
  const [name, setName] = useState(initial?.name ?? '');
  const [selected, setSelected] = useState<number | typeof NEW_TYPE | null>(
    initial?.typeId ?? null,
  );
  const [customType, setCustomType] = useState('');
  const [brandModel, setBrandModel] = useState(initial?.brandModel ?? '');
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<string | null>(initial?.photoFile ?? null);

  const originalPhoto = initial?.photoFile ?? null;
  const savedRef = useRef(false);
  const photoFileRef = useRef<string | null>(originalPhoto);

  useEffect(() => {
    listVehicleTypes(db).then((list) => {
      setTypes(list);
      setSelected((current) => current ?? list[0]?.id ?? null);
    });
  }, [db]);

  // A photo picked but never saved should not stay on the phone. The original photo is kept.
  useEffect(
    () => () => {
      if (!savedRef.current && photoFileRef.current !== originalPhoto) {
        deletePhotoFile(photoFileRef.current);
      }
    },
    [originalPhoto],
  );

  const setPhoto = (fileName: string | null) => {
    // Replacing an unsaved pick frees it right away; the original waits until Save.
    if (photoFileRef.current !== originalPhoto) deletePhotoFile(photoFileRef.current);
    photoFileRef.current = fileName;
    setPhotoFile(fileName);
  };

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
      if (result.status === 'picked') setPhoto(result.fileName);
    } catch {
      Alert.alert('Could not pick photo', 'Something went wrong. Please try again.');
    }
  };

  const openPhotoMenu = () => {
    if (!photoFile) {
      choosePhoto();
      return;
    }
    Alert.alert('Vehicle photo', undefined, [
      { text: 'Choose new photo', onPress: choosePhoto },
      { text: 'Remove photo', style: 'destructive', onPress: () => setPhoto(null) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const typeValid = selected === NEW_TYPE ? customType.trim().length > 0 : selected !== null;
  const canSave = name.trim().length > 0 && typeValid && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSubmit({
        name,
        typeId: typeof selected === 'number' ? selected : undefined,
        customTypeName: selected === NEW_TYPE ? customType : undefined,
        brandModel,
        photoFile,
      });
      savedRef.current = true;
      // The old photo is no longer used once the change is saved.
      if (originalPhoto && originalPhoto !== photoFile) deletePhotoFile(originalPhoto);
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
          accessibilityLabel="Vehicle photo"
          onPress={openPhotoMenu}>
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

      <PrimaryButton label={submitLabel} disabled={!canSave} onPress={save} />
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
