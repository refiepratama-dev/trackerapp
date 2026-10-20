import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function GarageLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.dark.text,
        headerStyle: { backgroundColor: Colors.dark.background },
        contentStyle: { backgroundColor: Colors.dark.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'Garage', headerLargeTitle: true }} />
      <Stack.Screen name="new" options={{ title: 'New vehicle', presentation: 'modal' }} />
    </Stack>
  );
}
