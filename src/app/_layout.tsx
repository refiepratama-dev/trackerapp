import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { Appearance, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Brand, Colors } from '@/constants/theme';
import { SettingsProvider } from '@/context/settings-context';
import { migrate } from '@/db/migrate';

SplashScreen.preventAutoHideAsync();

// The app is dark-only. Forcing it here also makes the native tab bar render in dark.
Appearance.setColorScheme('dark');

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Brand.accent,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
  },
};

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={navigationTheme}>
        <SQLiteProvider databaseName="trackerapp.db" onInit={migrate}>
          <AnimatedSplashOverlay />
          <SettingsProvider>
            <AppTabs />
          </SettingsProvider>
        </SQLiteProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
