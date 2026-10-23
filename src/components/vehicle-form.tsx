import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { Brand, Spacing } from '@/constants/theme';
import {
  listVehicleTypes,
  type NewVehicleInput,
  type Vehicle,
  type VehicleType,
} from '@/db/vehicles';
import { useTheme } from '@/hooks/use-theme';

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

  useEffect(() => {
    listVehicleTypes(db).then((list) => {
      setTypes(list);
      setSelected((current) => current ?? list[0]?.id ?? null);
    });
  }, [db]);

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
      });
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
      <TextField
        label="Name"
        placeholder="e.g. Wasp Queen"
        value={name}
        onChangeText={setName}
        maxLength={30}
        autoFocus={!initial}
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
