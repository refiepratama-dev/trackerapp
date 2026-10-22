import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.dark.text,
        headerStyle: { backgroundColor: Colors.dark.background },
        contentStyle: { backgroundColor: Colors.dark.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'History', headerLargeTitle: true }} />
      <Stack.Screen name="[id]" options={{ title: 'Session' }} />
    </Stack>
  );
}
