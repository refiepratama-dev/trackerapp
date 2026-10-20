import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Appearance } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Brand, Colors } from '@/constants/theme';

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
    <ThemeProvider value={navigationTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
