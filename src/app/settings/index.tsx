import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassPanel } from '@/components/glass-panel';
import { TextField } from '@/components/text-field';
import { Brand, BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import { formatWeight, parseWeightInput, type DistanceUnit } from '@/tracking/format';

const { text, textSecondary } = Colors.dark;

const UNITS: { value: DistanceUnit; label: string }[] = [
  { value: 'km', label: 'Kilometers' },
  { value: 'mi', label: 'Miles' },
];

export default function SettingsScreen() {
  const { settings, update } = useSettings();
  // Typed text stays local and is saved when the field loses focus.
  const [name, setName] = useState(settings.userName);

  useEffect(() => {
    setName(settings.userName);
  }, [settings.userName]);

  // Body weight is kept in kg and shown in kg or lb depending on the unit.
  const weightText = (kg: number | null) => (kg === null ? '' : formatWeight(kg, settings.unit));
  const [weight, setWeight] = useState(weightText(settings.weightKg));

  useEffect(() => {
    setWeight(weightText(settings.weightKg));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.weightKg, settings.unit]);

  const saveWeight = () => {
    if (weight.trim() === '') {
      setWeight('');
      if (settings.weightKg !== null) update({ weightKg: null });
      return;
    }
    const kg = parseWeightInput(weight, settings.unit);
    // Not a usable number: put back what was saved.
    if (kg === null) {
      setWeight(weightText(settings.weightKg));
      return;
    }
    setWeight(formatWeight(kg, settings.unit));
    if (kg !== settings.weightKg) update({ weightKg: kg });
  };

  const saveName = () => {
    const trimmed = name.trim();
    setName(trimmed);
    if (trimmed !== settings.userName) update({ userName: trimmed });
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.content}>
      <View style={styles.group}>
        <TextField
          label="Your name"
          placeholder="Shown on your share cards"
          value={name}
          onChangeText={setName}
          onBlur={saveName}
          onSubmitEditing={saveName}
          maxLength={30}
          returnKeyType="done"
        />
        <Text style={styles.hint}>Leave it empty to keep your name off the cards.</Text>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Units</Text>
        <View style={styles.chips}>
          {UNITS.map((unit) => {
            const active = settings.unit === unit.value;
            return (
              <Pressable
                key={unit.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => update({ unit: unit.value })}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {unit.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>Applies to distance and speed everywhere in the app.</Text>
      </View>

      <View style={styles.group}>
        <TextField
          label={`Body weight (${settings.unit === 'km' ? 'kg' : 'lb'}), optional`}
          placeholder={settings.unit === 'km' ? 'e.g. 65' : 'e.g. 145'}
          value={weight}
          onChangeText={setWeight}
          onBlur={saveWeight}
          onSubmitEditing={saveWeight}
          keyboardType="decimal-pad"
          maxLength={6}
          returnKeyType="done"
        />
        <Text style={styles.hint}>
          Only used to estimate calories. Leave it empty to hide calories.
        </Text>
      </View>

      <GlassPanel>
        <Text style={styles.panelTitle}>Your data stays on this phone</Text>
        <Text style={styles.hint}>
          Vehicles, sessions and settings are stored locally. Nothing is uploaded.
        </Text>
      </GlassPanel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  group: {
    gap: Spacing.two,
  },
  label: {
    color: textSecondary,
    fontSize: 13,
  },
  hint: {
    color: textSecondary,
    fontSize: 13,
  },
  chips: {
    flexDirection: 'row',
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
  panelTitle: {
    color: text,
    fontSize: 17,
    fontWeight: '600',
  },
});
